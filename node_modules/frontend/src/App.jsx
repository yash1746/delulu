import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Chat from './pages/Chat.jsx';
import { useAuth } from './AuthContext';
import './App.css';

function App() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div className="spinner">Loading...</div>;

  if (!user) {
    return (
      <div className="centered">
        <h2>Welcome to Delulu</h2>
        <button onClick={signIn}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="top-nav">
        <Link to="/">Home</Link>
        <span className="user-info">{user.displayName || user.email}</span>
        <button onClick={signOut}>Sign out</button>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:conversationId" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
