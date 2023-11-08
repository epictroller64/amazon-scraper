import {
  editApiClient,
  retrieveApiClient,
} from "../repositories/apiKeyRepository";
import exp from "constants";

export async function validateApiKey(apiKey: string) {
  const apiClient = await retrieveApiClient(apiKey);
  if (apiClient) {
    if (apiClient.requestsRemaining > 0) {
      return { result: true, message: "Ok." };
    } else {
      return { result: false, message: "Out of credits." };
    }
  }
  return { result: false, message: "Invalid API Key." };
}

export async function addRequests(apiKey: string, count: number) {
  await editApiClient(apiKey, count);
}
