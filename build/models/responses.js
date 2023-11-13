"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unauthorized = exports.BadRequest = exports.Success = exports.ServerError = void 0;
function ServerError(res, message) {
    return res.status(500).json({ success: false, message: message });
}
exports.ServerError = ServerError;
function Success(res, responseObject) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ success: true, data: responseObject });
}
exports.Success = Success;
function BadRequest(res, message) {
    return res.status(400).json({ success: false, message });
}
exports.BadRequest = BadRequest;
function Unauthorized(res, message) {
    return res.status(401).json({ success: false, message });
}
exports.Unauthorized = Unauthorized;
//# sourceMappingURL=responses.js.map