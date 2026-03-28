'use client';

import { useCallback } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
} from '@livekit/components-react';
import type { AgentState } from '@livekit/components-react';

interface InCallModalProps {
  token: string;
  wsUrl: string;
  roomName: string;
  companionName?: string;
  hasVideo?: boolean;
  onDisconnect: () => void;
}

const agentStateLabels: Record<AgentState, string> = {
  disconnected: 'Connecting...',
  connecting: 'Connecting...',
  'pre-connect-buffering': 'Preparing...',
  failed: 'Connection failed',
  initializing: 'Initializing...',
  idle: 'Listening',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
};

export function InCallModal({
  token,
  wsUrl,
  roomName,
  companionName = 'Companion',
  hasVideo = false,
  onDisconnect,
}: InCallModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-space/90 backdrop-blur-sm">
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connectOptions={{ autoSubscribe: true }}
        onDisconnected={onDisconnect}
        className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-cosmic-purple border border-gold/20 shadow-2xl max-w-lg w-full mx-4"
      >
        <CallContent
          companionName={companionName}
          roomName={roomName}
          hasVideo={hasVideo}
          onDisconnect={onDisconnect}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function CallContent({
  companionName,
  roomName,
  hasVideo,
  onDisconnect,
}: {
  companionName: string;
  roomName: string;
  hasVideo: boolean;
  onDisconnect: () => void;
}) {
  const { state, audioTrack, agent } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const toggleMute = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  const isMuted = !isMicrophoneEnabled;

  const isConnected = connectionState === 'connected';
  const agentVideoTrack = agent?.getTrackPublications().find(
    (pub) => pub.kind === 'video' && pub.track,
  );

  return (
    <>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-gold">{companionName}</h2>
        <p className="text-sm text-stardust/70 mt-1">
          {agentStateLabels[state] ?? state}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{roomName}</p>
      </div>

      {/* Visualizer or Video */}
      <div className="w-full aspect-video max-h-64 flex items-center justify-center rounded-lg bg-deep-space/50 overflow-hidden">
        {hasVideo && agentVideoTrack?.track ? (
          <VideoTrack
            trackRef={{
              participant: agent!,
              source: agentVideoTrack.source,
              publication: agentVideoTrack,
            }}
            className="w-full h-full object-cover"
          />
        ) : audioTrack ? (
          <BarVisualizer
            trackRef={audioTrack}
            state={state}
            barCount={7}
            className="w-full h-32"
          />
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="w-16 h-16 rounded-full bg-nebula/50 border border-gold/30 flex items-center justify-center">
              <span className="text-2xl text-gold/60">
                {companionName.charAt(0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full transition-colors ${
            isMuted
              ? 'bg-red-500/20 text-red-400'
              : 'bg-nebula/50 text-cream hover:bg-nebula/80'
          }`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .46-.04.91-.13 1.35" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* End call */}
        <button
          onClick={onDisconnect}
          className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
          aria-label="End call"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        </button>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <p className="text-xs text-text-muted animate-pulse">
          {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Connecting to room...'}
        </p>
      )}
    </>
  );
}
