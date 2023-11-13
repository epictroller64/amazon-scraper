"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteByKey = exports.getValueByKey = exports.storeKeyValue = void 0;
// Function to store a key/value pair
const mysql_1 = require("../utils/mysql");
async function storeKeyValue(key, value, timestamp) {
    const sql = "INSERT INTO cache (`key`, `value`, timestamp) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?;";
    return await (0, mysql_1.execute)(sql, [key, value, timestamp, value]);
}
exports.storeKeyValue = storeKeyValue;
// Function to retrieve a value by key
async function getValueByKey(key) {
    const sql = "SELECT `value` FROM cache WHERE `key` = ?";
    return await (0, mysql_1.query)(sql, [key]);
}
exports.getValueByKey = getValueByKey;
// Function to delete a key/value pair by key
async function deleteByKey(key) {
    const sql = "DELETE FROM cache WHERE 'key' = ?";
    return await (0, mysql_1.execute)(sql, [key]);
}
exports.deleteByKey = deleteByKey;
//# sourceMappingURL=cacheRepository.js.map