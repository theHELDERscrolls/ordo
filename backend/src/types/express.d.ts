// Augment Express's Request so protected handlers can read the authenticated id
// that the auth middleware attaches after verifying the access token.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
