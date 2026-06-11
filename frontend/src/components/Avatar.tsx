import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
}

export default function Avatar({ src, name, className = 'w-8 h-8' }: AvatarProps) {
  const [error, setError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  const initials = name ? name.charAt(0).toUpperCase() : '?';

  if (!src || error) {
    return (
      <div className={`${className} rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xs select-none shadow-sm flex-shrink-0`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={`${className} rounded-full object-cover flex-shrink-0`}
    />
  );
}
