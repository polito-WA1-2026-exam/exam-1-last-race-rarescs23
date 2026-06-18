
import dayjs from "dayjs";

// Constructor functions

function Station(id, name) {
  this.id = id;
  this.name = name;
}

function Line(id, name, color) {
  this.id = id;
  this.name = name;
  this.color = color;
}

// StationLine: links station-line with order on the line
function StationLine(stationId, lineId, order) {
  this.stationId = stationId;
  this.lineId = lineId;
  this.order = order;
}

function Segment(id, station1Id, station2Id, lineId) {
  this.id = id;
  this.station1Id = station1Id;
  this.station2Id = station2Id;
  this.lineId = lineId;
}

function GameEvent(id, description, scoreEffect) {
  this.id = id;
  this.description = description;
  this.scoreEffect = scoreEffect;
}

function Game(id, userId, startStation, endStation, finalScore, completed, createdAt) {
  this.id = id;
  this.userId = userId;
  this.startStation = startStation;
  this.endStation = endStation;
  this.finalScore = finalScore;
  this.completed = completed;
  this.createdAt = dayjs(createdAt);
}

export { Station, Line, StationLine, Segment, GameEvent, Game };
