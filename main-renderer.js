async function loadDataFromCloud() {
 try {
 const { data: cloudTeams, error: e1 } = await supabaseClient.from('teams').select('*');
 if (e1) throw e1;
 teams = { "NoTeam": { points: 0, initial: true, img: "", wins: 0, draws: 0, losses: 0 } };
 if (cloudTeams) { cloudTeams.forEach(t => { teams[t.name] = { points: t.points, img: t.img, wins: t.wins, draws: t.draws, losses: t.losses }; }); }
 
 const { data: cloudPlayers, error: e2 } = await supabaseClient.from('players').select('*').order('id', { ascending: true });
 if (e2) throw e2;
 players = cloudPlayers || [];
 
 const { data: cloudMatches, error: e3 } = await supabaseClient.from('matches').select('*').order('created_at', { ascending: false });
 if (e3) throw e3;
 matches = cloudMatches || [];
 renderUI();
 } catch (err) { console.error('Ошибка связи с базой данных:', err.message); }
}

function renderUI() {
 updateAdminUI();
 const teamsList = document.getElementById('teamsList');
 if (teamsList) {
 teamsList.innerHTML = '';
 const sortedTeams = Object.keys(teams).filter(t => !teams[t].initial).sort((a, b) => teams[b].points - teams[a].points);
 sortedTeams.forEach((team, index) => {
 let currentRank = index + 1;
 let logoHtml = teams[team].img ? '<img src="' + teams[team].img + '">' : ' ';
 let w = teams[team].wins || 0, d = teams[team].draws || 0, l = teams[team].losses || 0;
 let vnpString = w + '-' + d + '-' + l;
 let teamMembers = players.filter(p => p.team === team);
 let rosterHtml = teamMembers.length === 0 ? '<div class="roster-member-item" style="color: #a3a3a3;">В команде пока нет бойцов</div>' : teamMembers.map(p => {
 return '<div class="roster-member-item">' + getRoleIconSvg(p.role || "Штурмовик") + ' <b>' + p.name + '</b> (K:' + (p.kills || 0) + ' D:' + (p.deaths || 0) + ' | K/D: ' + calculateKD(p.kills, p.deaths) + ')</div>';
 }).join('');
 let isRActive = openRosters.includes(team) ? "active" : "";
 let deleteBtnHtml = isAdmin ? '<button class="delete-btn" onclick="deleteTeam(\'' + team + '\')">X</button>' : '';
 teamsList.innerHTML += `<li><div class="team-row-item"><span class="rank-badge">${currentRank}</span><div class="team-main-cell"><div class="team-logo-box" onclick="openLogoModal('${team}')" title="Управлять логотипом">${logoHtml}</div><span class="team-name-text" onclick="toggleRoster('${team}')" title="Нажмите для просмотра состава">${team}</span></div><span>${vnpString}</span><span style="font-weight: bold; color: #eccc68;">${teams[team].points}</span>${deleteBtnHtml}</div><div class="team-roster-box ${isRActive}"><div class="roster-title">Текущий состав:</div>${rosterHtml}</div></li>`;
 });
 
 const m1 = document.getElementById('matchTeam1'), m2 = document.getElementById('matchTeam2');
 if (m1 && m2) {
 let val1 = m1.value, val2 = m2.value;
 const teamOptions = sortedTeams.map(t => '<option value="' + t + '">' + t + '</option>').join('');
 m1.innerHTML = teamOptions; m2.innerHTML = teamOptions;
 if (val1 && teams[val1]) m1.value = val1; if (val2 && teams[val2]) m2.value = val2;
 }
 }
 
 const playersList = document.getElementById('playersList');
 if (playersList) {
 playersList.innerHTML = '';
 players.forEach((player, index) => {
 let options = Object.keys(teams).map(t => `<option value="${t}" ${player.team === t ? 'selected' : ''}>${t === "NoTeam" ? "Без команды" : t}</option>`).join('');
 let playerTeamLogoHtml = player.team === "NoTeam" ? '<div class="team-logo-box" style="font-weight: bold; color: #ef4444;" title="Нет команды"> </div>' : `<div class="team-logo-box" title="${player.team}">${teams[player.team] && teams[player.team].img ? '<img src="' + teams[player.team].img + '">' : ' '}</div>`;
 let actionControlsHtml = isAdmin ? `<select id="select-p-${index}" onchange="changePlayerTeam(${index}, this.value)" style="width: auto; margin: 0; padding: 4px;">${options}</select><button class="delete-btn" onclick="deletePlayer(${index})">X</button>` : `${player.team === "NoTeam" ? "Свободный" : player.team}`;
 playersList.innerHTML += `<li><div style="display: flex; align-items: center; gap: 10px;">${playerTeamLogoHtml}<div class="player-meta-box"><div class="player-name-row"><span class="player-name-clickable" onclick="openRoleModal(${index})">${player.name} ${getRoleIconSvg(player.role || "Штурмовик")}</span></div><span class="player-mini-stats">K: ${player.kills || 0} | D: ${player.deaths || 0} | R: ${player.revives || 0} | B: ${player.bombs || 0} | K/D: ${calculateKD(player.kills, player.deaths)}</span></div></div><div style="display: flex; align-items: center; gap: 5px;"><button class="stats-btn" onclick="openPlayerModal(${index})" title="Просмотр статистики"></button>${actionControlsHtml}</div></li>`;
 });
 }
 
 const historyList = document.getElementById('historyList'); 
 if (historyList) { 
 if (matches.length === 0) { historyList.innerHTML = 'Игр пока не было'; } 
 else { historyList.innerHTML = matches.map(m => `<div class="history-row-item"><div class="history-match-data">${teams[m.t1] && teams[m.t1].img ? '<img src="' + teams[m.t1].img + '" class="history-mini-logo">' : ' '} <b>${m.t1}</b> <span class="score-badge">${m.s1} : ${m.s2}</span> <b>${m.t2}</b> ${teams[m.t2] && teams[m.t2].img ? '<img src="' + teams[m.t2].img + '" class="history-mini-logo">' : ' '}</div>${m.time ? '<span class="history-time-badge">' + m.time + '</span>' : ''}</div>`).join(''); } 
 }
 updateMatchLogos();
}

/* СТАРТОВАЯ ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ */
async function initializeApp() {
    // 1. Сначала загружаем все данные из облака Supabase
    await loadDataFromCloud();
    
    // 2. После успешной загрузки данных принудительно открываем сохраненную вкладку
    console.log(`Восстановление сессии: открываем вкладку ${activeTabId}`);
    switchTab(activeTabId, null);
}

// Запускаем приложение через новую функцию инициализации
initializeApp();
