import { AxiosResponse } from "axios";
import { collectRequestCount, collectRequestsize } from "./logistics";

export function axiosResponseIterceptor(response: AxiosResponse) {
  const contentLength = response.data.length;
  const sizeInMB = contentLength / (1024 * 1024);
  collectRequestsize(sizeInMB);
  collectRequestCount();
  return response;
}
