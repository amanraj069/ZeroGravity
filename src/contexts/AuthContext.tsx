"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_ENDPOINTS, apiCall } from "@/config/api";

interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "admin";
  subscription: "basic" | "pro";
  isActive: boolean;
  isVerified: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userId: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
    requiresVerification?: boolean;
    email?: string;
  }>;
  logout: () => Promise<void>;
  signup: (
    userData: SignupData
  ) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (
    credential: string
  ) => Promise<{ success: boolean; message: string }>;
  checkSession: () => Promise<void>;
  sendOtp: (
    userData: SignupData
  ) => Promise<{ success: boolean; message: string; email?: string }>;
  verifyOtp: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; message: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; message: string }>;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to get userId from cookies (client-side)
  // const getUserIdFromCookies = (): string | null => {
  //   if (typeof window === "undefined") return null;

  //   const cookies = document.cookie.split(";");
  //   const userIdCookie = cookies.find((cookie) =>
  //     cookie.trim().startsWith("userId=")
  //   );

  //   if (userIdCookie) {
  //     return userIdCookie.split("=")[1];
  //   }

  //   return null;
  // };

  // Check session status on component mount and when needed
  const checkSession = async () => {
    try {
      setIsLoading(true);
      console.log("Checking session...");

      const response = await apiCall(API_ENDPOINTS.AUTH.SESSION_STATUS, {
        method: "GET",
      });

      const data = await response.json();
      console.log("Session check response:", data);

      if (data.success && data.isLoggedIn) {
        setUser(data.user);
        setUserId(data.userId);
        setIsLoggedIn(true);
        console.log("User logged in:", data.user);
      } else {
        setUser(null);
        setUserId(null);
        setIsLoggedIn(false);
        console.log("User not logged in");
      }
    } catch (error) {
      console.error("Session check failed:", error);
      setUser(null);
      setUserId(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    requiresVerification?: boolean;
    email?: string;
  }> => {
    try {
      console.log("Attempting login for:", email);
      const response = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        setUser(data.user);
        setUserId(data.userId);
        setIsLoggedIn(true);

        // Store token in localStorage as fallback for cookie issues
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }

        console.log("Login successful, user:", data.user);
        console.log("UserId:", data.userId);
        return { success: true, message: data.message };
      } else {
        console.log("Login failed:", data.message);
        return {
          success: false,
          message: data.message || "Login failed",
          requiresVerification: data.requiresVerification,
          email: data.email,
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          "Network error. Please check if the backend server is running.",
      };
    }
  };

  // Signup function
  const signup = async (
    userData: SignupData
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.SIGNUP, {
        method: "POST",
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setUserId(data.userId);
        setIsLoggedIn(true);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Signup failed" };
      }
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message:
          "Network error. Please check if the backend server is running.",
      };
    }
  };

  // Send OTP function
  const sendOtp = async (
    userData: SignupData
  ): Promise<{ success: boolean; message: string; email?: string }> => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.SEND_OTP, {
        method: "POST",
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message, email: data.email };
      } else {
        return {
          success: false,
          message: data.message || "Failed to send OTP",
        };
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        message:
          "Network error. Please check if the backend server is running.",
      };
    }
  };

  // Verify OTP function
  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setUserId(data.userId);
        setIsLoggedIn(true);

        // Store token in localStorage as fallback for cookie issues
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }

        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          message: data.message || "OTP verification failed",
        };
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      return {
        success: false,
        message:
          "Network error. Please check if the backend server is running.",
      };
    }
  };

  // Resend OTP function
  const resendOtp = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.RESEND_OTP, {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          message: data.message || "Failed to resend OTP",
        };
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      return {
        success: false,
        message:
          "Network error. Please check if the backend server is running.",
      };
    }
  };

  // Google OAuth login function
  const loginWithGoogle = async (
    credential: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Attempting Google login");
      const response = await apiCall(API_ENDPOINTS.AUTH.GOOGLE, {
        method: "POST",
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();
      console.log("Google login response:", data);

      if (data.success) {
        setUser(data.user);
        setUserId(data.userId);
        setIsLoggedIn(true);

        // Store token in localStorage as fallback for cookie issues
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }

        console.log("Google login successful, user:", data.user);
        return { success: true, message: data.message };
      } else {
        console.log("Google login failed:", data.message);
        return {
          success: false,
          message: data.message || "Google login failed",
        };
      }
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        message:
          "Network error. Please check if the backend server is running.",
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setUserId(null);
      setIsLoggedIn(false);

      // Clear localStorage token
      localStorage.removeItem("authToken");
    }
  };

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Optional: Set up periodic session checking
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(checkSession, 5 * 60 * 1000); // Check every 5 minutes
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const value: AuthContextType = {
    user,
    userId,
    isLoggedIn,
    isLoading,
    setUser,
    login,
    logout,
    signup,
    loginWithGoogle,
    checkSession,
    sendOtp,
    verifyOtp,
    resendOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
