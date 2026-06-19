/** api/auth.js — Client-side authentication functions **/

const SERVER_URL = "http://localhost:3001";

/**
 * Login: sends email + password to the server.
 * Returns the user object if authentication is successful,
 * otherwise throws an error with the message received from the server.
 */
export const doLogin = async (credentials) => {
  const response = await fetch(`${SERVER_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errObj = await response.json();
    throw new Error(errObj.error || "Login failed");
  }
};

/**
 * Logout: destroys the current session on the server.
 */
export const doLogout = async () => {
  const response = await fetch(`${SERVER_URL}/api/sessions/current`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const errObj = await response.json();
    throw new Error(errObj.error || "Logout failed");
  }
};

/**
 * Checks if the user has an active session (on page refresh).
 * Returns the user object if a session exists, null otherwise.
 */
export const checkSession = async () => {
  const response = await fetch(`${SERVER_URL}/api/sessions/current`, {
    credentials: "include",
  });

  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    return null;
  }
};
