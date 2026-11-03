import React from 'react';

interface AidFastLogoProps {
  variant?: 'light' | 'dark' | 'icon-only';
  subtitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AidFastLogo: React.FC<AidFastLogoProps> = ({
  variant = 'light',
  subtitle,
  className = '',
  size = 'md'
}) => {
  const isDark = variant === 'dark'; // for dark background (sidebar)

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon Badge */}
      <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-sm bg-white p-1 border ${isDark ? 'border-emerald-600/30' : 'border-emerald-100'} ${iconSizes[size]}`}>
        <img
          src="/logo.jpg"
          alt="AidFast"
          className="w-full h-full object-contain"
        />
      </div>

      {variant !== 'icon-only' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 leading-tight">
            <span
              className={`font-bold tracking-tight ${titleSizes[size]} ${
                isDark ? 'text-white' : 'text-[#065f46]'
              }`}
            >
              AidFast
            </span>
          </div>
          {subtitle && (
            <span
              className={`text-xs truncate max-w-[170px] ${
                isDark ? 'text-emerald-200/70 font-normal' : 'text-emerald-700/80 font-medium'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AidFastLogo;

