"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const axios_1 = __importDefault(require("axios"));
const proxy_1 = require("../models/proxy");
const fs = __importStar(require("fs"));
const interceptor_1 = require("../interceptor");
const logManager_1 = require("./logManager");
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const node_html_parser_1 = require("node-html-parser");
const cookieManager_1 = require("./cookieManager");
const useragentManager_1 = require("./useragentManager");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
class RequestManager {
    proxies;
    instances = new Map();
    instance = this.getInstance();
    baseHeaders;
    currentProxyIndex = 0;
    constructor() {
        this.proxies = this.loadProxies();
        this.baseHeaders = {
            "User-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
            Referer: "google.com",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-US,en;q=0.9",
        };
    }
    //Generate the cookies with puppeteer
    checkIfCaptchaRequested(html) {
        const parsed = (0, node_html_parser_1.parse)(html);
        const captchaInputElement = parsed.querySelector("#captchacharacters");
        return !!captchaInputElement;
    }
    getInstance() {
        const instance = axios_1.default.create({
            headers: this.baseHeaders,
        });
        instance.interceptors.response.use(interceptor_1.axiosResponseInterceptor, interceptor_1.axiosResponseErrorInterceptor);
        instance.interceptors.request.use((config) => {
            return config;
        });
        return instance;
    }
    loadProxies() {
        const file = fs.readFileSync("proxies.json", "utf-8");
        const json = JSON.parse(file).proxies;
        return json.map((proxy) => new proxy_1.ProxyData(proxy));
    }
    async getNextProxy() {
        try {
            const filteredProxies = this.proxies.filter((proxy) => !proxy.isThrottled && proxy.currentUsers < 9);
            const currentProxy = filteredProxies[this.currentProxyIndex];
            this.currentProxyIndex =
                (this.currentProxyIndex + 1) % this.proxies.length;
            //wait til proxy is unlocked
            return currentProxy;
        }
        catch (e) {
            (0, logManager_1.saveSystemInfo)("No proxy available");
            return undefined;
        }
    }
    async getRequest(url, apiKey, useProxy = false) {
        const MAX_RETRIES = 3; // Clearer to have a constant for max retries
        let retries = 0;
        let proxyConfig = undefined;
        if (useProxy) {
            proxyConfig = useProxy ? await this.getNextProxy() : undefined;
        }
        if (!this.baseHeaders["Cookie"]) {
            const cookiesFromDb = await (0, cookieManager_1.getRandomValidCookies)(this.extractDomainFromURL(url));
            if (cookiesFromDb) {
                this.baseHeaders["Cookie"] = cookiesFromDb.cookieString;
            }
        }
        while (retries < MAX_RETRIES) {
            try {
                return await this.sendGetRequest(url, proxyConfig, apiKey);
            }
            catch (error) {
                console.log(error.message);
                const err = error;
                // Unhandled error case
                if (err.message.includes("getaddrinfo ENOTFOUND") ||
                    err.message.includes("connect ECONNREFUSED")) {
                    throw error;
                }
                // Blocked by Amazon
                retries++;
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000);
                });
            }
        }
        throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts.`);
    }
    async sendGetRequest(url, proxyConfig, apiKey, customHeaders = undefined) {
        //lock proxy by user
        let headers = this.baseHeaders;
        headers["User-agent"] = (0, useragentManager_1.generateRandomUseragent)();
        if (customHeaders) {
            headers = { ...customHeaders, ...headers };
        }
        const requestObj = {
            timeout: 25000,
            headers: headers,
        };
        if (proxyConfig) {
            requestObj.proxy = proxyConfig.proxy;
        }
        console.log(requestObj?.headers);
        return await this.instance.get(url, requestObj);
    }
    extractDomainFromURL(urlString) {
        try {
            const url = new URL(urlString);
            if (url.hostname.includes(".com")) {
                return "com";
            }
            if (url.hostname.includes(".de")) {
                return "de";
            }
            return "com";
        }
        catch (error) {
            // Handle invalid URL or other errors
            return "com";
        }
    }
}
exports.Request = new RequestManager();
//# sourceMappingURL=requestManager.js.map