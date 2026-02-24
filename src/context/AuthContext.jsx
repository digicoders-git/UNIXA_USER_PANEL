import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

const USER_KEY = "user-data";
const TOKEN_KEY = "user-token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        console.error("Error parsing saved user data", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/users/login", { email, password });
      
      const userData = data.user;
      const userToken = data.token;

      setUser(userData);
      setToken(userToken);

      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_KEY, userToken);
      
      return data;
    } catch (error) {
       throw error.response?.data?.message || "Login failed";
    }
  };

  const register = async (userData) => {
     try {
       const { data } = await api.post("/users/register", userData);
       // Assuming register automatically logs in or requires separate login
       // Let's assume it requires separate login unless backend returns token.
       // Usually /users/register might return user and token.
       if (data.token) {
           setUser(data.user);
           setToken(data.token);
           localStorage.setItem(USER_KEY, JSON.stringify(data.user));
           localStorage.setItem(TOKEN_KEY, data.token);
       }
       return data;
     } catch (error) {
        throw error.response?.data?.message || "Registration failed";
     }
  };

  const loginWithToken = async (receivedToken) => {
    try {
      // Clear any existing session first
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      
      setToken(receivedToken);
      localStorage.setItem(TOKEN_KEY, receivedToken);
      
      // Set token in API headers before making request
      api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
      
      // Fetch user profile to ensure token is valid and get user data
      const { data } = await api.get("/users/profile");
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      logout();
      throw "Invalid or expired session";
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    // Redirect logic handled by router usually
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginWithToken,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
