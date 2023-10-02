import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { JobModel } from "./models/jobModel";
import { performance } from "perf_hooks";
import { AmazonScraper } from "./scraper/scraper";
import { ProductFull } from "./types";
import { reset, totalRequestCount, totalRequestSize } from "./logistics";
import { BadRequest, ServerError, Unauthorized } from "./models/responses";
import { RequestManager } from "./utils/requestManager";
import { getCache, insertCache } from "./utils/cacheManager";
import { addRequests } from "./utils/apiManager";
import { saveError, saveIp } from "./utils/logManager";

dotenv.config();
const requestManager: RequestManager = new RequestManager();
const scrapers: Map<string, AmazonScraper> = new Map<string, AmazonScraper>();
export function start() {
  const port = process.env.PORT2 || 8001;
  const app: Express = express();
  app.use(express.json());

  // Middleware to handle JWT token
  app.use((req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"];
    if (token) {
      try {
        req.user = { username: "swa", token: token }; // Attach the decoded user information to the request object
        saveIp(token, req.socket.remoteAddress || req.ip); //log the ip address into database
      } catch (error) {
        // Handle invalid token
        return Unauthorized(res, "Invalid token");
      }
      return next();
    }
    return Unauthorized(res, "No token provided");
  });

  app.use(validateJob);

  app.post("/", async (req: Request, res: Response) => {
    resetNetworkStats();
    const job: JobModel = req.body;
    //get cached job
    const cachedJob = await getCache(JSON.stringify(job));
    if (cachedJob && cachedJob.length > 0) {
      return res.json({ status: "OK", data: cachedJob[0].value });
    }
    let amazonScraper: AmazonScraper;
    const existing = scrapers.get(req.user!.username);
    if (!existing) {
      amazonScraper = new AmazonScraper(requestManager, req.user!.token);
      scrapers.set(req.user!.username, amazonScraper);
    } else {
      amazonScraper = existing;
    }
    if (job.title === "amazon_search") {
      try {
        const a = performance.now();
        const productPromises = amazonScraper.search(job.keyword, job.domain, {
          maxPages: job.pages,
          ignoreNoPrice: true,
        });
        try {
          const productPages = await Promise.all(productPromises);
          await insertCache(JSON.stringify(job), productPages);
          res.json({ status: "OK", data: productPages });
          await addRequests(req.user!.token, job.pages); //adds
          const b = performance.now();
          const d = b - a;
          logNetworkData(d);
        } catch (e: any) {
          saveError(req.user?.token || "", e.message, "");
          return ServerError(res, e.message);
        }
      } catch (e: any) {
        saveError(req.user?.token || "", e.message, "");
        return ServerError(res, e.message);
      }
    } else if (job.title === "amazon_asin") {
      const a = performance.now();
      const productPromises = amazonScraper.search(job.keyword, job.domain, {
        maxPages: job.pages,
        ignoreNoPrice: true,
      });
      try {
        const productPages = await Promise.all(productPromises);
        const productDetails = await amazonScraper.getProductDetails(
          productPages[0].products[0].url,
        );
        res.json({ status: "OK", data: productDetails });
        await addRequests(req.user!.token, 1);
        await insertCache(JSON.stringify(job), productDetails);
        const b = performance.now();
        const d = b - a;
        logNetworkData(d);
      } catch (e: any) {
        saveError(req.user?.token || "", e.message, "");
        return ServerError(res, e.message);
      }
    } else if (job.title === "product_details") {
      const a = performance.now();
      const product: ProductFull = await amazonScraper.getProductDetails(
        job.keyword,
      );
      const b = performance.now();
      const d = b - a;
      logNetworkData(d);
      res.json({ status: "OK", data: product });
    } else if (job.title === "product_reviews") {
      const a = performance.now();
      const pagesPromises = amazonScraper.getProductReviewsByAsin(
        job.keyword,
        job.pages,
        job.domain,
      );
      const pages = await Promise.all(pagesPromises);
      const b = performance.now();
      const d = b - a;
      logNetworkData(d);
      res.json({ status: "OK", data: pages });
      await addRequests(req.user!.token, 1);
    } else if (job.title === "seller_details") {
      const a = performance.now();
      const seller = await amazonScraper.getSellerDetails(
        job.keyword,
        job.domain,
      );
      const b = performance.now();
      const d = b - a;
      logNetworkData(d);
      res.json({ status: "OK", data: seller });
      await addRequests(req.user!.token, 1);
    } else {
      saveError(req.user?.token || "", "Bad request", "");
      return BadRequest(res, "Bad request");
    }
  });

  app.listen(port, () => {
    console.log(
      `⚡️[server]: Action Server is running at http://localhost:${port}`,
    );
  });
}

function resetNetworkStats() {
  reset();
}

function validateJob(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  if (
    (body.title === "amazon_search" ||
      body.title === "amazon_asin" ||
      body.title === "seller_details" ||
      body.title === "product_reviews" ||
      body.title === "product_details") &&
    typeof body.keyword === "string" &&
    (body.domain === "de" || body.domain === "com")
  ) {
    next();
  } else {
    res.status(400).send({ error: "Invalid job model" });
  }
}

function logNetworkData(time: number) {
  console.log(
    "Done, took " +
      time +
      " milliseconds and used " +
      totalRequestSize.toFixed(2) +
      " MB, with a total of " +
      totalRequestCount +
      " requests.",
  );
}
