import { ApiClient } from "../models/apiClient";
import {
  editApiClient,
} from "../repositories/apiKeyRepository";

const concurrentRequests = new Map<string, number>()
export async function validateApiKey(apiClient: ApiClient) {
  if (apiClient) {
    if (apiClient.requestsRemaining > 0) {
      const renewDate = new Date(apiClient.renewtimestamp * 1000)
      const currentDate = new Date()
      if (currentDate.getTime() > renewDate.getTime()) {
        return { result: false, message: "Package expired" }
      }
      if (apiClient.renewtimestamp)
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

export async function addConcurrentRequest(apiKey: string) {
  const existing = concurrentRequests.get(apiKey)
  if (!existing) {
    concurrentRequests.set(apiKey, 1)
  } else {
    concurrentRequests.set(apiKey, existing + 1)
  }
}

export async function checkConcurrentRequestLimit(apiClient: ApiClient) {
  const current = concurrentRequests.get(apiClient.apiKey)
  if (!current) {
    return { result: true, message: "" }
  }
  const limit = apiClient.maxConcurrent || 3
  if (current < limit) {
    return { result: true, message: "" }
  }
  return { result: false, message: "Too many concurrent requests" }
}