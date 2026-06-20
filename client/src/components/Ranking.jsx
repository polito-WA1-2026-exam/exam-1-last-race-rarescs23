/** Ranking.jsx — General Leaderboard: best score per user **/

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { getRanking } from "../api/api";

function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // On mount: load ranking from the server
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await getRanking();
        setRanking(data);
      } catch (err) {
        setErrorMsg(err.message);
      }
      setLoading(false);
    };
    fetchRanking();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading ranking...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">🏅 Leaderboard</h2>
      <p className="text-muted">
        Best score per player, sorted by highest score. Only players who have
        completed at least one game appear here.
      </p>

      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      )}

      {ranking.length === 0 ? (
        <Alert variant="info">
          No completed games yet. Be the first to play!
        </Alert>
      ) : (
        <Row className="justify-content-center">
          <Col md={8}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Best Score</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry) => (
                  <tr key={entry.userId}>
                    <td>
                      {entry.rank === 1
                        ? "🥇"
                        : entry.rank === 2
                        ? "🥈"
                        : entry.rank === 3
                        ? "🥉"
                        : entry.rank}
                    </td>
                    <td>{entry.name}</td>
                    <td>
                      <Badge
                        bg={entry.bestScore > 0 ? "success" : "secondary"}
                        className="fs-6"
                      >
                        💰 {entry.bestScore} coins
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Ranking;
