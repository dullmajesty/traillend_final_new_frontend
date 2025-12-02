// app/context/NotificationContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const API_URL = "http://192.168.1.8:8000"; //  your backend IP

  // Load both tokens from storage
  useEffect(() => {
    const loadTokens = async () => {
      const access = await AsyncStorage.getItem("access_token");
      const refresh = await AsyncStorage.getItem("refresh_token");
      if (access) setAccessToken(access);
      if (refresh) setRefreshToken(refresh);
    };
    loadTokens();
  }, []);

  // Helper: refresh access token if expired
  const refreshAccessToken = async () => {
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const data = await res.json();

      if (data.access) {
        await AsyncStorage.setItem("access_token", data.access);
        setAccessToken(data.access);
        return true;
      } else {
        console.warn("⚠️ Failed to refresh token:", data);
        return false;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  //  Fetch notifications with token refresh support
  const fetchNotifications = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      // If token expired, try to refresh
      if (res.status === 401) {
        console.warn("⚠️ Token expired. Refreshing...");
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return fetchNotifications(); // retry
        }
      }

      const data = await res.json();
      // 🚫 If backend says restricted, trigger lock event
      if (data.restriction === true) {
        setNotifications([]);
        await AsyncStorage.clear();
        return;
      }
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        console.warn("Failed to fetch notifications:", data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id) => {
    if (!accessToken) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      await fetch(`${API_URL}/api/notifications/${id}/read/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  //  Auto-refresh every 15s
  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        markAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
