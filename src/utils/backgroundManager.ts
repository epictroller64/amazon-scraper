import {
  deleteCookie,
  generateNewCookies,
  getRandomValidCookies,
} from "./cookieManager";
import { Domain } from "../types";
import { saveSystemInfo } from "./logManager";

export class BackgroundManager {
  //Checks for the cookies and removes the aged ones. If necessary, generates new cookies
  cookieCheckerTimer: NodeJS.Timer | null = null;
  constructor() {
    this.checkForCookies()
      .then(function () {
        console.log("Cookie checker has stopped");
      })
      .catch(() => console.log("Cookie checker has failed"));
  }

  async checkForCookies() {
    saveSystemInfo("Cookie checker has started");
    const interval = 30 * 60 * 1000;
    this.cookieCheckerTimer = setInterval(async () => {
      const domains: Domain[] = ["de", "com"];
      for (const domain of domains) {
        const existingCookie = await getRandomValidCookies(domain);
        if (!existingCookie) {
          //generate new cookies
          await generateNewCookies(domain);
        } else {
          const currentTimestamp = Math.floor(new Date().getTime() / 1000);
          const difference = currentTimestamp - existingCookie.timestamp;
          if (difference > 172800) {
            await deleteCookie(existingCookie.cookieString);
            await generateNewCookies(domain);
          }
        }
      }
    }, interval);
  }
}
