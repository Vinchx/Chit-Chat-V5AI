// src/components/ProfileAvatar.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';

const ProfileAvatar = ({ user, isOwnProfile = false }) => {
  const [imgSrc, setImgSrc] = useState(user.avatar || '/default-avatar.png');
  const { data: session } = useSession();
  const { user: currentUser } = useUser();

  // Jika ini adalah user yang sedang login, gunakan avatar dari context
  const displayAvatar = session?.user?.id === user._id ?
    (currentUser?.avatar || user.avatar) : user.avatar;

  useEffect(() => {
    setImgSrc(displayAvatar || '/default-avatar.png');
  }, [displayAvatar]);

  const handleError = () => {
    setImgSrc('/default-avatar.png');
  };

  return (
    <div className="relative mb-4 md:mb-0 md:mr-6">
      <img
        src={imgSrc}
        alt={user.displayName}
        className="w-24 h-24 rounded-full border-4 border-white object-cover"
        onError={handleError}
      />
      {isOwnProfile && (
        <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 cursor-pointer">
          <span className="text-xs">✏️</span>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;