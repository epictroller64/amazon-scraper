"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUseragentReport = void 0;
const mysql_1 = require("../utils/mysql");
async function insertUseragentReport(report) {
    const sql = "INSERT INTO useragentreports (useragent, status, site) VALUES (?,?,?)";
    return await (0, mysql_1.execute)(sql, [report.useragent, report.status, report.site]);
}
exports.insertUseragentReport = insertUseragentReport;
//# sourceMappingURL=useragentRepository.js.map