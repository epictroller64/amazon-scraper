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
import { axiosResponseIterceptor } from "../interceptor";
import { saveSystemInfo } from "./logManager";
import { parse } from "node-html-parser";
import { exec } from "child_process";
import puppeteer from "puppeteer";

export class RequestManager {
  private readonly proxies: ProxyData[];
  private instances: Map<string, AxiosInstance> = new Map();
  private currentProxyIndex: number;
  private baseHeaders: { [key: string]: string };
  private cookies: Map<string, [{ [key: string]: string }]>;
  constructor() {
    this.currentProxyIndex = 0;
    this.proxies = this.loadProxies();
    this.cookies = new Map<string, [{ [key: string]: string }]>();
    this.baseHeaders = {
      "User-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.69",
      Referer: "google.com",
    };
  }

  private getInstance(apiKey: string) {
    if (!this.instances.has(apiKey)) {
      const instance: AxiosInstance = axios.create({
        headers: this.baseHeaders,
      });
      instance.defaults.withCredentials = true;
      instance.interceptors.response.use(axiosResponseIterceptor);
      instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          return config;
        },
      );
      this.instances.set(apiKey, instance);
    }
    return this.instances.get(apiKey)!;
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
      console.log(
        `Proxy supplied is: ${currentProxy.proxy.host}:${currentProxy.proxy.port}`,
      );
      //wait til proxy is unlocked
      await currentProxy.waitUnlock();
      currentProxy?.setUser();
      return currentProxy;
    } catch (e) {
      console.log("No proxy remaining");
      saveSystemInfo("No proxy available");
      return undefined;
    }
  }
  public async getRequest(
    url: string,
    apiKey: string,
    useProxy: boolean = false,
  ) {
    const MAX_RETRIES = 2; // Clearer to have a constant for max retries
    let retries = 0;
    let proxyConfig = undefined;
    if (useProxy) {
      proxyConfig = useProxy ? await this.getNextProxy() : undefined;
    }
    while (retries < MAX_RETRIES) {
      try {
        return await this.sendGetRequest(url, proxyConfig, apiKey);
      } catch (error: unknown) {
        if (!isAxiosError(error)) {
          retries++;
          continue;
        }

        const err: AxiosError = error;
        // Unhandled error case
        if (err.message.includes("getaddrinfo ENOTFOUND")) {
          throw error;
        }

        // Blocked by Amazon
        if (err.message === "Request failed with status code 503") {
          //now try to get captcha and solve it
          try {
            const browser = await puppeteer.launch({
              headless: false,
              args: [
                `--proxy-server=http://${proxyConfig!.proxy.host}:${
                  proxyConfig!.proxy.port
                }`,
              ],
            });
            const page = await browser.newPage();
            await page.setRequestInterception(true);

            page.on("request", (req) => {
              if (req.resourceType() === "image") {
                req.abort();
              } else {
                req.continue();
              }
            });
            await page.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.69",
            );
            await page.goto("https://www.amazon.de/errors/validateCaptcha");

            //Get the captcha image from amazon
            const parsed = parse(await page.content());
            const images = parsed.querySelectorAll("img");
            console.log(images.map((img) => img.getAttribute("src")));
            const found = images.find(
              (img) => img.getAttribute("src")?.includes("captcha"),
            );
            if (found) {
              const captchaUrl = found?.attributes["src"];
              //now send to python and solve it
              const requestObj: AxiosRequestConfig | undefined = {
                timeout: 10000,
                headers: this.baseHeaders,
                responseType: "arraybuffer",
              };
              if (proxyConfig) {
                requestObj.proxy = proxyConfig.proxy;
              }
              const dlresult = await this.getInstance(apiKey).get(
                captchaUrl!,
                requestObj,
              );
              fs.writeFileSync("./captcha.jpg", dlresult.data);
              const captchaResult: string = await new Promise(
                (resolve, reject) => {
                  exec("py solve.py", (error, stdout, stderr) => {
                    if (error) {
                      reject(`exec error: ${error}`);
                      return;
                    }
                    resolve(stdout);
                    if (stderr) {
                      reject(stderr);
                    }
                  });
                },
              );
              const trimmedResult = captchaResult.trim();
              //get the request id to send
              const captchaInput = await page.$("#captchacharacters");
              captchaInput?.type(trimmedResult);
              const submitButton = await page.$("button.a-button-text");
              await submitButton?.click();
              await page.waitForNavigation({ waitUntil: "networkidle2" });
              const cookies = (await page.cookies()) as unknown as [
                { [key: string]: string },
              ];
              this.cookies.set(apiKey, cookies);
              console.log(cookies);
              await browser.close();
              //save the html to page
              fs.writeFileSync("error.html", error.response?.data || "");
            }
          } catch (e: any) {
            console.log(e.message);
            fs.writeFileSync("error2.html", e.response?.data || "");
          }
        } else {
          // Other axios errors
          console.log(err.message + " " + url);
        }
        retries++;
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }
    }
    console.log("still failed after retries");
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
    if (this.cookies.get(apiKey)) {
      const cookies = this.cookies.get(apiKey);
      headers["cookie"] = cookies!
        .map(
          (cookie) =>
            `${encodeURIComponent(cookie.name)}=${encodeURIComponent(
              cookie.value,
            )}`,
        )
        .join("; ");
    }
    if (customHeaders) {
      headers = { ...customHeaders, ...headers };
    }
    const requestObj: AxiosRequestConfig | undefined = {
      timeout: 10000,
      headers: headers,
    };
    if (proxyConfig) {
      requestObj.proxy = proxyConfig.proxy;
    }
    const result = await this.getInstance(apiKey).get(url, requestObj);
    console.log({ ...requestObj, url: url });
    return result;
  }
}
