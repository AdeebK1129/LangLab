// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { useAuth, useUserProfile } from "@/auth/AuthUserProvider";
import Navbar01Page from "@/components/navbar-01/navbar-01";
import Hero05 from "@/components/hero-05/hero-05";
import SignupPage from "./app/signup/page";
import LoginPage from "./app/login/page";
import ChatPage from "@/pages/ChatPage";

function InitProfile() {
  // this hook will grab the ID token and POST /api/users/profile
  // (now proxied to :8080) as soon as we have a logged-in user
  useUserProfile();
  return null;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      {/* kick off the profile‐upsert call */}
      <InitProfile />

      {/* show navbar on every screen */}
      <Navbar01Page />

      {/* swap out content based on the URL */}
      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <Hero05 />
            ) : (
              <div className="p-8 text-center">
                Welcome back! More content coming soon.
              </div>
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </>
  );
}
