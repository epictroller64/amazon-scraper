import axios, { AxiosInstance } from "axios";
import { AmazonError } from "../models/error";

import { spawn } from 'child_process';

const runPythonScript = (url: string) => {
  const script = spawn('python', ['proxy.py', url]); // Replace './script.py' with your Python script's path

  script.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  script.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  script.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};


export class RequestManagerV2 {
  private instance: AxiosInstance = axios.create();

  constructor() { }
  public async getRequest2(url: string) {
    runPythonScript(url);
  }

  //automatically sends through proxy api
  public async getRequest(url: string) {
    const result = await this.instance.get("http://127.0.0.1:5000/fetch_url", {
      params: {
        url: url,
        response_type: "text",
      },
    });
    if (result.data.status_code !== 200) {
      const newError: AmazonError = new AmazonError("Fetching failed: " + result.data.status_code, result.data.status_code)
      throw newError
    }
    return result;
  }
}
export const Request = new RequestManagerV2();
