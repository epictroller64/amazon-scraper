"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editApiClient = exports.retrieveApiClient = void 0;
const mysql_1 = require("../utils/mysql");
async function retrieveApiClient(apiKey) {
    const sql = "SELECT * FROM apiclients WHERE apiKey = ?";
    return await (0, mysql_1.query)(sql, [apiKey]);
}
exports.retrieveApiClient = retrieveApiClient;
//reduces requestsRemaining by 1
async function editApiClient(apiKey, count) {
    const sql = "UPDATE apiclients SET requestsRemaining = requestsRemaining - ? WHERE apiKey = ?;";
    return await (0, mysql_1.execute)(sql, [count, apiKey]);
}
exports.editApiClient = editApiClient;
//# sourceMappingURL=apiKeyRepository.js.map