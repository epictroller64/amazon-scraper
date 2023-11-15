export type ApiClient = {
  id: number;
  apiKey: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  requestsRemaining: number;
  requestsTotal: number;
  session: string;
  activepackage: number;
  renewTimestamp: number
  maxConcurrent?: number
};
