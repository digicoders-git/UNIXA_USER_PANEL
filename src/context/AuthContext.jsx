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
    const savedUser = localStorage.getItem("userData");
    const savedTokenData = localStorage.getItem("userToken");

    if (savedUser && savedTokenData) {
      try {
        const user = JSON.parse(savedUser);
        const tokenData = JSON.parse(savedTokenData);
        
        // Check if token has expired
        if (Date.now() > tokenData.expiresAt) {
          localStorage.removeItem("userData");
          localStorage.removeItem("userToken");
          setLoading(false);
          return;
        }
        
        setUser(user);
        setToken(tokenData.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${tokenData.token}`;
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

      const tokenData = {
        token: userToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      };

      setUser(userData);
      setToken(userToken);

      localStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("userToken", JSON.stringify(tokenData));
      api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      return data;
    } catch (error) {
       throw error.response?.data?.message || "Login failed";
    }
  };

  const register = async (userData) => {
     try {
       const { data } = await api.post("/users/register", userData);
       if (data.token) {
           const tokenData = {
             token: data.token,
             expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
           };
           setUser(data.user);
           setToken(data.token);
           localStorage.setItem("userData", JSON.stringify(data.user));
           localStorage.setItem("userToken", JSON.stringify(tokenData));
           api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
       }
       return data;
     } catch (error) {
        throw error.response?.data?.message || "Registration failed";
     }
  };

  const loginWithToken = async (receivedToken) => {
    try {
      // Clear any existing session first
      localStorage.removeItem("userData");
      localStorage.removeItem("userToken");
      
      const tokenData = {
        token: receivedToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      };
      
      setToken(receivedToken);
      localStorage.setItem("userToken", JSON.stringify(tokenData));
      
      // Set token in API headers before making request
      api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
      
      // Fetch user profile to ensure token is valid and get user data
      const { data } = await api.get("/users/profile");
      setUser(data.user);
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      logout();
      throw "Invalid or expired session";
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("userToken");
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem("userData", JSON.stringify(updatedData));
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
