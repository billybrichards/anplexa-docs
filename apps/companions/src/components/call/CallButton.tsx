'use client';

interface CallButtonProps {
  onStartVoice: () => void;
  onStartVideo: () => void;
  isConnecting: boolean;
  disabled?: boolean;
}

export function CallButton({ onStartVoice, onStartVideo, isConnecting, disabled }: CallButtonProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Voice call */}
      <button
        onClick={onStartVoice}
        disabled={disabled || isConnecting}
        className="p-2 rounded-lg text-gold/60 hover:text-gold hover:bg-gold/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Start voice call"
        title="Voice call"
      >
        {isConnecting ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        )}
      </button>

      {/* Video call */}
      <button
        onClick={onStartVideo}
        disabled={disabled || isConnecting}
        className="p-2 rounded-lg text-gold/60 hover:text-gold hover:bg-gold/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Start video call"
        title="Video call"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </button>
    </div>
  );
}
