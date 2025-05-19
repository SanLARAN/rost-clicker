// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let reputation = 0;
let repPerClick = 1;
let passiveIncome = 0;
let adhdLevel = 100;       // от 0 до 100
let adhdMax = 100;

let stage = 'work';        // 'work' либо 'pause'
let workTimer = 60;        // сек
let pauseTimer = 60;       // сек
let shiftCount = 0;
let repGoal = 100;

let eventTimeout = null;
let eventActive = false;
let spinnerActive = false;
let spinnerProgress = 0;
let spinnerInterval = null;
let adhdDrainRate = 1;     // единиц за сек

// === ЭЛЕМЕНТЫ DOM ===
const menuButton    = document.getElementById('menu-button');
const menuPanel     = document.getElementById('menu');
const reputationEl  = document.getElementById('reputation');
const characterImg  = document.getElementById('characterImg');
const shiftTimerEl  = document.getElementById('shiftTimer');
const adhdBar       = document.getElementById('adhd-bar');
const clickButton   = document.getElementById('click-button');
const upgradesEl    = document.getElementById('upgrades');
const eventEl       = document.getElementById('event');
const acceptBtn     = document.getElementById('acceptBtn');
const declineBtn    = document.getElementById('declineBtn');
const tiktokEl      = document.getElementById('tiktok');
const energyDrinkEl = document.getElementById('energy-drink');
const restartBtn    = document.getElementById('restartBtn');
const openTiktokBtn = document.getElementById('openTiktokBtn');
const musicVolume   = document.getElementById('musicVolume');
const sfxVolume     = document.getElementById('sfxVolume');
const spinnerCont   = document.getElementById('spinner-container');
const spinnerProg   = document.getElementById('spinner-progress');

// === АУДИО ===
const audioClick    = new Audio('assets/audio/click.mp3');
const audioKeyboard = new Audio('assets/audio/keyboard.mp3');
const audioMusic    = new Audio('assets/audio/music.mp3');
const audioCall     = new Audio('assets/audio/call.mp3');
const audioEnergy   = new Audio('assets/audio/energy.mp3');
const audioBoss     = new Audio('assets/audio/boss.mp3');
const audioTiktok   = new Audio('assets/audio/tiktok.mp3');

audioMusic.loop = true;
audioMusic.volume = musicVolume.value;
audioMusic.play();

// === ПРОКАЧКИ ===
let upgrades = [
  { name: "Энергетик", cost: 50, effect: () => activateEnergy(), owned: false },
  { name: "Гарнитура", cost: 200, effect: () => passiveIncome += 1, owned: false },
  { name: "Эксель-Мастер", cost: 500, effect: () => repPerClick += 1, owned: false },
  { name: "Тимбилдинг", cost: 1000, effect: () => repPerClick *= 2, owned: false }
];

// === ИВЕНТЫ ===
const events = [
  { name: "🔧 Ломается клавиатура!",   effect: () => repPerClick = Math.max(1, Math.floor(repPerClick / 2)),   duration: 15 },
  { name: "📞 Звонит клиент!",           effect: () => repPerClick = 0,                                           duration: 10 },
  { name: "🐌 Лаги системы!",            effect: () => passiveIncome = 0,                                        duration: 20 }
];

// === ИНИЦИАЛИЗАЦИЯ ===
function initGame() {
  reputation = 0;
  repPerClick = 1;
  passiveIncome = 0;
  adhdLevel = adhdMax;
  stage = 'work';
  workTimer = 60;
  pauseTimer = 60;
  shiftCount = 0;
  repGoal = 100;
  eventActive = false;
  spinnerActive = false;
  spinnerProgress = 0;
  clearInterval(spinnerInterval);
  audioMusic.currentTime = 0;
  audioMusic.play();
  generateUpgrades();
  updateDisplayAll();
  scheduleEventCheck();
}

// === ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ ===
function updateDisplayAll() {
  reputationEl.innerText = `РЕПУТАЦИЯ: ${reputation}`;
  shiftTimerEl.innerText = formatTime(stage === 'work' ? workTimer : pauseTimer);
  adhdBar.style.width = `${adhdLevel}%`;
}
function formatTime(sec) {
  let m = Math.floor(sec / 60);
  let s = sec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// === ГЕНЕРАЦИЯ СПИСКА ПРОКАЧЕК ===
function generateUpgrades() {
  upgradesEl.innerHTML = '';
  upgrades.forEach((upg, idx) => {
    if (!upg.owned) {
      const btn = document.createElement('button');
      btn.innerText = `${upg.name} — ${upg.cost}`;
      btn.onclick = () => buyUpgrade(idx);
      if (reputation < upg.cost) btn.disabled = true;
      upgradesEl.appendChild(btn);
    }
  });
}

function buyUpgrade(idx) {
  let upg = upgrades[idx];
  if (reputation >= upg.cost && !upg.owned) {
    reputation -= upg.cost;
    upg.effect();
    upg.owned = true;
    if (upg.name === "Энергетик") {
      energyDrinkEl.classList.remove('disabled');
    }
    generateUpgrades();
    updateDisplayAll();
    playSfx(audioClick);
  }
}

// === КНОПКА «КЛАЦ» ===
clickButton.addEventListener('click', () => {
  if (stage !== 'work' || eventActive || spinnerActive) return;
  if (adhdLevel <= 0) return;
  reputation += repPerClick;
  playSfx(audioKeyboard);
  clickButton.classList.add('pressed');
  setTimeout(() => clickButton.classList.remove('pressed'), 100);
  updateDisplayAll();
});

// === ОБЩИЙ ЦИКЛ ИГРЫ (каждую секунду) ===
setInterval(() => {
  if (stage === 'work' && !eventActive && !spinnerActive) {
    // уменьшение таймера рабочей смены
    workTimer--;
    // пассивный доход
    reputation += passiveIncome;
    // уменьшение шкалы СДВГ
    adhdLevel = Math.max(0, adhdLevel - adhdDrainRate);
    // проверка конца смены
    if (workTimer <= 0) {
      if (reputation >= repGoal) {
        // УСПЕХ: перерыв
        enterPause(true);
      } else {
        // ПРОВАЛ: босс разозлился
        playSfx(audioBoss);
        enterPause(false);
      }
    }
    updateDisplayAll();
  } else if (stage === 'pause') {
    pauseTimer--;
    if (pauseTimer <= 0) {
      // Начинаем новую смену
      enterWork();
    }
    updateDisplayAll();
  }
}, 1000);

// === ЗАПУСК РАБОЧЕЙ СМЕНЫ ===
function enterWork() {
  stage = 'work';
  workTimer = Math.max(30, 60 - 5 * shiftCount); // прогрессия сложности: каждая смена короче
  pauseTimer = 60;
  shiftCount++;
  repGoal = Math.floor(repGoal * 1.3 + 20 * shiftCount);
  eventActive = false;
  spinnerActive = false;
  adhdDrainRate = 1 + Math.floor(shiftCount / 2); // шкала убывает быстрее
  generateUpgrades();
  updateDisplayAll();
  scheduleEventCheck();
}

// === ЗАПУСК ПЕРЕРЫВА ===
function enterPause(success) {
  stage = 'pause';
  pauseTimer = 60; // 1 минута перерыва
  workTimer = 0;
  eventActive = false;
  spinnerActive = false;
  generateUpgrades();
  updateDisplayAll();
  if (success) {
    // При успешной смене шанс ивента
    if (shiftCount % 2 === 0) triggerRandomEvent();
    if (shiftCount % 3 === 0) setTimeout(startSpinnerGame, 1000);
  } else {
    // При провале даём минус в репутации
    reputation = Math.max(0, reputation - Math.floor(repGoal / 2));
    updateDisplayAll();
  }
}

// === СЛУЧАЙНЫЙ ИВЕНТ ===
function triggerRandomEvent() {
  if (eventActive || spinnerActive) return;
  eventActive = true;
  let ev = events[Math.floor(Math.random() * events.length)];
  eventEl.querySelector('p').innerText = ev.name;
  eventEl.classList.remove('hidden');
  playSfx(audioCall);
  // Функция клика «Отклонить»
  declineBtn.onclick = () => {
    eventEl.classList.add('hidden');
    eventActive = false;
    clearTimeout(eventTimeout);
  };
  // Функция клика «Принять»
  acceptBtn.onclick = () => {
    eventEl.classList.add('hidden');
    ev.effect();
    setTimeout(() => {
      // Восстанавливаем базовые значения после ивента
      repPerClick = Math.max(1, repPerClick);
      passiveIncome = Math.floor(shiftCount / 2);
      eventActive = false;
      updateDisplayAll();
    }, ev.duration * 1000);
  };
  // Если не нажали за 10 сек, событие пропадает
  eventTimeout = setTimeout(() => {
    eventEl.classList.add('hidden');
    eventActive = false;
  }, 10000);
}

// === МИНИ-ИГРА: РАСКРУТИ КОЛЕСО ===
function startSpinnerGame() {
  if (spinnerActive || eventActive) return;
  spinnerActive = true;
  spinnerProgress = 0;
  spinnerProg.style.width = '0%';
  spinnerCont.style.display = 'block';
  // По нажатию на «КЛАЦ» добавляем прогресс
  clickButton.addEventListener('click', spinnerClick);
  // Каждую секунду замедляем прогресс
  spinnerInterval = setInterval(() => {
    spinnerProgress = Math.max(0, spinnerProgress - 2);
    spinnerProg.style.width = spinnerProgress + '%';
    if (!spinnerActive) clearInterval(spinnerInterval);
  }, 500);

  // Если не успели за 10 сек, мини‑игра заканчивается
  setTimeout(endSpinnerGame, 10000);
}
function spinnerClick() {
  if (!spinnerActive) return;
  spinnerProgress = Math.min(100, spinnerProgress + 10);
  spinnerProg.style.width = spinnerProgress + '%';
  if (spinnerProgress >= 100) {
    // Выигрыш: даём большой бонус репутации
    reputation += 200;
    updateDisplayAll();
    endSpinnerGame();
  }
}
function endSpinnerGame() {
  spinnerActive = false;
  spinnerCont.style.display = 'none';
  clickButton.removeEventListener('click', spinnerClick);
  clearInterval(spinnerInterval);
}

// === ШЕДУЛЕР ДЛЯ ИВЕНТОВ (СЛУЧАЙНЫХ ЗВОНОК) ===
function scheduleEventCheck() {
  if (stage !== 'work') return;
  let t = Math.random() * (workTimer - 5) * 1000; // между 0 и workTimer-5 сек
  setTimeout(() => {
    if (stage === 'work' && !eventActive && !spinnerActive) triggerRandomEvent();
  }, t);
}

// === ЭНЕРГЕТИК ===
function activateEnergy() {
  if (adhdLevel >= adhdMax) return;
  playSfx(audioEnergy);
  adhdBar.style.background = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
  adhdLevel = adhdMax;
  updateDisplayAll();
  setTimeout(() => {
    adhdBar.style.background = 'white';
  }, 10000);
}
energyDrinkEl.onclick = () => {
  let upg = upgrades.find(u => u.name === "Энергетик");
  if (upg && upg.owned) {
    activateEnergy();
  }
};

// === ОТКРЫТИЕ/ЗАКРЫТИЕ TIKTOK ===
openTiktokBtn.onclick = () => {
  tiktokEl.classList.remove('hidden');
  playSfx(audioTiktok);
};
tiktokEl.onclick = () => {
  tiktokEl.classList.add('hidden');
  adhdLevel = Math.min(adhdMax, adhdLevel + 30);
  updateDisplayAll();
};

// === РЕСТАРТ ИГРЫ ===
restartBtn.onclick = () => {
  initGame();
};

// === РЕГУЛЯЦИЯ ГРОМКОСТИ ===
musicVolume.oninput = () => {
  audioMusic.volume = musicVolume.value;
};
sfxVolume.oninput = () => {
  [audioClick, audioKeyboard, audioCall, audioEnergy, audioBoss, audioTiktok].forEach(a => a.volume = sfxVolume.value);
};

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ЗВУКОВ ===
function playSfx(audio) {
  audio.currentTime = 0;
  audio.play();
}

// === СВАЙП ВВЕРХ: ОТКРЫТЬ TIKTOK ===
let touchStartY = null;
document.body.addEventListener('touchstart', e => {
  touchStartY = e.changedTouches[0].clientY;
});
document.body.addEventListener('touchend', e => {
  let dy = touchStartY - e.changedTouches[0].clientY;
  if (dy > 50) {
    tiktokEl.classList.remove('hidden');
    playSfx(audioTiktok);
  }
});

// === СТАРТ ИГРЫ ===
window.onload = () => {
  tiktokEl.classList.add('hidden');
  initGame();
};
