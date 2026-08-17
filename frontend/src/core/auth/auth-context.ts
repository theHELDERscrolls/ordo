import { createContext } from 'react';
import type { AuthContextValue } from './auth-types';

/** Holds the session. Read it through `useAuth`, never directly. */
export const AuthContext = createContext<AuthContextValue | null>(null);
