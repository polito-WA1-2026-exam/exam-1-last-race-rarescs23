/** PlanRoute.jsx — Planning Phase: select segments, 90s timer **/

import { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Alert,
  Badge,
  ListGroup,
  Card,
} from "react-bootstrap";
import { useNavigate, useLocation, Navigate } from "react-router";
import { getSegments, submitRoute } from "../api/api";

const TIMER_SECONDS = 90;

function PlanRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  // Game data comes from state (navigate from MetroMap)
  const gameState = location.state;
  const gameId = gameState ? gameState.gameId : null;
  const startStation = gameState ? gameState.startStation : null;
  const endStation = gameState ? gameState.endStation : null;

  // Main states
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRoute, setSelectedRoute] = useState([]); // array de segmentId-uri
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [submitted, setSubmitted] = useState(false);

  // Ref to access the current route from the timer callback
  const selectedRouteRef = useRef(selectedRoute);
  const submittedRef = useRef(submitted);

  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
  }, [selectedRoute]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  // Handler: submits the route to the server
  // Declared BEFORE the timer that calls it
  const handleSubmitRoute = async (routeToSubmit) => {
    if (submittedRef.current) return; // avoid double-submit
    setSubmitted(true);
    submittedRef.current = true;

    try {
      const result = await submitRoute(gameId, routeToSubmit || []);

      if (result.valid) {
        // Valid route -> Execution Phase (step by step)
        navigate("/game/execution", {
          state: {
            gameId,
            startStation,
            endStation,
            result, // { valid, startingCoins, steps, finalScore }
          },
          replace: true,
        });
      } else {
        // Invalid route -> Result Phase directly (skip Execution Phase)
        // If the route is invalid or incomplete, the execution phase is skipped
        navigate("/game/result", {
          state: {
            gameId,
            startStation,
            endStation,
            result, // { valid: false, reason, startingCoins, steps: [], finalScore: 0 }
          },
          replace: true,
        });
      }
    } catch (err) {
      setErrorMsg(err.message);
      setSubmitted(false);
      submittedRef.current = false;
    }
  };

  // On mount: load stations + segments WITHOUT lineId
  // We use /api/metro/segments which does NOT include lineId
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await getSegments();
        setNetwork(data);
      } catch (err) {
        setErrorMsg(err.message);
      }
      setLoading(false);
    };
    fetchSegments();
  }, []);

  // Timer countdown
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          // Auto-submit when time expires
          if (!submittedRef.current) {
            handleSubmitRoute(selectedRouteRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler: add segment to route
  const handleAddSegment = (segId) => {
    setSelectedRoute((prev) => [...prev, segId]);
  };

  // Handler: remove last segment from route (undo)
  const handleRemoveLast = () => {
    setSelectedRoute((prev) => prev.slice(0, -1));
  };

  // Handler: clear the route
  const handleClearRoute = () => {
    setSelectedRoute([]);
  };

  // If we do not have state (direct URL access), redirect to /game
  // If we do not have state, redirect
  if (!gameId) {
    return <Navigate to="/game" replace />;
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <p>Loading network data...</p>
      </Container>
    );
  }

  if (!network) {
    return (
      <Container className="mt-3">
        <Alert variant="danger">{errorMsg || "Failed to load network."}</Alert>
      </Container>
    );
  }

  const { stations, segments, stationLines } = network;

  // Map: stationId -> station name
  const stationMap = {};
  for (const st of stations) {
    stationMap[st.id] = st.name;
  }

  // Map: stationId -> Set of lineIds (to identify interchange stations)
  const stationLineMap = {};
  for (const sl of stationLines) {
    if (!stationLineMap[sl.stationId]) stationLineMap[sl.stationId] = new Set();
    stationLineMap[sl.stationId].add(sl.lineId);
  }

  // Already selected segments (Set for quick check)
  const usedSegmentIds = new Set(selectedRoute);

  // Determine the current station (the last one in the route)
  // This helps with highlighting the available segments
  let currentStationId = startStation.id;
  for (const segId of selectedRoute) {
    const seg = segments.find((s) => s.id === segId);
    if (seg) {
      currentStationId =
        seg.station1Id === currentStationId ? seg.station2Id : seg.station1Id;
    }
  }

  // Timer formatting (mm:ss)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const timerVariant = timeLeft <= 10 ? "danger" : timeLeft <= 30 ? "warning" : "info";

  return (
    <Container fluid>
      {/* Timer + Start/End info */}
      <Row className="mb-3 align-items-center">
        <Col>
          <h2>📋 Planning Phase</h2>
        </Col>
        <Col xs="auto">
          <h3>
            <Badge bg={timerVariant} className="p-2">
              ⏱ {timerDisplay}
            </Badge>
          </h3>
        </Col>
      </Row>

      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      )}

      {/* Start and Destination Station */}
      <Alert variant="primary" className="mb-3">
        <Row>
          <Col>
            <strong>🚩 Start:</strong>{" "}
            <Badge bg="success" className="fs-6">{startStation.name}</Badge>
          </Col>
          <Col>
            <strong>🏁 Destination:</strong>{" "}
            <Badge bg="danger" className="fs-6">{endStation.name}</Badge>
          </Col>
        </Row>
      </Alert>

      <Row>
        {/* Left column: stations list (WITHOUT lines) + built route */}
        <Col md={4}>
          {/* Stations list without lines */}
          <Card className="mb-3">
            <Card.Header as="h6">🗺 Stations (no lines shown)</Card.Header>
            <Card.Body style={{ maxHeight: "250px", overflowY: "auto" }}>
              <ListGroup variant="flush">
                {stations.map((st) => {
                  const isInterchange = (stationLineMap[st.id] || new Set()).size > 1;
                  const isStart = st.id === startStation.id;
                  const isEnd = st.id === endStation.id;
                  const isCurrent = st.id === currentStationId;

                  return (
                    <ListGroup.Item
                      key={st.id}
                      className={`py-1 ${isCurrent ? "fw-bold" : ""}`}
                    >
                      {isStart && "🚩 "}
                      {isEnd && "🏁 "}
                      {st.name}
                      {isInterchange && (
                        <Badge bg="secondary" className="ms-1" pill>⬥</Badge>
                      )}
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Route built by user */}
          <Card className="mb-3">
            <Card.Header as="h6">
              📍 Your Route ({selectedRoute.length} segment{selectedRoute.length !== 1 ? "s" : ""})
            </Card.Header>
            <Card.Body style={{ maxHeight: "250px", overflowY: "auto" }}>
              {selectedRoute.length === 0 ? (
                <p className="text-muted mb-0">
                  No segments selected yet. Click a segment from the list to add it.
                </p>
              ) : (
                <ListGroup variant="flush" as="ol" numbered>
                  {selectedRoute.map((segId, idx) => {
                    const seg = segments.find((s) => s.id === segId);
                    if (!seg) return null;
                    return (
                      <ListGroup.Item key={idx} className="py-1">
                        {stationMap[seg.station1Id]} — {stationMap[seg.station2Id]}
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </Card.Body>
            <Card.Footer>
              <Button
                variant="outline-warning"
                size="sm"
                onClick={handleRemoveLast}
                disabled={selectedRoute.length === 0 || submitted}
                className="me-2"
              >
                ↩ Undo Last
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleClearRoute}
                disabled={selectedRoute.length === 0 || submitted}
              >
                ✕ Clear All
              </Button>
            </Card.Footer>
          </Card>

          {/* Submit button */}
          <Button
            variant="success"
            size="lg"
            className="w-100 mb-3"
            onClick={() => handleSubmitRoute(selectedRoute)}
            disabled={submitted}
          >
            {submitted ? "Submitting..." : "✅ Submit Route"}
          </Button>
        </Col>

        {/* Right column: list of available segments */}
        {/* List of available segments */}
        <Col md={8}>
          <Card>
            <Card.Header as="h6">
              📦 Available Segments (click to add to route)
            </Card.Header>
            <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
              <Table bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Station A</th>
                    <th>Station B</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((seg) => {
                    const isUsed = usedSegmentIds.has(seg.id);
                    // Highlight segments connected to the current station
                    const isConnected =
                      seg.station1Id === currentStationId ||
                      seg.station2Id === currentStationId;

                    return (
                      <tr
                        key={seg.id}
                        className={
                          isUsed
                            ? "table-secondary text-decoration-line-through"
                            : isConnected
                            ? "table-success"
                            : ""
                        }
                      >
                        <td>{stationMap[seg.station1Id]}</td>
                        <td>{stationMap[seg.station2Id]}</td>
                        <td>
                          <Button
                            variant={isConnected && !isUsed ? "success" : "outline-primary"}
                            size="sm"
                            onClick={() => handleAddSegment(seg.id)}
                            disabled={isUsed || submitted}
                          >
                            {isUsed ? "Used" : "Add"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default PlanRoute;
