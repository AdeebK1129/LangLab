import {Routes, Route} from 'react-router-dom';
import {useAuth, useUserProfile} from '@/auth/AuthUserProvider';
import Navbar01Page from '@/components/navbar-01/navbar-01';
import Hero05 from '@/components/hero-05/hero-05';
import SignupPage from '@/app/signup/page';
import LoginPage from '@/app/login/page';
import Dashboard from '@/pages/Dashboard';
import ChatPage from '@/pages/ChatPage';
import FeedbackPage from '@/pages/FeedbackPage';
import ResultsPage from '@/pages/ResultsPage';

/**
 * Component that initializes the user profile and returns null
 */
function InitProfile() {
  useUserProfile();
  return null;
}

/**
 * Main application component that handles routing
 */
export default function App() {
  const {user} = useAuth();
  return (
    <>
      <InitProfile />
      <Navbar01Page />
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Hero05 />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/chat/:mode" element={<ChatPage />} />
        <Route path="/feedback/:mode" element={<FeedbackPage />} />
        <Route path="/results/:mode" element={<ResultsPage />} />
      </Routes>
    </>
  );
}