"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {!sent ? (
        <>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 border border-white/[0.08] flex items-center justify-center mb-5 auth-icon-enter">
              <svg
                className="w-7 h-7 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 auth-title-enter">
              Reset your password
            </h1>
            <p className="text-gray-400 text-sm auth-subtitle-enter leading-relaxed max-w-xs mx-auto">
              Enter the email address associated with your account and we&apos;ll
              send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm auth-field-enter">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="auth-field-enter" style={{ animationDelay: "0.1s" }}>
              <label
                htmlFor="reset-email"
                className={`block text-xs font-medium mb-1.5 transition-colors duration-300 ${
                  focusedField === "email" ? "text-sky-400" : "text-gray-400"
                }`}
              >
                Email address
              </label>
              <div className={`auth-input-wrapper ${focusedField === "email" ? "focused" : ""}`}>
                <svg
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    focusedField === "email" ? "text-sky-400" : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="auth-input pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field-enter" style={{ animationDelay: "0.2s" }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-submit-btn w-full relative overflow-hidden"
              >
                <span className={`relative z-10 flex items-center justify-center gap-2 transition-all duration-300 ${isSubmitting ? "opacity-0" : "opacity-100"}`}>
                  Send reset link
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="auth-spinner" />
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-8 auth-footer-enter">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-sky-400 hover:text-sky-300 font-medium transition-colors duration-300 auth-link-hover"
            >
              Sign in
            </Link>
          </p>
        </>
      ) : (
        /* Success state */
        <div className="text-center auth-success-enter">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 auth-success-icon">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
          <p className="text-gray-400 text-sm mb-2 leading-relaxed">
            We&apos;ve sent a password reset link to
          </p>
          <p className="text-sky-400 font-medium text-sm mb-6">{email}</p>
          <p className="text-gray-500 text-xs mb-8 leading-relaxed">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-amber-400 hover:text-amber-300 transition-colors duration-300 auth-link-hover"
            >
              try again
            </button>
          </p>
          <Link
            href="/login"
            className="auth-submit-btn inline-flex items-center gap-2 px-6 py-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to sign in
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
