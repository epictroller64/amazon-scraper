//Use puppeteer to generate new cookies, and insert them into the database
import puppeteer from "puppeteer-extra";
import { parse } from "node-html-parser";
import { AxiosRequestConfig } from "axios";
import fs from "fs";
import { exec } from "child_process";
import axios from "axios";
import { generateRandomUseragent } from "./useragentManager";
import {
  getRandomCookie,
  insertCookie,
  removeCookie,
  updateCookieFailureCount,
} from "../repositories/cookieRepository";
import { saveSystemError, saveSystemInfo } from "./logManager";
import { Cookie } from "../models/cookie";
import { Domain } from "../types";
let cookieGenerationInProgress = false;
export async function getRandomValidCookies(domain: "de" | "com") {
  let retry = 0;
  while (retry < 5) {
    const cookie = await getRandomCookie();
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    if (cookie) {
      //compare timestamps
      const difference = currentTimestamp - cookie.timestamp;
      if (difference > 172800) {
        //means older than 2 days, discard and get new
        await deleteCookie(cookie.cookieString);
      } else {
        return cookie;
      }
    }
    retry++;
  }
  return await generateNewCookies(domain);
}

export async function reportFailure(cookieString: string, domain: Domain) {
  await updateCookieFailureCount(cookieString, domain);
}

export async function deleteCookie(cookieString: string) {
  await removeCookie(cookieString);
}
export async function generateNewCookies(domain: "de" | "com") {
  try {
    if (cookieGenerationInProgress) {
      //One puppeteer is already open for this server, no need
      return;
    }
    cookieGenerationInProgress = true;
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.setUserAgent(generateRandomUseragent());
    const url = `https://amazon.${domain}/errors/validateCaptcha`;
    await page.goto(url, {
      waitUntil: "networkidle2",
    });
    //Get the captcha image from amazon
    const parsed = parse(await page.content());
    const images = parsed.querySelectorAll("img");
    const found = images.find(
      (img) => img.getAttribute("src")?.includes("captcha"),
    );
    const captchaUrl = found?.attributes["src"];
    if (captchaUrl) {
      const requestObj: AxiosRequestConfig | undefined = {
        timeout: 20000,
        responseType: "arraybuffer",
      };
      const dlResult = await axios.get(captchaUrl, requestObj);
      fs.writeFileSync("./captcha.jpg", dlResult.data);
      //now send to python and solve it
      const captchaResult: string = await new Promise((resolve, reject) => {
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
      await insertCookie(mapped, domain);
      saveSystemInfo("Cookies successfully saved to the database");
      const cookie: Cookie = { cookieString: mapped, timestamp: 0, id: 0 };
      return cookie;
    }
    await browser.close();
  } catch (e: any) {
    saveSystemError(e.message);
  }
}
