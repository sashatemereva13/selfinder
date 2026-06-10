import { createContext, useCallback, useContext, useState } from "react";
import { apiUrl } from "../api/baseUrl";

const AuthContext = createContext(null);

const API = apiUrl("/auth");

function loadStored() {
  try {
    const raw = localStorage.getItem("sf_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStored);

  function persist(data) {
    setAuth(data);
    if (data) localStorage.setItem("sf_auth", JSON.stringify(data));
    else localStorage.removeItem("sf_auth");
  }

  const register = useCallback(async (username, password, privacyPolicyAccepted) => {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, privacyPolicyAccepted }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    persist(data);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    persist(data);
  }, []);

  const logout = useCallback(() => persist(null), []);

  return (
    <AuthContext.Provider
      value={{
        user: auth ? { username: auth.username, role: auth.role } : null,
        token: auth?.token ?? null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
