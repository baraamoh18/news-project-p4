const tableContainer = document.querySelector(".tables-container");
const leagueId = 4328;
const seasons = ["2025-2026", "2024-2025", "2023-2024"];

function buildTeamRow(team) {
  const goalsFor = Number(team.intGoalsFor || 0);
  const goalsAgainst = Number(team.intGoalsAgainst || 0);
  const goalDiff = goalsFor - goalsAgainst;
  const goalDiffClass = goalDiff >= 0 ? "goal-positive" : "goal-negative";
  const goalDiffText = goalDiff >= 0 ? `+${goalDiff}` : `${goalDiff}`;

  return `
    <tr>
      <td>${team.intRank}</td>
      <td>${team.strTeam}</td>
      <td>${team.intPlayed}</td>
      <td>${team.intWin}</td>
      <td>${team.intDraw}</td>
      <td>${team.intLoss}</td>
      <td>${goalsFor}</td>
      <td>${goalsAgainst}</td>
      <td class="${goalDiffClass}">${goalDiffText}</td>
      <td class="points">${team.intPoints}</td>
    </tr>
  `;
}

async function loadSeasonTable(season) {
  const url = `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${leagueId}&s=${season}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Table API returned ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.table) || !data.table.length) {
    return;
  }

  const rows = data.table.map(buildTeamRow).join("");
  const card = document.createElement("section");
  card.className = "table-card";
  card.innerHTML = `
    <h2 class="table-title">Premier League ${season}</h2>
    <table class="league-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>GF</th>
          <th>GA</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  tableContainer.appendChild(card);
}

async function loadAllTables() {
  if (!tableContainer) return;

  for (const season of seasons) {
    try {
      await loadSeasonTable(season);
    } catch (error) {
      console.error(`Failed to load season ${season}:`, error);
    }
  }
}

loadAllTables();
