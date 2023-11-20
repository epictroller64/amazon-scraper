import express, { Request, Response } from "express";
import * as dotenv from 'dotenv'
dotenv.config();
import { JobModel } from "./models/jobModel";
import { performance } from "perf_hooks";
import { AmazonScraper } from "./scraper/scraper";
import { JobResponse, ProductFull } from "./types";
import { reset, totalRequestCount, totalRequestSize } from "./logistics";
import {
  BadRequest,
  ServerError,
  Success,
  Unauthorized,
} from "./models/responses";
import { insertCache } from "./utils/cacheManager";
import { addRequests, checkConcurrentRequestLimit, validateApiKey } from "./utils/apiManager";
import { saveError, saveInfo } from "./utils/logManager";
import { authMiddleware } from "./middleware";
import { generateJobId } from "./utils/jobManager";
import fs from "fs";
import { AmazonError } from "./models/error";
import { retrieveApiClient } from "./repositories/apiKeyRepository";



export const jobIds: Map<string, string> = new Map<string, string>();
//New server implementation with GET requests
export function startServer(parsedPort: number) {
  const port = parsedPort || 8001;
  const app = express();
  app.use(authMiddleware);
  app.use(express.text());
  app.post("/proxies", (req, res) => {
    const body = req.body as string;
    const splitted = body.split("\n");
    const mapped = splitted.map((line) => {
      line = line.trim();
      return {
        protocol: "http",
        host: line.split(":")[0],
        port: line.split(":")[1],
      };
    });
    fs.writeFileSync("proxies.json", JSON.stringify({ proxies: mapped }));
    res.sendStatus(200);
  });
  app.use(express.json());
  app.get("/v1/online", (req, res) => {
    res.sendStatus(200)
  })
  app.get("/v1", async (req: Request, res: Response) => {
    try {
      const job = req.query as unknown as JobModel;
      job.includeAds = job.includeAds as unknown as string === "true" ? true : false
      const jobId = generateJobId(job, req.user!.token);
      //retrieve the api client here
      const apiClient = await retrieveApiClient(req.user!.token)
      const apiKeyQuotaCheck = await validateApiKey(apiClient!);
      if (!apiKeyQuotaCheck.result) {
        saveInfo(req.user!.token, apiKeyQuotaCheck.message, jobId);
        Unauthorized(res, "Not enough requests remaining");
        return;
      }
      const concurrentCheck = await checkConcurrentRequestLimit(apiClient!)
      if (!concurrentCheck.result) {
        saveInfo(req.user!.token, concurrentCheck.message, jobId);
        Unauthorized(res, "Too many concurrent requests");
        return;
      }
      jobIds.set(req.user!.token, jobId);
      resetNetworkStats();
      const amazonScraper: AmazonScraper = new AmazonScraper(req.user!.token);
      await executeOperation(req, res, amazonScraper, job, jobId);
    } catch (err: any) {
      saveError(req.user?.token || "", err.message, "");
      return res.status(500).json({ error: err });
    }
  });
  app.listen(port, () => {
    console.log(
      `⚡️[server]: New Action Server is running at http://localhost:${port}`,
    );
  });
}

function resetNetworkStats() {
  reset();
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
async function executeOperation(
  req: Request,
  res: Response,
  amazonScraper: AmazonScraper,
  job: JobModel,
  jobId: string,
) {
  async function wrapper(func: () => Promise<void>) {
    const a = performance.now();
    try {
      await func();
      const b = performance.now();
      const d = b - a;
      logNetworkData(d);
    } catch (err: any) {
      const error: AmazonError = err
      res.sendStatus(error.statusCode)
    }
  }

  const operations = {
    amazon_asin: async function () {
      const productPromises = amazonScraper.search(job.keyword, job.domain, {
        maxPages: job.pages || 1,
        ignoreNoPrice: true,
      }, job.includeAds || false, job.language);
      try {
        const productPages = await Promise.all(productPromises);
        const productDetails = await amazonScraper.getProductDetails(
          productPages[0].products[0].url,
        );
        const jobResponse: JobResponse = {
          totalResults: 1,
          body: productDetails,
          requestsConsumed: 1
        };
        Success(res, jobResponse);
        await addRequests(req.user!.token, 1);
        await insertCache(JSON.stringify(job), productDetails);
      } catch (e: any) {
        saveError(req.user?.token || "", e.message, jobId);
        ServerError(res, e.message);
      }
    },
    amazon_search: async function () {
      try {
        const productPromises = amazonScraper.search(job.keyword, job.domain, {
          maxPages: job.pages || 1,
          ignoreNoPrice: true,
        }, job.includeAds || false, job.language);
        try {
          const productPages = await Promise.all(productPromises);
          await insertCache(JSON.stringify(job), productPages);
          const responseObject: JobResponse = {
            requestsConsumed: productPages.length,
            totalResults: productPages.reduce(
              (acc, curr) => acc + curr.products.length,
              0,
            ),
            totalPages: productPages.length,
            body: productPages,
          };
          res.setHeader("X-RapidAPI-Billing", "Requests=" + productPages.length.toString())
          Success(res, responseObject);
          await addRequests(req.user!.token, productPages.length);
        } catch (e: any) {
          saveError(req.user?.token || "", e.message, jobId);
          ServerError(res, e.message);
        }
      } catch (e: any) {
        saveError(req.user?.token || "", e.message, jobId);
        ServerError(res, e.message);
      }
    },
    product_details: async function () {
      const product: ProductFull = await amazonScraper.getProductDetails(
        job.keyword,
      );
      const jobResponse: JobResponse = {
        totalResults: 1,
        requestsConsumed: 1,
        body: product,
      };
      Success(res, jobResponse);
      await addRequests(req.user!.token, 1);
    },
    product_reviews: async function () {
      const pagesPromises = amazonScraper.getProductReviewsByAsin(
        job.keyword,
        job.pages || 1,
        job.language,
        job.domain,
      );
      const pages = await Promise.all(pagesPromises);
      const jobResponse: JobResponse = {
        requestsConsumed: pages.length,
        totalResults: pages.length,
        body: pages,
      };
      Success(res, jobResponse);
      await addRequests(req.user!.token, pages.length);
    },
    seller_details: async function () {
      const seller = await amazonScraper.getSellerDetails(
        job.keyword,
        job.domain,
        job.language
      );
      const jobResponse: JobResponse = {
        requestsConsumed: 1,
        totalResults: 1,
        body: seller,
      };
      Success(res, jobResponse);
      await addRequests(req.user!.token, 1);
    },
  };
  if (operations[job.type]) {
    return wrapper(operations[job.type]);
  } else {
    saveError(req.user?.token || "", "Bad request", "");
    return BadRequest(res, "Bad request");
  }
}
