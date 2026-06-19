/** MetroMap.jsx — Setup Phase: vizualizarea rețelei de metrou **/
// Pattern: week09/qa-client — useEffect + fetch + Table din react-bootstrap
// Conform PDF: "The player sees the network map with all stations, their connections, and the lines."

import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Badge, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router";
import { getNetwork, startGame } from "../api/api";

function MetroMap() {
  const [network, setNetwork] = useState(null);   // { lines, stations, stationLines, segments }
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // La mount: încarcă rețeaua de metrou de la server (pattern week09: useEffect + fetch)
  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const data = await getNetwork();
        setNetwork(data);
      } catch (err) {
        setErrorMsg(err.message);
      }
      setLoading(false);
    };
    fetchNetwork();
  }, []);

  // Handler: "Start New Game" — creează un joc nou pe server, apoi navighează la Planning Phase
  const handleStartGame = async () => {
    setErrorMsg("");
    try {
      const game = await startGame();
      // Navighez la Planning Phase, pasând datele jocului prin state (pattern week09: useNavigate + state)
      navigate("/game/plan", {
        state: {
          gameId: game.gameId,
          startStation: game.startStation,
          endStation: game.endStation,
        },
      });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading metro network...</p>
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

  const { lines, stations, stationLines, segments } = network;

  // Construim o mapă: stationId → station name (pentru afișare)
  const stationMap = {};
  for (const st of stations) {
    stationMap[st.id] = st.name;
  }

  // Construim o mapă: lineId → line object (pentru culori)
  const lineMap = {};
  for (const line of lines) {
    lineMap[line.id] = line;
  }

  // Construim o mapă: stationId → Set de lineId-uri (pentru a marca stațiile de schimb)
  const stationLineMap = {};
  for (const sl of stationLines) {
    if (!stationLineMap[sl.stationId]) stationLineMap[sl.stationId] = new Set();
    stationLineMap[sl.stationId].add(sl.lineId);
  }

  // Pentru fiecare linie, grupăm stațiile în ordine (din stationLines, sortat după "order")
  const lineStations = {};
  for (const line of lines) {
    const lineStationList = stationLines
      .filter((sl) => sl.lineId === line.id)
      .sort((a, b) => a.order - b.order)
      .map((sl) => ({
        id: sl.stationId,
        name: stationMap[sl.stationId],
        isInterchange: (stationLineMap[sl.stationId] || new Set()).size > 1,
      }));
    lineStations[line.id] = lineStationList;
  }

  return (
    <Container>
      <h2 className="mb-3">🚇 Metro Network — Setup Phase</h2>
      <p className="text-muted">
        Explore the metro network below. When you are ready, press{" "}
        <strong>"Start New Game"</strong> to begin.
      </p>

      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      )}

      {/* Tabel cu liniile și stațiile — conform PDF: "all stations, their connections, and the lines" */}
      <Row>
        <Col>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Line</th>
                <th>Stations (in order)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <Badge
                      bg=""
                      style={{ backgroundColor: line.color, fontSize: "0.9rem" }}
                    >
                      {line.name}
                    </Badge>
                  </td>
                  <td>
                    {lineStations[line.id]
                      ? lineStations[line.id].map((st, idx) => (
                          <span key={st.id}>
                            {idx > 0 && " → "}
                            {st.isInterchange ? (
                              <strong title="Interchange station">{st.name} ⬥</strong>
                            ) : (
                              st.name
                            )}
                          </span>
                        ))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Legendă stații de schimb */}
      <p className="text-muted mb-4">
        <strong>⬥</strong> = Interchange station (served by multiple lines)
      </p>

      {/* Tabel cu toate segmentele — afișează conexiunile */}
      <h5 className="mt-3 mb-2">All Segments (connections)</h5>
      <Row>
        <Col md={8}>
          <Table bordered size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>From</th>
                <th>To</th>
                <th>Line</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, idx) => (
                <tr key={seg.id}>
                  <td>{idx + 1}</td>
                  <td>{stationMap[seg.station1Id]}</td>
                  <td>{stationMap[seg.station2Id]}</td>
                  <td>
                    <Badge
                      bg=""
                      style={{
                        backgroundColor: lineMap[seg.lineId]
                          ? lineMap[seg.lineId].color
                          : "#666",
                      }}
                    >
                      {lineMap[seg.lineId] ? lineMap[seg.lineId].name : "?"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Buton Start New Game */}
      <div className="text-center mt-4 mb-5">
        <Button variant="success" size="lg" onClick={handleStartGame}>
          🎮 Start New Game
        </Button>
      </div>
    </Container>
  );
}

export default MetroMap;
