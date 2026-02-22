const container = document.getElementById("matches-container");
const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";
const LOOKUP_DAY_OFFSETS = [-1, 0, 1];

let currentFilter = "all";
let cachedMatches = {
  live: [],
  finished: [],
  upcoming: [],
};
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

function getDateParam(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function getTimestamp(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatKickoff(kickoff) {
  if (!kickoff) return "Scheduled";
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return "Scheduled";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

async function fetchScoreboardByDate(dateParam) {
  const response = await fetch(`${ESPN_SCOREBOARD_URL}?dates=${dateParam}`);
  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status} for ${dateParam}`);
  }

  const data = await response.json();
  return Array.isArray(data.events) ? data.events : [];
}

function normalizeEvent(event) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((team) => team.homeAway === "home");
  const away = competitors.find((team) => team.homeAway === "away");

  if (!home || !away) {
    return null;
  }

  const state = event?.status?.type?.state;
  const completed = Boolean(event?.status?.type?.completed);

  let section = "upcoming";
  if (state === "in") {
    section = "live";
  } else if (state === "post" || completed) {
    section = "finished";
  }

  return {
    id: String(event.id || `${home.team?.id}-${away.team?.id}-${event.date}`),
    section,
    status:
      event?.status?.type?.shortDetail ||
      event?.status?.type?.description ||
      "Scheduled",
    homeName: home.team?.displayName || home.team?.name || "Home",
    awayName: away.team?.displayName || away.team?.name || "Away",
    homeLogo: home.team?.logo || "",
    awayLogo: away.team?.logo || "",
    homeScore: home.score,
    awayScore: away.score,
    kickoff: event.date || competition?.date || "",
  };
}

function sortMatches(matches, section) {
  const ordered = [...matches];
  if (section === "finished") {
    ordered.sort((a, b) => getTimestamp(b.kickoff) - getTimestamp(a.kickoff));
  } else {
    ordered.sort((a, b) => getTimestamp(a.kickoff) - getTimestamp(b.kickoff));
  }
  return ordered;
}

function renderMatchCard(match, section) {
  const scoreText =
    section === "upcoming"
      ? "vs"
      : `${match.homeScore ?? "-"} - ${match.awayScore ?? "-"}`;

  const infoText =
    section === "upcoming"
      ? formatKickoff(match.kickoff)
      : `${match.status} • ${formatKickoff(match.kickoff)}`;

  return `
    <div class="match-card ${section}">
      <span class="status ${section}-badge">${match.status}</span>
      <div class="match-teams">
        <div class="team">
          ${
            match.homeLogo
              ? `<img src="${match.homeLogo}" width="25" height="25" alt="${match.homeName} logo">`
              : ""
          }
          <span>${match.homeName}</span>
        </div>
        <div class="score">${scoreText}</div>
        <div class="team">
          ${
            match.awayLogo
              ? `<img src="${match.awayLogo}" width="25" height="25" alt="${match.awayName} logo">`
              : ""
          }
          <span>${match.awayName}</span>
        </div>
      </div>
      <p>${infoText}</p>
    </div>
  `;
}

function renderMatches() {
  container.innerHTML = "";

  const sections = {
    live: cachedMatches.live,
    finished: cachedMatches.finished,
    upcoming: cachedMatches.upcoming,
  };

  let hasContent = false;

  Object.keys(sections).forEach((section) => {
    if (currentFilter !== "all" && currentFilter !== section) {
      return;
    }

    if (!sections[section].length) {
      return;
    }

    hasContent = true;
    const sectionWrapper = document.createElement("section");
    sectionWrapper.className = "matches-section";

    const title = document.createElement("h2");
    title.className = "matches-group-title";
    title.textContent = section.toUpperCase();

    const cardsGrid = document.createElement("div");
    cardsGrid.className = "matches-section-grid";
    sections[section].forEach((match) => {
      cardsGrid.insertAdjacentHTML("beforeend", renderMatchCard(match, section));
    });

    sectionWrapper.appendChild(title);
    sectionWrapper.appendChild(cardsGrid);
    container.appendChild(sectionWrapper);
  });

  if (!hasContent) {
    container.innerHTML = '<p class="loading">No matches found for this filter.</p>';
  }
}

async function fetchMatches() {
  container.innerHTML = '<p class="loading">Loading...</p>';

  try {
    const dateParams = LOOKUP_DAY_OFFSETS.map((offset) => getDateParam(offset));
    const eventLists = await Promise.all(
      dateParams.map((dateParam) => fetchScoreboardByDate(dateParam)),
    );

    const uniqueEvents = new Map();
    eventLists.flat().forEach((event) => {
      const match = normalizeEvent(event);
      if (!match) {
        return;
      }
      uniqueEvents.set(match.id, match);
    });

    const allMatches = Array.from(uniqueEvents.values());
    cachedMatches.live = sortMatches(
      allMatches.filter((match) => match.section === "live"),
      "live",
    );
    cachedMatches.finished = sortMatches(
      allMatches.filter((match) => match.section === "finished"),
      "finished",
    );
    cachedMatches.upcoming = sortMatches(
      allMatches.filter((match) => match.section === "upcoming"),
      "upcoming",
    );

    renderMatches();
  } catch (error) {
    console.error("Fetch error:", error);
    container.innerHTML =
      '<p class="error">Error loading matches. Please try again later.</p>';
  }
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
  renderMatches();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter);
  });
});

setFilter(currentFilter);
fetchMatches();
