"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

export default function UserReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchReports();
    }
  }, [session]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports/my-reports");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reports");
      }

      setReports(data.reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      harassment: "Harassment",
      spam: "Spam",
      inappropriate_content: "Inappropriate Content",
      impersonation: "Impersonation",
      other: "Other",
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-700 dark:text-yellow-400",
        border: "border-yellow-500/30",
      },
      under_review: {
        bg: "bg-blue-500/20",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-500/30",
      },
      resolved: {
        bg: "bg-green-500/20",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-500/30",
      },
      rejected: {
        bg: "bg-gray-500/20",
        text: "text-gray-700 dark:text-gray-400",
        border: "border-gray-500/30",
      },
    };
    return badges[status] || badges.pending;
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-zinc-400">Please login to view your reports</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                My Reports
              </h1>
              <p className="text-gray-600 dark:text-zinc-400">
                Track the status of your submitted reports
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/40 dark:bg-zinc-800 hover:bg-white/60 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg transition-colors border border-white/30 dark:border-zinc-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Reports List */}
        <div className="backdrop-blur-lg bg-white/20 dark:bg-gray-900/40 rounded-2xl border border-white/30 dark:border-gray-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-600 dark:text-zinc-400">
              Loading your reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 dark:text-zinc-400 text-lg">
                You haven't submitted any reports yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-zinc-800">
              {reports.map((report) => {
                const badge = getStatusBadge(report.status);
                return (
                  <div
                    key={report._id}
                    className="p-6 hover:bg-white/30 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                              {report.reportedUserId?.avatar ? (
                                <img
                                  src={report.reportedUserId.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-sm">
                                  {report.reportedUserId?.displayName?.charAt(
                                    0,
                                  ) || "?"}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                Report against{" "}
                                <span className="text-blue-600 dark:text-blue-400">
                                  @
                                  {report.reportedUserId?.username || "unknown"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-zinc-400">
                                {new Date(report.createdAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Category and Status */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-full text-xs font-medium">
                            {getCategoryLabel(report.category)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {report.status
                              .replace("_", " ")
                              .charAt(0)
                              .toUpperCase() +
                              report.status.slice(1).replace("_", " ")}
                          </span>
                        </div>

                        {/* Reason */}
                        <div className="bg-gray-100 dark:bg-zinc-800/50 rounded-lg p-3">
                          <p className="text-sm text-gray-700 dark:text-zinc-300 line-clamp-2">
                            {report.reason}
                          </p>
                        </div>

                        {/* Review Note (if resolved) */}
                        {(report.status === "resolved" ||
                          report.status === "rejected") &&
                          report.reviewNote && (
                            <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                                Admin Response:
                              </div>
                              <p className="text-sm text-blue-900 dark:text-blue-300">
                                {report.reviewNote}
                              </p>
                              {report.actionTaken &&
                                report.actionTaken !== "none" && (
                                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                    Action taken:{" "}
                                    <span className="font-semibold">
                                      {report.actionTaken}
                                    </span>
                                  </div>
                                )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
