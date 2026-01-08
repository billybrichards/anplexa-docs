---
sidebar_position: 3
---

# Frontend Improvements

This document outlines the plan to refactor the frontend codebase, focusing on component decomposition, hook extraction, and establishing clear architectural patterns.

## Current Architecture Issues

### ChatInterface Analysis (949 lines)

The `ChatInterface` component has grown into a monolithic component handling multiple responsibilities:

| Responsibility | Lines (approx.) | Should Be |
|---------------|-----------------|-----------|
| Message rendering | 150 | Separate component |
| Input handling | 100 | Separate component |
| Conversation management | 120 | Custom hook |
| Guest mode logic | 80 | Custom hook |
| Settings modal integration | 60 | Separate component |
| Theme handling | 40 | Context/hook |
| Scroll management | 50 | Custom hook |
| Error handling | 70 | Error boundary |
| Side effects | 100 | Custom hooks |
| State management | 150+ | Multiple hooks |

### Current File Structure

```
components/
├── chat-interface.tsx    # 949 lines - too large
├── auth-form.tsx         # 200 lines
├── gender-setup.tsx      # 150 lines
├── settings-modal.tsx    # 180 lines
├── theme-customizer.tsx  # 120 lines
└── ui/                   # shadcn components

lib/
├── auth-context.tsx      # 300+ lines - mixed concerns
└── utils.ts
```

### Issues Identified

| Issue | Impact | Location |
|-------|--------|----------|
| Monolithic component | Hard to test, maintain | ChatInterface |
| Mixed state management | Coupling, re-renders | ChatInterface |
| No hook extraction | Code duplication | ChatInterface |
| Auth context bloat | Single responsibility violation | auth-context.tsx |
| No service layer | Direct API calls in components | Multiple |
| Inconsistent error handling | Poor UX | All components |

## Target Component Architecture

### Decomposed Structure

```
components/
├── chat/
│   ├── ChatInterface.tsx       # < 200 lines - orchestration only
│   ├── MessageList.tsx         # Message rendering
│   ├── MessageItem.tsx         # Single message
│   ├── MessageInput.tsx        # Input with send
│   ├── TypingIndicator.tsx     # AI typing indicator
│   ├── ConversationHeader.tsx  # Title, actions
│   └── index.ts                # Barrel export
│
├── auth/
│   ├── AuthForm.tsx            # Login/register form
│   ├── LoginForm.tsx           # Login specific
│   ├── RegisterForm.tsx        # Register specific
│   ├── PasswordReset.tsx       # Password reset flow
│   └── index.ts
│
├── settings/
│   ├── SettingsModal.tsx       # Main modal
│   ├── ProfileSettings.tsx     # Profile section
│   ├── AppearanceSettings.tsx  # Theme section
│   ├── NotificationSettings.tsx
│   └── index.ts
│
├── layout/
│   ├── AppShell.tsx            # Main layout
│   ├── Sidebar.tsx             # Navigation
│   ├── Header.tsx              # Top bar
│   └── index.ts
│
└── ui/                         # shadcn components (unchanged)

hooks/
├── useChat.ts                  # Chat state and operations
├── useConversation.ts          # Conversation management
├── useGuestMode.ts             # Guest mode logic
├── useMessages.ts              # Message operations
├── useScrollToBottom.ts        # Scroll behavior
├── useLocalStorage.ts          # Storage abstraction
└── index.ts

services/
├── api/
│   ├── client.ts               # API client setup
│   ├── auth.ts                 # Auth API calls
│   ├── chat.ts                 # Chat API calls
│   └── conversations.ts        # Conversation API calls
├── storage/
│   ├── conversations.ts        # localStorage for conversations
│   └── preferences.ts          # User preferences
└── index.ts

contexts/
├── AuthContext.tsx             # Simplified auth state
├── ThemeContext.tsx            # Theme state
├── ChatContext.tsx             # Chat state (if needed)
└── index.ts

types/
├── auth.ts                     # Auth types
├── chat.ts                     # Chat types
├── conversation.ts             # Conversation types
└── index.ts
```

## ChatInterface Decomposition

### Step 1: Extract MessageList and MessageItem

**Before (in ChatInterface):**
```tsx
// 150+ lines of message rendering logic
{messages.map((message, index) => (
  <div
    key={index}
    className={cn(
      "flex gap-3 p-4",
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}
  >
    {message.role === 'assistant' && (
      <Avatar className="h-8 w-8">
        <AvatarImage src="/companion-avatar.png" />
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
    )}
    <div className={cn(
      "max-w-[80%] rounded-lg px-4 py-2",
      message.role === 'user'
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted'
    )}>
      {message.role === 'assistant' ? (
        <MarkdownRenderer content={message.content} />
      ) : (
        <p>{message.content}</p>
      )}
    </div>
    {/* More rendering logic... */}
  </div>
))}
```

**After:**

```tsx
// components/chat/MessageItem.tsx
interface MessageItemProps {
  message: Message;
  isLastMessage?: boolean;
  onRetry?: () => void;
}

export function MessageItem({ message, isLastMessage, onRetry }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && <CompanionAvatar />}

      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2",
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>

      {isUser && <UserAvatar />}
    </div>
  );
}

// components/chat/MessageList.tsx
interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRetry?: (messageId: string) => void;
}

export function MessageList({ messages, isLoading, onRetry }: MessageListProps) {
  const scrollRef = useScrollToBottom(messages);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        messages.map((message, index) => (
          <MessageItem
            key={message.id || index}
            message={message}
            isLastMessage={index === messages.length - 1}
            onRetry={() => onRetry?.(message.id)}
          />
        ))
      )}

      {isLoading && <TypingIndicator />}
    </div>
  );
}
```

### Step 2: Extract MessageInput

```tsx
// components/chat/MessageInput.tsx
interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  isLoading,
  disabled,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSend(input.trim());
    setInput('');
  }, [input, isLoading, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className="min-h-[44px] max-h-[200px] resize-none"
        rows={1}
      />
      <Button
        type="submit"
        disabled={!input.trim() || isLoading || disabled}
        size="icon"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
      </Button>
    </form>
  );
}
```

### Step 3: Simplified ChatInterface

```tsx
// components/chat/ChatInterface.tsx (< 200 lines)
export function ChatInterface() {
  const { user, isGuest } = useAuth();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    retryMessage,
    clearError
  } = useChat();

  const {
    conversations,
    currentConversation,
    selectConversation,
    createConversation,
    deleteConversation
  } = useConversation();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentId={currentConversation?.id}
        onSelect={selectConversation}
        onCreate={createConversation}
        onDelete={deleteConversation}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <ConversationHeader
          conversation={currentConversation}
          isGuest={isGuest}
        />

        {error && (
          <ErrorBanner
            message={error.message}
            onDismiss={clearError}
            onRetry={() => retryMessage()}
          />
        )}

        <MessageList
          messages={messages}
          isLoading={isLoading}
          onRetry={retryMessage}
        />

        <MessageInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!currentConversation}
        />
      </div>
    </div>
  );
}
```

## Hook Extraction

### useChat Hook

```typescript
// hooks/useChat.ts
interface UseChatOptions {
  conversationId?: string;
  onError?: (error: Error) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId?: string) => Promise<void>;
  clearError: () => void;
  clearMessages: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { conversationId, onError } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadMessages = async (id: string) => {
    try {
      const data = await chatService.getMessages(id);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Optimistic update
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await chatService.sendMessage({
        conversationId,
        content,
        signal: abortControllerRef.current.signal
      });

      // Handle streaming response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      for await (const chunk of response) {
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content += chunk;
          }
          return updated;
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Cancelled, not an error
      }
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onError?.(error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, isLoading, onError]);

  const retryMessage = useCallback(async (messageId?: string) => {
    // Find last user message to retry
    const lastUserMessage = [...messages]
      .reverse()
      .find(m => m.role === 'user' && (!messageId || m.id === messageId));

    if (lastUserMessage) {
      // Remove failed assistant response if any
      setMessages(prev => {
        const userMsgIndex = prev.findIndex(m => m.id === lastUserMessage.id);
        return prev.slice(0, userMsgIndex + 1);
      });

      await sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  const clearError = useCallback(() => setError(null), []);
  const clearMessages = useCallback(() => setMessages([]), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryMessage,
    clearError,
    clearMessages
  };
}
```

### useConversation Hook

```typescript
// hooks/useConversation.ts
interface UseConversationReturn {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: Error | null;
  selectConversation: (id: string) => void;
  createConversation: (title?: string) => Promise<Conversation>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useConversation(): UseConversationReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentConversation = useMemo(
    () => conversations.find(c => c.id === currentId) ?? null,
    [conversations, currentId]
  );

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await conversationService.getAll();
      setConversations(data);

      // Select first conversation if none selected
      if (!currentId && data.length > 0) {
        setCurrentId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversations'));
    } finally {
      setIsLoading(false);
    }
  }, [currentId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const createConversation = useCallback(async (title?: string) => {
    const conversation = await conversationService.create({ title });
    setConversations(prev => [conversation, ...prev]);
    setCurrentId(conversation.id);
    return conversation;
  }, []);

  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    await conversationService.update(id, updates);
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await conversationService.delete(id);
    setConversations(prev => prev.filter(c => c.id !== id));

    // Select another conversation if current was deleted
    if (currentId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentId(remaining[0]?.id ?? null);
    }
  }, [currentId, conversations]);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    selectConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    refresh: loadConversations
  };
}
```

### useGuestMode Hook

```typescript
// hooks/useGuestMode.ts
interface UseGuestModeReturn {
  isGuest: boolean;
  guestMessageCount: number;
  maxGuestMessages: number;
  canSendMessage: boolean;
  showUpgradePrompt: boolean;
  dismissUpgradePrompt: () => void;
  resetGuestSession: () => void;
}

const MAX_GUEST_MESSAGES = 10;
const GUEST_STORAGE_KEY = 'anplexa_guest_session';

export function useGuestMode(): UseGuestModeReturn {
  const { user } = useAuth();
  const [guestData, setGuestData] = useLocalStorage<GuestSession | null>(
    GUEST_STORAGE_KEY,
    null
  );
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const isGuest = !user;
  const guestMessageCount = guestData?.messageCount ?? 0;
  const canSendMessage = !isGuest || guestMessageCount < MAX_GUEST_MESSAGES;

  useEffect(() => {
    if (isGuest && guestMessageCount >= MAX_GUEST_MESSAGES - 2) {
      setShowUpgradePrompt(true);
    }
  }, [isGuest, guestMessageCount]);

  const incrementMessageCount = useCallback(() => {
    if (!isGuest) return;

    setGuestData(prev => ({
      ...prev,
      messageCount: (prev?.messageCount ?? 0) + 1,
      lastActivity: new Date().toISOString()
    }));
  }, [isGuest, setGuestData]);

  const dismissUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
  }, []);

  const resetGuestSession = useCallback(() => {
    setGuestData(null);
    setShowUpgradePrompt(false);
  }, [setGuestData]);

  return {
    isGuest,
    guestMessageCount,
    maxGuestMessages: MAX_GUEST_MESSAGES,
    canSendMessage,
    showUpgradePrompt,
    dismissUpgradePrompt,
    resetGuestSession
  };
}
```

## Auth Context Refactor

### Current Issues

The current `auth-context.tsx` (~300 lines) handles:
- User state management
- Token storage
- API calls directly
- Loading states
- Error handling
- Token refresh logic

### Target: Adapter Pattern

```typescript
// services/api/auth.ts - AuthService (API calls)
export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<TokenPair>;
  getProfile(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
}

export const authService: AuthService = {
  async login(credentials) {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data) {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async refreshToken() {
    const response = await apiClient.post<TokenPair>('/auth/refresh');
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  async updateProfile(data) {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  }
};

// services/storage/auth.ts - Token storage
export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: TokenPair): void;
  clearTokens(): void;
}

export const tokenStorage: TokenStorage = {
  getAccessToken() {
    return localStorage.getItem('access_token');
  },

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  },

  setTokens(tokens) {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  },

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// contexts/AuthContext.tsx - Simplified context (< 150 lines)
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch {
          tokenStorage.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    tokenStorage.setTokens(response.tokens);
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authService.register(data);
    tokenStorage.setTokens(response.tokens);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile
  }), [user, isLoading, login, register, logout, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Conversation Service Consolidation

Currently, conversation operations are spread across multiple locations. Consolidate into a single service.

```typescript
// services/conversations.ts
export interface ConversationService {
  getAll(): Promise<Conversation[]>;
  getById(id: string): Promise<Conversation>;
  create(data: CreateConversationData): Promise<Conversation>;
  update(id: string, data: Partial<Conversation>): Promise<Conversation>;
  delete(id: string): Promise<void>;
  getMessages(id: string): Promise<Message[]>;

  // Local storage methods for offline support
  saveToLocal(conversations: Conversation[]): void;
  loadFromLocal(): Conversation[] | null;
  clearLocal(): void;
}

export const conversationService: ConversationService = {
  async getAll() {
    try {
      const response = await apiClient.get<Conversation[]>('/conversations');
      this.saveToLocal(response.data);
      return response.data;
    } catch (error) {
      // Fallback to local storage on network error
      const local = this.loadFromLocal();
      if (local) return local;
      throw error;
    }
  },

  async getById(id) {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await apiClient.post<Conversation>('/conversations', data);
    return response.data;
  },

  async update(id, data) {
    const response = await apiClient.put<Conversation>(`/conversations/${id}`, data);
    return response.data;
  },

  async delete(id) {
    await apiClient.delete(`/conversations/${id}`);
  },

  async getMessages(id) {
    const response = await apiClient.get<Message[]>(`/conversations/${id}/messages`);
    return response.data;
  },

  saveToLocal(conversations) {
    localStorage.setItem('anplexa_conversations', JSON.stringify(conversations));
  },

  loadFromLocal() {
    const data = localStorage.getItem('anplexa_conversations');
    return data ? JSON.parse(data) : null;
  },

  clearLocal() {
    localStorage.removeItem('anplexa_conversations');
  }
};
```

## Migration Plan

### Phase 1: Setup (Week 1)

1. Create new directory structure
2. Add barrel exports (index.ts files)
3. Set up path aliases in tsconfig
4. Create TypeScript types

### Phase 2: Hook Extraction (Week 2)

1. Extract useChat hook
2. Extract useConversation hook
3. Extract useGuestMode hook
4. Create useScrollToBottom utility hook
5. Test hooks in isolation

### Phase 3: Component Decomposition (Week 3-4)

1. Create MessageItem component
2. Create MessageList component
3. Create MessageInput component
4. Create ConversationSidebar component
5. Refactor ChatInterface to use new components
6. Delete old monolithic code

### Phase 4: Service Layer (Week 5)

1. Create API client with interceptors
2. Implement authService
3. Implement conversationService
4. Implement chatService
5. Refactor components to use services

### Phase 5: Context Refactor (Week 6)

1. Create adapter pattern for auth
2. Simplify AuthContext
3. Add error boundaries
4. Final integration testing

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| ChatInterface lines | 949 | < 200 |
| Largest component | 949 | < 200 |
| Custom hooks | 0 | 5+ |
| Service layer | None | Complete |
| Test coverage | < 10% | > 70% |
| Bundle size | TBD | -20% |

## Related Documentation

- [Improvement Roadmap](./roadmap.md)
- [Backend Improvements](./backend-improvements.md)
- [Monorepo Migration](./monorepo-migration.md)
