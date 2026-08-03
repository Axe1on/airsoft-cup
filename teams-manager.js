function toggleRoster(teamName) {
 if (openRosters.includes(teamName)) {
 openRosters = openRosters.filter(t => t !== teamName);
 } else {
 openRosters.push(teamName);
 }
 renderUI();
}

async function addTeam() {
 if (!isAdmin) return;
 const name = document.getElementById('teamName').value.trim();
 if (!name) return;
 let teamExists = Object.keys(teams).some(t => t.toLowerCase() === name.toLowerCase());
 if (teamExists) {
 alert('Ошибка! Команда с названием ' + name + ' уже зарегистрирована.');
 return;
 }
 const { error } = await supabaseClient.from('teams').insert([{ name }]);
 if (!error) {
 document.getElementById('teamName').value = '';
 await loadDataFromCloud();
 }
}

async function deleteTeam(teamName) {
 if (!isAdmin) return;
 if (confirm('Удалить команду ' + teamName + '?')) {
 await supabaseClient.from('players').update({ team: "NoTeam" }).eq('team', teamName);
 await supabaseClient.from('teams').delete().eq('name', teamName);
 await loadDataFromCloud();
 }
}

function openLogoModal(teamName) {
 if (!isAdmin) return;
 currentSelectedModalTeam = teamName;
 document.getElementById('modalTeamName').innerText = 'Логотип команды: ' + teamName;
 const teamData = teams[teamName];
 if (teamData.img) {
 document.getElementById('modalAddArea').style.display = 'none';
 document.getElementById('modalEditArea').style.display = 'block';
 document.getElementById('editLogoUrl').value = teamData.img;
 } else {
 document.getElementById('modalAddArea').style.display = 'block';
 document.getElementById('modalEditArea').style.display = 'none';
 document.getElementById('newLogoUrl').value = '';
 }
 document.getElementById('logoModal').style.display = 'flex';
}

function closeModal() {
 document.getElementById('logoModal').style.display = 'none';
 currentSelectedModalTeam = "";
}

async function saveModalLogo() {
 if (!isAdmin || !currentSelectedModalTeam) return;
 const teamData = teams[currentSelectedModalTeam];
 let url = teamData.img ? document.getElementById('editLogoUrl').value.trim() : document.getElementById('newLogoUrl').value.trim();
 if (url) {
 const { error } = await supabaseClient.from('teams').update({ img: url }).eq('name', currentSelectedModalTeam);
 if (!error) {
 closeModal();
 await loadDataFromCloud();
 }
 } else {
 alert("Пожалуйста, введите ссылку!");
 }
}

async function deleteModalLogo() {
 if (!isAdmin || !currentSelectedModalTeam) return;
 if (confirm("Удалить логотип этой команды?")) {
 const { error } = await supabaseClient.from('teams').update({ img: "" }).eq('name', currentSelectedModalTeam);
 if (!error) {
 closeModal();
 await loadDataFromCloud();
 }
 }
}

function updateMatchLogos() { 
 const t1 = document.getElementById('matchTeam1').value; 
 const t2 = document.getElementById('matchTeam2').value; 
 const log1 = document.getElementById('logo-match-1'); 
 const log2 = document.getElementById('logo-match-2'); 
 if (log1 && t1 && teams[t1]) log1.innerHTML = teams[t1].img ? '<img src="' + teams[t1].img + '">' : ' '; 
 if (log2 && t2 && teams[t2]) log2.innerHTML = teams[t2].img ? '<img src="' + teams[t2].img + '">' : ' '; 
} 

async function recordMatch() { 
 if (!isAdmin) return; 
 const t1 = document.getElementById('matchTeam1').value; 
 const t2 = document.getElementById('matchTeam2').value; 
 const s1 = parseInt(document.getElementById('score1').value); 
 const s2 = parseInt(document.getElementById('score2').value); 
 if (!t1 || !t2 || t1 === t2 || isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) { 
 alert("Проверьте правильность заполнения команд и счета!"); 
 return; 
 } 
 let t1_pts = teams[t1].points, t1_w = teams[t1].wins, t1_d = teams[t1].draws, t1_l = teams[t1].losses; 
 let t2_pts = teams[t2].points, t2_w = teams[t2].wins, t2_d = teams[t2].draws, t2_l = teams[t2].losses; 
 
 if (s1 > s2) { 
 t1_pts += 2; t1_w += 1; t2_l += 1; 
 } else if (s2 > s1) { 
 t2_pts += 2; t2_w += 1; t1_l += 1; /* Исправлено */
 } else { 
 t1_pts += 1; t2_pts += 1; t1_d += 1; t2_d += 1; 
 } 
 let d = new Date(); 
 let timeString = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear() + ' в ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); 
 
 await supabaseClient.from('matches').insert([{ t1: t1, s1: s1, t2: t2, s2: s2, time: timeString }]); 
 await supabaseClient.from('teams').update({ points: t1_pts, wins: t1_w, draws: t1_d, losses: t1_l }).eq('name', t1); 
 await supabaseClient.from('teams').update({ points: t2_pts, wins: t2_w, draws: t2_d, losses: t2_l }).eq('name', t2); 
 document.getElementById('score1').value = ''; 
 document.getElementById('score2').value = ''; 
 await loadDataFromCloud(); 
}

async function clearHistory() { 
 if (!isAdmin) return; 
 if (confirm("Очистить историю матчей и обнулить очки у всех команд?")) { 
 await supabaseClient.from('matches').delete().neq('time', ''); 
 const sortedTeams = Object.keys(teams).filter(t => !teams[t].initial); 
 for (let team of sortedTeams) { 
 await supabaseClient.from('teams').update({ points: 0, wins: 0, draws: 0, losses: 0 }).eq('name', team); 
 } 
 await loadDataFromCloud(); 
 } 
}
