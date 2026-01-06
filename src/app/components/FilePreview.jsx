"use client";

import { useState } from 'react';

export default function FilePreview({ file, fileData, onRemove, isUploading }) {
  const [imageError, setImageError] = useState(false);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📘';
    if (mimeType?.includes('text')) return '📝';
    if (mimeType?.includes('zip')) return '📦';
    return '📎';
  };

  const isImage = fileData?.type === 'image';

  return (
    <div className="mb-3 p-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isUploading ? (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Uploading...</p>
                <p className="text-xs text-gray-600">{file?.name}</p>
              </div>
            </div>
          ) : isImage ? (
            <div className="flex items-start space-x-3">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {!imageError ? (
                  <img
                    src={fileData.url}
                    alt={fileData.filename}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🖼️
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{fileData.filename}</p>
                <p className="text-xs text-gray-600">{formatFileSize(fileData.size)}</p>
                <p className="text-xs text-green-600 mt-1">✓ Ready to send</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl">
                {getFileIcon(fileData?.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{fileData?.filename}</p>
                <p className="text-xs text-gray-600">{formatFileSize(fileData?.size)}</p>
                <p className="text-xs text-green-600 mt-1">✓ Ready to send</p>
              </div>
            </div>
          )}
        </div>

        {!isUploading && (
          <button
            onClick={onRemove}
            className="ml-3 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Remove file"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
