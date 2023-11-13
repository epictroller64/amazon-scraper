"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
let success = 0;
let failure = 0;
const maxRetry = 3;
async function start() {
    let retry = 0;
    while (retry < maxRetry) {
        try {
            const result = await axios_1.default.get("https://www.amazon.de/s?k=intel&page=1", {
                headers: {
                    Referer: "google.com",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47",
                },
                proxy: {
                    host: "localhost",
                    port: 8888,
                    protocol: "http",
                },
            });
            console.log(result.status);
            if (result.status === 200) {
                success++;
                break;
            }
            else {
                failure++;
            }
        }
        catch (err) {
            failure++;
        }
        retry++;
    }
}
async function run() {
    let i = 0;
    const promises = [];
    const startTime = performance.now();
    while (i <= 1000) {
        promises.push(start());
        i++;
    }
    await Promise.all(promises);
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    console.log(`Time: ${elapsedTime.toFixed(2)}ms Success: ${success}, Failure: ${failure}`);
}
run().then();
//# sourceMappingURL=speedTest.js.map