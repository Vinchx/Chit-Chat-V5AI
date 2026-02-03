// src/components/GroupInfoSidebar.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { useRef } from "react";
import ImageCropper from "./ImageCropper";

const GroupInfoSidebar = ({ isOpen, onClose, roomData, currentUserId }) => {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [groupName, setGroupName] = useState(roomData?.name || "");
  const [groupDescription, setGroupDescription] = useState(
    roomData?.description || "",
  );
  const [showMemberActions, setShowMemberActions] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // info, media, files, settings

  // Avatar Upload States
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Banner Upload States
  const bannerFileInputRef = useRef(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showBannerCropper, setShowBannerCropper] = useState(false);
  const [selectedBannerImage, setSelectedBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Check if current user is admin
  const isAdmin = roomData?.admins?.includes(currentUserId);

  const getInitials = (name) => {
    if (!name) return "G";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const normalizeAvatar = (avatar) => {
    return avatar ? avatar.replace(/\\/g, "/") : null;
  };

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
      toast.error("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    // Show cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    setShowCropper(false);

    // Preview immediately
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(croppedUrl);

    // Upload
    const file = new File([croppedBlob], "group-avatar.jpg", {
      type: "image/jpeg",
    });
    await handleUploadAvatar(file);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Banner Upload Handlers
  const handleBannerFileSelect = (e) => {
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
      toast.error("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    // Show cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedBannerImage(reader.result);
      setShowBannerCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerCropComplete = async (croppedBlob) => {
    setShowBannerCropper(false);

    // Preview immediately
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setBannerPreview(croppedUrl);

    // Upload
    const file = new File([croppedBlob], "group-banner.jpg", {
      type: "image/jpeg",
    });
    await handleUploadBanner(file);
  };

  const handleBannerCropCancel = () => {
    setShowBannerCropper(false);
    setSelectedBannerImage(null);
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = "";
    }
  };

  const handleUploadBanner = async (file) => {
    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("banner", file);

      const response = await fetch(`/api/rooms/${roomData.id}/banner`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Banner grup berhasil diubah");
        router.refresh();
      } else {
        toast.error(data.error || "Gagal upload banner");
        setBannerPreview(null); // Revert preview on error
      }
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Terjadi kesalahan saat upload banner");
      setBannerPreview(null);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleUploadAvatar = async (file) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`/api/rooms/${roomData.id}/avatar`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Avatar grup berhasil diubah");
        router.refresh();
      } else {
        toast.error(data.error || "Gagal upload avatar");
        setAvatarPreview(null); // Revert preview on error
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Terjadi kesalahan saat upload avatar");
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateGroupInfo = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomData.id}/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditingName(false);
        setIsEditingDescription(false);
        router.refresh();
      } else {
        toast.error("Gagal update info grup: " + data.message);
      }
    } catch (error) {
      console.error("Error updating group info:", error);
      toast.error("Terjadi kesalahan saat update info grup");
    }
  };

  const handlePromoteMember = async (memberId) => {
    try {
      const response = await fetch(`/api/rooms/${roomData.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          action: "promote",
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error promoting member:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDemoteMember = async (memberId) => {
    try {
      const response = await fetch(`/api/rooms/${roomData.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          action: "demote",
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error demoting member:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleRemoveMember = async (memberId) => {
    // Use toast.promise for confirmation-like behavior
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Hapus member dari grup?</p>
          <p className="text-sm text-gray-600">
            Member akan dihapus secara permanen.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t);
                try {
                  const response = await fetch(
                    `/api/rooms/${roomData.id}/members?memberId=${memberId}`,
                    { method: "DELETE" },
                  );
                  const data = await response.json();
                  if (data.success) {
                    toast.success("Member berhasil dihapus");
                    router.refresh();
                  } else {
                    toast.error(data.message);
                  }
                } catch (error) {
                  console.error("Error removing member:", error);
                  toast.error("Terjadi kesalahan");
                }
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
            >
              Hapus
            </button>
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Batal
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
      },
    );
  };

  const handleLeaveGroup = async () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Keluar dari grup ini?</p>
          <p className="text-sm text-gray-600">
            Anda tidak akan bisa melihat pesan grup lagi.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t);
                try {
                  const response = await fetch(
                    `/api/rooms/${roomData.id}/leave`,
                    {
                      method: "POST",
                    },
                  );
                  const data = await response.json();
                  if (data.success) {
                    toast.success("Berhasil keluar dari grup");
                    router.push("/dashboard");
                  } else {
                    toast.error(data.message);
                  }
                } catch (error) {
                  console.error("Error leaving group:", error);
                  toast.error("Terjadi kesalahan");
                }
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
            >
              Keluar
            </button>
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Batal
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
      },
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        } overflow-y-auto flex flex-col`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Info Grup
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-300"
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

        {/* Tabs */}
        <div className="sticky top-[60px] flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
          {[
            { id: "info", label: "Info", icon: "ℹ️" },
            { id: "media", label: "Media", icon: "🖼️" },
            { id: "files", label: "Files", icon: "📎" },
            { id: "settings", label: "Settings", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-2 py-3 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="p-6 space-y-6">
              {/* Group Profile */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 group">
                  {avatarPreview || normalizeAvatar(roomData?.groupAvatar) ? (
                    <Image
                      src={
                        avatarPreview || normalizeAvatar(roomData.groupAvatar)
                      }
                      alt={roomData.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="128px"
                      unoptimized={true}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {getInitials(roomData?.name)}
                    </div>
                  )}

                  {/* Upload Overlay (Admin Only) */}
                  {isAdmin && (
                    <>
                      <div
                        onClick={() =>
                          !isUploading && fileInputRef.current?.click()
                        }
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all cursor-pointer"
                      >
                        <div className="opacity-0 group-hover:opacity-100 text-white transform scale-50 group-hover:scale-100 transition-all">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {/* Group Name */}
                {isEditingName && isAdmin ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateGroupInfo}
                        className="flex-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => {
                          setGroupName(roomData.name);
                          setIsEditingName(false);
                        }}
                        className="flex-1 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {roomData?.name}
                    </h2>
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600 dark:text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                  {roomData?.memberCount || roomData?.members?.length || 0}{" "}
                  member
                </p>

                {/* Group Description */}
                <div className="mt-4">
                  {isEditingDescription && isAdmin ? (
                    <div className="space-y-2">
                      <textarea
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="3"
                        placeholder="Deskripsi grup..."
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateGroupInfo}
                          className="flex-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setGroupDescription(roomData.description || "");
                            setIsEditingDescription(false);
                          }}
                          className="flex-1 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-center space-x-2">
                      <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex-1">
                        {roomData?.description || "Belum ada deskripsi"}
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => setIsEditingDescription(true)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mt-2"
                        >
                          <svg
                            className="w-4 h-4 text-gray-600 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Group Banner */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Banner Grup
                </h4>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden group bg-gray-100 dark:bg-gray-700">
                  {bannerPreview || normalizeAvatar(roomData?.groupBanner) ? (
                    <Image
                      src={
                        bannerPreview || normalizeAvatar(roomData.groupBanner)
                      }
                      alt="Group Banner"
                      fill
                      className="object-cover"
                      sizes="320px"
                      unoptimized={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <div className="text-center">
                        <svg
                          className="w-16 h-16 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-sm">Belum ada banner</p>
                      </div>
                    </div>
                  )}

                  {/* Upload Overlay (Admin Only) */}
                  {isAdmin && (
                    <>
                      <div
                        onClick={() =>
                          !isUploadingBanner &&
                          bannerFileInputRef.current?.click()
                        }
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all cursor-pointer"
                      >
                        <div className="opacity-0 group-hover:opacity-100 text-white transform scale-50 group-hover:scale-100 transition-all">
                          <svg
                            className="w-10 h-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                      </div>
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleBannerFileSelect}
                        className="hidden"
                      />
                    </>
                  )}

                  {isUploadingBanner && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rekomendasi: 1600x900px atau aspect ratio 16:9
                  </p>
                )}
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Member ({roomData?.members?.length || 0})
                </h4>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {roomData?.members?.map((member) => {
                    const isMemberAdmin = roomData?.admins?.includes(
                      member._id,
                    );
                    const isCurrentUser = member._id === currentUserId;

                    return (
                      <div
                        key={member._id}
                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3">
                          {normalizeAvatar(member.avatar) ? (
                            <Image
                              src={normalizeAvatar(member.avatar)}
                              alt={member.displayName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                              {getInitials(member.displayName)}
                            </div>
                          )}
                        </div>

                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {member.displayName} {isCurrentUser && "(Anda)"}
                            </h4>
                            {isMemberAdmin && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            @{member.username}
                          </p>
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && !isCurrentUser && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowMemberActions(
                                  showMemberActions === member._id
                                    ? null
                                    : member._id,
                                )
                              }
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                            >
                              <svg
                                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>

                            {showMemberActions === member._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                                {isMemberAdmin ? (
                                  <button
                                    onClick={() => {
                                      handleDemoteMember(member._id);
                                      setShowMemberActions(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    Turunkan dari Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handlePromoteMember(member._id);
                                      setShowMemberActions(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    Jadikan Admin
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleRemoveMember(member._id);
                                    setShowMemberActions(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  Hapus dari Grup
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === "media" && (
            <div className="p-6 space-y-4">
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-lg font-medium">Shared Media</p>
                <p className="text-sm mt-2">
                  Gambar dan video yang dibagikan akan muncul di sini
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {/* Placeholder untuk media grid */}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                    >
                      <svg
                        className="w-8 h-8 text-gray-300 dark:text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FILES TAB */}
          {activeTab === "files" && (
            <div className="p-6 space-y-4">
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-medium">Shared Files</p>
                <p className="text-sm mt-2">
                  Dokumen dan file yang dibagikan akan muncul di sini
                </p>
                <div className="mt-6 space-y-2">
                  {/* Placeholder untuk files list */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                        <svg
                          className="w-6 h-6 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Group Settings
                </h4>

                {/* Permission Settings - Only for admins */}
                {isAdmin ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            Only Admins Can Post
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Hanya admin yang bisa mengirim pesan
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            Only Admins Can Add Members
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Hanya admin yang bisa menambah member
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center justify-end px-1">
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            Only Admins Can Edit Info
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            Hanya admin yang bisa edit nama & deskripsi
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center justify-end px-1">
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <p className="text-sm">
                      Hanya admin yang bisa melihat pengaturan grup
                    </p>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase mb-3">
                    Danger Zone
                  </h4>
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium transition-all"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Keluar dari Grup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Image Cropper Modal */}
      {showCropper && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          title="Crop Group Avatar (1:1)"
        />
      )}

      {/* Banner Image Cropper */}
      {showBannerCropper && (
        <ImageCropper
          image={selectedBannerImage}
          onCropComplete={handleBannerCropComplete}
          onCancel={handleBannerCropCancel}
          aspectRatio={16 / 9}
          title="Crop Group Banner (16:9)"
        />
      )}
    </>
  );
};

export default GroupInfoSidebar;
