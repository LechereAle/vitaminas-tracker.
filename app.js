const STORAGE_KEY = "vitaminas_log_v1";

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (local-ish, good enough for daily habit)
}

function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLog(log) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

function dateDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function computeStreak(log) {
  let streak = 0;
  let cursor = new Date();
  // if today isn't marked yet, streak counts backwards from yesterday
  if (!log[todayStr(cursor)]) {
    cursor = dateDaysAgo(1);
  }
  while (log[todayStr(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderWeek(log) {
  const weekEl = document.getElementById("week");
  weekEl.innerHTML = "";
  const letters = ["D", "L", "M", "M", "J", "V", "S"];
  for (let i = 6; i >= 0; i--) {
    const d = dateDaysAgo(i);
    const key = todayStr(d);
    const done = !!log[key];
    const isToday = i === 0;
    const el = document.createElement("div");
    el.className = "day" + (done ? " done" : "") + (isToday ? " today" : "");
    el.innerHTML = `<span class="letter">${letters[d.getDay()]}</span><span class="dot"></span>`;
    weekEl.appendChild(el);
  }
}

function render() {
  const log = loadLog();
  const key = todayStr();
  const done = !!log[key];

  document.getElementById("streakNumber").textContent = computeStreak(log);

  const btn = document.getElementById("takeBtn");
  const status = document.getElementById("status");
  if (done) {
    btn.textContent = "✓ Ya tomaste hoy";
    btn.classList.add("done");
    status.textContent = "¡Buen trabajo! Volvé mañana.";
  } else {
    btn.textContent = "Tomé mis vitaminas hoy";
    btn.classList.remove("done");
    status.textContent = "";
  }

  renderWeek(log);
}

document.getElementById("takeBtn").addEventListener("click", () => {
  const log = loadLog();
  const key = todayStr();
  if (log[key]) return; // already done, nothing to undo accidentally
  log[key] = true;
  saveLog(log);
  render();
});

// Recordatorio: Safari en iPhone no permite programar notificaciones push
// reales sin un servidor. Pedimos permiso igual por si el navegador lo
// soporta, pero la vía confiable en iPhone es una Automatización de Atajos
// ("Hora del día" -> Abrir esta app) — se explica en el hint de abajo.
if ("Notification" in window && Notification.permission === "default") {
  document.getElementById("takeBtn").addEventListener(
    "click",
    () => Notification.requestPermission(),
    { once: true }
  );
}

document.getElementById("reminderHint").textContent =
  "Para que el iPhone te avise todos los días a una hora fija: app Atajos → Automatización → Nueva automatización personal → Hora del día → acción \"Abrir app\" (elegí esta, una vez agregada a tu pantalla de inicio).";

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
