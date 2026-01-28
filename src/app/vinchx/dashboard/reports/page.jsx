"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminReportsPage() {
  const { isAdminAuthed, isLoading: authLoading } = useAdminAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  // Review modal state
  const [reviewAction, setReviewAction] = useState("none");
  const [reviewNote, setReviewNote] = useState("");
  const [suspendDays, setSuspendDays] = useState(7);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (isAdminAuthed) {
      fetchReports();
    }
  }, [isAdminAuthed, statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/reports/list?status=${statusFilter}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reports");
      }

      setReports(data.reports);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openReview = async (reportId) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch report details");
      }

      setSelectedReport(data.report);
      setReviewAction("none");
      setReviewNote("");
      setSuspendDays(7);
      setBanReason("");
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast.error(error.message);
    }
  };

  const submitReview = async () => {
    if (!selectedReport) return;

    if (!reviewNote.trim()) {
      toast.error("Please provide a review note");
      return;
    }

    if (reviewAction === "suspend" && suspendDays < 1) {
      toast.error("Suspend duration must be at least 1 day");
      return;
    }

    setReviewing(true);

    try {
      const response = await fetch(
        `/api/admin/reports/${selectedReport._id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "resolved",
            reviewNote,
            actionTaken: reviewAction,
            suspendDays: reviewAction === "suspend" ? suspendDays : undefined,
            banReason:
              reviewAction === "ban" ? banReason || reviewNote : undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to review report");
      }

      toast.success("Report reviewed successfully");
      setSelectedReport(null);
      fetchReports(); // Refresh list
    } catch (error) {
      console.error("Error reviewing report:", error);
      toast.error(error.message);
    } finally {
      setReviewing(false);
    }
  };

  if (authLoading || !isAdminAuthed) {
    return null;
  }

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
      pending:
        "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
      under_review:
        "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
      resolved:
        "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
      rejected:
        "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30",
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Reports Management
              </h1>
              <p className="text-zinc-400">Review and manage user reports</p>
            </div>
            <Link
              href="/vinchx/dashboard"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-zinc-400">Total Reports</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {stats.pending}
              </div>
              <div className="text-sm text-zinc-400">Pending</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">
                {stats.under_review}
              </div>
              <div className="text-sm text-zinc-400">Under Review</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">
                {stats.resolved}
              </div>
              <div className="text-sm text-zinc-400">Resolved</div>
            </div>
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-400">
                {stats.rejected}
              </div>
              <div className="text-sm text-zinc-400">Rejected</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {["all", "pending", "under_review", "resolved", "rejected"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status.replace("_", " ").charAt(0).toUpperCase() +
                    status.slice(1).replace("_", " ")}
              </button>
            ),
          )}
        </div>

        {/* Reports Table */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-400">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              No reports found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Reporter
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Reported User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {reports.map((report) => (
                    <tr
                      key={report._id}
                      className="hover:bg-zinc-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white overflow-hidden">
                            {report.reporterId?.avatar ? (
                              <img
                                src={report.reporterId.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              report.reporterId?.displayName?.charAt(0) || "?"
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {report.reporterId?.displayName || "Unknown"}
                            </div>
                            <div className="text-xs text-zinc-400">
                              @{report.reporterId?.username || "unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white overflow-hidden">
                            {report.reportedUserId?.avatar ? (
                              <img
                                src={report.reportedUserId.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              report.reportedUserId?.displayName?.charAt(0) ||
                              "?"
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {report.reportedUserId?.displayName || "Unknown"}
                            </div>
                            <div className="text-xs text-zinc-400">
                              @{report.reportedUserId?.username || "unknown"}
                              {report.reportedUserId?.warningCount > 0 && (
                                <span className="ml-2 text-yellow-400">
                                  ⚠️ {report.reportedUserId.warningCount}{" "}
                                  warnings
                                </span>
                              )}
                              {report.reportedUserId?.isBanned && (
                                <span className="ml-2 text-red-400">
                                  🚫 Banned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-300">
                          {getCategoryLabel(report.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(report.status)}`}
                        >
                          {report.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {new Date(report.createdAt).toLocaleDateString(
                          "id-ID",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openReview(report._id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h3 className="text-2xl font-semibold text-white">
                Review Report
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-zinc-400 hover:text-white transition-colors"
                disabled={reviewing}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Report Details */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">
                  Report Details
                </h4>
                <div className="space-y-3 bg-zinc-800 rounded-lg p-4">
                  <div>
                    <span className="text-zinc-400">Category:</span>{" "}
                    <span className="text-white ml-2">
                      {getCategoryLabel(selectedReport.category)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Status:</span>{" "}
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${getStatusBadge(selectedReport.status)}`}
                    >
                      {selectedReport.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Date:</span>{" "}
                    <span className="text-white ml-2">
                      {new Date(selectedReport.createdAt).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1">Reason:</span>
                    <p className="text-white bg-zinc-900 p-3 rounded">
                      {selectedReport.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reported User Info */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">
                  Reported User
                </h4>
                <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-zinc-400">Name:</span>{" "}
                    <span className="text-white ml-2">
                      {selectedReport.reportedUserId?.displayName}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Username:</span>{" "}
                    <span className="text-white ml-2">
                      @{selectedReport.reportedUserId?.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Warnings:</span>{" "}
                    <span className="text-yellow-400 ml-2">
                      {selectedReport.reportedUserId?.warningCount || 0}
                    </span>
                  </div>
                  {selectedReport.reportedUserId?.isBanned && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded p-2 text-red-400">
                      This user is currently banned
                    </div>
                  )}
                  {selectedReport.reportedUserId?.suspendedUntil &&
                    new Date(selectedReport.reportedUserId.suspendedUntil) >
                      new Date() && (
                      <div className="bg-orange-500/20 border border-orange-500/30 rounded p-2 text-orange-400">
                        Suspended until:{" "}
                        {new Date(
                          selectedReport.reportedUserId.suspendedUntil,
                        ).toLocaleString("id-ID")}
                      </div>
                    )}
                </div>
              </div>

              {/* Review Form */}
              {selectedReport.status === "pending" ||
              selectedReport.status === "under_review" ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">
                    Take Action
                  </h4>

                  {/* Action Selection */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Action
                    </label>
                    <select
                      value={reviewAction}
                      onChange={(e) => setReviewAction(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={reviewing}
                    >
                      <option value="none">No Action</option>
                      <option value="warning">Warning</option>
                      <option value="suspend">Suspend</option>
                      <option value="ban">Ban</option>
                    </select>
                  </div>

                  {/* Suspend Duration */}
                  {reviewAction === "suspend" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Suspend Duration (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={suspendDays}
                        onChange={(e) =>
                          setSuspendDays(parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={reviewing}
                      />
                    </div>
                  )}

                  {/* Ban Reason */}
                  {reviewAction === "ban" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Ban Reason
                      </label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Reason for permanent ban..."
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="2"
                        disabled={reviewing}
                      />
                    </div>
                  )}

                  {/* Review Note */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Review Note *
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Internal note about this review..."
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                      disabled={reviewing}
                      required
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      disabled={reviewing}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReview}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      disabled={reviewing}
                    >
                      {reviewing ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-zinc-400">
                    This report has already been reviewed
                  </p>
                  {selectedReport.reviewNote && (
                    <div className="mt-3">
                      <span className="text-zinc-400 block mb-1">
                        Review Note:
                      </span>
                      <p className="text-white">{selectedReport.reviewNote}</p>
                    </div>
                  )}
                  {selectedReport.actionTaken && (
                    <div className="mt-2">
                      <span className="text-zinc-400">Action Taken:</span>{" "}
                      <span className="text-white ml-2">
                        {selectedReport.actionTaken}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
