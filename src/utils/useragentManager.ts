import { randomInt } from "crypto";
import { insertUseragentReport } from "../repositories/useragentRepository";
import { UseragentReport } from "../models/useragent";

export function generateRandomUseragent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47",
  ];
  const rand = randomInt(0, userAgents.length);
  return userAgents[rand];
}

export async function reportUserAgent(
  userAgent: string,
  url: string,
  status: string,
) {
  const report: UseragentReport = {
    useragent: userAgent,
    site: url,
    status: status,
  };
  await insertUseragentReport(report);
}
