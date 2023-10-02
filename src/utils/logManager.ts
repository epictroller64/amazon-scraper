import { Log } from "../types";
import { insertIp, insertLog } from "../repositories/logRepository";

async function saveLog(
  type: "error" | "info",
  apiKey: string,
  message: string,
  jobId: string,
) {
  const log: Log = {
    type: type,
    message: message,
    apiKey: apiKey,
    jobId: jobId,
    timestamp: Math.floor(new Date().getTime() / 1000),
  };
  await insertLog(log);
}

export function saveError(apiKey: string, message: string, jobId: string) {
  saveLog("error", apiKey, message, jobId).then();
}

export function saveInfo(apiKey: string, message: string, jobId: string) {
  saveLog("info", apiKey, message, jobId).then();
}

export function saveSystemInfo(message: string) {
  saveLog("info", "system", message, "N/A").then();
}
export function saveIp(apiKey: string, ip: string) {
  insertIp(ip, apiKey).then();
}
