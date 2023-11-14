"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.query = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
// Create a MySQL connection pool
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0, // 0 means no limit
});
async function query(sql, params) {
    const connection = await exports.pool.getConnection();
    try {
        const [rows] = await connection.query(sql, params);
        if (rows.length > 0) {
            return rows[0];
        }
        return null;
    }
    finally {
        connection.release();
    }
}
exports.query = query;
async function execute(sql, params) {
    const connection = await exports.pool.getConnection();
    try {
        await connection.execute(sql, params);
    }
    finally {
        connection.release();
    }
}
exports.execute = execute;
//# sourceMappingURL=mysql.js.map