export const APP_NAME = 'Delulu';

// Neutral, universal disguised notification messages for private chat messages
export const DISGUISED_NOTIFICATION_MESSAGES = [
  'You have a new reminder.',
  'Daily calendar sync complete.',
  'Your summary is ready.',
  'New system update available.',
  'A note was shared with you.'
] as const;

export const DEFAULT_DISGUISED_MESSAGE = 'You have a new reminder.';
export const DISGUISED_NOTIFICATION_TITLE = 'Notification';

// Default auto-lock timeout for private spaces (in seconds)
export const DEFAULT_AUTO_LOCK_SECONDS = 120; // 2 minutes

// Ephemeral message envelope TTL on backend (7 days in ms)
export const ENVELOPE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// PIN Lockout settings
export const MAX_PIN_FAILURES_BEFORE_DELAY = 3;
export const INITIAL_LOCKOUT_MS = 5000; // 5 seconds
export const EXTENDED_LOCKOUT_MS = 30000; // 30 seconds

// In-Place Chat Swap Trigger settings
export const DEFAULT_SECRET_TRIGGER_PREFIX = '*';
export const DEFAULT_SECRET_TRIGGER_SUFFIX = '#';
export const IN_PLACE_SWAP_EXIT_COMMAND = '!exit';
