/** dao-games.js — DAO for games, scores, and ranking **/

import db from "./db.js";
import dayjs from "dayjs";
import { GameEvent, Game } from "./models.js";

/**
 * Creates a new game in the DB and returns the generated id.
 */
export const createGame = (userId, startStation, endStation) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO game (userId, startStation, endStation, finalScore, completed, createdAt)
      VALUES (?, ?, ?, NULL, 0, ?)
    `;
    const createdAt = dayjs().toISOString();
    db.run(sql, [userId, startStation, endStation, createdAt], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

/**
 * Returns a game by id (checking that it belongs to the given user).
 */
export const getGameById = (gameId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, userId, startStation, endStation, finalScore, completed, createdAt
      FROM game
      WHERE id = ? AND userId = ?
    `;
    db.get(sql, [gameId, userId], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else
        resolve(
          new Game(
            row.id,
            row.userId,
            row.startStation,
            row.endStation,
            row.finalScore,
            row.completed,
            row.createdAt
          )
        );
    });
  });
};

/**
 * Marks a game as completed and saves the final score.
 * If the score is negative, we save 0.
 */
export const completeGame = (gameId, finalScore) => {
  return new Promise((resolve, reject) => {
    const safeScore = Math.max(0, finalScore); // negative score rule
    const sql = `
      UPDATE game
      SET finalScore = ?, completed = 1
      WHERE id = ?
    `;
    db.run(sql, [safeScore, gameId], function (err) {
      if (err) reject(err);
      else resolve(safeScore);
    });
  });
};

/**
 * Returns a random event from the DB.
 */
export const getRandomEvent = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, description, scoreEffect FROM event ORDER BY RANDOM() LIMIT 1";
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error("No events in database"));
      else resolve(new GameEvent(row.id, row.description, row.scoreEffect));
    });
  });
};

/**
 * Returns the leaderboard: best score per user, sorted descending.
 */
export const getRanking = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT u.id, u.name, MAX(g.finalScore) AS bestScore
      FROM game g
      JOIN user u ON g.userId = u.id
      WHERE g.completed = 1
      GROUP BY u.id
      ORDER BY bestScore DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else
        resolve(
          rows.map((r, index) => ({
            rank: index + 1,
            userId: r.id,
            name: r.name,
            bestScore: r.bestScore,
          }))
        );
    });
  });
};
