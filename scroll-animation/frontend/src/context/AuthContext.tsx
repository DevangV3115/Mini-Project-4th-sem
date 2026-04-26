"use client";

import { createContext, useContext, type ReactNode } from "react";

interface AuthContextType {
  user: null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 👉 dummy functions (Firebase हटाने के लिए)
  const signIn = async () => {
    console.log("Login handled by backend");
  };

  const signUp = async () => {
    console.log("Signup handled by backend");
  };

  const signOut = async () => {
    console.log("Logout");
  };

  const resetPassword = async () => {};
  const signInWithGoogle = async () => {};
  const signInWithGithub = async () => {};

  return (
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        signInWithGithub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}