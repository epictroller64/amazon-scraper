"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJobId = void 0;
const uuid_1 = require("uuid");
function generateJobId(job, ownerApiKey) {
    job.jobId = (0, uuid_1.v4)();
    job.ownerApiKey = ownerApiKey;
    const jsonString = JSON.stringify(job);
    // Generate a random unique ID from the JSON string
    return Buffer.from(jsonString).toString("base64");
}
exports.generateJobId = generateJobId;
//# sourceMappingURL=jobManager.js.map