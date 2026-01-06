// src/components/ProfileAvatarSection.jsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ProfileAvatar from './ProfileAvatar';
import FileUpload from './FileUpload';

const ProfileAvatarSection = ({ initialUser, isOwnProfile }) => {
  const [user, setUser] = useState(initialUser);
  const { data: session } = useSession();

  const handleUploadSuccess = (fileData) => {
    // Update avatar setelah upload berhasil
    setUser(prev => ({
      ...prev,
      avatar: fileData.path
    }));
    // Refresh halaman setelah upload
    window.location.reload();
  };

  return (
    <div className="relative mb-4 md:mb-0 md:mr-6">
      <ProfileAvatar
        user={user}
        isOwnProfile={isOwnProfile}
      />
      {isOwnProfile && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Ganti Foto Profil</h4>
          <FileUpload
            uploadType="avatar"
            userId={user._id}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileAvatarSection;