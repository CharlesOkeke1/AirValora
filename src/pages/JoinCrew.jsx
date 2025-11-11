import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import '../components/Home.css';

function JoinCrew() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    psn: '',
    mic: '',
    experience: '',
    age: '',
    email: '',
    desc: '',
    role: '',
    pilotAssets: {
      miljet: false,
      shamal: false,
      nimbus: false,
      hangar: false
    },
    groundCrewAssets: {
      fighterJet: false,
      airportBus: false
    }
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCrewStatus = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setHasApplied(data.isCrew === true);
          setIsApproved(data.approved === true);
        }
      } catch (err) {
        console.error('Error fetching crew status:', err);
      }
    };

    fetchCrewStatus();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    setFormData({ ...formData, role: e.target.value });
  };

  const handleCheckboxChange = (category, field) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  const sendEmails = (formData) => {
    const serviceID = 'AVInfo';
    const templateID = 'crew_admin_notification';
    const publicKey = 'e1z8UXANJ6NDj9Kfe';

    const basePayload = {
      fullName: formData.fullName,
      email: formData.email,
      psn: formData.psn,
      mic: formData.mic,
      experience: formData.experience,
      desc: formData.desc,
      age: formData.age,
      role: formData.role,
      reply_to: 'charles.official36@gmail.com',
    };

    // 1. Send to admin
    emailjs.send(serviceID, templateID, {
      ...basePayload,
      to_email: 'charles.official36@gmail.com',
    }, publicKey).then(() => {
      console.log('✅ Admin email sent');
    }).catch((err) => {
      console.error('❌ Admin email error:', err);
    });

    // 2. Send to user
    emailjs.send(serviceID, templateID, {
      ...basePayload,
      to_email: formData.email,
    }, publicKey).then(() => {
      console.log('✅ User confirmation email sent');
    }).catch((err) => {
      console.error('❌ User confirmation error:', err);
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to apply.');
      return;
    }

    try {
      setLoading(true);

      const crewData = {
        ...formData,
        isCrew: true,
        approved: false,
        uid: user.uid,
        joinedCrewAt: serverTimestamp(),
        proofImage: 'User will submit image via email',
      };

      await setDoc(doc(db, 'users', user.uid), crewData, { merge: true });
      await setDoc(doc(db, 'crewMembers', formData.fullName), {
        uid: user.uid,
        ...crewData,
      });

      sendEmails(formData);

      alert('✅ Crew application submitted! Please check your email.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Submission Error:', err);
      alert('❌ Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-crew-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2>Join the Air Valora Crew</h2>

      {hasApplied && !isApproved ? (
        <div className="awaiting-msg">
          <p>⏳ You’ve already applied to join the crew. Please wait while we review your application.</p>
          <button className="cta-btn" disabled style={{ backgroundColor: '#ccc' }}>
            Awaiting Decision
          </button>
        </div>
      ) : hasApplied && isApproved ? (
        <div className="crew-member-msg">
          <p>🧑‍✈️ You are already a member of the Air Valora Crew!</p>
        </div>
      ) : (
        <form className="join-crew-form" onSubmit={handleSubmit}>
          <input name="fullName" type="text" placeholder="Full Name" required onChange={handleChange} />
          <input name="psn" type="text" placeholder="PSN Username" required onChange={handleChange} />
          <input name="age" type="number" placeholder="Age" required onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" required onChange={handleChange} />
          <input name="mic" type="text" placeholder="Do you have a mic? Yes/No" required onChange={handleChange} />
          <textarea name="experience" placeholder="Your flying experience in GTA Online" onChange={handleChange} />
          <textarea name="desc" placeholder="Why should we accept you?" onChange={handleChange} />

          <div className="role-selection">
            <p><strong>What role are you applying for?</strong></p>
            <label><input type="radio" name="role" value="Pilot" onChange={handleRoleChange} /> Pilot</label>
            <label><input type="radio" name="role" value="Flight Crew" onChange={handleRoleChange} /> Flight Crew</label>
            <label><input type="radio" name="role" value="Ground Crew" onChange={handleRoleChange} /> Ground Crew</label>
          </div>

          {formData.role === "Pilot" && (
            <div className="asset-checklist">
              <p><strong>Pilot Assets:</strong></p>
              <label><input type="checkbox" onChange={() => handleCheckboxChange('pilotAssets', 'miljet')} /> Miljet</label>
              <label><input type="checkbox" onChange={() => handleCheckboxChange('pilotAssets', 'shamal')} /> Shamal</label>
              <label><input type="checkbox" onChange={() => handleCheckboxChange('pilotAssets', 'nimbus')} /> Nimbus</label>
              <label><input type="checkbox" onChange={() => handleCheckboxChange('pilotAssets', 'hangar')} /> Zancudo Hangar</label>
            </div>
          )}

          {formData.role === "Ground Crew" && (
            <div className="asset-checklist">
              <p><strong>Ground Crew Assets:</strong></p>
              <label><input type="checkbox" onChange={() => handleCheckboxChange('groundCrewAssets', 'fighterJet')} /> Fighter Jet</label>
              <label><input type="checkbox" onChange={() => handleCheckboxChange('groundCrewAssets', 'airportBus')} /> Airport Shuttle Bus</label>
            </div>
          )}

          <p className="upload-instruction">
            📧 <strong>IMPORTANT:</strong> After submitting, please send your screenshot proof to <b>charles.official36@gmail.com</b> to complete your application.
          </p>

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Join Crew'}
          </button>
        </form>
      )}
    </div>
  );
}

export default JoinCrew;
