import { Log } from "../types";
import { execute } from "../utils/mysql";

export async function insertIp(ip: string, apiKey: string): Promise<void> {
  const sql = "INSERT INTO iplogs (ip, apiKey, timestamp) VALUES (?,?,?)";
  return await execute(sql, [
    ip,
    apiKey,
    Math.floor(new Date().getTime() / 1000),
  ]);
}
export async function insertLog(log: Log): Promise<void> {
  const sql =
    "INSERT INTO logs (type, message, apikey, timestamp, jobId) VALUES (?,?,?,?,?)";
  return await execute(sql, [
    log.type,
    log.message,
    log.apiKey,
    log.timestamp,
    log.jobId,
  ]);
}
