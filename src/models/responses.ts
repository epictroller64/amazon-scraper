import { Response } from "express";
import { JobResponse, Product } from "../types";

export interface SearchResponse {
  success: boolean;
  message: string;
  products: Product[];
}

export function ServerError(res: Response, message: string) {
  return res.status(500).json({ success: false, message: message });
}
export function Success(res: Response, responseObject: JobResponse) {
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({ success: true, data: responseObject });
}

export function BadRequest(res: Response, message: string) {
  return res.status(400).json({ success: false, message });
}

export function Unauthorized(res: Response, message: string) {
  return res.status(401).json({ success: false, message });
}
