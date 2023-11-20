"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConcurrentRequestLimit = exports.addConcurrentRequest = exports.addRequests = exports.validateApiKey = void 0;
const apiKeyRepository_1 = require("../repositories/apiKeyRepository");
const concurrentRequests = new Map();
async function validateApiKey(apiClient) {
    if (apiClient) {
        if (apiClient.requestsRemaining > 0) {
            const renewDate = new Date(apiClient.renewtimestamp * 1000);
            const currentDate = new Date();
            if (currentDate.getTime() > renewDate.getTime()) {
                return { result: false, message: "Package expired" };
            }
            if (apiClient.renewtimestamp)
                return { result: true, message: "Ok." };
        }
        else {
            return { result: false, message: "Out of credits." };
        }
    }
    return { result: false, message: "Invalid API Key." };
}
exports.validateApiKey = validateApiKey;
async function addRequests(apiKey, count) {
    await (0, apiKeyRepository_1.editApiClient)(apiKey, count);
}
exports.addRequests = addRequests;
async function addConcurrentRequest(apiKey) {
    const existing = concurrentRequests.get(apiKey);
    if (!existing) {
        concurrentRequests.set(apiKey, 1);
    }
    else {
        concurrentRequests.set(apiKey, existing + 1);
    }
}
exports.addConcurrentRequest = addConcurrentRequest;
async function checkConcurrentRequestLimit(apiClient) {
    const current = concurrentRequests.get(apiClient.apiKey);
    if (!current) {
        return { result: true, message: "" };
    }
    const limit = apiClient.maxConcurrent || 3;
    if (current < limit) {
        return { result: true, message: "" };
    }
    return { result: false, message: "Too many concurrent requests" };
}
exports.checkConcurrentRequestLimit = checkConcurrentRequestLimit;
//# sourceMappingURL=apiManager.js.map