"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectRequestCount = exports.reset = exports.collectRequestsize = exports.totalRequestCount = exports.totalRequestSize = void 0;
exports.totalRequestSize = 0;
exports.totalRequestCount = 0;
function collectRequestsize(size) {
    exports.totalRequestSize += size;
    //console.log(`Total request size: ${totalRequestSize.toFixed(2)} MB`);
}
exports.collectRequestsize = collectRequestsize;
function reset() {
    exports.totalRequestCount = 0;
    exports.totalRequestSize = 0;
}
exports.reset = reset;
//adds up request
function collectRequestCount() {
    exports.totalRequestCount++;
}
exports.collectRequestCount = collectRequestCount;
//# sourceMappingURL=logistics.js.map