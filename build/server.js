"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.jobIds = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const perf_hooks_1 = require("perf_hooks");
const scraper_1 = require("./scraper/scraper");
const logistics_1 = require("./logistics");
const responses_1 = require("./models/responses");
const cacheManager_1 = require("./utils/cacheManager");
const apiManager_1 = require("./utils/apiManager");
const logManager_1 = require("./utils/logManager");
const middleware_1 = require("./middleware");
const jobManager_1 = require("./utils/jobManager");
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
exports.jobIds = new Map();
//New server implementation with GET requests
function startServer(parsedPort) {
    const port = parsedPort || 8001;
    const app = (0, express_1.default)();
    app.use(middleware_1.authMiddleware);
    app.use(express_1.default.text());
    app.post("/proxies", (req, res) => {
        const body = req.body;
        const splitted = body.split("\n");
        const mapped = splitted.map((line) => {
            line = line.trim();
            return {
                protocol: "http",
                host: line.split(":")[0],
                port: line.split(":")[1],
            };
        });
        fs_1.default.writeFileSync("proxies.json", JSON.stringify({ proxies: mapped }));
        res.sendStatus(200);
    });
    app.use(express_1.default.json());
    app.get("/online", (req, res) => {
        res.sendStatus(200);
    });
    app.get("/", async (req, res) => {
        try {
            const job = req.query;
            job.includeAds = job.includeAds === "true" ? true : false;
            const jobId = (0, jobManager_1.generateJobId)(job, req.user.token);
            const apiKeyQuotaCheck = await (0, apiManager_1.validateApiKey)(req.user.token);
            if (!apiKeyQuotaCheck.result) {
                (0, logManager_1.saveInfo)(req.user.token, apiKeyQuotaCheck.message, jobId);
                (0, responses_1.Unauthorized)(res, "Not enough requests remaining");
                return;
            }
            exports.jobIds.set(req.user.token, jobId);
            resetNetworkStats();
            const amazonScraper = new scraper_1.AmazonScraper(req.user.token);
            await executeOperation(req, res, amazonScraper, job, jobId);
        }
        catch (err) {
            (0, logManager_1.saveError)(req.user?.token || "", err.message, "");
            return res.status(500).json({ error: err });
        }
    });
    app.listen(port, () => {
        console.log(`⚡️[server]: New Action Server is running at http://localhost:${port}`);
    });
}
exports.startServer = startServer;
function resetNetworkStats() {
    (0, logistics_1.reset)();
}
function logNetworkData(time) {
    console.log("Done, took " +
        time +
        " milliseconds and used " +
        logistics_1.totalRequestSize.toFixed(2) +
        " MB, with a total of " +
        logistics_1.totalRequestCount +
        " requests.");
}
async function executeOperation(req, res, amazonScraper, job, jobId) {
    async function wrapper(func) {
        const a = perf_hooks_1.performance.now();
        try {
            await func();
            const b = perf_hooks_1.performance.now();
            const d = b - a;
            logNetworkData(d);
        }
        catch (err) {
            const error = err;
            res.sendStatus(error.statusCode);
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
                const productDetails = await amazonScraper.getProductDetails(productPages[0].products[0].url);
                const jobResponse = {
                    totalResults: 1,
                    body: productDetails,
                };
                (0, responses_1.Success)(res, jobResponse);
                await (0, apiManager_1.addRequests)(req.user.token, 1);
                await (0, cacheManager_1.insertCache)(JSON.stringify(job), productDetails);
            }
            catch (e) {
                (0, logManager_1.saveError)(req.user?.token || "", e.message, jobId);
                (0, responses_1.ServerError)(res, e.message);
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
                    await (0, cacheManager_1.insertCache)(JSON.stringify(job), productPages);
                    const responseObject = {
                        totalResults: productPages.reduce((acc, curr) => acc + curr.products.length, 0),
                        totalPages: productPages.length,
                        body: productPages,
                    };
                    (0, responses_1.Success)(res, responseObject);
                    await (0, apiManager_1.addRequests)(req.user.token, productPages.length);
                }
                catch (e) {
                    (0, logManager_1.saveError)(req.user?.token || "", e.message, jobId);
                    (0, responses_1.ServerError)(res, e.message);
                }
            }
            catch (e) {
                (0, logManager_1.saveError)(req.user?.token || "", e.message, jobId);
                (0, responses_1.ServerError)(res, e.message);
            }
        },
        product_details: async function () {
            const product = await amazonScraper.getProductDetails(job.keyword);
            const jobResponse = {
                totalResults: 1,
                body: product,
            };
            (0, responses_1.Success)(res, jobResponse);
            await (0, apiManager_1.addRequests)(req.user.token, 1);
        },
        product_reviews: async function () {
            const pagesPromises = amazonScraper.getProductReviewsByAsin(job.keyword, job.pages || 1, job.language, job.domain);
            const pages = await Promise.all(pagesPromises);
            const jobResponse = {
                totalResults: pages.length,
                body: pages,
            };
            (0, responses_1.Success)(res, jobResponse);
            await (0, apiManager_1.addRequests)(req.user.token, pages.length);
        },
        seller_details: async function () {
            const seller = await amazonScraper.getSellerDetails(job.keyword, job.domain, job.language);
            const jobResponse = {
                totalResults: 1,
                body: seller,
            };
            (0, responses_1.Success)(res, jobResponse);
            await (0, apiManager_1.addRequests)(req.user.token, 1);
        },
    };
    if (operations[job.type]) {
        return wrapper(operations[job.type]);
    }
    else {
        (0, logManager_1.saveError)(req.user?.token || "", "Bad request", "");
        return (0, responses_1.BadRequest)(res, "Bad request");
    }
}
//# sourceMappingURL=server.js.map