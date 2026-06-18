/** index.js — Main Express server **/

import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { check, validationResult } from "express-validator";

import { getUser } from "./dao-users.js";
import { getNetwork, getAllSegments, getSegmentById } from "./dao-metro.js";
import {
  createGame,
  getGameById,
  completeGame,
  getRandomEvent,
  getRanking,
} from "./dao-games.js";

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(morgan("dev"));

// CORS: allow requests from Vite
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// Passport: LocalStrategy

passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await getUser(email, password);
      if (!user) {
        return done(null, false, { message: "Incorrect email or password." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { getUserById } = await import("./dao-users.js");
    const user = await getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ─── Session ──────────────────────────────────────────────────────────────────

app.use(
  session({
    secret: "last-race-secret-wa1-2026",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.authenticate("session"));

// Middleware: isLoggedIn

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
};

// RUTE: Autentificare

// POST /api/sessions — Login
app.post("/api/sessions", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info.message });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current — Verify current session
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// DELETE /api/sessions/current — Logout
app.delete("/api/sessions/current", isLoggedIn, (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// ─── RUTE: Rețea Metrou ───────────────────────────────────────────────────────

// GET /api/metro/network — Returns the entire network (protected)
app.get("/api/metro/network", isLoggedIn, async (req, res) => {
  try {
    const network = await getNetwork();
    res.json(network);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RUTE: Joc ────────────────────────────────────────────────────────────────

/**
 * POST /api/games — Creates a new game
 * Randomly chooses a pair (start, end) with BFS distance >= 3 segments.
 */
app.post("/api/games", isLoggedIn, async (req, res) => {
  try {
    const network = await getNetwork();
    const { stations, segments, stationLines } = network;

    // Build the graph: adjacency list (stationId -> [stationId, ...])
    // A segment is bidirectional
    const graph = {};
    for (const st of stations) {
      graph[st.id] = [];
    }
    for (const seg of segments) {
      graph[seg.station1Id].push(seg.station2Id);
      graph[seg.station2Id].push(seg.station1Id);
    }

    // BFS to calculate the distance between two stations (in segments)
    const bfsDistance = (startId, endId) => {
      if (startId === endId) return 0;
      const visited = new Set([startId]);
      const queue = [[startId, 0]];
      while (queue.length > 0) {
        const [current, dist] = queue.shift();
        for (const neighbor of graph[current] || []) {
          if (neighbor === endId) return dist + 1;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push([neighbor, dist + 1]);
          }
        }
      }
      return Infinity;
    };

    // Collect all pairs with BFS distance >= 3
    const stationIds = stations.map((s) => s.id);
    const validPairs = [];
    for (let i = 0; i < stationIds.length; i++) {
      for (let j = i + 1; j < stationIds.length; j++) {
        const dist = bfsDistance(stationIds[i], stationIds[j]);
        if (dist >= 3) {
          validPairs.push([stationIds[i], stationIds[j]]);
        }
      }
    }

    if (validPairs.length === 0) {
      return res.status(500).json({ error: "No valid station pairs found (BFS ≥ 3)." });
    }

    // Randomly choose a pair
    const randomIndex = Math.floor(Math.random() * validPairs.length);
    const [startStation, endStation] = validPairs[randomIndex];

    // Save the game to the DB
    const gameId = await createGame(req.user.id, startStation, endStation);

    // Find the station names for the response
    const startStationObj = stations.find((s) => s.id === startStation);
    const endStationObj = stations.find((s) => s.id === endStation);

    res.status(201).json({
      gameId,
      startStation: { id: startStation, name: startStationObj.name },
      endStation: { id: endStation, name: endStationObj.name },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/games/:id/submit — Submits the planned route
 * Validates the route, applies random events, returns the results.
 */
app.post(
  "/api/games/:id/submit",
  isLoggedIn,
  [check("route").isArray({ min: 0 }).withMessage("route must be an array")],
  async (req, res) => {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const gameId = parseInt(req.params.id, 10);
      const { route } = req.body; // array of segmentIds

      // Verify that the game exists and belongs to the current user
      const game = await getGameById(gameId, req.user.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found." });
      }
      if (game.completed) {
        return res.status(400).json({ error: "Game already completed." });
      }

      const STARTING_COINS = 20;

      // ── Case 1: Empty route -> score 0, skip Execution Phase ─────────────────
      if (!route || route.length === 0) {
        await completeGame(gameId, 0);
        return res.json({
          valid: false,
          reason: "Empty route submitted.",
          startingCoins: STARTING_COINS,
          steps: [],
          finalScore: 0,
        });
      }

      // ── Route validation ─────────────────────────────────────────────────────
      // Load all segments from the DB for validation
      const allSegments = await getAllSegments();
      const segMap = {};
      for (const seg of allSegments) {
        segMap[seg.id] = seg;
      }

      // Load stationLines to check interchange stations
      const network = await getNetwork();
      const { stationLines } = network;

      // Map: stationId -> Set of lineIds (how many lines serve the station)
      const stationLineMap = {};
      for (const sl of stationLines) {
        if (!stationLineMap[sl.stationId]) stationLineMap[sl.stationId] = new Set();
        stationLineMap[sl.stationId].add(sl.lineId);
      }

      // Verify that all segmentIds in the route exist
      for (const segId of route) {
        if (!segMap[segId]) {
          await completeGame(gameId, 0);
          return res.json({
            valid: false,
            reason: `Segment id ${segId} does not exist.`,
            startingCoins: STARTING_COINS,
            steps: [],
            finalScore: 0,
          });
        }
      }

      // Verify that no segment is repeated
      const segIdSet = new Set(route);
      if (segIdSet.size !== route.length) {
        await completeGame(gameId, 0);
        return res.json({
          valid: false,
          reason: "Route contains repeated segments.",
          startingCoins: STARTING_COINS,
          steps: [],
          finalScore: 0,
        });
      }

      // Verify that the route starts from startStation
      const firstSeg = segMap[route[0]];
      const startId = game.startStation;
      const endId = game.endStation;

      // The first segment must include startStation (bidirectional)
      if (firstSeg.station1Id !== startId && firstSeg.station2Id !== startId) {
        await completeGame(gameId, 0);
        return res.json({
          valid: false,
          reason: "Route does not start from the assigned start station.",
          startingCoins: STARTING_COINS,
          steps: [],
          finalScore: 0,
        });
      }

      // Build route traversal step by step
      // "currentStation" = current station after each segment
      let currentStation =
        firstSeg.station1Id === startId ? firstSeg.station2Id : firstSeg.station1Id;
      let currentLineId = firstSeg.lineId;

      const routeValid = { ok: true, reason: "" };

      for (let i = 1; i < route.length && routeValid.ok; i++) {
        const seg = segMap[route[i]];

        // Segment must start from currentStation (bidirectional)
        if (seg.station1Id !== currentStation && seg.station2Id !== currentStation) {
          routeValid.ok = false;
          routeValid.reason = `Segments ${route[i - 1]} and ${route[i]} are not connected.`;
          break;
        }

        // If we change the line, the current station must be an interchange station
        if (seg.lineId !== currentLineId) {
          const linesAtStation = stationLineMap[currentStation] || new Set();
          if (!linesAtStation.has(currentLineId) || !linesAtStation.has(seg.lineId)) {
            routeValid.ok = false;
            routeValid.reason = `Line change at station ${currentStation} is not an interchange station.`;
            break;
          }
        }

        // Advance to next station
        currentStation =
          seg.station1Id === currentStation ? seg.station2Id : seg.station1Id;
        currentLineId = seg.lineId;
      }

      // Verify that the route ends at endStation
      if (routeValid.ok && currentStation !== endId) {
        routeValid.ok = false;
        routeValid.reason = "Route does not end at the assigned destination station.";
      }

      // ── Case 2: Invalid route -> score 0, skip Execution Phase ──────────────
      if (!routeValid.ok) {
        await completeGame(gameId, 0);
        return res.json({
          valid: false,
          reason: routeValid.reason,
          startingCoins: STARTING_COINS,
          steps: [],
          finalScore: 0,
        });
      }

      // ── Case 3: Valid route -> apply random events ─────────────────
      let coins = STARTING_COINS;
      const steps = [];

      // Re-traverse the route to build the steps with events
      let stepStation =
        firstSeg.station1Id === startId ? firstSeg.station1Id : firstSeg.station2Id;

      for (const segId of route) {
        const seg = segMap[segId];
        const event = await getRandomEvent();

        // Determine destination station of current segment
        const toStation =
          seg.station1Id === stepStation ? seg.station2Id : seg.station1Id;

        coins += event.scoreEffect;

        steps.push({
          segment: {
            id: seg.id,
            from: seg.station1Id === stepStation ? seg.station1Name : seg.station2Name,
            to: seg.station1Id === stepStation ? seg.station2Name : seg.station1Name,
          },
          event: {
            id: event.id,
            description: event.description,
            effect: event.scoreEffect,
          },
          coinsAfter: Math.max(0, coins), // nu afișăm negativ pas cu pas
        });

        stepStation = toStation;
      }

      // Final score: Math.max(0, coins) — negative score rule
      const finalScore = Math.max(0, coins);
      await completeGame(gameId, finalScore);

      return res.json({
        valid: true,
        startingCoins: STARTING_COINS,
        steps,
        finalScore,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── RUTE: Ranking ────────────────────────────────────────────────────────────

// GET /api/ranking — Leaderboard (protected)
app.get("/api/ranking", isLoggedIn, async (req, res) => {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});