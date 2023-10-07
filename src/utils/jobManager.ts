import { JobModel } from "../models/jobModel";
import { v4 as uuidv4 } from "uuid";

export function generateJobId(job: JobModel, ownerApiKey: string) {
  job.jobId = uuidv4();
  job.ownerApiKey = ownerApiKey;
  const jsonString = JSON.stringify(job);

  // Generate a random unique ID from the JSON string
  return Buffer.from(jsonString).toString("base64");
}
