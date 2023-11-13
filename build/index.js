"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const backgroundManager_1 = require("./utils/backgroundManager");
const getPortFromArgs = () => {
    for (let i = 0; i < process.argv.length; i++) {
        const match = process.argv[i].match(/^--port=(\d+)$/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }
    return null; // or default port, e.g., return 8080;
};
const port = getPortFromArgs() || 8001;
new backgroundManager_1.BackgroundManager();
(0, server_1.startServer)(port);
//# sourceMappingURL=index.js.map