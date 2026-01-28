// src/components/BannerEditorModal.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const BannerEditorModal = ({ user, isOpen, onClose }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Tipe file tidak valid. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan.",
      );
      return;
    }

    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (Max 10MB)");
      return;
    }

    setSelectedFile(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewFile(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error("Silakan pilih gambar terlebih dahulu");
      return;
    }

    setIsLoading(true);

    try {
      // Handle File Upload
      const formData = new FormData();
      formData.append("banner", selectedFile);

      const response = await fetch("/api/profile/upload-banner", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload banner");
      }

      toast.success("Banner berhasil diupload!");
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Gagal menyimpan banner.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Determine current preview style
  const currentPreviewStyle = () => {
    if (previewFile) {
      return {
        backgroundImage: `url('${previewFile}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    // Fallback to current user banner
    if (user.banner) {
      // If it looks like a file path (starts with / or http), wrap it
      if (user.banner.startsWith("/") || user.banner.startsWith("http")) {
        return {
          backgroundImage: `url('${user.banner}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      }
      // Otherwise it's likely a gradient or hex code
      return { background: user.banner };
    }

    return {
      background: "#6b7280", // neutral gray instead of gradient
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex justify-between items-center text-white shrink-0">
          <h2 className="text-xl font-bold">Ubah Banner Profil</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview Banner
            </label>
            <div
              className="h-32 rounded-xl w-full shadow-inner transition-all duration-300 relative overflow-hidden bg-gray-100 dark:bg-gray-900"
              style={currentPreviewStyle()}
            >
              {!previewFile && (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-black/20">
                  {user.banner
                    ? "Header Tampilan Profil"
                    : "Belum ada gambar dipilih"}
                </div>
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">
                    Klik untuk upload gambar banner
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF atau WebP (MAX. 10MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>

            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                File dipilih:{" "}
                <span className="font-medium">{selectedFile.name}</span> (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !selectedFile}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerEditorModal;
