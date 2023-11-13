"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonError = void 0;
class AmazonError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.name = "AmazonError";
        this.statusCode = statusCode;
    }
}
exports.AmazonError = AmazonError;
//# sourceMappingURL=error.js.map