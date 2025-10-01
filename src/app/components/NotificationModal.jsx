// NotificationModal.jsx - Modal cantik untuk feedback
"use client";

import { useEffect } from "react";

export default function NotificationModal({
  isOpen,
  onClose,
  type = "success",
  title,
  message,
  autoClose = true,
  autoCloseDelay = 3000,
}) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getModalStyle = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconBg: "bg-green-100",
          icon: "✅",
          titleColor: "text-green-800",
        };
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconBg: "bg-red-100",
          icon: "❌",
          titleColor: "text-red-800",
        };
      default:
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconBg: "bg-blue-100",
          icon: "ℹ️",
          titleColor: "text-blue-800",
        };
    }
  };

  const styles = getModalStyle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md">
        <div
          className={`
          ${styles.bgColor} ${styles.borderColor}
          border-2 rounded-2xl shadow-2xl p-6
        `}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`
                ${styles.iconBg} 
                w-12 h-12 rounded-full flex items-center justify-center
                text-xl
              `}
              >
                {styles.icon}
              </div>

              <h3 className={`${styles.titleColor} text-lg font-semibold`}>
                {title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-700 mb-6">{message}</p>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
