/** GameResult.jsx — Result Phase: final score + continuation options **/
// Display of the final game result.

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Badge,
} from "react-bootstrap";
import { useNavigate, useLocation, Navigate } from "react-router";

function GameResult() {
  const navigate = useNavigate();
  const location = useLocation();

  // Data comes from state (navigate from PlanRoute or GamePlay)
  const gameState = location.state;
  const result = gameState ? gameState.result : null;
  const startStation = gameState ? gameState.startStation : null;
  const endStation = gameState ? gameState.endStation : null;

  // If we do not have state, redirect to /game
  if (!result) {
    return <Navigate to="/game" replace />;
  }

  const { valid, reason, startingCoins, steps, finalScore } = result;

  return (
    <Container>
      <Row className="justify-content-center mt-3">
        <Col md={8}>
          <h2 className="text-center mb-4">🏆 Game Result</h2>

          {/* Message if the route was invalid */}
          {!valid && (
            <Alert variant="danger" className="text-center">
              <Alert.Heading>❌ Invalid Route</Alert.Heading>
              <p>{reason || "Your route was invalid or incomplete."}</p>
              <p className="mb-0">
                The Execution Phase was skipped. You lost all your coins.
              </p>
            </Alert>
          )}

          {/* Card with the final score */}
          <Card className="text-center mb-4">
            <Card.Header as="h5">Final Score</Card.Header>
            <Card.Body>
              {/* Route info */}
              <p className="text-muted">
                Route: <strong>{startStation ? startStation.name : "?"}</strong>
                {" → "}
                <strong>{endStation ? endStation.name : "?"}</strong>
              </p>

              {/* Large final score */}
              <h1>
                <Badge
                  bg={finalScore > 0 ? "success" : "secondary"}
                  className="p-3"
                  style={{ fontSize: "2rem" }}
                >
                  💰 {finalScore} coins
                </Badge>
              </h1>

              {/* Additional details */}
              <p className="text-muted mt-3">
                Starting coins: {startingCoins} | Segments traveled:{" "}
                {steps ? steps.length : 0}
              </p>

              {finalScore === 0 && valid && (
                <Alert variant="warning" className="mt-3 mb-0">
                  Your coin balance dropped below zero during the ride. Final
                  score capped at 0.
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Navigation buttons */}
          <Row className="text-center">
            <Col>
              <Button
                variant="success"
                size="lg"
                className="me-3"
                onClick={() => navigate("/game")}
              >
                🎮 Play Again
              </Button>
              <Button
                variant="outline-primary"
                size="lg"
                onClick={() => navigate("/ranking")}
              >
                🏅 View Ranking
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default GameResult;
