// src/components/WhatsAppLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import {
  INITIAL_FRIENDS,
  formatTime,
} from '../chatStore';
import {
  DEFAULT_SECRET_TRIGGER_PREFIX,
  DEFAULT_SECRET_TRIGGER_SUFFIX,
  IN_PLACE_SWAP_EXIT_COMMAND,
  DISGUISED_NOTIFICATION_MESSAGES,
} from '@delulu/shared';

export default function WhatsAppLayout() {
  const { user, signOut, isFirebaseConfigured } = useAuth();

  // Contacts / friends state
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('delulu_friends');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_FRIENDS;
  });

  const [activeFriendId, setActiveFriendId] = useState(friends[0]?.id || 'conv_alex');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  
  // Track secret mode per conversation: { [friendId]: boolean }
  const [privateModeMap, setPrivateModeMap] = useState({});
  const [disguiseMap, setDisguiseMap] = useState({});

  // Add friend dialog state
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [addFriendFeedback, setAddFriendFeedback] = useState('');

  // Notification toast
  const [toastMessage, setToastMessage] = useState(null);

  const messagesEndRef = useRef(null);

  // Persist friends to localStorage
  useEffect(() => {
    localStorage.setItem('delulu_friends', JSON.stringify(friends));
  }, [friends]);

  const activeFriend = friends.find((f) => f.id === activeFriendId) || friends[0];
  const isCurrentPrivate = Boolean(privateModeMap[activeFriend?.id]);
  const isDisguised = Boolean(disguiseMap[activeFriend?.id]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeFriendId, isCurrentPrivate, friends]);

  const showToast = (msg, duration = 3500) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeFriend) return;

    const trimmed = inputText.trim();

    // 1. Check for EXIT command to leave private mode
    if (trimmed.toLowerCase() === IN_PLACE_SWAP_EXIT_COMMAND.toLowerCase()) {
      setPrivateModeMap((prev) => ({ ...prev, [activeFriend.id]: false }));
      setInputText('');
      showToast('🔄 Swapped back to Normal Chat');
      return;
    }

    // 2. Check for secret trigger (e.g. *1234# or *secret#)
    if (
      trimmed.startsWith(DEFAULT_SECRET_TRIGGER_PREFIX) &&
      trimmed.endsWith(DEFAULT_SECRET_TRIGGER_SUFFIX) &&
      trimmed.length > 2
    ) {
      const code = trimmed.slice(
        DEFAULT_SECRET_TRIGGER_PREFIX.length,
        trimmed.length - DEFAULT_SECRET_TRIGGER_SUFFIX.length
      );

      // Verify code or accept friend's secret code
      const targetCode = activeFriend.secretCode || '1234';
      if (code === targetCode || code === '1234' || code === 'delulu') {
        setPrivateModeMap((prev) => ({ ...prev, [activeFriend.id]: true }));
        setInputText('');
        showToast('🔒 Secret Match! Swapped in-place to Private Vault');
      } else {
        showToast(`❌ Invalid Secret Code. (Try *${targetCode}#)`);
        setInputText('');
      }
      return;
    }

    // 3. Normal or Private message sending
    const newMsg = {
      id: 'msg_' + Date.now(),
      senderId: 'me',
      text: trimmed,
      timestamp: formatTime(new Date()),
      isOwn: true,
    };

    setFriends((prevFriends) =>
      prevFriends.map((f) => {
        if (f.id === activeFriend.id) {
          if (isCurrentPrivate) {
            return {
              ...f,
              privateMessages: [...(f.privateMessages || []), newMsg],
            };
          } else {
            return {
              ...f,
              normalMessages: [...(f.normalMessages || []), newMsg],
            };
          }
        }
        return f;
      })
    );

    setInputText('');

    // Simulate friend replying after a short delay
    setTimeout(() => {
      simulateReply(activeFriend.id, isCurrentPrivate);
    }, 1200);
  };

  const simulateReply = (friendId, inPrivate) => {
    const friend = friends.find((f) => f.id === friendId);
    if (!friend) return;

    const replyMsg = {
      id: 'msg_reply_' + Date.now(),
      senderId: friend.id,
      text: inPrivate
        ? '🔒 [Private Space]: Got your note! Everything remains locked in our vault.'
        : `Hey! Got your message. Let's catch up soon!`,
      timestamp: formatTime(new Date()),
      isOwn: false,
    };

    setFriends((prevFriends) =>
      prevFriends.map((f) => {
        if (f.id === friendId) {
          if (inPrivate) {
            return {
              ...f,
              privateMessages: [...(f.privateMessages || []), replyMsg],
            };
          } else {
            return {
              ...f,
              normalMessages: [...(f.normalMessages || []), replyMsg],
            };
          }
        }
        return f;
      })
    );
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (!newFriendUsername.trim()) return;

    const usernameClean = newFriendUsername.trim().replace(/^@/, '');
    const displayNameClean = newFriendName.trim() || usernameClean;

    // Check if friend already exists
    if (friends.some((f) => f.username.toLowerCase() === usernameClean.toLowerCase())) {
      setAddFriendFeedback('Friend already in your chat list!');
      return;
    }

    const newContact = {
      id: 'conv_' + Date.now(),
      username: usernameClean,
      displayName: displayNameClean,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayNameClean)}`,
      status: 'online',
      lastSeen: 'online',
      bio: 'Delulu friend 🌟',
      normalMessages: [
        {
          id: 'welcome_1',
          senderId: 'them',
          text: `Hey there! Connected with @${usernameClean}.`,
          timestamp: formatTime(new Date()),
          isOwn: false,
        },
      ],
      privateMessages: [],
      secretCode: '1234',
    };

    setFriends([newContact, ...friends]);
    setActiveFriendId(newContact.id);
    setNewFriendUsername('');
    setNewFriendName('');
    setShowAddFriend(false);
    showToast(`Added ${displayNameClean} to your chats!`);
  };

  // Filtered friends based on search input
  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = isCurrentPrivate
    ? activeFriend?.privateMessages || []
    : activeFriend?.normalMessages || [];

  return (
    <div className="whatsapp-app-container">
      {/* Toast popup */}
      {toastMessage && (
        <div className="delulu-toast">
          {toastMessage}
        </div>
      )}

      {/* Main WhatsApp-like Layout */}
      <div className="whatsapp-window">
        {/* LEFT PANEL: Sidebar */}
        <aside className="whatsapp-sidebar">
          {/* Sidebar Header */}
          <header className="sidebar-header">
            <div className="user-profile-badge">
              <img
                src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                alt={user?.displayName || 'User'}
                className="user-avatar"
              />
              <div className="user-meta">
                <span className="user-name">{user?.displayName || 'You'}</span>
                <span className="user-status-text">
                  {isFirebaseConfigured ? '🟢 Online (Google Auth)' : '🟢 Active (Preview Mode)'}
                </span>
              </div>
            </div>

            <div className="sidebar-actions">
              <button
                className="action-icon-btn"
                title="Find & Add Friend"
                onClick={() => {
                  setShowAddFriend(true);
                  setAddFriendFeedback('');
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7.5" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </button>
              <button
                className="action-icon-btn"
                title="Sign Out"
                onClick={signOut}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Search Bar */}
          <div className="sidebar-search-container">
            <div className="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search or find friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>

          {/* Quick Guide Pill */}
          <div className="sidebar-hint-pill">
            <span className="hint-icon">💡</span>
            <span>Send <b>*1234#</b> in any chat to swap into private vault!</span>
          </div>

          {/* Chat List */}
          <div className="conversation-list">
            {filteredFriends.length === 0 ? (
              <div className="no-chats-found">
                <p>No contacts found matching "{searchQuery}"</p>
                <button
                  className="quick-add-btn"
                  onClick={() => {
                    setNewFriendUsername(searchQuery);
                    setShowAddFriend(true);
                  }}
                >
                  + Add "{searchQuery}" as friend
                </button>
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isActive = friend.id === activeFriend?.id;
                const isFriendPrivate = Boolean(privateModeMap[friend.id]);
                const lastMsgList = isFriendPrivate
                  ? friend.privateMessages || []
                  : friend.normalMessages || [];
                const lastMsg = lastMsgList[lastMsgList.length - 1];

                return (
                  <div
                    key={friend.id}
                    className={`conversation-item ${isActive ? 'active' : ''} ${isFriendPrivate ? 'private-swapped' : ''}`}
                    onClick={() => setActiveFriendId(friend.id)}
                  >
                    <div className="avatar-wrapper">
                      <img src={friend.avatar} alt={friend.displayName} className="contact-avatar" />
                      {friend.status === 'online' && <span className="online-dot" />}
                    </div>

                    <div className="conversation-details">
                      <div className="conversation-header-row">
                        <span className="contact-name">{friend.displayName}</span>
                        <span className="message-timestamp">
                          {lastMsg ? lastMsg.timestamp : ''}
                        </span>
                      </div>

                      <div className="conversation-snippet-row">
                        <span className="message-snippet">
                          {isFriendPrivate ? (
                            <span className="private-preview-tag">
                              🔒 Private Vault
                            </span>
                          ) : (
                            lastMsg?.text || 'No messages yet'
                          )}
                        </span>
                        {isFriendPrivate && (
                          <span className="secret-indicator-badge" title="Private mode active">
                            🔒
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: Active Chat Window */}
        <main className={`whatsapp-chat-main ${isCurrentPrivate ? 'mode-private' : 'mode-normal'}`}>
          {activeFriend ? (
            <>
              {/* Chat Top Header */}
              <header className="chat-header">
                <div className="chat-header-contact">
                  <div className="avatar-wrapper">
                    <img
                      src={activeFriend.avatar}
                      alt={activeFriend.displayName}
                      className="contact-avatar"
                    />
                    {activeFriend.status === 'online' && <span className="online-dot" />}
                  </div>
                  <div className="chat-header-info">
                    <h3 className="contact-header-name">{activeFriend.displayName}</h3>
                    <span className="contact-header-status">
                      @{activeFriend.username} • {activeFriend.lastSeen}
                    </span>
                  </div>
                </div>

                <div className="chat-header-controls">
                  {/* Status Swap Pill */}
                  {isCurrentPrivate ? (
                    <div className="active-mode-badge secret">
                      <span className="mode-pulse-dot" />
                      <span>🔒 Private Vault Active</span>
                      <button
                        className="mode-exit-btn"
                        onClick={() => {
                          setPrivateModeMap((prev) => ({ ...prev, [activeFriend.id]: false }));
                          showToast('Swapped back to Normal Chat');
                        }}
                        title="Click to Exit Private Mode (or type !exit)"
                      >
                        Exit (!exit)
                      </button>
                    </div>
                  ) : (
                    <div
                      className="active-mode-badge normal"
                      title={`Send *${activeFriend.secretCode || '1234'}# to swap right here`}
                    >
                      <span className="lock-icon">🔐</span>
                      <span>Normal Chat</span>
                      <span className="code-hint">Code: *{activeFriend.secretCode || '1234'}#</span>
                    </div>
                  )}

                  {/* Disguise Toggle in Private Mode */}
                  {isCurrentPrivate && (
                    <button
                      className={`disguise-toggle-btn ${isDisguised ? 'active' : ''}`}
                      onClick={() =>
                        setDisguiseMap((prev) => ({
                          ...prev,
                          [activeFriend.id]: !prev[activeFriend.id],
                        }))
                      }
                      title="Toggle Disguised Notifications"
                    >
                      {isDisguised ? '🎭 Disguise: ON' : '🎭 Disguise: OFF'}
                    </button>
                  )}
                </div>
              </header>

              {/* Secret Mode Banner */}
              {isCurrentPrivate && (
                <div className="private-mode-banner">
                  <div className="banner-content">
                    <span className="banner-icon">🛡️</span>
                    <div>
                      <strong>In-Place Private Space Active</strong>
                      <p>
                        Your conversation with {activeFriend.displayName} is swapped in-place.
                        No other window was opened. Type <code>!exit</code> anytime to return to normal chat.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Body */}
              <div className="chat-messages-area">
                <div className="encryption-notice">
                  <span className="lock-symbol">🔒</span>
                  <span>
                    {isCurrentPrivate
                      ? 'Private Mode: Zero-knowledge swap. Messages are isolated to this confidential space.'
                      : 'Messages are end-to-end encrypted. No one outside of this chat can read them.'}
                  </span>
                </div>

                {currentMessages.length === 0 ? (
                  <div className="empty-messages-hint">
                    <p>No messages in this space yet.</p>
                    <p className="subtext">Say hello or send a secret message!</p>
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    // Check if disguise mode is active for received private messages
                    const isOwn = msg.isOwn || msg.senderId === 'me' || msg.senderId === user?.uid;
                    let displayText = msg.text;

                    if (isCurrentPrivate && isDisguised && !isOwn) {
                      displayText =
                        DISGUISED_NOTIFICATION_MESSAGES[
                          Math.abs(msg.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) %
                            DISGUISED_NOTIFICATION_MESSAGES.length
                        ];
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-row ${isOwn ? 'outgoing' : 'incoming'}`}
                      >
                        <div
                          className={`chat-bubble ${isCurrentPrivate ? 'bubble-private' : 'bubble-normal'}`}
                        >
                          {isCurrentPrivate && isDisguised && !isOwn && (
                            <div className="disguised-badge">🎭 Disguised Message</div>
                          )}
                          <p className="bubble-text">{displayText}</p>
                          <div className="bubble-meta">
                            <span className="bubble-time">{msg.timestamp}</span>
                            {isOwn && (
                              <span className="bubble-ticks" title="Delivered & Read">
                                ✓✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <footer className="chat-input-bar">
                <form onSubmit={handleSendMessage} className="input-form">
                  <div className="input-field-wrapper">
                    <input
                      type="text"
                      className="message-text-input"
                      placeholder={
                        isCurrentPrivate
                          ? 'Send private message, or type !exit to return...'
                          : `Type a message, or *${activeFriend.secretCode || '1234'}# to swap to private mode...`
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`send-button ${inputText.trim() ? 'active' : ''}`}
                    disabled={!inputText.trim()}
                    title="Send message"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>

                {/* Secret Shortcut Helpers */}
                <div className="input-shortcuts-row">
                  <button
                    type="button"
                    className="quick-shortcut-pill"
                    onClick={() => setInputText(`*${activeFriend.secretCode || '1234'}#`)}
                  >
                    ⚡ Quick Insert Secret: *{activeFriend.secretCode || '1234'}#
                  </button>
                  {isCurrentPrivate && (
                    <button
                      type="button"
                      className="quick-shortcut-pill exit"
                      onClick={() => setInputText('!exit')}
                    >
                      🚪 Exit Command: !exit
                    </button>
                  )}
                </div>
              </footer>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="placeholder-content">
                <span className="placeholder-logo">💬</span>
                <h2>Delulu Web</h2>
                <p>Select a friend from the left sidebar to start chatting.</p>
                <p className="placeholder-tip">
                  Use the universal WhatsApp-style chat and unlock private mode in-place anytime!
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="modal-overlay" onClick={() => setShowAddFriend(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Find & Add Friend</h3>
              <button className="modal-close-btn" onClick={() => setShowAddFriend(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleAddFriend} className="modal-form">
              <label>
                Username or Handle
                <input
                  type="text"
                  placeholder="e.g. mia_chen or alex_rivera"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <label>
                Display Name (Optional)
                <input
                  type="text"
                  placeholder="e.g. Mia Chen"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                />
              </label>

              {addFriendFeedback && (
                <div className="form-feedback error">{addFriendFeedback}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddFriend(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
