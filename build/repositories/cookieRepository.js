"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastCookie = exports.getRandomCookie = exports.removeCookie = exports.updateCookieFailureCount = exports.insertCookie = void 0;
const mysql_1 = require("../utils/mysql");
async function insertCookie(cookieString, domain) {
    const sql = "INSERT INTO cookies (cookieString, timestamp, domain) VALUES (?, ?, ?)";
    return await (0, mysql_1.execute)(sql, [
        cookieString,
        Math.floor(new Date().getTime() / 1000),
        domain,
    ]);
}
exports.insertCookie = insertCookie;
async function updateCookieFailureCount(cookieString, domain) {
    const sql = "UPDATE cookies SET failure_count = failure_count + 1 WHERE cookieString = ? AND domain = ?";
    return await (0, mysql_1.execute)(sql, [cookieString, domain]);
}
exports.updateCookieFailureCount = updateCookieFailureCount;
async function removeCookie(cookieString) {
    const sql = "DELETE FROM cookies WHERE cookieString=?";
    return await (0, mysql_1.execute)(sql, [cookieString]);
}
exports.removeCookie = removeCookie;
async function getRandomCookie() {
    const sql = "select * from cookies order by RAND() limit 1";
    return await (0, mysql_1.query)(sql, []);
}
exports.getRandomCookie = getRandomCookie;
async function getLastCookie() {
    const sql = "select * from cookies order by id desc limit 1";
    return await (0, mysql_1.query)(sql, []);
}
exports.getLastCookie = getLastCookie;
//# sourceMappingURL=cookieRepository.js.map