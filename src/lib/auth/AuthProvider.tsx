"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AuthValue = { user: User | null; loading: boolean };

const AuthContext = createContext<AuthValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthValue>({ user: null, loading: isFirebaseConfigured });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (user) => setState({ user, loading: false }));
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
