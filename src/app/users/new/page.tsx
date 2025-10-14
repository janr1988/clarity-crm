"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Team = { id: string; name: string };

export default function NewUserPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load teams for the form (optional field)
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("Failed to load teams:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
      teamId: formData.get("teamId") as string || undefined,
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.details) {
          const errors: Record<string, string> = {};
          errorData.details.forEach((err: any) => {
            errors[err.path[0]] = err.message;
          });
          setFieldErrors(errors);
        } else {
          setError(errorData.error || "Failed to create user");
        }
        setIsLoading(false);
        return;
      }

      const user = await res.json();
      router.push(`/users?created=true&name=${encodeURIComponent(user.name)}`);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const hasFieldError = (fieldName: string) => !!fieldErrors[fieldName];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Create New User</h1>
        <p className="text-gray-600 mt-1">Add a new team member to the CRM</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasFieldError("name") ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasFieldError("email") ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasFieldError("password") ? "border-red-500" : "border-gray-300"
            }`}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-2">
            Role *
          </label>
          <select
            id="role"
            name="role"
            required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasFieldError("role") ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select a role</option>
            <option value="SALES_AGENT">Sales Agent</option>
            <option value="SALES_LEAD">Sales Lead</option>
            <option value="MANAGER">Manager</option>
          </select>
          {fieldErrors.role && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
          )}
        </div>

        <div>
          <label htmlFor="teamId" className="block text-sm font-medium mb-2">
            Team (Optional)
          </label>
          <select
            id="teamId"
            name="teamId"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create User"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/users")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

