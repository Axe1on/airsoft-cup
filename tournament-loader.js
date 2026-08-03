const allMatchIds = ['ga1', 'ga2', 'gb1', 'gb2', 'gc1', 'gc2', 'sf1', 'sf2', 'm3', 'gf'];
let cupScores = {};

function renderCupLeaderboard() {
 const lb = document.getElementById('cupGroupLeaderboard');
 if (!lb) return;
 let sorted = Object.keys(cupScores).sort((a, b) => cupScores[b] - cupScores[a]);
 if (sorted.length === 0) {
 lb.innerHTML = '<li style="background:transparent; text-align:center; color:#a3a3a3; padding:10px;">Назначьте команды и сыграйте матчи для расчета очков</li>';
 return;
 }
 lb.innerHTML = sorted.map((team, idx) => `<li>${idx + 1}. ${team} <span>${cupScores[team]} очков</span></li>`).join('');
}

async function saveSelectionToCloud(matchId, teamNum, forcedPlayedStatus) {
 if (!isAdmin) return;
 const t1 = document.getElementById('select-' + matchId + '-t1').value.trim();
 const t2 = document.getElementById('select-' + matchId + '-t2').value.trim();
 const s1 = parseInt(document.getElementById('score-' + matchId + '-t1').value) || 0;
 const s2 = parseInt(document.getElementById('score-' + matchId + '-t2').value) || 0;
 syncViewerText(matchId, 1); syncViewerText(matchId, 2);
 
 let isPlayedState = (forcedPlayedStatus !== undefined) ? forcedPlayedStatus : document.getElementById('btn-' + matchId).innerText.includes("сыгран");
 await supabaseClient.from('cup_matches').delete().eq('match_id', matchId);
 await supabaseClient.from('cup_matches').insert([{ match_id: matchId, team1: t1, team2: t2, score1: s1, score2: s2, is_played: isPlayedState }]);
}

async function loadTournamentData() {
 try {
 const { data: cloudTeams } = await supabaseClient.from('teams').select('*');
 let allCloudTeams = cloudTeams || [];
 const sortedTeams = allCloudTeams.sort((a, b) => b.points - a.points);
 
 ['A', 'B', 'C', 'D'].forEach(slot => {
 const el = document.getElementById('slot-team-' + slot);
 if (el) {
 if (document.activeElement === el) return;
 const currentVal = el.value;
 el.innerHTML = '<option value="">-- Выбрать команду --</option>' + sortedTeams.map(t => '<option value="' + t.name + '">' + t.name + '</option>').join('');
 if (currentVal) el.value = currentVal;
 // Защита: зритель не может менять настройки слотов
 if (!isAdmin) el.setAttribute('disabled', 'true');
 else el.removeAttribute('disabled');
 }
 });
 
 cupScores = {};
 allMatchIds.forEach(id => {
 const b = document.getElementById('btn-' + id);
 if (b) { b.innerText = "Записать матч"; b.style.background = "#d97706"; b.style.color = "#1e2522"; b.removeAttribute('disabled'); }
 const sc1 = document.getElementById('score-' + id + '-t1');
 const sc2 = document.getElementById('score-' + id + '-t2');
 const sel1 = document.getElementById('select-' + id + '-t1');
 const sel2 = document.getElementById('select-' + id + '-t2');
 
 // Разблокируем для админа по умолчанию (если матч ещё не сыгран)
 if (sc1) sc1.removeAttribute('disabled');
 if (sc2) sc2.removeAttribute('disabled');
 if (sel1) sel1.removeAttribute('disabled');
 if (sel2) sel2.removeAttribute('disabled');
 
 // Защита: если зашёл зритель — выключаем абсолютно всё сразу
 if (!isAdmin) {
 if (sc1) { sc1.value = ""; sc1.setAttribute('disabled', 'true'); }
 if (sc2) { sc2.value = ""; sc2.setAttribute('disabled', 'true'); }
 if (sel1) sel1.setAttribute('disabled', 'true');
 if (sel2) sel2.setAttribute('disabled', 'true');
 }
 });
 
 const { data: savedCupMatches } = await supabaseClient.from('cup_matches').select('*');
 if (savedCupMatches) {
 const slotsConfig = savedCupMatches.find(m => m.match_id === 'slots_config');
 if (slotsConfig) {
 currentSlots.A = slotsConfig.team1 ? slotsConfig.team1.trim() : "";
 currentSlots.B = slotsConfig.team2 ? slotsConfig.team2.trim() : "";
 currentSlots.C = slotsConfig.team1_img ? slotsConfig.team1_img.trim() : "";
 currentSlots.D = slotsConfig.team2_img ? slotsConfig.team2_img.trim() : "";
 ['A', 'B', 'C', 'D'].forEach(slot => {
 const el = document.getElementById('slot-team-' + slot);
 if (el && currentSlots[slot] && document.activeElement !== el) el.value = currentSlots[slot];
 });
 }
 applySlotsToInputs();
 
 savedCupMatches.forEach(m => {
 if (m.match_id === 'slots_config') return;
 const s1 = document.getElementById('select-' + m.match_id + '-t1');
 const s2 = document.getElementById('select-' + m.match_id + '-t2');
 const sc1 = document.getElementById('score-' + m.match_id + '-t1');
 const sc2 = document.getElementById('score-' + m.match_id + '-t2');
 const b = document.getElementById('btn-' + m.match_id);
 let t1Clean = m.team1 ? m.team1.trim() : "";
 let t2Clean = m.team2 ? m.team2.trim() : "";
 
 if (s1 && t1Clean) s1.value = t1Clean;
 if (s2 && t2Clean) s2.value = t2Clean;
 
 if (sc1 && m.score1 !== undefined && document.activeElement !== sc1) sc1.value = m.score1;
 if (sc2 && m.score2 !== undefined && document.activeElement !== sc2) sc2.value = m.score2;
 if (t1Clean) document.getElementById('view-' + m.match_id + '-t1').innerText = t1Clean;
 if (t2Clean) document.getElementById('view-' + m.match_id + '-t2').innerText = t2Clean;
 
 if (m.is_played) {
 document.getElementById('score-view-' + m.match_id + '-t1').innerText = m.score1;
 document.getElementById('score-view-' + m.match_id + '-t2').innerText = m.score2;
 if (b) { b.innerText = "Матч сыгран "; b.style.background = "#4a5d52"; b.style.color = "#a3a3a3"; b.setAttribute('disabled', 'true'); }
 
 // ФИКС: Если матч сыгран, полностью блокируем ввод счёта и выбор команд даже для Админа!
 if (sc1) sc1.setAttribute('disabled', 'true');
 if (sc2) sc2.setAttribute('disabled', 'true');
 if (s1) s1.setAttribute('disabled', 'true');
 if (s2) s2.setAttribute('disabled', 'true');
 
 const isRoundRobin = m.match_id.startsWith('ga') || m.match_id.startsWith('gb') || m.match_id.startsWith('gc');
 if (isRoundRobin) {
 if (t1Clean && !cupScores[t1Clean]) cupScores[t1Clean] = 0;
 if (t2Clean && !cupScores[t2Clean]) cupScores[t2Clean] = 0;
 let winTeam = (m.score1 > m.score2) ? t1Clean : t2Clean;
 if (winTeam) { if (!cupScores[winTeam]) cupScores[winTeam] = 0; cupScores[winTeam] += 2; }
 }
 } else {
 document.getElementById('score-view-' + m.match_id + '-t1').innerText = "-";
 document.getElementById('score-view-' + m.match_id + '-t2').innerText = "-";
 }
 });
 } else {
 applySlotsToInputs();
 }
 
 allMatchIds.forEach(id => { syncViewerText(id, 1); syncViewerText(id, 2); });
 renderCupLeaderboard();
 
 let gfData = savedCupMatches ? savedCupMatches.find(m => m.match_id === 'gf' && m.is_played) : null;
 let m3Data = savedCupMatches ? savedCupMatches.find(m => m.match_id === 'm3' && m.is_played) : null;
 if (gfData) {
 let w = (gfData.score1 > gfData.score2) ? gfData.team1.trim() : gfData.team2.trim();
 let l = (gfData.score1 > gfData.score2) ? gfData.team2.trim() : gfData.team1.trim();
 document.getElementById('podium-1').innerHTML = `🏆 <b class="gold-text"> ${w}</b>`;
 document.getElementById('podium-2').innerHTML = `🥈 <b class="silver-text">${l}</b>`;
 } else {
 document.getElementById('podium-1').innerHTML = ' Ожидание...'; document.getElementById('podium-2').innerHTML = ' Ожидание...';
 }
 if (m3Data) {
 let w = (m3Data.score1 > m3Data.score2) ? m3Data.team1.trim() : m3Data.team2.trim();
 document.getElementById('podium-3').innerHTML = `🥉 <b class="bronze-text">${w}</b>`;
 } else {
 document.getElementById('podium-3').innerHTML = ' Ожидание...';
 }
 } catch (err) { console.error('Ошибка связи с облаком в сетке:', err.message); }
}
