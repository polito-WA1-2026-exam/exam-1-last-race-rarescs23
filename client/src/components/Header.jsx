/** Header.jsx — Navbar with title + navigation + Login/Logout **/

import { useContext } from "react";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router";
import { PersonCircle, BoxArrowRight, Trophy, Controller } from "react-bootstrap-icons";
import UserContext from "../contexts/UserContext";

function Header(props) {
  const { doLogout } = props;
  const user = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await doLogout();
    navigate("/");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          🚇 Last Race
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-main" />
        <Navbar.Collapse id="navbar-main">
          <Nav className="me-auto">
            {user && (
              <>
                <Nav.Link as={Link} to="/game">
                  <Controller className="me-1" /> Game
                </Nav.Link>
                <Nav.Link as={Link} to="/ranking">
                  <Trophy className="me-1" /> Ranking
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-3">
                  <PersonCircle className="me-1" /> {user.name}
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  <BoxArrowRight className="me-1" /> Logout
                </Button>
              </>
            ) : (
              <Button variant="outline-light" size="sm" as={Link} to="/login">
                <PersonCircle className="me-1" /> Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
