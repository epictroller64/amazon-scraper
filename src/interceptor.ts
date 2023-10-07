import { AxiosError, AxiosResponse, isAxiosError } from "axios";
import { collectRequestCount, collectRequestsize } from "./logistics";
import { reportUserAgent } from "./utils/useragentManager";

export function axiosResponseInterceptor(response: AxiosResponse) {
  const contentLength = response.data.length;
  const sizeInMB = contentLength / (1024 * 1024);
  collectRequestsize(sizeInMB);
  collectRequestCount();
  return response;
}
export async function axiosResponseErrorInterceptor(error: any) {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;
    await reportUserAgent(
      (axiosError.response?.config.headers["User-Agent"] as string) || "None",
      axiosError.response?.config.url || "",
      "Failed",
    );
  }
  return Promise.reject(error);
}
