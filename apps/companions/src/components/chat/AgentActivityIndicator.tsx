'use client';

// Local type — mirrors @anplexa/contracts AgentActivityStatus to avoid cross-package resolution issues
type AgentActivityStatus = 'thinking' | 'tool_call' | 'tool_return' | 'responding';

interface AgentActivityIndicatorProps {
  status: AgentActivityStatus;
}

const labels: Record<AgentActivityStatus, string> = {
  thinking: 'Thinking',
  responding: 'Typing',
  tool_call: 'Using a tool',
  tool_return: 'Processing result',
};

export function AgentActivityIndicator({ status }: AgentActivityIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-stardust animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-stardust animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-stardust animate-bounce [animation-delay:300ms]" />
      </span>
      <span className="text-sm text-stardust opacity-80">
        {labels[status] ?? 'Working'}...
      </span>
    </div>
  );
}
