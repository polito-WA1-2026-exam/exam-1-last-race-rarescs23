/** PageLayout.jsx — Layouts: MainLayout, NotFoundLayout **/

import { Container, Alert, Button } from "react-bootstrap";
import { Outlet, useNavigate, Navigate } from "react-router";
import { useContext } from "react";
import UserContext from "../contexts/UserContext";
import Header from "./Header";

/**
 * MainLayout: header + main content (Outlet).
 * Receives doLogout as a prop for the logout button in Header.
 */
function MainLayout(props) {
  const { doLogout } = props;

  return (
    <>
      <Header doLogout={doLogout} />
      <Container fluid className="mt-3 mb-5">
        <Outlet />
      </Container>
    </>
  );
}

/**
 * NotFoundLayout: 404 page.
 */
function NotFoundLayout() {
  const navigate = useNavigate();

  return (
    <Container className="text-center mt-5">
      <h1>404</h1>
      <p className="text-muted">Page not found</p>
      <Button variant="primary" onClick={() => navigate("/")}>
        Go Home
      </Button>
    </Container>
  );
}

/**
 * ProtectedRoute: redirect to "/" if the user is not authenticated.
 */
function ProtectedRoute({ children }) {
  const user = useContext(UserContext);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export { MainLayout, NotFoundLayout, ProtectedRoute };
