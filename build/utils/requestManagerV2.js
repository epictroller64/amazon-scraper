"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = exports.RequestManagerV2 = void 0;
const axios_1 = __importDefault(require("axios"));
const error_1 = require("../models/error");
const child_process_1 = require("child_process");
const runPythonScript = (url) => {
    const script = (0, child_process_1.spawn)('python', ['proxy.py', url]); // Replace './script.py' with your Python script's path
    script.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    script.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    script.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
};
class RequestManagerV2 {
    instance = axios_1.default.create();
    constructor() { }
    async getRequest2(url) {
        runPythonScript(url);
    }
    //automatically sends through proxy api
    async getRequest(url) {
        const result = await this.instance.get("http://127.0.0.1:5000/fetch_url", {
            params: {
                url: url,
                response_type: "text",
            },
        });
        if (result.data.status_code !== 200) {
            const newError = new error_1.AmazonError("Fetching failed: " + result.data.status_code, result.data.status_code);
            throw newError;
        }
        return result;
    }
}
exports.RequestManagerV2 = RequestManagerV2;
exports.Request = new RequestManagerV2();
//# sourceMappingURL=requestManagerV2.js.map