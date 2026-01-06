// src/components/FileUpload.jsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/contexts/UserContext';

const FileUpload = ({ onUploadSuccess, uploadType = 'avatar', userId }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const { updateAvatar } = useUser();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Buat preview untuk gambar
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Silakan pilih file terlebih dahulu.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (userId) {
      formData.append('userId', userId);
    }

    setUploading(true);
    setMessage('');

    try {
      // Gunakan endpoint yang berbeda untuk avatar
      const endpoint = uploadType === 'avatar' ? '/api/upload/avatar' : '/api/upload';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage('File berhasil diupload!');
        if (uploadType === 'avatar' && result.data.avatar) {
          // Update avatar di context
          updateAvatar(result.data.avatar);
        }
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
        // Reset form setelah upload sukses
        setFile(null);
        setPreview('');
      } else {
        setMessage(result.message || 'Gagal upload file.');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan saat upload file.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-component">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Pilih {uploadType === 'avatar' ? 'Foto Profil' : 'File'}:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {preview && (
        <div className="mb-4">
          <p className="text-sm mb-2">Preview:</p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-md border object-cover"
          />
        </div>
      )}

      {file && (
        <div className="mb-4">
          <p className="text-sm">
            File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className={`px-4 py-2 rounded-md ${
          uploading || !file
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {uploading ? 'Mengupload...' : `Upload ${uploadType === 'avatar' ? 'Foto Profil' : 'File'}`}
      </button>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('berhasil') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FileUpload;