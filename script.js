
let respect = 0;
let adhdLevel = 100;
let adhdInterval;
let adhdBar = document.getElementById("adhd-bar");

function updateRespect(amount) {
    respect += amount;
    document.getElementById("respect").innerText = respect;
}

document.getElementById("click-button").addEventListener("click", () => {
    updateRespect(1);
});

document.getElementById("menu-button").addEventListener("click", () => {
    document.getElementById("menu").classList.toggle("hidden");
});

function restartGame() {
    respect = 0;
    document.getElementById("respect").innerText = respect;
}

function useEnergyDrink() {
    adhdLevel = 100;
    adhdBar.style.background = "linear-gradient(90deg, red, orange, yellow, green, blue, violet)";
    setTimeout(() => {
        adhdBar.style.background = "#0ff";
    }, 10000);
}

function decreaseADHD() {
    adhdInterval = setInterval(() => {
        adhdLevel -= 0.2;
        if (adhdLevel < 0) adhdLevel = 0;
        adhdBar.style.width = adhdLevel + "%";
    }, 100);
}
decreaseADHD();
