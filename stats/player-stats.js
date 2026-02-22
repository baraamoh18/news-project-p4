document.addEventListener("DOMContentLoaded", () => {
    const players = [
        {
            name: "Mohamed Salah",
            team: "Liverpool",
            photo: "img/Mohamed Salah1.jpg",
            teamLogo: "img/Liverpool.png",
            goals: 22,
            yellow: 3,
            red: 0
        },
        {
            name: "Haaland",
            team: "Man City",
            photo: "img/Haaland1.jpg",
            teamLogo: "img/Man City.jpg",
            goals: 25,
            yellow: 2,
            red: 0
        },
        {
            name: "Saka",
            team: "Arsenal",
            photo: "img/Saka1.jpg",
            teamLogo: "img/Arsenal.png",
            goals: 16,
            yellow: 4,
            red: 0
        },
        {
            name: "Rashford",
            team: "Man United",
            photo: "img/Saka.jpg",
            teamLogo: "img/Man United.png",
            goals: 14,
            yellow: 3,
            red: 1
        }
    ];

    const container = document.getElementById("playersContainer");
    const buttons = document.querySelectorAll(".player-sort-buttons .sort-btn");
    if (!container || !buttons.length) {
        return;
    }

    const sortOrder = {
        goals: "desc",
        yellow: "desc",
        red: "desc"
    };

    function renderPlayers(arr) {
        container.innerHTML = "";
        arr.forEach((player) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <span class="player-name">
                        <img src="${player.photo}" class="player-photo" alt="${player.name}">
                        ${player.name}
                    </span>
                </td>
                <td>
                    <span class="team-name">
                        <img src="${player.teamLogo}" class="team-logo" alt="${player.team}">
                        ${player.team}
                    </span>
                </td>
                <td>🥅 ${player.goals}</td>
                <td>🟨 ${player.yellow}</td>
                <td>🟥 ${player.red}</td>
            `;
            container.appendChild(row);
        });
    }

    renderPlayers(players);

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.getAttribute("data-sort");
            if (!key || !(key in sortOrder)) {
                return;
            }

            const order = sortOrder[key] === "desc" ? "asc" : "desc";
            sortOrder[key] = order;

            buttons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");

            const sorted = [...players].sort((a, b) => (
                order === "desc" ? b[key] - a[key] : a[key] - b[key]
            ));

            renderPlayers(sorted);
        });
    });
});
