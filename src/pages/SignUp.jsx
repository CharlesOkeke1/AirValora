// SignUp.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import '../components/Home.css';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const calculateAge = (birthdate) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !username || !birthday) {
      return setError('Fill all fields');
    }

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(birthday);
    if (!isValidDate) return setError('Birthday must be YYYY-MM-DD');

    const age = calculateAge(birthday);
    if (age < 0 || age > 120) return setError('Enter a valid birthday');

    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        fullName,
        username,
        birthday,
        age,
        email: user.email,
      });

      console.log('✅ Account created and Firestore doc saved:', user.uid);
      navigate('/');
    } catch (e) {
      console.error('❌ Account creation error:', e.message);
      setError(e.message || 'Account creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2>Create Account</h2>
      <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input type="text" placeholder="PSN Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="text" placeholder="Birthday (YYYY-MM-DD)" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <button onClick={handleSignUp} disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
      <p>Already have an account? <span className="link" onClick={() => navigate('/signin')}>Sign In</span></p>
    </div>
  );
}
