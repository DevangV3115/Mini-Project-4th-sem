"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashSidebar from "@/components/dashboard/DashSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060a14]">
        <div className="auth-spinner !w-8 !h-8 !border-2" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#060a14]">
      <DashSidebar />
      <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
