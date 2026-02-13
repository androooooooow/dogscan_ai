import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/axios';

import SignIn from './page/SignIn.jsx';
import SignUp from './page/SignUp.jsx';
import Dashboard from './page/Dashboard.jsx';
import DogBreeds from './page/DogBreeds.jsx';
import DogScanner from './page/DogScanner.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data);
      } catch (err) {
        console.log("Not authenticated");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/signin" replace />} 
        />
        
        <Route 
          path="/signup" 
          element={!user ? <SignUp setUser={setUser} /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/signin" 
          element={!user ? <SignIn setUser={setUser} /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dogbreeds" 
          element={user ? <DogBreeds user={user} setUser={setUser} /> : <Navigate to="/signin" replace />} 
        />

        <Route
          path="/dogscanner"
          element={<DogScanner user={user} setUser={setUser} />}
        />

        
        {/* IMPORTANT: Pass user and setUser to Dashboard */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/signin" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;