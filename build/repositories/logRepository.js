"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertLog = exports.insertIp = void 0;
const mysql_1 = require("../utils/mysql");
async function insertIp(ip, apiKey) {
    const sql = "INSERT INTO iplogs (ip, apiKey, timestamp) VALUES (?,?,?)";
    return await (0, mysql_1.execute)(sql, [
        ip,
        apiKey,
        Math.floor(new Date().getTime() / 1000),
    ]);
}
exports.insertIp = insertIp;
async function insertLog(log) {
    const sql = "INSERT INTO logs (type, message, apikey, timestamp, jobId) VALUES (?,?,?,?,?)";
    return await (0, mysql_1.execute)(sql, [
        log.type,
        log.message,
        log.apiKey,
        log.timestamp,
        log.jobId,
    ]);
}
exports.insertLog = insertLog;
//# sourceMappingURL=logRepository.js.map