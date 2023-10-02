import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";
import { ApiClient } from "../models/apiClient";

// Create a MySQL connection pool
export const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "aaaaaa",
  database: "amazon_scraper",
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0, // 0 means no limit
});

export async function query<T>(
  sql: string,
  params: string[] | number[],
): Promise<T | null> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(sql, params);
    if (rows.length > 0) {
      return rows[0] as T;
    }
    return null;
  } finally {
    connection.release();
  }
}

export async function execute(
  sql: string,
  params: string[] | number[] | unknown[],
) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(sql, params);
  } finally {
    connection.release();
  }
}
