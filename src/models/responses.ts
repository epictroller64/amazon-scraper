import { Response } from "express";
import { Product } from "../types";

export interface SearchResponse {
  success: boolean;
  message: string;
  products: Product[];
}

export function ServerError(res: Response, message: string) {
  return res.status(500).json({ status: "Failed", message: message });
}
export function Success(res: Response, data: any) {
  return res.status(200).json({ status: "Success", data: data });
}

export function BadRequest(res: Response, message: string) {
  return res.status(400).json({ status: "Failed", message });
}

export function Unauthorized(res: Response, message: string) {
  return res.status(401).json({ status: "Failed", message });
}
