import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// On définit l'URL en dur pour être certain de taper au bon endroit
const API_URL = "https://rafygold-app.onrender.com";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("rafy_token"));
  const [loading, setLoading] = useState(true);

  // Instance API simplifiée
  const api = axios.create({
    baseURL: API_URL,
  });

  // Ajouter le token dynamiquement à chaque requête
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
      } catch (error) {
        console.error("Token invalide");
        localStorage.removeItem("rafy_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (email, password) => {
    // On utilise axios direct pour le login pour éviter les headers vides
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    
    // 1. Stockage physique
    localStorage.setItem("rafy_token", access_token);
    
    // 2. Mise à jour des états (déclenche isAuthenticated dans App.js)
    setToken(access_token);
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("rafy_token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user, // C'est cette valeur que App.js surveille
    login,
    logout,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};