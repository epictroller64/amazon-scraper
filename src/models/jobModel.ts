import { Domain, Type } from "../types";

export interface JobModel {
  type: Type;
  keyword: string;
  pages?: number;
  domain: Domain;
  jobId?: string;
  ownerApiKey?: string;
}
