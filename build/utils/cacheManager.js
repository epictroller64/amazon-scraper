"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = exports.removeCache = exports.insertCache = void 0;
const cacheRepository_1 = require("../repositories/cacheRepository");
async function insertCache(key, value) {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    if (typeof value !== "string") {
        value = JSON.stringify(value);
    }
    await (0, cacheRepository_1.storeKeyValue)(key, value, timestamp);
}
exports.insertCache = insertCache;
async function removeCache(key) {
    await (0, cacheRepository_1.deleteByKey)(key);
}
exports.removeCache = removeCache;
async function getCache(key) {
    const cachedValue = (await (0, cacheRepository_1.getValueByKey)(key));
    if (cachedValue && cachedValue.length > 0) {
        const currentTimestamp = Math.floor(new Date().getTime() / 1000);
        if (currentTimestamp - 86400 < cachedValue.timestamp) {
            return null;
        }
        return cachedValue;
    }
    return null;
}
exports.getCache = getCache;
//# sourceMappingURL=cacheManager.js.map