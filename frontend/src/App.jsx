import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from "./page/Toast";
import { AuthProvider, useAuth } from "./page/context/AuthContext";

import LandingPage  from "./page/LandingPage";
import SignIn       from './page/SignIn.jsx';
import SignUp       from './page/SignUp.jsx';
import Dashboard    from './page/Dashboard.jsx';
import DogBreeds    from './page/DogBreeds.jsx';
import DogSkinDisease from './page/DogSkinDisease.jsx';
import DogScanner   from './page/DogScanner.jsx';

const AppRoutes = () => {
  const { user } = useAuth(); // ✅ single source of truth — no more prop drilling

  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/"       element={<LandingPage />} />

      {/* AUTH — redirect if already logged in */}
      <Route path="/signup" element={!user ? <SignUp />  : <Navigate to="/dashboard" replace />} />
      <Route path="/signin" element={!user ? <SignIn />  : <Navigate to="/dashboard" replace />} />

      {/* PROTECTED — redirect if not logged in */}
      <Route path="/dashboard"  element={user ? <Dashboard  user={user} /> : <Navigate to="/signin" replace />} />
      <Route path="/dogbreeds"  element={user ? <DogBreeds  user={user} /> : <Navigate to="/signin" replace />} />
      <Route path="/dogskindisease"  element={user ? <DogSkinDisease  user={user} /> : <Navigate to="/signin" replace />} />
      <Route path="/dogscanner" element={user ? <DogScanner user={user} /> : <Navigate to="/signin" replace />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;