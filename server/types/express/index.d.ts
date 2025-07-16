import 'express';
import session from 'express-session';

// You may want to adjust the User interface to match your actual user object

declare global {
  namespace Express {
    interface User {
      id: string;
      // Add other user properties as needed
      [key: string]: any;
    }
    interface Request {
      user?: User;
      isAuthenticated(): boolean;
      logout(callback: (err: any) => void): void;
      session?: session.Session & Partial<session.SessionData>;
      sessionStore?: session.Store;
    }
  }
}

export {}; 