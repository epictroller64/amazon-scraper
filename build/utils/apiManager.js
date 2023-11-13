"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRequests = exports.validateApiKey = void 0;
const apiKeyRepository_1 = require("../repositories/apiKeyRepository");
async function validateApiKey(apiKey) {
    const apiClient = await (0, apiKeyRepository_1.retrieveApiClient)(apiKey);
    if (apiClient) {
        if (apiClient.requestsRemaining > 0) {
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
//# sourceMappingURL=apiManager.js.map