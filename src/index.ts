import { startServer } from "./server";
import { BackgroundManager } from "./utils/backgroundManager";
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
new BackgroundManager();
startServer(port);
