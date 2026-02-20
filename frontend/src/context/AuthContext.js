import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// L'URL de base sans le /auth/login à la fin
const API_URL = "https://rafygold-app.onrender.com/api/v1";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({ baseURL: API_URL });

  api.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem("rafy_token");
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  });

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("rafy_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem("rafy_token");
      } finally {
        setLoading(false);
      }
    };
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    // On ajoute /auth/login seulement ici
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem("rafy_token", access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("rafy_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};
