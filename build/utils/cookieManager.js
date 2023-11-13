"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNewCookies = exports.deleteCookie = exports.reportFailure = exports.getRandomValidCookies = void 0;
//Use puppeteer to generate new cookies, and insert them into the database
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const node_html_parser_1 = require("node-html-parser");
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const axios_1 = __importDefault(require("axios"));
const useragentManager_1 = require("./useragentManager");
const cookieRepository_1 = require("../repositories/cookieRepository");
const logManager_1 = require("./logManager");
let cookieGenerationInProgress = false;
async function getRandomValidCookies(domain) {
    let retry = 0;
    while (retry < 5) {
        const cookie = await (0, cookieRepository_1.getRandomCookie)();
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        if (cookie) {
            //compare timestamps
            const difference = currentTimestamp - cookie.timestamp;
            if (difference > 172800) {
                //means older than 2 days, discard and get new
                await deleteCookie(cookie.cookieString);
            }
            else {
                return cookie;
            }
        }
        retry++;
    }
    return await generateNewCookies(domain);
}
exports.getRandomValidCookies = getRandomValidCookies;
async function reportFailure(cookieString, domain) {
    await (0, cookieRepository_1.updateCookieFailureCount)(cookieString, domain);
}
exports.reportFailure = reportFailure;
async function deleteCookie(cookieString) {
    await (0, cookieRepository_1.removeCookie)(cookieString);
}
exports.deleteCookie = deleteCookie;
async function generateNewCookies(domain) {
    try {
        if (cookieGenerationInProgress) {
            //One puppeteer is already open for this server, no need
            return;
        }
        cookieGenerationInProgress = true;
        const browser = await puppeteer_extra_1.default.launch({
            headless: false,
        });
        const page = await browser.newPage();
        await page.setUserAgent((0, useragentManager_1.generateRandomUseragent)());
        const url = `https://amazon.${domain}/errors/validateCaptcha`;
        await page.goto(url, {
            waitUntil: "networkidle2",
        });
        //Get the captcha image from amazon
        const parsed = (0, node_html_parser_1.parse)(await page.content());
        const images = parsed.querySelectorAll("img");
        const found = images.find((img) => img.getAttribute("src")?.includes("captcha"));
        const captchaUrl = found?.attributes["src"];
        if (captchaUrl) {
            const requestObj = {
                timeout: 20000,
                responseType: "arraybuffer",
            };
            const dlResult = await axios_1.default.get(captchaUrl, requestObj);
            fs_1.default.writeFileSync("./captcha.jpg", dlResult.data);
            //now send to python and solve it
            const captchaResult = await new Promise((resolve, reject) => {
                (0, child_process_1.exec)("py solve.py", (error, stdout, stderr) => {
                    if (error) {
                        reject(`exec error: ${error}`);
                        return;
                    }
                    resolve(stdout);
                    if (stderr) {
                        reject(stderr);
                    }
                });
            });
            const trimmedResult = captchaResult.trim();
            //get the request id to send
            const captchaInput = await page.$("#captchacharacters");
            captchaInput?.type(trimmedResult);
            const submitButton = await page.$("button.a-button-text");
            await submitButton?.click();
            await page.waitForNavigation({ waitUntil: "networkidle2" });
            const cookies = await page.cookies();
            const mapped = cookies
                .map((cookie) => `${cookie.name}=${cookie.value};`)
                .join("");
            await (0, cookieRepository_1.insertCookie)(mapped, domain);
            (0, logManager_1.saveSystemInfo)("Cookies successfully saved to the database");
            const cookie = { cookieString: mapped, timestamp: 0, id: 0 };
            await browser.close();
            return cookie;
        }
        await browser.close();
    }
    catch (e) {
        (0, logManager_1.saveSystemError)(e.message);
    }
}
exports.generateNewCookies = generateNewCookies;
//# sourceMappingURL=cookieManager.js.map