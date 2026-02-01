"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";

function FlowingRoomItem({
  room,
  onClick,
  normalizeAvatar,
  getInitials,
  speed = 12,
}) {
  const itemRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeInnerRef = useRef(null);
  const animationRef = useRef(null);
  const [repetitions, setRepetitions] = useState(4);

  const animationDefaults = { duration: 0.4, ease: "expo" };

  // Get display name based on room type
  const displayName =
    room.type === "private" && room.friend
      ? room.friend.displayName || room.name
      : room.name;

  // Get avatar for circular display (handles both friend and group avatars)
  const avatarUrl =
    room.type === "private" && room.friend?.avatar
      ? normalizeAvatar(room.friend.avatar)
      : room.type === "group" && room.groupAvatar
        ? normalizeAvatar(room.groupAvatar)
        : null;

  // Get banner for landscape background
  const bannerUrl =
    room.type === "private" && room.friend?.banner
      ? normalizeAvatar(room.friend.banner)
      : null;

  // Debug: Log banner info
  if (room.type === "private" && room.friend) {
    console.log(
      "🎨 [FlowingRoomItem] Friend:",
      room.friend.displayName,
      "| Avatar:",
      room.friend.avatar,
      "| Banner:",
      room.friend.banner,
    );
  }

  // Generate avatar style for circle
  const getAvatarStyle = () => {
    if (avatarUrl) {
      return {
        backgroundImage: `url(${avatarUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    // Fallback to neutral gray
    return {
      background: "#6b7280",
    };
  };

  // Generate banner background for landscape
  const getBannerStyle = () => {
    if (bannerUrl) {
      return {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    // Fallback to neutral gray
    return {
      background: "#6b7280",
    };
  };

  const findClosestEdge = (mouseX, mouseY, width, height) => {
    const topEdgeDist = (mouseX - width / 2) ** 2 + mouseY ** 2;
    const bottomEdgeDist = (mouseX - width / 2) ** 2 + (mouseY - height) ** 2;
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent =
        marqueeInnerRef.current.querySelector(".marquee-part");
      if (!marqueeContent) return;
      const contentWidth = marqueeContent.offsetWidth;
      if (contentWidth === 0) return; // Prevent division by zero
      const containerWidth = itemRef.current?.offsetWidth || 300;
      const needed = Math.ceil(containerWidth / contentWidth) + 2;

      // Safety check to ensure needed is a finite number
      if (!isFinite(needed) || isNaN(needed)) {
        setRepetitions(4);
        return;
      }

      setRepetitions(Math.max(4, needed));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [displayName, avatarUrl, bannerUrl]);

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent =
        marqueeInnerRef.current.querySelector(".marquee-part");
      if (!marqueeContent) return;
      const contentWidth = marqueeContent.offsetWidth;
      if (contentWidth === 0) return;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };

    const timer = setTimeout(setupMarquee, 50);
    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [displayName, avatarUrl, bannerUrl, repetitions, speed]);

  const handleMouseEnter = (ev) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );

    // Hide normal content and show marquee
    const normalContent = itemRef.current.querySelector(".normal-content");

    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to(normalContent, { opacity: 0, duration: 0.2 }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );

    // Show normal content and hide marquee
    const normalContent = itemRef.current.querySelector(".normal-content");

    gsap
      .timeline({ defaults: animationDefaults })
      .to(normalContent, { opacity: 1, duration: 0.2 }, 0)
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative p-3 cursor-pointer transition-all duration-300 overflow-hidden group hover:bg-white/30 dark:hover:bg-gray-800/40"
    >
      {/* Normal State Content */}
      <div className="normal-content flex items-center space-x-3 relative z-10 transition-opacity duration-100">
        {/* Avatar */}
        {avatarUrl ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="40px"
              unoptimized={true}
            />
          </div>
        ) : room.type === "private" && room.friend ? (
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {getInitials(room.friend.displayName || room.name)}
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {room.type === "private"
              ? "👤"
              : room.type === "group"
                ? "👥"
                : "🤖"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 dark:text-white truncate">
            {displayName}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {room.lastMessage || "No messages yet"}
          </p>
        </div>
      </div>

      {/* Flowing Marquee Overlay */}
      <div
        ref={marqueeRef}
        className="absolute -top-3 -left-3 w-[calc(100%+24px)] h-[calc(100%+24px)] overflow-hidden pointer-events-none translate-y-[101%] bg-white/95 dark:bg-gray-100/95 backdrop-blur-sm"
      >
        <div ref={marqueeInnerRef} className="h-full w-fit flex">
          {[...Array(repetitions)].map((_, idx) => (
            <div
              key={idx}
              className="marquee-part flex items-center flex-shrink-0 gap-3 px-4"
            >
              {/* Avatar Circle - uses avatar */}
              <div
                className="w-12 h-12 rounded-full bg-cover bg-center flex-shrink-0 border-2 border-white shadow-lg"
                style={getAvatarStyle()}
              >
                {!avatarUrl && (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                    {room.type === "private"
                      ? "👤"
                      : room.type === "group"
                        ? "👥"
                        : "🤖"}
                  </div>
                )}
              </div>

              {/* Landscape Banner Image */}
              <div
                className="w-[125px] h-[50px] rounded-4xl bg-cover bg-center flex-shrink-0 shadow-md"
                style={getBannerStyle()}
              >
                {!bannerUrl && (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm bg-black/20 rounded-2xl">
                    {room.type === "private"
                      ? "💬"
                      : room.type === "group"
                        ? "👥"
                        : "🤖"}
                  </div>
                )}
              </div>

              {/* Room Name */}
              <span className="whitespace-nowrap font-semibold text-gray-800 dark:text-gray-900 text-base">
                {displayName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FlowingRoomItem;
