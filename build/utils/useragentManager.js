"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportUserAgent = exports.generateRandomUseragent = void 0;
const useragentRepository_1 = require("../repositories/useragentRepository");
const user_agents_1 = __importDefault(require("user-agents"));
function generateRandomUseragent() {
    return new user_agents_1.default({ deviceCategory: "desktop" }).toString();
}
exports.generateRandomUseragent = generateRandomUseragent;
async function reportUserAgent(userAgent, url, status) {
    const report = {
        useragent: userAgent,
        site: url,
        status: status,
    };
    await (0, useragentRepository_1.insertUseragentReport)(report);
}
exports.reportUserAgent = reportUserAgent;
//# sourceMappingURL=useragentManager.js.map