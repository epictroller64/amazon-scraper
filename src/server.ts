import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { JobModel } from "./models/jobModel";
import { performance } from "perf_hooks";
import { AmazonScraper } from "./scraper/scraper";
import { JobResponse, ProductFull } from "./types";
import { reset, totalRequestCount, totalRequestSize } from "./logistics";
import { BadRequest, ServerError, Success } from "./models/responses";
import { getCache, insertCache } from "./utils/cacheManager";
import { addRequests } from "./utils/apiManager";
import { saveError } from "./utils/logManager";
import { authMiddleware, validateJob } from "./middleware";
import { generateJobId } from "./utils/jobManager";

dotenv.config();
export const jobIds: Map<string, string> = new Map<string, string>();
//New server implementation with GET requests
export function startServer(parsedPort: number) {
  const port = parsedPort || 8001;
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.use(validateJob);

  async function executeOperation(
    req: Request,
    res: Response,
    amazonScraper: AmazonScraper,
    job: JobModel,
    jobId: string,
  ) {
    async function wrapper(func: () => Promise<void>) {
      const a = performance.now();
      await func();
      const b = performance.now();
      const d = b - a;
      logNetworkData(d);
      await addRequests(req.user!.token, job.pages || 1); //adds
    }

    const operations = {
      amazon_asin: async function () {
        const productPromises = amazonScraper.search(job.keyword, job.domain, {
          maxPages: job.pages || 1,
          ignoreNoPrice: true,
        });
        try {
          const productPages = await Promise.all(productPromises);
          const productDetails = await amazonScraper.getProductDetails(
            productPages[0].products[0].url,
          );
          const jobResponse: JobResponse = {
            totalResults: 1,
            body: productDetails,
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
          const productPromises = amazonScraper.search(
            job.keyword,
            job.domain,
            {
              maxPages: job.pages || 1,
              ignoreNoPrice: true,
            },
          );
          try {
            const productPages = await Promise.all(productPromises);
            await insertCache(JSON.stringify(job), productPages);
            const responseObject: JobResponse = {
              totalResults: productPages.reduce(
                (acc, curr) => acc + curr.products.length,
                0,
              ),
              totalPages: productPages.length,
              body: productPages,
            };
            Success(res, responseObject);
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
          body: product,
        };
        Success(res, jobResponse);
      },
      product_reviews: async function () {
        const pagesPromises = amazonScraper.getProductReviewsByAsin(
          job.keyword,
          job.pages || 1,
          job.domain,
        );
        const pages = await Promise.all(pagesPromises);
        const jobResponse: JobResponse = {
          totalResults: pages.length,
          body: pages,
        };
        Success(res, jobResponse);
      },
      seller_details: async function () {
        const seller = await amazonScraper.getSellerDetails(
          job.keyword,
          job.domain,
        );
        const jobResponse: JobResponse = {
          totalResults: 1,
          body: seller,
        };
        Success(res, jobResponse);
      },
    };
    if (operations[job.type]) {
      return wrapper(operations[job.type]);
    } else {
      saveError(req.user?.token || "", "Bad request", "");
      return BadRequest(res, "Bad request");
    }
  }

  app.get("/", async (req: Request, res: Response) => {
    try {
      const job = req.query as unknown as JobModel;
      const jobId = generateJobId(job, req.user!.token);
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
