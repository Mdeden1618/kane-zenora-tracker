// Zenora Mining Tracker — single-page app, no server needed.
// State is saved in localStorage so totals, timer and checklist survive reloads.

const SESSION_SECONDS = 8 * 60 * 60; // 8 hours = 28800 seconds

const REWARDS_KEY = 'zenoraRewards';
const TIMER_KEY = 'zenoraTimer';
const CHECKLIST_KEY = 'zenoraChecklist';
const CLAIMED_KEY = 'zenoraSessionsClaimed';

const DAILY_TASKS = [
  { id: 'claim-session', label: 'Claim finished mining session' },
  { id: 'start-session', label: 'Start a new 8-hour mining session' },
  { id: 'check-rewards', label: 'Check the Rewards menu for new tasks' },
  { id: 'complete-task', label: 'Complete 1 reward task' },
  { id: 'check-points', label: 'Check Node Points progress' }
];

// ---------- helpers ----------
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return h + ':' + m + ':' + sec;
}
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ---------- date ----------
document.getElementById('todayDate').textContent =
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ---------- rewards ----------
let rewards = loadJSON(REWARDS_KEY, []);

const rewardForm = document.getElementById('rewardForm');
const taskNameInput = document.getElementById('taskName');
const znrInput = document.getElementById('znrAmount');
const pointsInput = document.getElementById('pointsAmount');
const dateInput = document.getElementById('rewardDate');
const rewardList = document.getElementById('rewardList');
const emptyRewards = document.getElementById('emptyRewards');
const rewardMessage = document.getElementById('rewardMessage');

dateInput.value = todayISO();

function renderRewards() {
  const totalZnr = rewards.reduce((sum, r) => sum + Number(r.znr || 0), 0);
  const totalPoints = rewards.reduce((sum, r) => sum + Number(r.points || 0), 0);
  document.getElementById('totalZnr').textContent = totalZnr.toFixed(1);
  document.getElementById('totalPoints').textContent = totalPoints.toFixed(1);
  document.getElementById('rewardCount').textContent = String(rewards.length);

  rewardList.innerHTML = '';
  emptyRewards.style.display = rewards.length === 0 ? 'block' : 'none';

  // Newest first
  const sorted = rewards.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  sorted.forEach(function (r) {
    const li = document.createElement('li');
    const info = document.createElement('div');
    info.className = 'reward-info';
    const name = document.createElement('div');
    name.textContent = r.task;
    const date = document.createElement('div');
    date.className = 'reward-date';
    date.textContent = r.date;
    info.appendChild(name);
    info.appendChild(date);

    const amounts = document.createElement('div');
    amounts.className = 'reward-amounts';
    amounts.textContent = '+' + Number(r.znr).toFixed(1) + ' $ZNR · +' + Number(r.points).toFixed(1) + ' pts';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete-btn';
    del.textContent = 'Delete';
    del.setAttribute('data-id', String(r.id));
    del.addEventListener('click', function () {
      rewards = rewards.filter(function (x) { return x.id !== r.id; });
      saveJSON(REWARDS_KEY, rewards);
      renderRewards();
    });

    li.appendChild(info);
    li.appendChild(amounts);
    li.appendChild(del);
    rewardList.appendChild(li);
  });
}

rewardForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const task = taskNameInput.value.trim();
  const znr = parseFloat(znrInput.value);
  const points = parseFloat(pointsInput.value);
  const date = dateInput.value || todayISO();
  if (!task || isNaN(znr) || isNaN(points) || znr < 0 || points < 0) {
    rewardMessage.textContent = 'Please fill in task name, $ZNR and Node Points.';
    return;
  }
  rewards.push({ id: Date.now(), task: task, znr: znr, points: points, date: date });
  saveJSON(REWARDS_KEY, rewards);
  renderRewards();
  rewardMessage.textContent = 'Reward added: ' + task;
  rewardForm.reset();
  dateInput.value = todayISO();
  taskNameInput.focus();
});

// ---------- timer ----------
const startBtn = document.getElementById('startBtn');
const claimBtn = document.getElementById('claimBtn');
const resetBtn = document.getElementById('resetBtn');
const simulateBtn = document.getElementById('simulateFinishBtn');
const timerDisplay = document.getElementById('timerDisplay');
const timerStatus = document.getElementById('timerStatus');
const progressBar = document.getElementById('sessionProgress');
const progressText = document.getElementById('progressText');
const timerMessage = document.getElementById('timerMessage');

let timerState = loadJSON(TIMER_KEY, { status: 'idle', endTime: null });
let sessionsClaimed = Number(localStorage.getItem(CLAIMED_KEY) || '0');
document.getElementById('sessionsClaimed').textContent = String(sessionsClaimed);

function saveTimer() { saveJSON(TIMER_KEY, timerState); }

function updateTimerUI() {
  const now = Date.now();
  if (timerState.status === 'running' && timerState.endTime) {
    const remaining = Math.max(0, Math.floor((timerState.endTime - now) / 1000));
    if (remaining <= 0) {
      timerState.status = 'finished';
      saveTimer();
    } else {
      timerDisplay.textContent = formatTime(remaining);
      const elapsed = SESSION_SECONDS - remaining;
      const pct = Math.min(100, Math.round((elapsed / SESSION_SECONDS) * 100));
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '% complete';
      timerStatus.textContent = 'Mining in progress. Session ends when the timer reaches 00:00:00.';
      startBtn.disabled = true;
      claimBtn.disabled = true;
      return;
    }
  }
  if (timerState.status === 'finished') {
    timerDisplay.textContent = '00:00:00';
    progressBar.style.width = '100%';
    progressText.textContent = '100% complete';
    timerStatus.textContent = 'Session complete! Tap Claim Session to claim it.';
    startBtn.disabled = true;
    claimBtn.disabled = false;
    return;
  }
  // idle
  timerDisplay.textContent = '08:00:00';
  progressBar.style.width = '0%';
  progressText.textContent = '0% complete';
  timerStatus.textContent = 'Ready to start a new 8-hour session.';
  startBtn.disabled = false;
  claimBtn.disabled = true;
}

startBtn.addEventListener('click', function () {
  timerState = { status: 'running', endTime: Date.now() + SESSION_SECONDS * 1000 };
  saveTimer();
  timerMessage.textContent = 'Session started. Good luck mining!';
  updateTimerUI();
});

claimBtn.addEventListener('click', function () {
  if (timerState.status !== 'finished') return;
  sessionsClaimed += 1;
  localStorage.setItem(CLAIMED_KEY, String(sessionsClaimed));
  document.getElementById('sessionsClaimed').textContent = String(sessionsClaimed);
  timerState = { status: 'idle', endTime: null };
  saveTimer();
  timerMessage.textContent = 'Session claimed! Start a new session when you are ready.';
  updateTimerUI();
});

resetBtn.addEventListener('click', function () {
  timerState = { status: 'idle', endTime: null };
  saveTimer();
  timerMessage.textContent = 'Timer reset. Ready to start again.';
  updateTimerUI();
});

// Test helper: finishes the session in 3 seconds so the Claim flow can be tested.
simulateBtn.addEventListener('click', function () {
  timerState = { status: 'running', endTime: Date.now() + 3000 };
  saveTimer();
  timerMessage.textContent = 'Test mode: session will finish in 3 seconds.';
  updateTimerUI();
});

setInterval(updateTimerUI, 1000);

// ---------- checklist ----------
const checklistEl = document.getElementById('checklist');
const checklistProgress = document.getElementById('checklistProgress');
let checked = loadJSON(CHECKLIST_KEY, {});

function renderChecklist() {
  checklistEl.innerHTML = '';
  let done = 0;
  DAILY_TASKS.forEach(function (t) {
    const isDone = !!checked[t.id];
    if (isDone) done += 1;
    const li = document.createElement('li');
    if (isDone) li.className = 'done';
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = isDone;
    cb.setAttribute('data-task', t.id);
    cb.addEventListener('change', function () {
      checked[t.id] = cb.checked;
      saveJSON(CHECKLIST_KEY, checked);
      renderChecklist();
    });
    const span = document.createElement('span');
    span.textContent = t.label;
    label.appendChild(cb);
    label.appendChild(span);
    li.appendChild(label);
    checklistEl.appendChild(li);
  });
  checklistProgress.textContent = done + ' of ' + DAILY_TASKS.length + ' done';
}

document.getElementById('resetChecklistBtn').addEventListener('click', function () {
  checked = {};
  saveJSON(CHECKLIST_KEY, checked);
  renderChecklist();
});

// ---------- init ----------
renderRewards();
renderChecklist();
updateTimerUI();
