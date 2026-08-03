async function addPlayer() { 
 if (!isAdmin) return; 
 const name = document.getElementById('playerName').value.trim(); 
 if (!name) return; 
 let playerExists = players.some(p => p.name.toLowerCase() === name.toLowerCase()); 
 if (playerExists) { 
 alert('Ошибка! Игрок с именем ' + name + ' уже зарегистрирован.'); 
 return; 
 } 
 const { error } = await supabaseClient.from('players').insert([{ name, team: 'NoTeam', role: 'Штурмовик' }]);
 if (!error) { 
 document.getElementById('playerName').value = ''; 
 await loadDataFromCloud(); 
 }
}

async function deletePlayer(index) { 
 if (!isAdmin) return; 
 let player = players[index]; 
 if (confirm('Удалить игрока ' + player.name + '?')) { 
 await supabaseClient.from('players').delete().eq('id', player.id); 
 await loadDataFromCloud(); 
 } 
}

async function changePlayerTeam(playerIndex, newTeam) { 
 if (!isAdmin) return; 
 let player = players[playerIndex]; 
 let pRole = player.role || "Штурмовик"; 
 if (newTeam !== "NoTeam" && pRole !== "Штурмовик") { 
 let duplicateExists = players.some((p, idx) => { 
 return idx !== playerIndex && p.team === newTeam && (p.role || "Штурмовик") === pRole; 
 }); 
 if (duplicateExists) { 
 alert('Ошибка лимита! В команде ' + newTeam + ' уже зарегистрирован один ' + pRole + '. Сначала смените роль бойцу.'); 
 document.getElementById('select-p-' + playerIndex).value = player.team; 
 return; 
 } 
 } 
 const { error } = await supabaseClient.from('players').update({ team: newTeam }).eq('id', player.id); 
 if (!error) { 
 await loadDataFromCloud(); 
 } 
}

function openPlayerModal(index) { 
 currentSelectedModalPlayerIndex = index; 
 const player = players[index]; 
 document.getElementById('modalPlayerName').innerText = 'Боец: ' + player.name + ' (' + (player.role || 'Штурмовик') + ')'; 
 let kInp = document.getElementById('input-kills'); 
 let dInp = document.getElementById('input-deaths'); 
 let rInp = document.getElementById('input-revives'); 
 let bInp = document.getElementById('input-bombs'); 
 kInp.value = player.kills || 0; 
 dInp.value = player.deaths || 0; 
 rInp.value = player.revives || 0; 
 bInp.value = player.bombs || 0; 
 if (isAdmin) { 
 kInp.removeAttribute('disabled'); dInp.removeAttribute('disabled'); 
 rInp.removeAttribute('disabled'); bInp.removeAttribute('disabled'); 
 document.getElementById('modalStatSaveBtn').style.display = 'block'; 
 document.getElementById('modalStatCancelBtn').innerText = 'Отмена'; 
 } else { 
 kInp.setAttribute('disabled', 'true'); dInp.setAttribute('disabled', 'true'); 
 rInp.setAttribute('disabled', 'true'); bInp.setAttribute('disabled', 'true'); 
 document.getElementById('modalStatSaveBtn').style.display = 'none'; 
 document.getElementById('modalStatCancelBtn').innerText = 'Закрыть'; 
 } 
 document.getElementById('playerStatsModal').style.display = 'flex'; 
}

async function savePlayerStats() { 
 if (!isAdmin || currentSelectedModalPlayerIndex === null) return; 
 let player = players[currentSelectedModalPlayerIndex]; 
 let k = parseInt(document.getElementById('input-kills').value); 
 let d = parseInt(document.getElementById('input-deaths').value); 
 let r = parseInt(document.getElementById('input-revives').value); 
 let b = parseInt(document.getElementById('input-bombs').value); 
 let kills = isNaN(k) || k < 0 ? 0 : k; 
 let deaths = isNaN(d) || d < 0 ? 0 : d; 
 let revives = isNaN(r) || r < 0 ? 0 : r; 
 let bombs = isNaN(b) || b < 0 ? 0 : b; 
 const { error } = await supabaseClient.from('players').update({ kills, deaths, revives, bombs }).eq('name', player.name); 
 if (!error) { 
 closePlayerModal(); 
 await loadDataFromCloud(); 
 } else { 
 alert('Ошибка сохранения в облако: ' + error.message); /* Пофиксили опечатку */
 } 
} 

function closePlayerModal() { 
 document.getElementById('playerStatsModal').style.display = 'none'; 
 currentSelectedModalPlayerIndex = null; 
} 

function openRoleModal(index) { 
 if (!isAdmin) return; 
 currentSelectedRolePlayerIndex = index; 
 const player = players[index]; 
 document.getElementById('roleModalTitle').innerText = 'Роль для бойца: ' + player.name; 
 document.getElementById('modalRoleSelect').value = player.role || "Штурмовик"; 
 document.getElementById('playerRoleModal').style.display = 'flex'; 
} 

function closeRoleModal() { 
 document.getElementById('playerRoleModal').style.display = 'none'; 
 currentSelectedRolePlayerIndex = null; 
}

async function savePlayerRole() { 
 if (!isAdmin || currentSelectedRolePlayerIndex === null) return; 
 let player = players[currentSelectedRolePlayerIndex]; 
 let selectedRole = document.getElementById('modalRoleSelect').value; 
 if (player.team !== "NoTeam" && selectedRole !== "Штурмовик") { 
 let duplicateExists = players.some((p, idx) => { 
 return idx !== currentSelectedRolePlayerIndex && p.team === player.team && (p.role || "Штурмовик") === selectedRole; 
 }); 
 if (duplicateExists) { 
 alert('Ошибка тактического лимита! В команде ' + player.team + ' уже есть один ' + selectedRole + '. Два специалиста одной роли недопустимы.'); 
 return; 
 } 
 } 
 const { error } = await supabaseClient.from('players').update({ role: selectedRole }).eq('name', player.name); 
 if (!error) { 
 closeRoleModal(); 
 await loadDataFromCloud(); 
 } 
}
