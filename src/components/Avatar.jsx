// src/components/Avatar.jsx
'use client';

import { useState } from 'react';

const Avatar = ({ src, alt, className, size = 'md' }) => {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    setImgSrc('/default-avatar.png');
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Jika src tidak diberikan, langsung gunakan default avatar
  const finalSrc = imgSrc || '/default-avatar.png';

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={`${sizeClasses[size] || sizeClasses.md} ${className} object-cover`}
      onError={handleError}
    />
  );
};

export default Avatar;