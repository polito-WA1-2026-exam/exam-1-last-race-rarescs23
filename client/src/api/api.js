/** api/api.js — Client-side API functions for game and ranking **/

const SERVER_URL = "http://localhost:3001";

/**
 * Returns the entire metro network (lines, stations, stationLines, segments).
 */
export const getNetwork = async () => {
  const response = await fetch(`${SERVER_URL}/api/metro/network`, {
    credentials: "include",
  });

  if (response.ok) {
    const network = await response.json();
    return network;
  } else {
    const errObj = await response.json();
    throw new Error(errObj.error || "Failed to fetch network");
  }
};

/**
 * Returns stations + segments WITHOUT lineId (for Planning Phase).
 */
export const getSegments = async () => {
  const response = await fetch(`${SERVER_URL}/api/metro/segments`, {
    credentials: "include",
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    const errObj = await response.json();
    throw new Error(errObj.error || "Failed to fetch segments");
  }
};

/**
 * Creates a new game. Returns { gameId, startStation, endStation }.
 */
export const startGame = async () => {
  const response = await fetch(`${SERVER_URL}/api/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (response.ok) {
    const game = await response.json();
    return game;
  } else {
    const errObj = await response.json();
    throw new Error(errObj.error || "Failed to start game");
  }
};

/**
 * Submits the planned route (array of segmentIds) for a game.
 * Returns the validation result + execution steps.
 */
export const submitRoute = async (gameId, route) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ route }),
  });

  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    const errObj = await response.json();
    throw new Error(errObj.error || "Failed to submit route");
  }
};

/**
 * Returns the ranking (best score per user).
 */
export const getRanking = async () => {
  const response = await fetch(`${SERVER_URL}/api/ranking`, {
    credentials: "include",
  });

  if (response.ok) {
    const ranking = await response.json();
    return ranking;
  } else {
    const errObj = await response.json();
    throw new Error(errObj.error || "Failed to fetch ranking");
  }
};
