// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
// Placeholder friend list – replace with real data fetching
const dummyFriends = [
  { id: 'friend1', username: 'Alex Rivera', conversationId: 'conv1' },
  { id: 'friend2', username: 'Mia Chen', conversationId: 'conv2' },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <h2>Welcome, {user?.displayName || user?.email}</h2>
      <h3>Your Friends</h3>
      <ul className="friend-list">
        {dummyFriends.map((friend) => (
          <li key={friend.id} className="friend-item">
            <Link to={`/chat/${friend.conversationId}`}>{friend.username}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
