async function executeCupMatch(id) {
 const t1 = document.getElementById('select-' + id + '-t1').value.trim();
 const t2 = document.getElementById('select-' + id + '-t2').value.trim();
 const s1 = parseInt(document.getElementById('score-' + id + '-t1').value);
 const s2 = parseInt(document.getElementById('score-' + id + '-t2').value);
 if (!t1 || !t2 || t1 === t2 || isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) { alert("Укажите команды и введите корректный счет матча!"); return; }
 if (s1 === s2) { alert("В кубковых раундах и отборе должна быть определена победа одной из команд!"); return; }
 
 let winner = (s1 > s2) ? t1 : t2;
 let loser = (s1 > s2) ? t2 : t1;
 const isRoundRobin = id.startsWith('ga') || id.startsWith('gb') || id.startsWith('gc');
 if (isRoundRobin) {
 if (!cupScores[t1]) cupScores[t1] = 0; if (!cupScores[t2]) cupScores[t2] = 0;
 cupScores[winner] += 2;
 }
 document.getElementById('score-view-' + id + '-t1').innerText = s1;
 document.getElementById('score-view-' + id + '-t2').innerText = s2;
 
 if (isAdmin) {
 const { data: cloudTeams } = await supabaseClient.from('teams').select('*');
 let allCloudTeams = cloudTeams || [];
 let dbT1 = allCloudTeams.find(t => t.name.trim() === t1);
 let dbT2 = allCloudTeams.find(t => t.name.trim() === t2);
 if (dbT1 && dbT2) {
 let pts1 = dbT1.points + (s1 > s2 ? 2 : 0), w1 = dbT1.wins + (s1 > s2 ? 1 : 0), l1 = dbT1.losses + (s1 > s2 ? 0 : 1);
 let pts2 = dbT2.points + (s2 > s1 ? 2 : 0), w2 = dbT2.wins + (s2 > s1 ? 1 : 0), l2 = dbT2.losses + (s2 > s1 ? 0 : 1);
 let d = new Date();
 let timeStr = String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear() + ' в ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
 await supabaseClient.from('matches').insert([{ t1: t1, s1: s1, t2: t2, s2: s2, time: timeStr + ' (Кубок: ' + id.toUpperCase() + ')' }]);
 await supabaseClient.from('teams').update({ points: pts1, wins: w1, losses: l1 }).eq('name', t1);
 await supabaseClient.from('teams').update({ points: pts2, wins: w2, losses: l2 }).eq('name', t2);
 }
 }
 
 const b = document.getElementById('btn-' + id);
 if (b) { b.innerText = "Матч сыгран "; b.style.background = "#4a5d52"; b.style.color = "#a3a3a3"; b.setAttribute('disabled', 'true'); }
 
 const sc1 = document.getElementById('score-' + id + '-t1');
 const sc2 = document.getElementById('score-' + id + '-t2');
 const sel1 = document.getElementById('select-' + id + '-t1');
 const sel2 = document.getElementById('select-' + id + '-t2');
 if (sc1) sc1.setAttribute('disabled', 'true');
 if (sc2) sc2.setAttribute('disabled', 'true');
 if (sel1) sel1.setAttribute('disabled', 'true');
 if (sel2) sel2.setAttribute('disabled', 'true');
 
 await saveSelectionToCloud(id, 1, true);
 renderCupLeaderboard();
 
 const roundMatchIds = ['ga1', 'ga2', 'gb1', 'gb2', 'gc1', 'gc2'];
 let roundFinishedCount = roundMatchIds.filter(mid => document.getElementById('btn-' + mid).hasAttribute('disabled')).length;
 if (roundFinishedCount === 6 && isRoundRobin) {
 let active4Teams = [currentSlots.A, currentSlots.B, currentSlots.C, currentSlots.D].filter(Boolean);
 active4Teams.forEach(t => { if (cupScores[t] === undefined) cupScores[t] = 0; });
 let sortedCupTeams = active4Teams.sort((a, b) => cupScores[b] - cupScores[a]);
 if (sortedCupTeams.length >= 4) {
 document.getElementById('select-sf1-t1').value = sortedCupTeams; syncViewerText('sf1', 1);
 document.getElementById('select-sf1-t2').value = sortedCupTeams; syncViewerText('sf1', 2);
 document.getElementById('select-sf2-t1').value = sortedCupTeams; syncViewerText('sf2', 1);
 document.getElementById('select-sf2-t2').value = sortedCupTeams; syncViewerText('sf2', 2);
 await saveSelectionToCloud('sf1', 1, false); await saveSelectionToCloud('sf2', 1, false);
 alert("Отборочный тур завершен! Сформированы Полуфиналы:\nПФ 1: " + sortedCupTeams + " vs " + sortedCupTeams + "\nПФ 2: " + sortedCupTeams + " vs " + sortedCupTeams);
 }
 }
 
 if (id === 'sf1' || id === 'sf2') {
 if (document.getElementById('btn-sf1').hasAttribute('disabled') && document.getElementById('btn-sf2').hasAttribute('disabled')) {
 const sf1_s1 = parseInt(document.getElementById('score-sf1-t1').value) || 0, sf1_s2 = parseInt(document.getElementById('score-sf1-t2').value) || 0;
 const sf1_t1 = document.getElementById('select-sf1-t1').value, sf1_t2 = document.getElementById('select-sf1-t2').value;
 let sf1_winner = (sf1_s1 > sf1_s2) ? sf1_t1 : sf1_t2, sf1_loser = (sf1_s1 > sf1_s2) ? sf1_t2 : sf1_t1;
 const sf2_s1 = parseInt(document.getElementById('score-sf2-t1').value) || 0, sf2_s2 = parseInt(document.getElementById('score-sf2-t2').value) || 0;
 const sf2_t1 = document.getElementById('select-sf2-t1').value, sf2_t2 = document.getElementById('select-sf2-t2').value;
 let sf2_winner = (sf2_s1 > sf2_s2) ? sf2_t1 : sf2_t2, sf2_loser = (sf2_s1 > sf2_s2) ? sf2_t2 : sf2_t1;
 
 document.getElementById('select-gf-t1').value = sf1_winner; syncViewerText('gf', 1);
 document.getElementById('select-gf-t2').value = sf2_winner; syncViewerText('gf', 2);
 document.getElementById('select-m3-t1').value = sf1_loser; syncViewerText('m3', 1);
 document.getElementById('select-m3-t2').value = sf2_loser; syncViewerText('m3', 2);
 await saveSelectionToCloud('gf', 1, false); await saveSelectionToCloud('m3', 1, false);
 alert("Полуфиналы сыграны! Сформированы пары:\nГранд-Финал: " + sf1_winner + " vs " + sf2_winner + "\nМатч за Бронзу: " + sf1_loser + " vs " + sf2_loser);
 }
 }
 if (id === 'm3') document.getElementById('podium-3').innerHTML = `🥉 <b class="bronze-text">${winner}</b>`;
 if (id === 'gf') {
 document.getElementById('podium-1').innerHTML = `🏆 <b class="gold-text"> ${winner}</b>`;
 document.getElementById('podium-2').innerHTML = `🥈 <b class="silver-text">${loser}</b>`;
 }
 await loadTournamentData();
}

async function clearBracketTables() {
 if (confirm("Вы уверены, что хотите ПОЛНОСТЬЮ стереть результаты кубка?")) {
 cupScores = {}; currentSlots = { A: "", B: "", C: "", D: "" };
 await supabaseClient.from('cup_matches').delete().neq('match_id', '');
 ['A', 'B', 'C', 'D'].forEach(slot => { const el = document.getElementById('slot-team-' + slot); if (el) el.value = ""; });
 allMatchIds.forEach(id => {
 const b = document.getElementById('btn-' + id);
 if (b) { b.innerText = "Записать матч"; b.style.background = "#d97706"; b.style.color = "#1e2522"; b.removeAttribute('disabled'); }
 const sc1 = document.getElementById('score-' + id + '-t1'), sc2 = document.getElementById('score-' + id + '-t2');
 if (sc1 && sc2) { sc1.value = ""; sc2.value = ""; }
 const vsc1 = document.getElementById('score-view-' + id + '-t1'), vsc2 = document.getElementById('score-view-' + id + '-t2');
 if (vsc1 && vsc2) { vsc1.innerText = "-"; vsc2.innerText = "-"; }
 const sel1 = document.getElementById('select-' + id + '-t1'), sel2 = document.getElementById('select-' + id + '-t2');
 if (sel1 && sel2) { sel1.value = ""; sel2.value = ""; }
 });
 document.getElementById('podium-1').innerHTML = ' Ожидание...'; document.getElementById('podium-2').innerHTML = ' Ожидание...'; document.getElementById('podium-3').innerHTML = ' Ожидание...';
 await loadTournamentData();
 alert("Турнирная сетка и слоты успешно обнулены!");
 }
}
