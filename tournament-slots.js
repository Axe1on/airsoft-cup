/* ОБЪЕКТ ЛОКАЛЬНОГО ХРАНЕНИЯ СЛОТОВ */
let currentSlots = { A: "", B: "", C: "", D: "" };

/* Автоматическое заполнение полей команд в сетке на основе слотов */
function applySlotsToInputs() {
 setSlotTeamName('ga1-t1', currentSlots.A); setSlotTeamName('ga1-t2', currentSlots.B);
 setSlotTeamName('ga2-t1', currentSlots.C); setSlotTeamName('ga2-t2', currentSlots.D);
 setSlotTeamName('gb1-t1', currentSlots.A); setSlotTeamName('gb1-t2', currentSlots.C);
 setSlotTeamName('gb2-t1', currentSlots.B); setSlotTeamName('gb2-t2', currentSlots.D);
 setSlotTeamName('gc1-t1', currentSlots.A); setSlotTeamName('gc1-t2', currentSlots.D);
 setSlotTeamName('gc2-t1', currentSlots.B); setSlotTeamName('gc2-t2', currentSlots.C);
}

function setSlotTeamName(inputId, name) {
 const inp = document.getElementById('select-' + inputId);
 const view = document.getElementById('view-' + inputId);
 if (inp) inp.value = name || "";
 if (view) view.innerText = name || "Ожидание...";
}

/* ОБЛАЧНОЕ СОХРАНЕНИЕ НАЗНАЧЕННЫХ СЛОТОВ */
async function saveSlotsToCloud() {
 if (!isAdmin) return;
 currentSlots.A = document.getElementById('slot-team-A').value;
 currentSlots.B = document.getElementById('slot-team-B').value;
 currentSlots.C = document.getElementById('slot-team-C').value;
 currentSlots.D = document.getElementById('slot-team-D').value;
 applySlotsToInputs();
 
 await supabaseClient.from('cup_matches').delete().eq('match_id', 'slots_config');
 await supabaseClient.from('cup_matches').insert([{
 match_id: 'slots_config', team1: currentSlots.A, team2: currentSlots.B,
 score1: 0, score2: 0, is_played: false,
 team1_img: currentSlots.C, team2_img: currentSlots.D
 }]);
 
 const roundIds = ['ga1', 'ga2', 'gb1', 'gb2', 'gc1', 'gc2'];
 for (let id of roundIds) {
 const b = document.getElementById('btn-' + id);
 if (b && !b.hasAttribute('disabled')) {
 await saveSelectionToCloud(id, 1, false);
 }
 }
 await loadTournamentData();
}

function syncViewerText(matchId, teamNum) {
 const selectEl = document.getElementById('select-' + matchId + '-t' + teamNum);
 const viewEl = document.getElementById('view-' + matchId + '-t' + teamNum);
 if (selectEl && viewEl) { viewEl.innerText = selectEl.value.trim() || 'Ожидание...'; }
}
