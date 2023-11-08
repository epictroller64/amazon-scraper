import { insertUseragentReport } from "../repositories/useragentRepository";
import { UseragentReport } from "../models/useragent";
import UserAgent from "user-agents";

export function generateRandomUseragent() {
  return new UserAgent({ deviceCategory: "desktop" }).toString();
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
