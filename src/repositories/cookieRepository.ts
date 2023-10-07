import { execute, query } from "../utils/mysql";
import { Cookie } from "../models/cookie";
import { Domain } from "../types";

export async function insertCookie(cookieString: string, domain: "com" | "de") {
  const sql =
    "INSERT INTO cookies (cookieString, timestamp, domain) VALUES (?, ?, ?)";
  return await execute(sql, [
    cookieString,
    Math.floor(new Date().getTime() / 1000),
    domain,
  ]);
}
export async function updateCookieFailureCount(
  cookieString: string,
  domain: Domain,
) {
  const sql =
    "UPDATE cookies SET failure_count = failure_count + 1 WHERE cookieString = ? AND domain = ?";
  return await execute(sql, [cookieString, domain]);
}
export async function removeCookie(cookieString: string) {
  const sql = "DELETE FROM cookies WHERE cookieString=?";
  return await execute(sql, [cookieString]);
}

export async function getRandomCookie() {
  const sql = "select * from cookies order by RAND() limit 1";
  return await query<Cookie>(sql, []);
}
export async function getLastCookie() {
  const sql = "select * from cookies order by id desc limit 1";
  return await query<Cookie>(sql, []);
}
