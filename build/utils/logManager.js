"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveIp = exports.saveSystemInfo = exports.saveSystemError = exports.saveInfo = exports.saveError = void 0;
const logRepository_1 = require("../repositories/logRepository");
async function saveLog(type, apiKey, message, jobId) {
    const log = {
        type: type,
        message: message,
        apiKey: apiKey,
        jobId: jobId,
        timestamp: Math.floor(new Date().getTime() / 1000),
    };
    await (0, logRepository_1.insertLog)(log);
}
function saveError(apiKey, message, jobId) {
    saveLog("error", apiKey, message, jobId).then();
}
exports.saveError = saveError;
function saveInfo(apiKey, message, jobId) {
    saveLog("info", apiKey, message, jobId).then();
}
exports.saveInfo = saveInfo;
function saveSystemError(message) {
    saveLog("error", "system", message, "N/A").then();
}
exports.saveSystemError = saveSystemError;
function saveSystemInfo(message) {
    saveLog("info", "system", message, "N/A").then();
}
exports.saveSystemInfo = saveSystemInfo;
function saveIp(apiKey, ip) {
    (0, logRepository_1.insertIp)(ip, apiKey).then();
}
exports.saveIp = saveIp;
//# sourceMappingURL=logManager.js.map