// frontend/src/auth/AuthUserProvider.tsx
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebase";

type AuthContextType = { user: User | null };

const AuthUserContext = createContext<AuthContextType>({ user: null });

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthUserContext.Provider value={{ user }}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthUserContext);
  if (ctx === undefined)
    throw new Error("useAuth must be used inside AuthUserProvider");
  return ctx;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    uid: string;
    name: string | null;
    email: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    user.getIdToken().then((idToken) => {
      fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch user profile");
          return res.json();
        })
        .then((data) => setProfile(data))
        .catch(console.error);
    });
  }, [user]);

  return profile;
}
