import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// On définit l'URL de base incluant le préfixe de l'API
const API_URL = "https://rafygold-app.onrender.com/api/v1";

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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Instance API configurée avec l'URL de Render
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
        setToken(storedToken);
      } catch (error) {
        console.error("Token invalide ou serveur injoignable");
        localStorage.removeItem("rafy_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    // Appel vers https://rafygold-app.onrender.com/api/v1/auth/login
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    // On récupère les données (vérifie que ton backend renvoie bien access_token et user)
    const { access_token, user: userData } = response.data;
    
    // Stockage et mise à jour des états
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

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
