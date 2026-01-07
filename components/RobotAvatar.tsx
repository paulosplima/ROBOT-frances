
import React from 'react';

interface RobotAvatarProps {
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RobotAvatar: React.FC<RobotAvatarProps> = ({ isThinking = false, size = 'md' }) => {
  const dimensions = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48'
  };

  return (
    <div className={`relative flex items-center justify-center ${dimensions[size]}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        {/* Body */}
        <rect x="25" y="40" width="50" height="45" rx="10" fill="#3B82F6" />
        <rect x="30" y="45" width="40" height="30" rx="5" fill="#1E40AF" opacity="0.5" />
        
        {/* Head */}
        <rect x="30" y="15" width="40" height="30" rx="8" fill="#60A5FA" />
        
        {/* Eyes */}
        <g className={isThinking ? 'animate-pulse' : ''}>
          <circle cx="40" cy="28" r="4" fill="white" />
          <circle cx="60" cy="28" r="4" fill="white" />
          <circle cx="40" cy="28" r="1.5" fill="#1E3A8A" />
          <circle cx="60" cy="28" r="1.5" fill="#1E3A8A" />
        </g>
        
        {/* Antenna */}
        <line x1="50" y1="15" x2="50" y2="5" stroke="#3B82F6" strokeWidth="2" />
        <circle cx="50" cy="5" r="3" fill="#EF4444" className={isThinking ? 'animate-ping' : ''} />
        
        {/* Mouth/Panel */}
        <rect x="40" y="36" width="20" height="4" rx="2" fill="#1E3A8A" opacity="0.3" />
        
        {/* Decorative buttons */}
        <circle cx="40" cy="78" r="2" fill="#FDE047" />
        <circle cx="50" cy="78" r="2" fill="#4ADE80" />
        <circle cx="60" cy="78" r="2" fill="#F87171" />
      </svg>
      {isThinking && (
        <div className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 animate-bounce">
          PENSANT...
        </div>
      )}
    </div>
  );
};

export default RobotAvatar;
