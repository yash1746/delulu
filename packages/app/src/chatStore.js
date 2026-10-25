// src/chatStore.js
import { db, isFirebaseConfigured } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import {
  DEFAULT_SECRET_TRIGGER_PREFIX,
  DEFAULT_SECRET_TRIGGER_SUFFIX,
  IN_PLACE_SWAP_EXIT_COMMAND,
  DISGUISED_NOTIFICATION_MESSAGES,
} from '@delulu/shared';

// Initial friend list with avatars and initial normal + secret messages
export const INITIAL_FRIENDS = [
  {
    id: 'conv_alex',
    username: 'alex_rivera',
    displayName: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
    status: 'online',
    lastSeen: 'online',
    bio: 'Coffee, code, and chill vibes ☕',
    normalMessages: [
      { id: 'm1', senderId: 'conv_alex', text: 'Hey! Are we still meeting for lunch tomorrow?', timestamp: '11:42 AM', isOwn: false },
      { id: 'm2', senderId: 'me', text: 'Yes, around 1:00 PM at the usual cafe!', timestamp: '11:45 AM', isOwn: true },
      { id: 'm3', senderId: 'conv_alex', text: 'Perfect! See you there.', timestamp: '11:46 AM', isOwn: false },
    ],
    privateMessages: [
      { id: 'p1', senderId: 'conv_alex', text: '🔒 Hey, the secret proposal details are finalized.', timestamp: '11:50 AM', isOwn: false },
      { id: 'p2', senderId: 'me', text: 'Awesome, keeping it encrypted here.', timestamp: '11:52 AM', isOwn: true },
    ],
    secretCode: '1234',
  },
  {
    id: 'conv_mia',
    username: 'mia_chen',
    displayName: 'Mia Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    status: 'online',
    lastSeen: 'online',
    bio: 'Designing moments ✨',
    normalMessages: [
      { id: 'm4', senderId: 'conv_mia', text: 'Did you get a chance to check the new UI designs?', timestamp: 'Yesterday', isOwn: false },
      { id: 'm5', senderId: 'me', text: 'Just reviewed them, the color palette looks so clean and universal!', timestamp: 'Yesterday', isOwn: true },
    ],
    privateMessages: [
      { id: 'p3', senderId: 'conv_mia', text: '🔒 Surprise party plans for Jordan are locked in.', timestamp: 'Yesterday', isOwn: false },
    ],
    secretCode: '777',
  },
  {
    id: 'conv_jordan',
    username: 'jordan_lee',
    displayName: 'Jordan Lee',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&h=120&fit=crop&crop=face',
    status: 'offline',
    lastSeen: '2 hours ago',
    bio: 'Always learning 🚀',
    normalMessages: [
      { id: 'm6', senderId: 'conv_jordan', text: 'Bro that bug in the parser had me awake until 3 AM haha', timestamp: 'Tuesday', isOwn: false },
      { id: 'm7', senderId: 'me', text: 'Haha classic, at least we fixed it before release', timestamp: 'Tuesday', isOwn: true },
    ],
    privateMessages: [
      { id: 'p4', senderId: 'conv_jordan', text: '🔒 Stashed the API keys in our private vault.', timestamp: 'Tuesday', isOwn: false },
    ],
    secretCode: '0000',
  },
  {
    id: 'conv_sam',
    username: 'sam_patel',
    displayName: 'Sam Patel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
    status: 'online',
    lastSeen: 'online',
    bio: 'Music & photography lover 🎵📸',
    normalMessages: [
      { id: 'm8', senderId: 'conv_sam', text: 'Check out this new track I just produced!', timestamp: 'Monday', isOwn: false },
    ],
    privateMessages: [],
    secretCode: '9999',
  },
];

export const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
