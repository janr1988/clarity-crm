"use client";

import { useState, useEffect } from "react";

interface Insight {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  actionItems: Array<{
    priority: string;
    action: string;
    assignedTo: string;
  }>;
  metrics: {
    teamCompletionRate: number;
    totalActiveTasks: number;
    totalCompletedTasks: number;
    weeklyCallVolume: number;
    pendingFollowUps: number;
  };
}

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch("/api/ai/insights");
      if (!response.ok) throw new Error("Failed to fetch insights");
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!insights) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded shadow-card border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🤖</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Team Insights</h2>
        </div>
        <p className="text-gray-700 text-lg">{insights.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white p-6 rounded shadow-card">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-green-600">✓</span> Strengths
          </h3>
          <ul className="space-y-2">
            {insights.strengths.map((strength, idx) => (
              <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        {insights.concerns.length > 0 && (
          <div className="bg-white p-6 rounded shadow-card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-orange-600">⚠</span> Areas of Concern
            </h3>
            <ul className="space-y-2">
              {insights.concerns.map((concern, idx) => (
                <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="bg-white p-6 rounded shadow-card">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-600">💡</span> Recommendations
          </h3>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-white p-6 rounded shadow-card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">🎯</span> Action Items
        </h3>
        <div className="space-y-3">
          {insights.actionItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                    {item.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">→ {item.assignedTo}</span>
                </div>
                <p className="text-gray-700">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white p-6 rounded shadow-card">
        <h3 className="font-semibold text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-2xl font-bold text-primary">
              {insights.metrics.teamCompletionRate}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Completion Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {insights.metrics.totalActiveTasks}
            </div>
            <div className="text-xs text-gray-600 mt-1">Active Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {insights.metrics.totalCompletedTasks}
            </div>
            <div className="text-xs text-gray-600 mt-1">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {insights.metrics.weeklyCallVolume}
            </div>
            <div className="text-xs text-gray-600 mt-1">Calls This Week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {insights.metrics.pendingFollowUps}
            </div>
            <div className="text-xs text-gray-600 mt-1">Follow-ups</div>
          </div>
        </div>
      </div>
    </div>
  );
}

