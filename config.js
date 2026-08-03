/* КОНФИГУРАЦИЯ ПОДКЛЮЧЕНИЯ К Supabase */
const SUPABASE_URL = 'https://kecoxatolgxsxpqhtvgk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7icoBzwIZQ8p-IdnituWMg_2xbKz5ly';

/* Инициализация клиента */
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* Локальные копии данных для мгновенного рендера */
let teams = {};
let players = [];
let matches = [];
let currentSelectedModalTeam = "";
let currentSelectedModalPlayerIndex = null;
let currentSelectedRolePlayerIndex = null;
let isAdmin = JSON.parse(localStorage.getItem('str_is_admin')) || false;
let openRosters = [];
let tournamentIntervalId = null;

/* Синхронизация сессии */
function saveSession() {
 localStorage.setItem('str_is_admin', JSON.stringify(isAdmin));
}

/* Общее обновление UI админа */
function updateAdminUI() {
 if (isAdmin) {
 document.body.classList.add('is-admin');
 document.getElementById('adminStatusText').innerText = 'Организатор';
 document.getElementById('authBtn').innerText = 'Выйти';
 document.getElementById('matchSectionTitle').innerText = 'Внести результат матча';
 } else {
 document.body.classList.remove('is-admin');
 document.getElementById('adminStatusText').innerText = 'Зритель';
 document.getElementById('authBtn').innerText = 'Админ';
 document.getElementById('matchSectionTitle').innerText = 'Результаты матчей';
 }
}

function handleAuthClick() {
 if (isAdmin) {
 isAdmin = false;
 saveSession();
 updateAdminUI();
 renderUI();
 } else {
 document.getElementById('authLogin').value = '';
 document.getElementById('authPassword').value = '';
 document.getElementById('authModal').style.display = 'flex';
 }
}

function closeAuthModal() {
 document.getElementById('authModal').style.display = 'none';
}

function submitLogin() {
 let l = document.getElementById('authLogin').value.trim();
 let p = document.getElementById('authPassword').value.trim();
 
 if (l === "airsoftcup" && p === "strikeball") {
 isAdmin = true;
 saveSession();
 updateAdminUI();
 closeAuthModal();
 renderUI();
 } else {
 alert('Ошибка авторизации! Неверный логин или пароль.');
 }
}

/* Переключение вкладок с живым таймером кубка */
function switchTab(tabId, menuElement) {
 document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
 document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
 
 document.getElementById(tabId).classList.add('active');
 if (menuElement) menuElement.classList.add('active');
 
 if (tournamentIntervalId) {
 clearInterval(tournamentIntervalId);
 tournamentIntervalId = null;
 }
 
 if (tabId === 'bracket-tab') {
 loadTournamentData(); 
 tournamentIntervalId = setInterval(async () => {
 console.log('Живое автообновление: запрашиваем сетку турнира...');
 await loadTournamentData();
 }, 30000);
 }
}

/* Вспомогательные функции */
function calculateKD(kills, deaths) {
 let k = kills || 0;
 let d = deaths || 0;
 if (d === 0) return k.toFixed(2);
 return (k / d).toFixed(2);
}

function getRoleIconSvg(role) {
 if (role === "Медик") return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M10 21v-7H3v-4h7V3h4v7h7v4h-7v7h-4z"/></svg>';
 if (role === "Инженер") return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M21.71 2.29a1 1 0 0 0-1.42 0l-3.53 3.53a4.5 4.5 0 0 0-4.8 1.06 4.5 4.5 0 0 0-1.06 4.8L3.29 19.3a1 1 0 0 0 0 1.41l1 1a1 1 0 0 0 1.41 0l7.61-7.61a4.5 4.5 0 0 0 4.8-1.06 4.5 4.5 0 0 0 1.06-4.8l3.54-3.54a1 1 0 0 0 0-1.41zM14 11a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 14 11z"/></svg>';
 if (role === "Командир") return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
 return '<svg class="role-icon-svg" viewBox="0 0 24 24"><path d="M5 10V19H7V10H5M5 8C5 6 6 4 6 4C6 4 7 6 7 8H5M11 10V19H13V10H11M11 8C11 6 12 4 12 4C12 4 13 6 13 8H11M17 10V19H19V10H17M17 8C17 6 18 4 18 4C18 4 19 6 19 8H17Z"/></svg>';
}
