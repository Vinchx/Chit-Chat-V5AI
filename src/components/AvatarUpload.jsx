// src/components/AvatarUpload.jsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const AvatarUpload = ({ user, isOwnProfile }) => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(user.avatar);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipe file tidak valid. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan.');
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setError('');
    setSuccess('');
    
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengupload avatar');
      }

      // Update preview dengan URL dari server
      if (data.path) {
        setPreview(data.path);
      }

      setSuccess('Avatar berhasil diupload!');
      
      // Refresh halaman setelah delay singkat untuk menampilkan avatar baru
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal mengupload avatar');
      setPreview(user.avatar); // Kembalikan ke avatar lama jika gagal
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative group">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
        {preview ? (
          <Image
            src={preview}
            alt={user.displayName || 'User avatar'}
            fill
            className="object-cover"
            sizes="128px"
            unoptimized={true}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {getInitials(user.displayName)}
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {isOwnProfile && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
            title="Upload avatar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}

      {success && (
        <div className="absolute top-full mt-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-md">
          {success}
        </div>
      )}

      {error && (
        <div className="absolute top-full mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
