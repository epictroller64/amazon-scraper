"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJob = exports.authMiddleware = void 0;
const logManager_1 = require("./utils/logManager");
const responses_1 = require("./models/responses");
function authMiddleware(req, res, next) {
    const token = req.headers["authorization"];
    if (token) {
        const tokenRaw = token.replace("Bearer ", "");
        try {
            req.user = { username: "none", token: tokenRaw }; // Attach the decoded user information to the request object
            (0, logManager_1.saveIp)(token, req.socket.remoteAddress || req.ip); //log the ip address into database
        }
        catch (error) {
            // Handle invalid token
            return (0, responses_1.Unauthorized)(res, "Invalid token");
        }
        return next();
    }
    return (0, responses_1.Unauthorized)(res, "No token provided");
}
exports.authMiddleware = authMiddleware;
function validateJob(req, res, next) {
    const body = req.query;
    if ((body.type === "amazon_search" ||
        body.type === "amazon_asin" ||
        body.type === "seller_details" ||
        body.type === "product_reviews" ||
        body.type === "product_details") &&
        (body.domain === "de" || body.domain === "com")) {
        next();
    }
    else {
        res.status(400).send({ error: "Invalid job model" });
    }
}
exports.validateJob = validateJob;
//# sourceMappingURL=middleware.js.map