"use client";

export default function DocumentCard({ filename, size, url, mimeType }) {
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file type icon and color
  const getFileInfo = (mimeType) => {
    if (mimeType?.includes('pdf')) {
      return { icon: '📄', color: 'from-red-100 to-red-200', textColor: 'text-red-700' };
    }
    if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return { icon: '📘', color: 'from-blue-100 to-blue-200', textColor: 'text-blue-700' };
    }
    if (mimeType?.includes('text')) {
      return { icon: '📝', color: 'from-gray-100 to-gray-200', textColor: 'text-gray-700' };
    }
    if (mimeType?.includes('zip')) {
      return { icon: '📦', color: 'from-yellow-100 to-yellow-200', textColor: 'text-yellow-700' };
    }
    return { icon: '📎', color: 'from-purple-100 to-purple-200', textColor: 'text-purple-700' };
  };

  const fileInfo = getFileInfo(mimeType);

  // Truncate filename if too long
  const truncateFilename = (name, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    return `${truncated}...${extension}`;
  };

  return (
    <div className="mt-2 max-w-sm">
      <a
        href={url}
        download={filename}
        className="flex items-center p-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-lg hover:bg-white/70 hover:border-white/80 transition-all group"
      >
        {/* File icon */}
        <div className={`w-12 h-12 bg-gradient-to-br ${fileInfo.color} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
          {fileInfo.icon}
        </div>

        {/* File info */}
        <div className="ml-3 flex-1 min-w-0">
          <p className={`text-sm font-medium ${fileInfo.textColor} truncate`} title={filename}>
            {truncateFilename(filename)}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {formatFileSize(size)}
          </p>
        </div>

        {/* Download icon */}
        <div className="ml-2 text-gray-500 group-hover:text-blue-500 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </a>
    </div>
  );
}
