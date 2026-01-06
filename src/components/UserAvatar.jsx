// src/components/UserAvatar.jsx
'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';
import Avatar from './Avatar';

const UserAvatar = ({ user, size = 'md', showName = false, linkToProfile = true }) => {
  const { data: session } = useSession();
  const { user: currentUser } = useUser();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Jika ini adalah user yang sedang login, gunakan avatar dari context
  const displayUser = session?.user?.id === user?._id ?
    { ...user, avatar: currentUser?.avatar || user?.avatar } : user;

  const avatarElement = (
    <div className="relative inline-block">
      <Avatar
        src={displayUser?.avatar}
        alt={displayUser?.displayName || 'User Avatar'}
        className={`${sizeClasses[size]} rounded-full border-2 ${
          displayUser?.isOnline ? 'border-green-500' : 'border-gray-300'
        }`}
        size={size}
      />
      {displayUser?.isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );

  if (linkToProfile && displayUser?._id) {
    return (
      <Link href={`/profile/${displayUser._id}`}>
        {avatarElement}
        {showName && <span className="ml-2">{displayUser.displayName}</span>}
      </Link>
    );
  }

  return (
    <>
      {avatarElement}
      {showName && <span className="ml-2">{displayUser.displayName}</span>}
    </>
  );
};

export default UserAvatar;