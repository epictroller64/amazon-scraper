import { NextFunction, Request, Response } from "express";
import { saveIp } from "./utils/logManager";
import { Unauthorized } from "./models/responses";
import { JobModel } from "./models/jobModel";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers["authorization"];
  if (token) {
    try {
      req.user = { username: "swa", token: token }; // Attach the decoded user information to the request object
      saveIp(token, req.socket.remoteAddress || req.ip); //log the ip address into database
    } catch (error) {
      // Handle invalid token
      return Unauthorized(res, "Invalid token");
    }
    return next();
  }
  return Unauthorized(res, "No token provided");
}
export function validateJob(req: Request, res: Response, next: NextFunction) {
  const body = req.query as unknown as JobModel;
  if (
    (body.type === "amazon_search" ||
      body.type === "amazon_asin" ||
      body.type === "seller_details" ||
      body.type === "product_reviews" ||
      body.type === "product_details") &&
    (body.domain === "de" || body.domain === "com")
  ) {
    next();
  } else {
    res.status(400).send({ error: "Invalid job model" });
  }
}
