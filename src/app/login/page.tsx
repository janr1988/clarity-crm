"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ungültige E-Mail oder Passwort");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError("Ein Fehler ist aufgetreten");
      setIsLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Login fehlgeschlagen");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError("Ein Fehler ist aufgetreten");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-2xl shadow-xl">
              <div className="w-10 h-10 relative">
                <div className="absolute inset-0 bg-white/20 rounded-lg rotate-45" />
                <div className="absolute inset-1 bg-white/30 rounded-lg rotate-45" />
                <span className="relative text-white font-bold text-2xl z-10">C</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">Clarity</h1>
          <p className="text-gray-600">CRM Login</p>
        </div>

        <div className="bg-white p-8 rounded shadow-card">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Anmelden</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="lead@clarity.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-primary text-white rounded font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Anmelden..." : "Anmelden"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Demo-Accounts:</p>

            <div className="space-y-2">
              <button
                onClick={() => quickLogin("alexandra.mueller@clarity.com", "lead123")}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Alexandra Müller (Lead)</div>
                    <div className="text-xs text-gray-500">
                      alexandra.mueller@clarity.com • lead123
                    </div>
                  </div>
                  <span className="text-sm text-primary">→</span>
                </div>
              </button>

              <button
                onClick={() => quickLogin("marcus.weber@clarity.com", "agent123")}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Marcus Weber (Agent)</div>
                    <div className="text-xs text-gray-500">
                      marcus.weber@clarity.com • agent123
                    </div>
                  </div>
                  <span className="text-sm text-primary">→</span>
                </div>
              </button>

              <button
                onClick={() => quickLogin("sarah.thompson@clarity.com", "agent123")}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sarah Thompson (Lead)</div>
                    <div className="text-xs text-gray-500">
                      sarah.thompson@clarity.com • agent123
                    </div>
                  </div>
                  <span className="text-sm text-primary">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Demo-Version • Keine echten Daten verwenden</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

