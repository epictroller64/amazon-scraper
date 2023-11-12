declare global {
  namespace Express {
    export interface Request {
      user?: DecodedUser;
    }
  }
}

export interface DecodedUser {
  username: string;
  token: string;
  // Add more properties as needed
}
