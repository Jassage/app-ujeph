// types/express.d.ts
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      // autres propriétés de votre user
    }

    interface Request {
      logout(callback: (err?: any) => void): void;
      user?: User;
    }
  }
}
