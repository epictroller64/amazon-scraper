import { ApiClient } from "../models/apiClient";
import { execute, query } from "../utils/mysql";

export async function retrieveApiClient(
  apiKey: string,
): Promise<ApiClient | null> {
  const sql = "SELECT A.*, B.maxConcurrent FROM amazon_scraper.apiclients AS A INNER JOIN amazon_scraper.packages AS B ON A.activePackage = B.id WHERE A.apiKey = ?;";
  return await query<ApiClient>(sql, [apiKey]);
}

//reduces requestsRemaining by 1
export async function editApiClient(apiKey: string, count: number) {
  const sql =
    "UPDATE apiclients SET requestsRemaining = requestsRemaining - ? WHERE apiKey = ?;";
  return await execute(sql, [count, apiKey]);
}
