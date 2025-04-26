// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/auth/AuthUserProvider";
import Navbar01Page from "@/components/navbar-01/navbar-01";
import Hero05 from "@/components/hero-05/hero-05";
import SignupPage from "./app/signup/page";

function App() {
  const { user } = useAuth();

  return (
    <>
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
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </>
  );
}

export default App;
