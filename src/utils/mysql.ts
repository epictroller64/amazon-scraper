import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";

// Create a MySQL connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0, // 0 means no limit
});

export async function query<T>(
  sql: string,
  params: string[] | number[],
): Promise<T | null> {
  try {
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
  catch (err: any) {
    console.log(err.message)
    return null
  }
}

export async function execute(
  sql: string,
  params: string[] | number[] | unknown[],
) {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.execute(sql, params);
    } finally {
      connection.release();
    }

  } catch (err: any) {
    console.log(err.message)
  }
}
