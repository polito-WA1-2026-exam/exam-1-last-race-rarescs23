/** App.jsx — Main component with Routes and global state **/

import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import UserContext from "./contexts/UserContext";
import { doLogin as apiLogin, doLogout as apiLogout, checkSession } from "./api/auth";

import { MainLayout, NotFoundLayout, ProtectedRoute } from "./components/PageLayout";
import LoginForm from "./components/LoginForm";
import HomeInstructions from "./components/HomeInstructions";
import MetroMap from "./components/MetroMap";
import PlanRoute from "./components/PlanRoute";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: check if the user has an active session (cookie-based)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await checkSession();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Login function — called by LoginForm
  const doLogin = async (credentials) => {
    const loggedUser = await apiLogin(credentials);
    setUser(loggedUser);
  };

  // Logout function — called by Header
  const doLogout = async () => {
    await apiLogout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <Routes>
        <Route element={<MainLayout doLogout={doLogout} />}>
          {/* Public Routes — accessible also to anonymous users */}
          <Route path="/" element={<HomeInstructions />} />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/game" replace /> : <LoginForm doLogin={doLogin} />
            }
          />

          {/* Protected Routes — only authenticated users */}
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <MetroMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/plan"
            element={
              <ProtectedRoute>
                <PlanRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/execution"
            element={
              <ProtectedRoute>
                <h2>Execution Phase</h2>
                <p className="text-muted">Coming in next commit...</p>
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/result"
            element={
              <ProtectedRoute>
                <h2>Result Phase</h2>
                <p className="text-muted">Coming in next commit...</p>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute>
                <h2>Ranking</h2>
                <p className="text-muted">Coming in next commit...</p>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFoundLayout />} />
        </Route>
      </Routes>
    </UserContext.Provider>
  );
}

export default App;
