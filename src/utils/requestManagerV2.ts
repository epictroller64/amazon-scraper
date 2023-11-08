import axios, { AxiosInstance } from "axios";

export class RequestManagerV2 {
  private instance: AxiosInstance = axios.create();

  constructor() {}
  //automatically sends through proxy api
  public async getRequest(url: string, apiKey: string) {
    console.log("requesting");
    return await this.instance.get("http://127.0.0.1:5000/fetch_url", {
      params: {
        url: url,
        response_type: "text",
      },
    });
  }
}
export const Request = new RequestManagerV2();
