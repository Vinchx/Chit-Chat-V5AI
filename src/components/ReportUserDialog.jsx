"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";

export default function ReportUserDialog({
  userId,
  username,
  onClose,
  isOpen,
}) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("harassment");
  const [reason, setReason] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { value: "harassment", label: "Harassment/Bullying" },
    { value: "spam", label: "Spam" },
    { value: "inappropriate_content", label: "Inappropriate Content" },
    { value: "impersonation", label: "Impersonation" },
    { value: "other", label: "Other" },
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (selectedFiles.length + files.length > 3) {
      toast.error("Maximum 3 evidence images allowed");
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFiles((prev) => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for your report");
      return;
    }
    setLoading(true);
    try {
      let evidenceUrls = [];
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        for (const fileData of selectedFiles) {
          const formData = new FormData();
          formData.append("file", fileData.file);
          const uploadResponse = await fetch("/api/upload/reports/evidence", {
            method: "POST",
            body: formData,
          });
          const uploadData = await uploadResponse.json();
          if (uploadData.success) evidenceUrls.push(uploadData.url);
        }
        setUploadingFiles(false);
      }
      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: userId,
          category,
          reason: reason.trim(),
          evidence: evidenceUrls,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to submit report");
      toast.success("Report submitted successfully");
      setReason("");
      setCategory("harassment");
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report");
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h3 className="text-xl font-semibold text-white">Report User</h3>
            <p className="text-sm text-zinc-400 mt-1">Report @{username}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            disabled={loading}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you are reporting this user..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="5"
              maxLength="500"
              disabled={loading}
              required
            />
            <p className="text-xs text-zinc-500 mt-1">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Evidence Images Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Evidence Images (Optional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading || uploadingFiles}
            />

            {selectedFiles.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingFiles}
                className="w-full px-4 py-3 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Evidence Image ({selectedFiles.length}/3)
              </button>
            )}

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {selectedFiles.map((fileData, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
                      <Image
                        src={fileData.preview}
                        alt={`Evidence ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={loading || uploadingFiles}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-zinc-500 mt-2">
              Upload up to 3 images as evidence (max 5MB each)
            </p>
          </div>

          {/* Info */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <p className="text-xs text-zinc-400">
              Your report will be reviewed by our moderation team. False reports
              may result in penalties to your account.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading || uploadingFiles}
            >
              {loading || uploadingFiles ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {uploadingFiles ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
