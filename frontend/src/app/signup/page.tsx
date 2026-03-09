"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth();

  const passwordStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      router.push("/home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
      setIsSubmitting(false);
    }
  };

  const handleGithub = async () => {
    try {
      await signInWithGithub();
      router.push("/home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "GitHub sign up failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      router.push("/home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign up failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 auth-title-enter">
          Create your account
        </h1>
        <p className="text-gray-400 text-sm auth-subtitle-enter">
          Join 50,000+ researchers pushing AI forward
        </p>
      </div>

      {/* Social signup */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm auth-field-enter">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6 auth-social-enter">
        <button
          type="button"
          onClick={handleGithub}
          className="auth-social-btn flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all duration-300 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          className="auth-social-btn flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all duration-300 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6 auth-divider-enter">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0f1629] px-4 text-gray-500 uppercase tracking-widest">
            or continue with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="auth-field-enter" style={{ animationDelay: "0.05s" }}>
          <label
            htmlFor="name"
            className={`block text-xs font-medium mb-1.5 transition-colors duration-300 ${
              focusedField === "name" ? "text-sky-400" : "text-gray-400"
            }`}
          >
            Full name
          </label>
          <div className={`auth-input-wrapper ${focusedField === "name" ? "focused" : ""}`}>
            <svg
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                focusedField === "name" ? "text-sky-400" : "text-gray-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              className="auth-input pl-10"
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="auth-field-enter" style={{ animationDelay: "0.1s" }}>
          <label
            htmlFor="signup-email"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="signup-email"
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

        {/* Password */}
        <div className="auth-field-enter" style={{ animationDelay: "0.15s" }}>
          <label
            htmlFor="signup-password"
            className={`block text-xs font-medium mb-1.5 transition-colors duration-300 ${
              focusedField === "password" ? "text-sky-400" : "text-gray-400"
            }`}
          >
            Password
          </label>
          <div className={`auth-input-wrapper ${focusedField === "password" ? "focused" : ""}`}>
            <svg
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                focusedField === "password" ? "text-sky-400" : "text-gray-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="auth-input pl-10 pr-10"
              placeholder="Min 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-300"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.758 6.758M9.878 9.878l-3.12-3.12m7.362 7.362l3.12 3.12M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password strength bar */}
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i <= passwordStrength ? strengthColor : "bg-white/[0.08]"
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  passwordStrength <= 1 ? "text-red-400" : passwordStrength === 2 ? "text-amber-400" : passwordStrength === 3 ? "text-sky-400" : "text-emerald-400"
                }`}
              >
                {strengthLabel}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="auth-field-enter" style={{ animationDelay: "0.2s" }}>
          <label
            htmlFor="confirm-password"
            className={`block text-xs font-medium mb-1.5 transition-colors duration-300 ${
              focusedField === "confirm" ? "text-sky-400" : "text-gray-400"
            }`}
          >
            Confirm password
          </label>
          <div className={`auth-input-wrapper ${focusedField === "confirm" ? "focused" : ""}`}>
            <svg
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                focusedField === "confirm" ? "text-sky-400" : "text-gray-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirm")}
              onBlur={() => setFocusedField(null)}
              className="auth-input pl-10"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            {confirmPassword && password && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {password === confirmPassword ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="auth-field-enter flex items-start gap-3" style={{ animationDelay: "0.25s" }}>
          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
              agreed
                ? "bg-gradient-to-r from-amber-500 to-sky-500 border-transparent"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            {agreed && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span className="text-xs text-gray-400 leading-relaxed">
            I agree to the{" "}
            <span className="text-sky-400 hover:text-sky-300 cursor-pointer transition-colors duration-300 auth-link-hover">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-sky-400 hover:text-sky-300 cursor-pointer transition-colors duration-300 auth-link-hover">
              Privacy Policy
            </span>
          </span>
        </div>

        {/* Submit */}
        <div className="auth-field-enter" style={{ animationDelay: "0.3s" }}>
          <button
            type="submit"
            disabled={isSubmitting || !agreed}
            className="auth-submit-btn w-full relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`relative z-10 flex items-center justify-center gap-2 transition-all duration-300 ${isSubmitting ? "opacity-0" : "opacity-100"}`}>
              Create account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-sky-400 hover:text-sky-300 font-medium transition-colors duration-300 auth-link-hover"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
