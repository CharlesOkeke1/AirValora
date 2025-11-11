// SignIn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import '../components/Home.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!email || !password) return setError('Fill all fields');
    setError('');
    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign-in success:', res.user.uid);
      navigate('/');
    } catch (e) {
      console.error('❌ Sign-in error:', e.message);
      setError(e.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2>Welcome Back</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <button onClick={handleSignIn} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      <p>Don't have an account? <span className="link" onClick={() => navigate('/signup')}>Create one</span></p>
    </div>
  );
}