"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const signIn = async (email: string, password: string) => {
  try {
    const res = await fetch("https://mini-project-4th-sem-wz8x.onrender.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (res.ok) {
      // 🔥 यही main fix है
      router.push("/home");
    } else {
      alert("Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Login error");
  }
};

  const signUp = async (email: string, password: string, name: string) => {
  try {
    const res = await fetch("https://mini-project-4th-sem-wz8x.onrender.com/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    console.log("Signup response:", data);

    alert(data.message || "Signup response received");
  } catch (err) {
    console.error(err);
    alert("Signup error");
  }
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