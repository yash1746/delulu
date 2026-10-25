export type ConversationType = 'NORMAL' | 'PRIVATE';

export interface UserProfile {
  id: string;
  googleId?: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  presence: 'online' | 'idle' | 'offline';
  lastSeenAt: string;
  createdAt: string;
}

export interface Friendship {
  id: string;
  user: UserProfile;
  friend: UserProfile;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  normalConversationId: string;
  hasPrivateSpace: boolean;
  lastInteractionAt: string;
}

export interface PrivateSpaceConfig {
  friendshipId: string;
  isConfigured: boolean;
  secretTriggerCode: string; // e.g., "*4829#" or custom numeric PIN
  pinHash?: string; // PBKDF2/Argon2 local salt+hash
  autoLockSeconds: number; // default 120s
  disguisedNotificationsEnabled: boolean;
  customDisguisedMessage?: string;
  failedPinAttempts: number;
  lockedUntil?: number;
}

export interface InPlaceChatSwapState {
  conversationId: string;
  isPrivateDecrypted: boolean;
  autoRevertSecondsRemaining: number;
  lastActivityTimestamp: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  type: ConversationType;
  senderId: string;
  recipientId: string;
  encryptedContent?: string; // For E2EE private chats
  plainContent?: string; // For normal chats
  attachments?: {
    type: 'IMAGE' | 'AUDIO' | 'DOCUMENT';
    url: string;
    fileName?: string;
    fileSizeBytes?: number;
    durationSeconds?: number;
  }[];
  isDisappearing?: boolean;
  burnAfterReadSeconds?: number;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface PushNotificationPayload {
  recipientId: string;
  conversationType: ConversationType;
  title: string;
  body: string;
  data: {
    conversationId: string;
    isDisguised: boolean;
  };
}
