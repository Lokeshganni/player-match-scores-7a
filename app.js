const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db;

const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at PORT 3000");
    });
  } catch (e) {
    console.log("DB ERROR: ${e.message}");
  }
};

initializeServer();

const playerTableCamelCase = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

//API 1 getting list of all the players from player_details table

app.get("/players/", async (req, res) => {
  const api1Query = `
    SELECT * FROM player_details;`;
  const api1Res = await db.all(api1Query);
  res.send(api1Res.map((obj) => playerTableCamelCase(obj)));
});

//API 2 to get player details based on player_id

app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const api2Query = `
    SELECT * FROM player_details WHERE player_id=${playerId};`;
  const api2Res = await db.get(api2Query);
  res.send(playerTableCamelCase(api2Res));
});

//API 3 to update player details

app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;
  const api3Query = `
    UPDATE player_details
    SET player_name='${playerName}'
    WHERE player_id=${playerId};`;
  const api3Res = await db.run(api3Query);
  res.send("Player Details Updated");
});

const matchTableCamelCase = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

//API 4 to get match details based on matchId

app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const api4Query = `
    SELECT * FROM match_details WHERE match_id=${matchId};`;
  const api4Res = await db.get(api4Query);
  res.send(matchTableCamelCase(api4Res));
});

//API 5 to get all the matches of a player

app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;
  const api5Query = `
    SELECT DISTINCT match_details.match_id as matchId, match_details.match ,match_details.year
    FROM player_match_score 
    JOIN match_details
    WHERE player_match_score.player_id=${playerId};`;
  const api5Res = await db.all(api5Query);
  res.send(api5Res);
});

//API 6 to get player details of a match

app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;
  const api6Query = `
    SELECT DISTINCT player_details.player_id as playerId,player_details.player_name as playerName
    FROM player_match_score 
    JOIN player_details
    WHERE match_id=${matchId};`;
  const api6Res = await db.all(api6Query);
  res.send(api6Res);
});

//API 7

app.get("/players/:playerId/playerScores/", async (req, res) => {
  const { playerId } = req.params;
  const api7Query = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const api7Res = await db.all(api7Query);
  res.send(api7Res[0]);
});

module.exports = app;
