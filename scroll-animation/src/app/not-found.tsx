import Link from "next/link";

/**
 * Custom 404 page with consistent dark theme styling.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060a14] px-6">
      <div className="max-w-md text-center">
        {/* Animated 404 number */}
        <div className="mb-6">
          <span className="text-8xl font-black bg-gradient-to-r from-amber-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
            404
          </span>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-white">
          Page not found
        </h1>
        <p className="mb-8 text-sm text-gray-400 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 hover:scale-105"
          >
            Go Home
          </Link>
          <Link
            href="/home"
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:border-white/[0.15] hover:text-white"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
