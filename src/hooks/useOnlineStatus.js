// src/hooks/useOnlineStatus.js
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function useOnlineStatus() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== "authenticated" || !session) return;

        // Function to update online status
        const updateStatus = async (isOnline) => {
            try {
                await fetch("/api/users/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isOnline }),
                });
            } catch (error) {
                console.error("Failed to update online status:", error);
            }
        };

        // Set online when component mounts
        updateStatus(true);

        // Handle visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                updateStatus(true);
            } else {
                updateStatus(false);
            }
        };

        // Handle page unload/close
        const handleBeforeUnload = () => {
            // Use sendBeacon for reliable delivery when page closes
            navigator.sendBeacon(
                "/api/users/status",
                JSON.stringify({ isOnline: false })
            );
        };

        // Set up event listeners
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        // Heartbeat to keep status updated (every 30 seconds)
        const heartbeatInterval = setInterval(() => {
            if (document.visibilityState === "visible") {
                updateStatus(true);
            }
        }, 30000); // 30 seconds

        // Cleanup
        return () => {
            updateStatus(false);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            clearInterval(heartbeatInterval);
        };
    }, [session, status]);
}
