// Function to store a key/value pair
import { execute, query } from "../utils/mysql";
import Cache from "../models/cacheModel";

export async function storeKeyValue(
  key: string,
  value: unknown,
  timestamp: number,
): Promise<void> {
  const sql =
    "INSERT INTO cache (`key`, `value`, timestamp) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?;";
  return await execute(sql, [key, value, timestamp, value]);
}

// Function to retrieve a value by key
export async function getValueByKey(key: string) {
  const sql = "SELECT `value` FROM cache WHERE `key` = ?";
  return await query<Cache>(sql, [key]);
}

// Function to delete a key/value pair by key
export async function deleteByKey(key: string): Promise<void> {
  const sql = "DELETE FROM cache WHERE 'key' = ?";
  return await execute(sql, [key]);
}
