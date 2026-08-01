let teams = JSON.parse(localStorage.getItem('str_teams')) || {
    "NoTeam": { points: 0, initial: true, img: "", wins: 0, draws: 0, losses: 0 }
};
let players = JSON.parse(localStorage.getItem('str_players')) || [];
let matches = JSON.parse(localStorage.getItem('str_matches')) || [];

let currentSelectedModalTeam = "";
let currentSelectedModalPlayerIndex = null;
let currentSelectedRolePlayerIndex = null;

/* СОХРАНЕНИЕ СЕССИИ АДМИНА: Проверяем, был ли пользователь авторизован ранее */
let isAdmin = JSON.parse(localStorage.getItem('str_is_admin')) || false;

let openRosters = [];

function saveToStorage() {
    localStorage.setItem('str_teams', JSON.stringify(teams));
    localStorage.setItem('str_players', JSON.stringify(players));
    localStorage.setItem('str_matches', JSON.stringify(matches));
    localStorage.setItem('str_is_admin', JSON.stringify(isAdmin));
}

/* Функция для синхронизации внешнего вида верхней панели в зависимости от статуса админа */
function updateAdminUI() {
    if (isAdmin) {
        document.body.classList.add('is-admin');
        document.getElementById('adminStatusText').innerText = 'Режим: Организатор';
        document.getElementById('authBtn').innerText = 'Выйти';
        document.getElementById('matchSectionTitle').innerText = 'Внести результат матча';
    } else {
        document.body.classList.remove('is-admin');
        document.getElementById('adminStatusText').innerText = 'Режим: Зритель';
        document.getElementById('authBtn').innerText = 'Админ';
        document.getElementById('matchSectionTitle').innerText = 'Результаты матчей';
    }
}

function handleAuthClick() {
    if (isAdmin) {
        isAdmin = false;
        saveToStorage();
        updateAdminUI();
        render();
    } else {
        document.getElementById('authLogin').value = '';
        document.getElementById('authPassword').value = '';
        document.getElementById('authModal').style.display = 'flex';
    }
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

/* ОБНОВЛЕНО: Новые тактические логин и пароль для организатора */
function submitLogin() {
    let l = document.getElementById('authLogin').value.trim();
    let p = document.getElementById('authPassword').value.trim();
    
    if (l === "airsoftcup" && p === "strikeball") {
        isAdmin = true;
        saveToStorage();
        updateAdminUI();
        closeAuthModal();
        render();
    } else {
        alert('Ошибка авторизации! Неверный логин или пароль.');
    }
}

function getRoleIconSvg(role) {
    if (role === "Медик") {
        return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M10 21v-7H3v-4h7V3h4v7h7v4h-7v7h-4z"/></svg>';
    }
    if (role === "Инженер") {
        return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M21.71 2.29a1 1 0 0 0-1.42 0l-3.53 3.53a4.5 4.5 0 0 0-4.8 1.06 4.5 4.5 0 0 0-1.06 4.8L3.29 19.3a1 1 0 0 0 0 1.41l1 1a1 1 0 0 0 1.41 0l7.61-7.61a4.5 4.5 0 0 0 4.8-1.06 4.5 4.5 0 0 0 1.06-4.8l3.54-3.54a1 1 0 0 0 0-1.41zM14 11a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 14 11z"/></svg>';
    }
    if (role === "Командир") {
        return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
    }
    return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M5 10V19H7V10H5M5 8C5 6 6 4 6 4C6 4 7 6 7 8H5M11 10V19H13V10H11M11 8C11 6 12 4 12 4C12 4 13 6 13 8H11M17 10V19H19V10H17M17 8C17 6 18 4 18 4C18 4 19 6 19 8H17Z"/></svg>';
}

function calculateKD(kills, deaths) {
    let k = kills || 0;
    let d = deaths || 0;
    if (d === 0) return k.toFixed(2);
    return (k / d).toFixed(2);
}

function toggleRoster(teamName) {
    if (openRosters.includes(teamName)) {
        openRosters = openRosters.filter(t => t !== teamName);
    } else {
        openRosters.push(teamName);
    }
    render();
}

function render() {
    updateAdminUI();

    /* 1. Рендер команд */
    const teamsList = document.getElementById('teamsList');
    if (teamsList) {
        teamsList.innerHTML = '';
        const sortedTeams = Object.keys(teams)
            .filter(t => !teams[t].initial)
            .sort((a, b) => teams[b].points - teams[a].points);

        sortedTeams.forEach((team, index) => {
            let currentRank = index + 1;
            let logoHtml = teams[team].img ? '<img src="' + teams[team].img + '">' : '★';
            
            let w = teams[team].wins || 0;
            let d = teams[team].draws || 0;
            let l = teams[team].losses || 0;
            let vnpString = w + '-' + d + '-' + l;
            
            let teamMembers = players.filter(p => p.team === team);
            let rosterHtml = "";
            
            if (teamMembers.length === 0) {
                rosterHtml = '<div class="roster-member-item" style="color: #a3a3a3;">В команде пока нет бойцов</div>';
            } else {
                rosterHtml = teamMembers.map(p => {
                    let rSvg = getRoleIconSvg(p.role || "Штурмовик");
                    let playerKD = calculateKD(p.kills, p.deaths);
                    return '<div class="roster-member-item">' + rSvg + ' <b>' + p.name + '</b> (K:' + (p.kills || 0) + ' D:' + (p.deaths || 0) + ' | K/D: ' + playerKD + ')</div>';
                }).join('');
            }

            let isRActive = openRosters.includes(team) ? "active" : "";
            let deleteBtnHtml = isAdmin ? '<button class="delete-btn" onclick="deleteTeam(\'' + team + '\')">X</button>' : '';

            teamsList.innerHTML += `
                <li>
                    <div class="team-row-item">
                        <span class="rank-badge">${currentRank}</span>
                        <div class="team-main-cell">
                            <div class="team-logo-box" onclick="openLogoModal('${team}')" title="Управлять логотипом">${logoHtml}</div>
                            <span class="team-name-text" onclick="toggleRoster('${team}')" title="Нажмите, чтобы посмотреть состав">${team}</span>
                        </div>
                        <span>${vnpString}</span>
                        <span style="font-weight: bold; color: #eccc68;">${teams[team].points}</span>
                        ${deleteBtnHtml}
                    </div>
                    <div class="team-roster-box ${isRActive}">
                        <div class="roster-title">Текущий состав команды:</div>
                        ${rosterHtml}
                    </div>
                </li>`;
        });

        const m1 = document.getElementById('matchTeam1');
        const m2 = document.getElementById('matchTeam2');
        if (m1 && m2) {
            let val1 = m1.value;
            let val2 = m2.value;
            const teamOptions = sortedTeams.map(t => '<option value="' + t + '">' + t + '</option>').join('');
            m1.innerHTML = teamOptions;
            m2.innerHTML = teamOptions;
            if (val1 && teams[val1]) m1.value = val1;
            if (val2 && teams[val2]) m2.value = val2;
        }
    }

    /* 2. Рендер игроков */
    const playersList = document.getElementById('playersList');
    if (playersList) {
        playersList.innerHTML = '';
        players.forEach((player, index) => {
            let options = Object.keys(teams).map(t => {
                let displayTeam = t === "NoTeam" ? "Без команды" : t;
                return '<option value="' + t + '" ' + (player.team === t ? 'selected' : '') + '>' + displayTeam + '</option>';
            }).join('');
            
            let playerTeamLogoHtml = '';
            if (player.team === "NoTeam") {
                playerTeamLogoHtml = '<div class="team-logo-box" style="font-weight: bold; color: #ef4444;" title="Нет команды">✕</div>';
            } else {
                let currentTeamImg = teams[player.team] ? teams[player.team].img : '';
                playerTeamLogoHtml = '<div class="team-logo-box" title="' + player.team + '">' + (currentTeamImg ? '<img src="' + currentTeamImg + '">' : '★') + '</div>';
            }

            let roleSvgContent = getRoleIconSvg(player.role || "Штурмовик");
            let pk = player.kills || 0;
            let pd = player.deaths || 0;
            let pr = player.revives || 0;
            let pb = player.bombs || 0;
            let currentKD = calculateKD(pk, pd);
            let miniStatsString = 'K: ' + pk + ' | D: ' + pd + ' | R: ' + pr + ' | B: ' + pb + ' | K/D: ' + currentKD;
            
            let actionControlsHtml = '';
            if (isAdmin) {
                actionControlsHtml = '<select id="select-p-' + index + '" onchange="changePlayerTeam(' + index + ', this.value)" style="width: auto; margin: 0; padding: 4px;">' + options + '</select>' +
                                     '<button class="delete-btn" onclick="deletePlayer(' + index + ')">X</button>';
            } else {
                let teamLabelText = player.team === "NoTeam" ? "Свободный" : player.team;
                actionControlsHtml = '<span style="font-size: 12px; color: #a3a3a3; font-weight: bold; padding-right: 5px;">' + teamLabelText + '</span>';
            }

            playersList.innerHTML += `
                <li>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${playerTeamLogoHtml}
                        <div class="player-meta-box">
                            <div class="player-name-row">
                                <span class="player-name-clickable" onclick="openRoleModal(${index})">${player.name} ${roleSvgContent}</span>
                            </div>
                            <span class="player-mini-stats">${miniStatsString}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
📊${actionControlsHtml}`;});}/* 3. Рендер истории матчей */const historyList = document.getElementById('historyList');if (historyList) {if (matches.length === 0) {historyList.innerHTML = 'Игр пока не было';} else {historyList.innerHTML = matches.map(m => {let logo1Html = teams[m.t1] && teams[m.t1].img ? '' : '★';let logo2Html = teams[m.t2] && teams[m.t2].img ? '' : '★';let timeLabelHtml = m.time ? '' + m.time + '' : '';return '' +'' +'' + logo1Html + ' ' +'' + m.t1 + ' ' +'(' + m.s1 + ') : (' + m.s2 + ') ' +'' + m.t2 + ' ' +'' + logo2Html + '' +'' +timeLabelHtml +'';}).join('');}}}function openPlayerModal(index) {currentSelectedModalPlayerIndex = index;const player = players[index];document.getElementById('modalPlayerName').innerText = 'Боец: ' + player.name + ' (' + (player.role || 'Штурмовик') + ')';let kInp = document.getElementById('input-kills');let dInp = document.getElementById('input-deaths');let rInp = document.getElementById('input-revives');let bInp = document.getElementById('input-bombs');kInp.value = player.kills || 0;dInp.value = player.deaths || 0;rInp.value = player.revives || 0;bInp.value = player.bombs || 0;if (isAdmin) {kInp.removeAttribute('disabled'); dInp.removeAttribute('disabled');rInp.removeAttribute('disabled'); bInp.removeAttribute('disabled');document.getElementById('modalStatSaveBtn').style.display = 'block';document.getElementById('modalStatCancelBtn').innerText = 'Отмена';} else {kInp.setAttribute('disabled', 'true'); dInp.setAttribute('disabled', 'true');rInp.setAttribute('disabled', 'true'); bInp.setAttribute('disabled', 'true');document.getElementById('modalStatSaveBtn').style.display = 'none';document.getElementById('modalStatCancelBtn').innerText = 'Закрыть';}document.getElementById('playerStatsModal').style.display = 'flex';}function savePlayerStats() {if (!isAdmin || currentSelectedModalPlayerIndex === null) return;let player = players[currentSelectedModalPlayerIndex];let k = parseInt(document.getElementById('input-kills').value);let d = parseInt(document.getElementById('input-deaths').value);let r = parseInt(document.getElementById('input-revives').value);let b = parseInt(document.getElementById('input-bombs').value);player.kills = isNaN(k) || k < 0 ? 0 : k;player.deaths = isNaN(d) || d < 0 ? 0 : d;player.revives = isNaN(r) || r < 0 ? 0 : r;player.bombs = isNaN(b) || b < 0 ? 0 : b;closePlayerModal();}function closePlayerModal() {document.getElementById('playerStatsModal').style.display = 'none';currentSelectedModalPlayerIndex = null;saveToStorage();render();}function openRoleModal(index) {if (!isAdmin) return;currentSelectedRolePlayerIndex = index;const player = players[index];document.getElementById('roleModalTitle').innerText = 'Роль для бойца: ' + player.name;document.getElementById('modalRoleSelect').value = player.role || "Штурмовик";document.getElementById('playerRoleModal').style.display = 'flex';}function closeRoleModal() {document.getElementById('playerRoleModal').style.display = 'none';currentSelectedRolePlayerIndex = null;}function savePlayerRole() {if (!isAdmin || currentSelectedRolePlayerIndex === null) return;let player = players[currentSelectedRolePlayerIndex];let selectedRole = document.getElementById('modalRoleSelect').value;if (player.team !== "NoTeam" && selectedRole !== "Штурмовик") {let duplicateExists = players.some((p, idx) => {return idx !== currentSelectedRolePlayerIndex && p.team === player.team && (p.role || "Штурмовик") === selectedRole;});if (duplicateExists) {alert('Ошибка тактического лимита! В команде ' + player.team + ' уже есть один ' + selectedRole + '. Два специалиста одной роли недопустимы.');return;}}player.role = selectedRole;saveToStorage();render();closeRoleModal();}function openLogoModal(teamName) {if (!isAdmin) return;currentSelectedModalTeam = teamName;document.getElementById('modalTeamName').innerText = 'Логотип команды: ' + teamName;const teamData = teams[teamName];if (teamData.img) {document.getElementById('modalAddArea').style.display = 'none';document.getElementById('modalEditArea').style.display = 'block';document.getElementById('editLogoUrl').value = teamData.img;} else {document.getElementById('modalAddArea').style.display = 'block';document.getElementById('modalEditArea').style.display = 'none';document.getElementById('newLogoUrl').value = '';}document.getElementById('logoModal').style.display = 'flex';}function closeModal() {document.getElementById('logoModal').style.display = 'none';currentSelectedModalTeam = "";}function saveModalLogo() {if (!isAdmin || !currentSelectedModalTeam) return;const teamData = teams[currentSelectedModalTeam];let url = teamData.img ? document.getElementById('editLogoUrl').value.trim() : document.getElementById('newLogoUrl').value.trim();if (url) {teams[currentSelectedModalTeam].img = url;saveToStorage();render();closeModal();} else {alert("Пожалуйста, введите ссылку!");}}function deleteModalLogo() {if (!isAdmin || !currentSelectedModalTeam) return;if (confirm("Удалить логотип этой команды?")) {teams[currentSelectedModalTeam].img = "";saveToStorage();render();closeModal();}}function addTeam() {if (!isAdmin) return;const name = document.getElementById('teamName').value.trim();if (!name) return;let teamExists = Object.keys(teams).some(t => t.toLowerCase() === name.toLowerCase());if (teamExists) {alert('Ошибка! Команда с названием ' + name + ' уже зарегистрирована в турнирной системе.');return;}teams[name] = { points: 0, img: "", wins: 0, draws: 0, losses: 0 };document.getElementById('teamName').value = '';saveToStorage();render();}function deleteTeam(teamName) {if (!isAdmin) return;if (confirm('Удалить команду ' + teamName + '?')) {players.forEach(p => { if (p.team === teamName) p.team = "NoTeam"; });delete teams[teamName];saveToStorage();render();}}function addPlayer() {if (!isAdmin) return;const name = document.getElementById('playerName').value.trim();if (!name) return;let playerExists = players.some(p => p.name.toLowerCase() === name.toLowerCase());if (playerExists) {alert('Ошибка! Игрок с именем ' + name + ' уже зарегистрирован в турнирной системе.');return;}players.push({ name: name, team: "NoTeam", role: "Штурмовик", kills: 0, deaths: 0, revives: 0, bombs: 0 });document.getElementById('playerName').value = '';saveToStorage();render();}function deletePlayer(index) {if (!isAdmin) return;if (confirm('Удалить игрока ' + players[index].name + '?')) {players.splice(index, 1);saveToStorage();render();}}function changePlayerTeam(playerIndex, newTeam) {if (!isAdmin) return;let player = players[playerIndex];let pRole = player.role || "Штурмовик";if (newTeam !== "NoTeam" && pRole !== "Штурмовик") {let duplicateExists = players.some((p, idx) => {return idx !== playerIndex && p.team === newTeam && (p.role || "Штурмовик") === pRole;});if (duplicateExists) {alert('Ошибка лимита! В команде ' + newTeam + ' уже зарегистрирован один ' + pRole + '. Сначала смените роль бойцу.');document.getElementById('select-p-' + playerIndex).value = player.team;return;}}player.team = newTeam;saveToStorage();render();}function recordMatch() {if (!isAdmin) return;const t1 = document.getElementById('matchTeam1').value;const t2 = document.getElementById('matchTeam2').value;const s1 = parseInt(document.getElementById('score1').value);const s2 = parseInt(document.getElementById('score2').value);if (!t1 || !t2 || t1 === t2 || isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {alert("Проверьте правильность заполнения команд и счета!");return;}if (s1 > s2) {teams[t1].points += 2; teams[t1].wins += 1; teams[t2].losses += 1;} else if (s2 > s1) {teams[t2].points += 2; teams[t2].wins += 1; teams[t1].losses += 1;} else {teams[t1].points += 1; teams[t2].points += 1; teams[t1].draws += 1; teams[t2].draws += 1;}let d = new Date();let day = String(d.getDate()).padStart(2, '0');let month = String(d.getMonth() + 1).padStart(2, '0');let year = d.getFullYear();let hours = String(d.getHours()).padStart(2, '0');let minutes = String(d.getMinutes()).padStart(2, '0');let timeString = day + '.' + month + '.' + year + ' в ' + hours + ':' + minutes;matches.unshift({ t1: t1, s1: s1, t2: t2, s2: s2, time: timeString });document.getElementById('score1').value = '';document.getElementById('score2').value = '';saveToStorage();render();}function clearHistory() {if (!isAdmin) return;if (confirm("Очистить историю матчей и обнулить очки у всех команд?")) {matches = [];Object.keys(teams).forEach(t => {teams[t].points = 0; teams[t].wins = 0; teams[t].draws = 0; teams[t].losses = 0;});saveToStorage();render();}}render();