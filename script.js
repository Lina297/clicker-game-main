// --- Game State ---
let score = 0;
let clickPower = 1;
let autoPower = 0;

const upgrades = {
    toy:    { id: 'toy',    price: 150,   gain: 1,  type: 'click' },
    milk:   { id: 'milk',   price: 1000,  gain: 3,  type: 'click' },
    box:    { id: 'box',    price: 500,   gain: 1,  type: 'auto' },
    bed:    { id: 'bed',    price: 2500,  gain: 5,  type: 'auto' },
    friend: { id: 'friend', price: 10000, gain: 20, type: 'auto' }
};

// --- Achievements Definition ---
const achievements = [
    { id: 'first_click', text: "First Nibble", desc: "Collect your first item", condition: () => score >= 1, unlocked: false },
    { id: 'hundred_club', text: "Century Cat", desc: "Collect 100 items", condition: () => score >= 100, unlocked: false },
    { id: 'thousand_king', text: "Hoarder", desc: "Collect 1,000 items", condition: () => score >= 1000, unlocked: false },
    { id: 'auto_pilot', text: "Hands Free", desc: "Get your first Auto Bot", condition: () => autoPower >= 1, unlocked: false },
    { id: 'click_master', text: "Power Paw", desc: "Reach 10 CPC (Click Power)", condition: () => clickPower >= 10, unlocked: false }
];

let meterValue = 0;
const METER_MAX = 100;
const METER_DECAY = 10;
const METER_GAIN = 20;
let hasMultiplier = false;

const elScore = document.getElementById('score');
const elCpc = document.getElementById('cpc-display');
const elCps = document.getElementById('cps-display');
const elRank = document.getElementById('rank-display');
const clickPad = document.getElementById('click-pad');
const elMeter = document.getElementById('multiplier-meter');
const achListContainer = document.getElementById('achievements-list');
const clickSound = new Audio('./sounds/click_002.ogg'); // Ensure you have a click sound at this path

clickPad.addEventListener('click', (e) => {
    // --- SOUND START ---
    const sound = clickSound.cloneNode(); // Allows overlapping sounds for fast clicking
    sound.volume = 0.5; // Optional: Set volume (0.0 to 1.0)
    sound.play();
    // --- SOUND END ---

    let currentMultiplier = (meterValue >= 80) ? 2 : 1; 
    let totalGain = clickPower * currentMultiplier;
    score += totalGain;
    
    meterValue = Math.min(meterValue + METER_GAIN, METER_MAX);
    
    updateUI();
    checkAchievements();

    showFloatingText(e.clientX, e.clientY, `+${totalGain}${currentMultiplier > 1 ? ' x2!' : ''}`);

    spawnCatRain(e.clientX, e.clientY);
    spawnCatRain(e.clientX, e.clientY);
    spawnCatRain(e.clientX, e.clientY);
});

setInterval(() => {
    if (meterValue > 0) meterValue -= METER_DECAY;
    else meterValue = 0;

    if (meterValue >= 80) {
        hasMultiplier = true;
        elMeter.parentElement.classList.add('multiplier-active');
    } else {
        hasMultiplier = false;
        elMeter.parentElement.classList.remove('multiplier-active');
    }
    elMeter.style.width = `${meterValue}%`;
}, 100);

for (const key in upgrades) {
    const item = upgrades[key];
    const btn = document.getElementById(`btn-${key}`);
    if (btn) {
        btn.addEventListener('click', () => {
            if (score >= item.price) {
                score -= item.price;
                if (item.type === 'click') clickPower += item.gain;
                else autoPower += item.gain;
                item.price = Math.floor(item.price * 1.5);
                updateUI();
                checkAchievements(); 
            }
        });
    }
}

const clickSound = new Audio('./sounds/miauw.mp3');
clickSound.playbackSpeed = 2.0;

function checkAchievements() {
    achievements.forEach(ach => {
        if (!ach.unlocked && ach.condition()) {
            ach.unlocked = true;
            renderAchievements();
            // You can add a toast notification here if you want
        }
    });
}

function renderAchievements() {
    if (!achListContainer) return;
    achListContainer.innerHTML = ''; 
    achievements.forEach(ach => {
        const item = document.createElement('div');
        item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;
        item.innerHTML = `
            <strong>${ach.unlocked ? ach.text : '???'}</strong>
            <p>${ach.unlocked ? ach.desc : 'Locked milestone'}</p>
        `;
        achListContainer.appendChild(item);
    });
}

// --- UI & Logic Functions ---
function updateUI() {
    elScore.innerText = Math.floor(score).toLocaleString();
    if (elCpc) elCpc.innerText = clickPower;
    if (elCps) elCps.innerText = autoPower;

    for (const key in upgrades) {
        const item = upgrades[key];
        const btn = document.getElementById(`btn-${key}`);
        const costLabel = document.getElementById(`cost-${key}`);
        if (costLabel) costLabel.innerText = item.price.toLocaleString();
        if (btn) btn.disabled = (score < item.price);
    }
    updateRank();
}

function updateRank() {
    let rank = "Stray Kitten";
    if (score > 100) rank = "House Cat";
    if (score > 500) rank = "Tabby Collector";
    if (score > 1000) rank = "Cat Lover";
    if (score > 5000) rank = "Crazy Cat Lady";
    if (score > 20000) rank = "Cat Queen";
    if (elRank) elRank.innerText = rank;
}

function showFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// --- RAIN FUNCTION ---
function spawnCatRain(x, y) {
    const cat = document.createElement('img');
    cat.src = './images/download-removebg-preview.png'; 
    cat.className = 'falling-cat';
    
    // Random Start Offset
    const startOffsetX = (Math.random() - 0.5) * 50;
    const startOffsetY = (Math.random() - 0.5) * 50;
    cat.style.left = `${x + startOffsetX}px`;
    cat.style.top = `${y + startOffsetY}px`;

    // CSS Variables for Random Fall
    const randomXSpread = (Math.random() - 0.5) * 400; 
    const randomRot = (Math.random() - 0.5) * 360;

    cat.style.setProperty('--endX', `${randomXSpread}px`);
    cat.style.setProperty('--endRot', `${randomRot}deg`);

    document.body.appendChild(cat);

    setTimeout(() => {
        cat.remove();
    }, 1500);
}

// --- Auto Clicker Loop ---
setInterval(() => {
    if (autoPower > 0) {
        score += autoPower;
        updateUI();
        checkAchievements(); 
    }
}, 1000);

// --- Modal Logic ---
const modal = document.getElementById('achievements-modal');
const achBtn = document.getElementById('achievements-toggle');
const closeBtn = document.getElementById('close-modal');

if (achBtn) achBtn.onclick = () => {
    renderAchievements(); 
    modal.style.display = 'flex';
};
if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

// Initial calls
updateUI();
renderAchievements();