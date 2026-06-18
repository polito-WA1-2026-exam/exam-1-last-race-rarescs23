/** dao-metro.js — DAO for the metro network **/

import db from "./db.js";
import { Station, Line, StationLine, Segment } from "./models.js";

/**
 * Returns all metro lines.
 */
export const getAllLines = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, name, color FROM line";
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r) => new Line(r.id, r.name, r.color)));
    });
  });
};

/**
 * Returns all stations.
 */
export const getAllStations = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, name FROM station";
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r) => new Station(r.id, r.name)));
    });
  });
};

/**
 * Returns station-line connections (with their order on the line).
 */
export const getAllStationLines = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT stationId, lineId, "order" FROM station_line`;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r) => new StationLine(r.stationId, r.lineId, r.order)));
    });
  });
};

/**
 * Returns all segments with station names included
 * (joined with station table for client-side rendering).
 */
export const getAllSegments = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        s.id,
        s.station1Id,
        s1.name AS station1Name,
        s.station2Id,
        s2.name AS station2Name,
        s.lineId
      FROM segment s
      JOIN station s1 ON s.station1Id = s1.id
      JOIN station s2 ON s.station2Id = s2.id
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const segments = rows.map((r) => {
          const seg = new Segment(r.id, r.station1Id, r.station2Id, r.lineId);
          seg.station1Name = r.station1Name;
          seg.station2Name = r.station2Name;
          return seg;
        });
        resolve(segments);
      }
    });
  });
};

/**
 * Returns a single segment by id (used during route validation).
 */
export const getSegmentById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT s.id, s.station1Id, s1.name AS station1Name,
             s.station2Id, s2.name AS station2Name, s.lineId
      FROM segment s
      JOIN station s1 ON s.station1Id = s1.id
      JOIN station s2 ON s.station2Id = s2.id
      WHERE s.id = ?
    `;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else {
        const seg = new Segment(row.id, row.station1Id, row.station2Id, row.lineId);
        seg.station1Name = row.station1Name;
        seg.station2Name = row.station2Name;
        resolve(seg);
      }
    });
  });
};

/**
 * Returns the entire network (lines + stations + stationLines + segments)
 * in a single grouped call — used by GET /api/metro/network.
 */
export const getNetwork = async () => {
  const [lines, stations, stationLines, segments] = await Promise.all([
    getAllLines(),
    getAllStations(),
    getAllStationLines(),
    getAllSegments(),
  ]);
  return { lines, stations, stationLines, segments };
};
