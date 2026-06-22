/** GamePlay.jsx — Execution Phase: step-by-step display, one segment at a time **/
// Step-by-step display of route execution.

import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  ProgressBar,
} from "react-bootstrap";
import { useNavigate, useLocation, Navigate } from "react-router";

function GamePlay() {
  const navigate = useNavigate();
  const location = useLocation();

  // Data comes from state (navigate from PlanRoute)
  const gameState = location.state;
  const result = gameState ? gameState.result : null;
  const startStation = gameState ? gameState.startStation : null;
  const endStation = gameState ? gameState.endStation : null;

  // Index of the current step
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // If we do not have state, redirect to /game
  if (!result || !result.valid) {
    return <Navigate to="/game" replace />;
  }

  const { startingCoins, steps } = result;

  // Handler: advance to next step
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // Handler: navigate to Result Phase
  const handleSeeResult = () => {
    navigate("/game/result", {
      state: {
        gameId: gameState.gameId,
        startStation,
        endStation,
        result,
      },
      replace: true,
    });
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <Container>
      <h2 className="mb-3">🚂 Execution Phase</h2>

      {/* General progress */}
      <ProgressBar
        now={progress}
        label={`Step ${currentStepIndex + 1} / ${steps.length}`}
        className="mb-3"
        variant="info"
      />

      {/* Start/end info + starting coins */}
      <Alert variant="secondary" className="mb-3">
        <Row>
          <Col>
            <strong>🚩 Start:</strong> {startStation.name}
          </Col>
          <Col>
            <strong>🏁 Destination:</strong> {endStation.name}
          </Col>
          <Col xs="auto">
            <strong>💰 Starting Coins:</strong> {startingCoins}
          </Col>
        </Row>
      </Alert>

      {/* Current step — segment + event + score */}
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header as="h5" className="text-center">
              Step {currentStepIndex + 1} of {steps.length}
            </Card.Header>
            <Card.Body className="text-center">
              {/* Traversed segment */}
              <h4>
                {currentStep.segment.from}{" "}
                <span className="text-muted">→</span>{" "}
                {currentStep.segment.to}
              </h4>

              <hr />

              {/* Random event */}
              <Card
                className="mb-3"
                bg={currentStep.event.effect >= 0 ? "light" : "light"}
                border={currentStep.event.effect >= 0 ? "success" : "danger"}
              >
                <Card.Body>
                  <Card.Title>
                    {currentStep.event.effect >= 0 ? "🍀" : "⚡"} Event
                  </Card.Title>
                  <Card.Text className="fs-5">
                    {currentStep.event.description}
                  </Card.Text>
                  <Badge
                    bg={currentStep.event.effect >= 0 ? "success" : "danger"}
                    className="fs-5 p-2"
                  >
                    {currentStep.event.effect >= 0 ? "+" : ""}
                    {currentStep.event.effect} coins
                  </Badge>
                </Card.Body>
              </Card>

              {/* Current score */}
              <h3>
                💰 Coins:{" "}
                <Badge bg="primary" className="fs-4 p-2">
                  {currentStep.coinsAfter}
                </Badge>
              </h3>
            </Card.Body>
            <Card.Footer className="text-center">
              {isLastStep ? (
                <Button variant="success" size="lg" onClick={handleSeeResult}>
                  🏆 See Final Result
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={handleNextStep}>
                  Next Step →
                </Button>
              )}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default GamePlay;
