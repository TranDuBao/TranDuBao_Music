import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for the play button border */}
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#db2777" /> {/* Pink */}
          <stop offset="50%" stopColor="#a855f7" /> {/* Purple */}
          <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
        </linearGradient>
        
        {/* Glow effect filter */}
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main Play Button Shape (Triangle with rounded corners) */}
      <path
        d="M32 25C32 21.7 35.7 19.7 38.5 21.5L78 46.5C80.5 48.2 80.5 51.8 78 53.5L38.5 78.5C35.7 80.3 32 78.3 32 75V25Z"
        stroke="url(#logoGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neonGlow)"
        className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
      />

      {/* Microphone in the middle-top */}
      <g filter="url(#neonGlow)" className="drop-shadow-[0_0_6px_rgba(219,39,119,0.6)]">
        {/* Mic body */}
        <rect x="58" y="15" width="8" height="16" rx="4" fill="#db2777" />
        {/* Mic stand/mount */}
        <path d="M53 25C53 31 57 34 62 34C67 34 71 31 71 25" stroke="#db2777" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M62 34V39" stroke="#db2777" strokeWidth="2.5" />
      </g>

      {/* Soundwave Line across the center */}
      <path
        d="M10 50 Q 20 30, 24 50 T 34 50 T 40 70 T 48 35 T 56 50 T 66 50 T 76 40 T 90 50"
        stroke="#db2777"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neonGlow)"
        className="drop-shadow-[0_0_8px_rgba(219,39,119,0.7)]"
      />

      {/* Wi-Fi/Signal icon bottom right */}
      <g filter="url(#neonGlow)" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" fill="none" className="drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]">
        {/* Dot */}
        <circle cx="68" cy="74" r="1" fill="#3b82f6" />
        {/* Arc 1 */}
        <path d="M63 69 A 7 7 0 0 1 73 69" />
        {/* Arc 2 */}
        <path d="M58 64 A 14 14 0 0 1 78 64" />
      </g>
    </svg>
  );
}
