import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = "http://192.168.1.8:8000"; // or your production URL

export async function authFetch(url, options = {}) {
  const access = await AsyncStorage.getItem('access_token');
  const refresh = await AsyncStorage.getItem('refresh_token');

  // First try the request with access token
  let res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
  });

  // If access token expired
  if (res.status === 401 && refresh) {
    const refreshRes = await fetch(`${API_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (refreshRes.ok) {
      const newTokens = await refreshRes.json();
      await AsyncStorage.setItem("access_token", newTokens.access);

      // Retry original request
      res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newTokens.access}`,
          "Content-Type": "application/json",
        },
      });
    } else {
      console.warn("Session expired. Logging out...");
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      return refreshRes; // return the 401 to handle logout
    }
  }

  return res;
}
