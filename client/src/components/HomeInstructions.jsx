/** HomeInstructions.jsx — Public page with game instructions **/
// Accessible to everyone (anonymous + authenticated)
// Does NOT display the metro map

import { useContext } from "react";
import { Container, Card, Button, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router";
import UserContext from "../contexts/UserContext";

function HomeInstructions() {
  const user = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <Container>
      <h1 className="text-center mb-4">🚇 Last Race</h1>
      <p className="text-center text-muted mb-4">
        A single-player metro route planning game. Plan your route, ride the
        train, and collect coins!
      </p>

      <Card className="mb-4">
        <Card.Header as="h5">How to Play</Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>1. Setup Phase:</strong> View the metro network map with
              all lines, stations, and connections. Press{" "}
              <em>&quot;Start New Game&quot;</em> to begin — you will have a randomly
              assigned start station and a destination.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>2. Planning Phase (90 seconds):</strong> Build a route
              from your start to your destination by selecting segments one by
              one. You cannot see which line each segment belongs to! You have to
              submit your route before the timer runs out.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>3. Execution Phase:</strong> If your route is valid, ride
              through it step by step by pressing the{" "}
              <em>&quot;Next Step&quot;</em> button. At each segment, a random event
              will affect your coin balance (starting at 20 coins). Events can
              add or subtract coins.
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>4. Result Phase:</strong> See your final score. If your
              route was invalid, you lose all coins (score = 0). If your coins
              drop below 0 during the ride, your score is set to 0.
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header as="h5">Rules</Card.Header>
        <Card.Body>
          <ul>
            <li>Your route must start at the assigned start station and end at the destination.</li>
            <li>Each consecutive segment must be connected (share a station).</li>
            <li>You can only change metro lines at <strong>interchange stations</strong> (stations on 2+ lines).</li>
            <li>No segment can be used more than once in a route.</li>
            <li>You start with <strong>20 coins</strong>. Events along the way add or subtract coins.</li>
            <li>Final score: <code>max(0, coins)</code> — your score cannot be negative.</li>
          </ul>
        </Card.Body>
      </Card>

      {user ? (
        <div className="text-center">
          <Button variant="success" size="lg" onClick={() => navigate("/game")}>
            🎮 Go to Game
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted mb-3">Log in to start playing!</p>
          <Button variant="primary" size="lg" onClick={() => navigate("/login")}>
            Login to Play
          </Button>
        </div>
      )}
    </Container>
  );
}

export default HomeInstructions;
