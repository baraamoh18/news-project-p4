const NEWS_API_KEY = "bb5109f7fcc547509b0002189e7c84fa";
const WEATHER_API_KEY = "2898c5e2f7a7a09403b8cc3cc9e54bc8";

const NEWS_CONFIG = [
  {
    containerId: "sports-news",
    url: `https://newsapi.org/v2/everything?q=Premier%20League&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`,
  },
  {
    containerId: "entertainment-news",
    url: `https://newsapi.org/v2/top-headlines?country=us&category=entertainment&apiKey=${NEWS_API_KEY}`,
  },
  {
    containerId: "business-news",
    url: `https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${NEWS_API_KEY}`,
  },
  {
    containerId: "politic-news",
    url: `https://newsapi.org/v2/everything?q=politics&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`,
  },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildNewsCard(article) {
  return `
    <a href="${article.url}" target="_blank" class="news-card-link" rel="noopener noreferrer">
      <article class="news-card">
        <img src="${article.urlToImage}" alt="${article.title}" class="news-card-image">
        <div class="news-card-content">
          <h3 class="news-card-title">${article.title}</h3>
          <div class="news-card-meta">
            <span>${formatDate(article.publishedAt)}</span>
            <span>${article.source?.name || "Unknown source"}</span>
          </div>
        </div>
      </article>
    </a>
  `;
}

async function loadNewsSection({ containerId, url }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API returned ${response.status}`);
    }

    const data = await response.json();
    const articles = (data.articles || [])
      .filter((article) => article.url && article.title && article.urlToImage)
      .slice(0, 3);

    if (!articles.length) {
      container.innerHTML = '<p class="loading">No news available.</p>';
      return;
    }

    container.innerHTML = articles.map(buildNewsCard).join("");
  } catch (error) {
    container.innerHTML = '<p class="error">Unable to load news right now.</p>';
    console.error(`News error (${containerId}):`, error);
  }
}

async function loadWeather() {
  const tempEl = document.querySelector(".weather-temp");
  const cityEl = document.querySelector(".weather-city");
  const conditionEl = document.querySelector(".weather-condition");
  const descriptionEl = document.querySelector(".weather-description");
  if (!tempEl || !cityEl || !conditionEl || !descriptionEl) return;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=cairo,EG&appid=${WEATHER_API_KEY}&lang=en&units=metric`,
    );
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    tempEl.textContent = `${Math.round(data.main.temp)} C`;
    cityEl.textContent = data.name;
    conditionEl.textContent = data.weather[0].main;
    descriptionEl.textContent = data.weather[0].description;
  } catch (error) {
    tempEl.textContent = "--";
    conditionEl.textContent = "Unavailable";
    descriptionEl.textContent = "Weather data not available.";
    console.error("Weather error:", error);
  }
}

function renderCurrency(usdToEgp, usdToSar) {
  const currencyContent = document.getElementById("currency-content");
  if (!currencyContent) return;

  const sarToEgp = usdToEgp / usdToSar;
  currencyContent.innerHTML = `
    <div class="currency-list">
      <div class="currency-item">
        <div class="currency-name">
          <div class="currency-icon usd">USD</div>
          <div class="currency-code">USD / EGP</div>
        </div>
        <div class="currency-value">
          <div class="currency-rate">${usdToEgp.toFixed(3)}</div>
          <div class="currency-change">1 USD</div>
        </div>
      </div>
      <div class="currency-item">
        <div class="currency-name">
          <div class="currency-icon sar">SAR</div>
          <div class="currency-code">SAR / EGP</div>
        </div>
        <div class="currency-value">
          <div class="currency-rate">${sarToEgp.toFixed(3)}</div>
          <div class="currency-change">1 SAR</div>
        </div>
      </div>
    </div>
  `;
}

async function loadCurrency() {
  const currencyContent = document.getElementById("currency-content");
  if (!currencyContent) return;

  const sources = [
    "https://open.er-api.com/v6/latest/USD",
    "https://api.exchangerate-api.com/v4/latest/USD",
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;

      const data = await response.json();
      const usdToEgp = Number(data?.rates?.EGP);
      const usdToSar = Number(data?.rates?.SAR);
      if (!Number.isFinite(usdToEgp) || !Number.isFinite(usdToSar) || !usdToSar) {
        continue;
      }

      renderCurrency(usdToEgp, usdToSar);
      return;
    } catch (error) {
      console.error("Currency source error:", error);
    }
  }

  currencyContent.innerHTML =
    '<div class="error">Unable to load currency rates right now.</div>';
}

function formatKickoff(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Upcoming";
  return `Next kickoff - ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function renderLiveMatch({ league, home, away, homeScore, awayScore, status }) {
  const liveContent = document.getElementById("live-content");
  if (!liveContent) return;

  liveContent.innerHTML = `
    <div class="match-container">
      <div class="match-league">${league}</div>
      <div class="match-teams">
        <div class="team">
          <span class="team-name">${home}</span>
          <span class="team-score">${homeScore}</span>
        </div>
        <div class="match-divider"></div>
        <div class="team">
          <span class="team-name">${away}</span>
          <span class="team-score">${awayScore}</span>
        </div>
      </div>
      <div class="match-time">${status}</div>
    </div>
  `;
}

async function getLiveMatchFromEspn() {
  const response = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
  );
  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`);
  }

  const data = await response.json();
  const events = data?.events || [];
  const event = events.find((item) => item?.status?.type?.state === "in") || events[0];
  if (!event) {
    throw new Error("No match data from ESPN.");
  }

  const competition = event.competitions?.[0];
  const teams = competition?.competitors || [];
  const home = teams.find((team) => team.homeAway === "home");
  const away = teams.find((team) => team.homeAway === "away");
  if (!home || !away) {
    throw new Error("Invalid ESPN match format.");
  }

  const state = event.status?.type?.state;
  let status = "Match update";
  if (state === "in") {
    status = `Live - ${event.status?.type?.shortDetail || ""}`.trim();
  } else if (state === "post") {
    status = `Finished - ${event.status?.type?.detail || ""}`.trim();
  } else {
    status = formatKickoff(event.date);
  }

  return {
    league: competition?.league?.name || "Premier League",
    home: home.team?.displayName || "Home",
    away: away.team?.displayName || "Away",
    homeScore: home.score ?? "-",
    awayScore: away.score ?? "-",
    status,
  };
}

async function getLiveMatchFromSportsDb() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328",
  );
  if (!response.ok) {
    throw new Error(`SportsDB API returned ${response.status}`);
  }

  const data = await response.json();
  const event = data?.events?.[0];
  if (!event) {
    throw new Error("No match data from SportsDB.");
  }

  return {
    league: event.strLeague || "Football",
    home: event.strHomeTeam || "Home",
    away: event.strAwayTeam || "Away",
    homeScore: event.intHomeScore ?? "-",
    awayScore: event.intAwayScore ?? "-",
    status: formatKickoff(`${event.dateEvent}T${event.strTime || "00:00:00"}`),
  };
}

async function loadLiveMatch() {
  const liveContent = document.getElementById("live-content");
  if (!liveContent) return;

  try {
    renderLiveMatch(await getLiveMatchFromEspn());
    return;
  } catch (error) {
    console.error("ESPN live match error:", error);
  }

  try {
    renderLiveMatch(await getLiveMatchFromSportsDb());
  } catch (error) {
    liveContent.innerHTML =
      '<div class="error">Unable to load live match data right now.</div>';
    console.error("SportsDB live match error:", error);
  }
}

function init() {
  NEWS_CONFIG.forEach(loadNewsSection);
  loadWeather();
  loadCurrency();
  loadLiveMatch();
}

init();
