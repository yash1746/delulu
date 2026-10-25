// src/pages/Chat.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { DEFAULT_SECRET_TRIGGER_PREFIX, DEFAULT_SECRET_TRIGGER_SUFFIX, IN_PLACE_SWAP_EXIT_COMMAND, DISGUISED_NOTIFICATION_MESSAGES } from '../../shared/src/constants';

const Chat = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Listen for real‑time messages
  useEffect(() => {
    if (!conversationId) return;
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [conversationId]);

  const togglePrivateMode = (code) => {
    // For now, simply toggle private mode; in a real app the code would be used to derive a shared secret.
    setIsPrivate(true);
  };

  const exitPrivateMode = () => {
    setIsPrivate(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Check for exit command first
    if (newMessage.trim() === IN_PLACE_SWAP_EXIT_COMMAND) {
      exitPrivateMode();
      setNewMessage('');
      return;
    }

    // Check for secret trigger to enter private mode
    if (
      newMessage.startsWith(DEFAULT_SECRET_TRIGGER_PREFIX) &&
      newMessage.endsWith(DEFAULT_SECRET_TRIGGER_SUFFIX)
    ) {
      const secret = newMessage.slice(
        DEFAULT_SECRET_TRIGGER_PREFIX.length,
        newMessage.length - DEFAULT_SECRET_TRIGGER_SUFFIX.length
      );
      togglePrivateMode(secret);
      setNewMessage('');
      return;
    }

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      text: newMessage.trim(),
      senderId: user?.uid,
      createdAt: serverTimestamp(),
    });
    setNewMessage('');
  };

  const renderMessage = (msg) => {
    const isOwn = msg.senderId === user?.uid;
    const displayedText = isPrivate ?
      DISGUISED_NOTIFICATION_MESSAGES[Math.floor(Math.random() * DISGUISED_NOTIFICATION_MESSAGES.length)] :
      msg.text;
    return (
      <div key={msg.id} className={`message ${isOwn ? 'own' : ''}`}>
        <span className="text">{displayedText}</span>
      </div>
    );
  };

  return (
    <div className="chat-page">
      <h2>{isPrivate ? 'Private Chat' : 'Chat'}</h2>
      <div className="messages" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {messages.map(renderMessage)}
      </div>
      <form onSubmit={sendMessage} className="message-input" style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isPrivate ? 'Enter !exit to leave private mode' : 'Type a message...'}
          style={{ width: '80%' }}
        />
        <button type="submit" style={{ marginLeft: '0.5rem' }}>Send</button>
      </form>
    </div>
  );
};

export default Chat;
