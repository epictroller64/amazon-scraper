"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosResponseErrorInterceptor = exports.axiosResponseInterceptor = void 0;
const axios_1 = require("axios");
const logistics_1 = require("./logistics");
const useragentManager_1 = require("./utils/useragentManager");
function axiosResponseInterceptor(response) {
    const contentLength = response.data.length;
    const sizeInMB = contentLength / (1024 * 1024);
    (0, logistics_1.collectRequestsize)(sizeInMB);
    (0, logistics_1.collectRequestCount)();
    return response;
}
exports.axiosResponseInterceptor = axiosResponseInterceptor;
async function axiosResponseErrorInterceptor(error) {
    if ((0, axios_1.isAxiosError)(error)) {
        const axiosError = error;
        await (0, useragentManager_1.reportUserAgent)(axiosError.response?.config.headers["User-Agent"] || "None", axiosError.response?.config.url || "", "Failed");
    }
    return Promise.reject(error);
}
exports.axiosResponseErrorInterceptor = axiosResponseErrorInterceptor;
//# sourceMappingURL=interceptor.js.map