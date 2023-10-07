import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { Proxy, ProxyData } from "../models/proxy";
import * as fs from "fs";
import {
  axiosResponseErrorInterceptor,
  axiosResponseInterceptor,
} from "../interceptor";
import { saveSystemInfo } from "./logManager";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { parse } from "node-html-parser";
import { getRandomValidCookies } from "./cookieManager";
import { generateRandomUseragent } from "./useragentManager";

puppeteer.use(StealthPlugin());
class RequestManager {
  private readonly proxies: ProxyData[];
  private instances: Map<string, AxiosInstance> = new Map();
  private instance: AxiosInstance = this.getInstance();
  private readonly baseHeaders: { [key: string]: string };
  private currentProxyIndex: number = 0;
  constructor() {
    this.proxies = this.loadProxies();
    this.baseHeaders = {
      "User-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
      Referer: "google.com",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
    };
  }
  //Generate the cookies with puppeteer
  checkIfCaptchaRequested(html: string) {
    const parsed = parse(html);
    const captchaInputElement = parsed.querySelector("#captchacharacters");
    return !!captchaInputElement;
  }

  private getInstance() {
    const instance: AxiosInstance = axios.create({
      headers: this.baseHeaders,
    });
    instance.interceptors.response.use(
      axiosResponseInterceptor,
      axiosResponseErrorInterceptor,
    );
    instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      return config;
    });
    return instance;
  }

  private loadProxies() {
    const file = fs.readFileSync("proxies.json", "utf-8");
    const json: Proxy[] = JSON.parse(file).proxies;
    return json.map((proxy) => new ProxyData(proxy));
  }
  private async getNextProxy(): Promise<ProxyData | undefined> {
    try {
      const filteredProxies = this.proxies.filter(
        (proxy) => !proxy.isThrottled && proxy.currentUsers < 9,
      );
      const currentProxy = filteredProxies[this.currentProxyIndex];
      this.currentProxyIndex =
        (this.currentProxyIndex + 1) % this.proxies.length;
      //wait til proxy is unlocked
      return currentProxy;
    } catch (e) {
      saveSystemInfo("No proxy available");
      return undefined;
    }
  }
  public async getRequest(
    url: string,
    apiKey: string,
    useProxy: boolean = false,
  ) {
    const MAX_RETRIES = 3; // Clearer to have a constant for max retries
    let retries = 0;
    let proxyConfig = undefined;
    if (useProxy) {
      proxyConfig = useProxy ? await this.getNextProxy() : undefined;
    }
    if (!this.baseHeaders["Cookie"]) {
      const cookiesFromDb = await getRandomValidCookies(
        this.extractDomainFromURL(url),
      );
      if (cookiesFromDb) {
        this.baseHeaders["Cookie"] = cookiesFromDb.cookieString;
      }
    }
    while (retries < MAX_RETRIES) {
      try {
        return await this.sendGetRequest(url, proxyConfig, apiKey);
      } catch (error: any) {
        console.log(error.message);
        const err: AxiosError = error;
        // Unhandled error case
        if (
          err.message.includes("getaddrinfo ENOTFOUND") ||
          err.message.includes("connect ECONNREFUSED")
        ) {
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

  private async sendGetRequest(
    url: string,
    proxyConfig: ProxyData | undefined,
    apiKey: string,
    customHeaders: any | undefined = undefined,
  ): Promise<AxiosResponse> {
    //lock proxy by user
    let headers: { [key: string]: string } = this.baseHeaders;
    headers["User-agent"] = generateRandomUseragent();
    if (customHeaders) {
      headers = { ...customHeaders, ...headers };
    }
    const requestObj: AxiosRequestConfig | undefined = {
      timeout: 25000,
      headers: headers,
    };
    if (proxyConfig) {
      requestObj.proxy = proxyConfig.proxy;
    }
    const result = await this.instance.get(url, requestObj);
    return result;
  }
  extractDomainFromURL(urlString: string): "com" | "de" {
    try {
      const url = new URL(urlString);
      if (url.hostname.includes(".com")) {
        return "com";
      }
      if (url.hostname.includes(".de")) {
        return "de";
      }
      return "com";
    } catch (error) {
      // Handle invalid URL or other errors
      return "com";
    }
  }
}

export const Request = new RequestManager();
