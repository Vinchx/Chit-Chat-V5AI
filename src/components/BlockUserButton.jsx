// src/components/BlockUserButton.jsx
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

const BlockUserButton = ({ userId, displayName }) => {
  const router = useRouter();

  const handleBlock = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Block {displayName}?</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            User ini tidak akan bisa mengirim friend request ke kamu.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t);
                try {
                  const res = await fetch("/api/users/block", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, type: "block" }),
                  });
                  const data = await res.json();

                  if (data.success) {
                    toast.success(`${displayName} berhasil diblokir`);
                    // Optionally redirect to dashboard or refresh
                    setTimeout(() => {
                      router.push("/dashboard");
                    }, 1500);
                  } else {
                    toast.error(data.message);
                  }
                } catch (error) {
                  console.error("Error blocking user:", error);
                  toast.error("Terjadi kesalahan");
                }
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
            >
              Block
            </button>
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
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

  return (
    <button
      onClick={handleBlock}
      className="px-8 py-3 backdrop-blur-md bg-red-500/20 dark:bg-red-600/30 hover:bg-red-500/30 dark:hover:bg-red-600/40 text-red-700 dark:text-red-400 border border-red-400/30 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
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
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
      🚫 Block User
    </button>
  );
};

export default BlockUserButton;
