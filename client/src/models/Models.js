

function Station(id, name) {
  this.id = id;
  this.name = name;
}

function Line(id, name, color) {
  this.id = id;
  this.name = name;
  this.color = color;
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

export { Station, Line, Segment, GameEvent };
