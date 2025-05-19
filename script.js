
let respect = 0;
let respectPerClick = 1;
let passiveIncome = 0;

let stage = 'work';
let timeLeft = 60;
let respectGoal = 100;
let shiftCount = 0;
let eventActive = false;

const upgrades = [
  { name: "Энергетик", cost: 50, effect: () => respectPerClick += 1 },
  { name: "Гарнитура", cost: 200, effect: () => passiveIncome += 1 },
  { name: "Тимбилдинг", cost: 1000, effect: () => respectPerClick *= 2 },
];

const events = [
  {
    name: "🔧 Ломается клавиатура!",
    effect: () => respectPerClick = Math.max(1, Math.floor(respectPerClick / 2)),
    duration: 15
  },
  {
    name: "📞 Звонит клиент!",
    effect: () => respectPerClick = 0,
    duration: 10
  },
  {
    name: "🐌 Лаги системы!",
    effect: () => passiveIncome = 0,
    duration: 20
  }
];

function updateRespectDisplay() {
  document.getElementById("respect").innerText = respect;
}

function updateTimerDisplay() {
  document.getElementById("timer").innerText = `⏱ ${timeLeft}`;
}

function showMessage(text) {
  document.getElementById("message").innerText = text;
}

function generateShop() {
  const shop = document.getElementById("shop");
  shop.innerHTML = "";
  if (stage === 'pause') {
    upgrades.forEach((upg, index) => {
      const btn = document.createElement("button");
      btn.textContent = `${upg.name} — ${upg.cost} 💼`;
      btn.onclick = () => buyUpgrade(index);
      shop.appendChild(btn);
    });
  }
}

function buyUpgrade(index) {
  const upg = upgrades[index];
  if (respect >= upg.cost) {
    respect -= upg.cost;
    upg.effect();
    upgrades.splice(index, 1);
    updateRespectDisplay();
    generateShop();
  }
}

function applyRandomEvent() {
  const ev = events[Math.floor(Math.random() * events.length)];
  eventActive = true;
  showMessage(ev.name);
  ev.effect();
  setTimeout(() => {
    respectPerClick = Math.max(1, Math.floor(1 + shiftCount));
    passiveIncome = Math.floor(shiftCount / 2);
    showMessage("");
    eventActive = false;
  }, ev.duration * 1000);
}

function startMiniGame() {
  alert("🎮 Мини-игра! Быстро кликни 10 раз за 5 секунд!");
  let clicks = 0;
  const btn = document.getElementById("work-button");
  const listener = () => clicks++;
  btn.addEventListener("click", listener);

  setTimeout(() => {
    btn.removeEventListener("click", listener);
    if (clicks >= 10) {
      respect += 200;
      showMessage("🔥 Успех! +200 респекта");
    } else {
      showMessage("💤 Не успел!");
    }
  }, 5000);
}

document.getElementById("work-button").addEventListener("click", () => {
  if (stage === 'work') {
    respect += respectPerClick;
    updateRespectDisplay();
    document.getElementById("work-button").classList.add("shake");
    new Audio("assets/keyboard.mp3").play();
    setTimeout(() => {
      document.getElementById("work-button").classList.remove("shake");
    }, 100);
  }
});

setInterval(() => {
  if (stage === 'work') {
    timeLeft--;
    respect += passiveIncome;
    if (timeLeft <= 0) {
      if (respect >= respectGoal) {
        stage = 'pause';
        timeLeft = 60;
        shiftCount++;
        respectGoal = Math.floor(respectGoal * 1.4 + 30 * shiftCount);
        showMessage("🚬 Перекур! Прокачайся перед следующей сменой.");
        if (shiftCount % 2 === 0) applyRandomEvent();
        if (shiftCount % 3 === 0) setTimeout(startMiniGame, 1000);
      } else {
        showMessage("😡 Босс разозлился! Ты не успел!");
        timeLeft = 60;
        shiftCount = Math.max(0, shiftCount - 1);
        respectGoal = Math.max(100, Math.floor(respectGoal / 2));
        stage = 'pause';
      }
      generateShop();
    }
  } else if (stage === 'pause') {
    timeLeft--;
    if (timeLeft <= 0) {
      stage = 'work';
      timeLeft = 60;
      showMessage("");
      generateShop();
    }
  }
  updateRespectDisplay();
  updateTimerDisplay();
}, 1000);

generateShop();
updateRespectDisplay();
updateTimerDisplay();
