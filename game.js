const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const FISH = [
  { name: 'Lambari', emoji: '🐟', rarity: 'Comum', chance: 42, value: 18, hp: 72, atk: 8, speed: 7, color: '#71c7bb' },
  { name: 'Tilápia', emoji: '🐠', rarity: 'Comum', chance: 26, value: 28, hp: 86, atk: 9, speed: 6, color: '#dfb449' },
  { name: 'Traíra', emoji: '🐟', rarity: 'Raro', chance: 16, value: 55, hp: 104, atk: 13, speed: 7, color: '#7f6abe' },
  { name: 'Dourado', emoji: '🐠', rarity: 'Épico', chance: 9, value: 105, hp: 120, atk: 17, speed: 9, color: '#e39134' },
  { name: 'Pirarucu', emoji: '🐡', rarity: 'Épico', chance: 5, value: 160, hp: 150, atk: 19, speed: 5, color: '#c85d62' },
  { name: 'Bagre Fantasma', emoji: '🐟', rarity: 'Lendário', chance: 2, value: 330, hp: 172, atk: 25, speed: 10, color: '#62d6df' }
];
const fighterSprite = new Image();
fighterSprite.src = 'assets/peixe-lutador-spritesheet.png';
let walkingSprite = null;
const walkingSource = new Image();
walkingSource.onload = () => {
  const sheet = document.createElement('canvas'); sheet.width = walkingSource.naturalWidth; sheet.height = walkingSource.naturalHeight;
  const sx = sheet.getContext('2d', { willReadFrequently: true }); sx.drawImage(walkingSource, 0, 0);
  const pixels = sx.getImageData(0, 0, sheet.width, sheet.height), d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const hi = Math.max(d[i], d[i + 1], d[i + 2]), lo = Math.min(d[i], d[i + 1], d[i + 2]);
    if (hi - lo < 14 && lo > 118 && hi < 238) d[i + 3] = 0;
  }
  sx.putImageData(pixels, 0, 0); walkingSprite = sheet;
};
walkingSource.src = 'assets/peixe-lutador-andando.png';
const speciesSprites = {};
const SPECIES_SHEETS = {
  Lambari: 'assets/lutador-lambari.png',
  'Tilápia': 'assets/lutador-tilapia.png',
  'Traíra': 'assets/lutador-traira.png',
  Dourado: 'assets/lutador-dourado.png',
  Pirarucu: 'assets/lutador-pirarucu.png',
  'Bagre Fantasma': 'assets/lutador-bagre-fantasma.png',
  'Boss Rei Carniça': 'assets/boss-rei-carnica.png',
  'Boss Barão do Lodo': 'assets/boss-barao-lodo.png',
  'Boss Voltágua': 'assets/boss-voltagua.png'
};
Object.entries(SPECIES_SHEETS).forEach(([name, src]) => {
  const image = new Image();
  image.onload = () => {
    const prepared = prepareSpeciesSheet(image);
    if (prepared.valid) speciesSprites[name] = prepared;
  };
  image.src = src;
});

function prepareSpeciesSheet(image) {
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height), d = pixels.data, w = canvas.width, h = canvas.height;
  const cellW = w / 3, cellH = h / 2, bounds = [], framePixels = [];
  for (let frame = 0; frame < 6; frame++) {
    const col = frame % 3, row = (frame / 3) | 0, x0 = Math.floor(col * cellW), y0 = Math.floor(row * cellH), x1 = Math.ceil((col + 1) * cellW), y1 = Math.ceil((row + 1) * cellH);
    let minX = x1, minY = y1, maxX = x0, maxY = y0, count = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (d[(y * w + x) * 4 + 3] > 24) { count++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    framePixels.push(count);
    bounds.push(maxX > minX ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : { x: x0, y: y0, w: cellW, h: cellH });
  }
  const valid = framePixels.every(count => count > 1800 && count < cellW * cellH * .72);
  return { canvas, bounds, valid };
}
const BATTLE_HP_MULTIPLIER = 1.75;
const BOSS_HP_BONUS = 10;
const BOSS_DAMAGE_BONUS = 10;
const BOSSES = [
  { name: 'Rei Carniça', spriteKey: 'Boss Rei Carniça', emoji: '👑', hp: 250, atk: 23, speed: 10, weight: 8, reward: 450 },
  { name: 'Barão do Lodo', spriteKey: 'Boss Barão do Lodo', emoji: '🪨', hp: 340, atk: 20, speed: 4, weight: 12, reward: 520 },
  { name: 'Voltágua', spriteKey: 'Boss Voltágua', emoji: '⚡', hp: 230, atk: 26, speed: 12, weight: 7, reward: 560 }
];
const rarityClass = r => r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const baseState = { money: 70, rod: 1, reel: 1, wins: 0, catches: 0, fightsSinceBoss: 0, bossesFaced: 0, bossWins: 0, inventory: [] };
let state;
try { state = { ...baseState, ...JSON.parse(localStorage.getItem('rinhaDoRio')) }; } catch { state = { ...baseState }; }
const save = () => localStorage.setItem('rinhaDoRio', JSON.stringify(state));

function showView(id) {
  if (battle.running && id !== 'arena') return toast('Termine a luta primeiro!');
  $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === id));
  if (id === 'inventory') renderInventory();
  if (id === 'shop') renderShop();
  if (id === 'arena' && !battle.running) renderFighters();
}
$$('[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

function updateHud() {
  $('#money').textContent = state.money;
  $('#fishCount').textContent = state.inventory.length;
  $('#rodQuick').textContent = `Nível ${state.rod}`;
  $('#reelQuick').textContent = `Nível ${state.reel}`;
  $('#winsQuick').textContent = state.wins;
  save();
}

function fishCard(f, mode = 'inventory') {
  const el = document.createElement('article');
  el.className = 'fish-card';
  el.innerHTML = `<div class="fish-art" style="background:linear-gradient(150deg,#d2eee4,${f.color})"><span class="rarity ${rarityClass(f.rarity)}">${f.rarity}</span><span class="fish-sprite">${f.emoji}</span></div>
    <div class="fish-info"><h3>${f.name}</h3><div class="fish-meta"><span>${f.weight.toFixed(1)} kg</span><span>Qualidade ${'★'.repeat(f.quality)}</span></div>
    <div class="stats"><span>❤️ Vida <b>${Math.round(f.hp * BATTLE_HP_MULTIPLIER)}</b></span><span>⚔️ Ataque <b>${f.atk}</b></span><span>💨 Agilidade <b>${f.speed}</b></span><span>🪙 Valor <b>${f.sell}</b></span></div>
    ${mode === 'inventory' ? `<div class="card-actions"><button class="sell-btn">Vender ${f.sell} 🪙</button><button class="fight-btn">Rinha!</button></div>` : `<div class="card-actions"><button class="fight-btn">Escolher campeão</button></div>`}</div>`;
  if (mode === 'inventory') {
    $('.sell-btn', el).onclick = () => sellFish(f.id);
    $('.fight-btn', el).onclick = () => { showView('arena'); setTimeout(() => startBattle(f.id), 100); };
  } else $('.fight-btn', el).onclick = () => startBattle(f.id);
  return el;
}

function renderInventory() {
  const grid = $('#inventoryGrid'); grid.innerHTML = '';
  state.inventory.forEach(f => grid.append(fishCard(f)));
  $('#emptyInventory').classList.toggle('hidden', state.inventory.length > 0);
}
function renderFighters() {
  $('#arenaSelect').classList.remove('hidden'); $('#battleWrap').classList.add('hidden');
  const grid = $('#fighterGrid'); grid.innerHTML = '';
  state.inventory.forEach(f => grid.append(fishCard(f, 'fighter')));
  $('#emptyFighters').classList.toggle('hidden', state.inventory.length > 0);
  const ready = state.fightsSinceBoss >= 5, remaining = Math.max(0, 5 - state.fightsSinceBoss);
  $('#bossTracker').classList.toggle('ready', ready);
  $('#bossTrackerText').textContent = ready ? 'BOSS PRONTO — escolha seu campeão!' : `${remaining} luta${remaining === 1 ? '' : 's'} até o próximo boss`;
  $('#bossPips').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < state.fightsSinceBoss ? 'on' : ''}"></i>`).join('');
}
function sellFish(id) {
  const idx = state.inventory.findIndex(f => f.id === id); if (idx < 0) return;
  const [f] = state.inventory.splice(idx, 1); state.money += f.sell; updateHud(); renderInventory();
  toast(`${f.name} vendido por ${f.sell} moedas!`);
}

function renderShop() {
  const configs = [['rod', 'Vara', 90, 'buyRod', 20], ['reel', 'Molinete', 75, 'buyReel', 5]];
  configs.forEach(([key, name, base, buttonId, maxLevel]) => {
    const lvl = state[key], growth = key === 'rod' ? 1.32 : 1.75, cost = Math.round(base * Math.pow(growth, lvl - 1));
    $(`#${key}Level`).textContent = `NÍVEL ${lvl}`;
    $(`#${key}Segments`).innerHTML = Array.from({ length: maxLevel }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    const btn = $(`#${buttonId}`);
    btn.textContent = lvl >= maxLevel ? 'MÁXIMO' : `MELHORAR · ${cost} 🪙`;
    btn.disabled = lvl >= maxLevel || state.money < cost;
    btn.onclick = () => { if (state.money < cost || state[key] >= maxLevel) return; state.money -= cost; state[key]++; updateHud(); renderShop(); toast(`${name} melhorado para o nível ${state[key]}!`); };
  });
}

let toastTimer;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400); }

const FISH_TRACK_HEIGHT = 350;
const fishing = { active: false, preparing: false, holding: false, zone: 0, vel: 0, fish: 160, target: 160, progress: 12, last: 0, difficulty: 1, raf: 0 };
function chooseFish() {
  const rarityBoost = (state.rod - 1) * 4;
  const weights = FISH.map((f, i) => Math.max(1, f.chance + (i < 2 ? -rarityBoost : rarityBoost * (i / 8))));
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0), chosen = FISH[0];
  for (let i = 0; i < FISH.length; i++) { roll -= weights[i]; if (roll <= 0) { chosen = FISH[i]; break; } }
  const quality = Math.min(5, 1 + Math.floor(Math.random() * Math.max(1, state.rod + 1)));
  const weight = +(0.35 + Math.random() * (1.5 + FISH.indexOf(chosen) * 1.25) + state.rod * .08).toFixed(1);
  const mult = 1 + (quality - 1) * .09 + weight * .025;
  return { ...chosen, id: Date.now() + Math.random(), quality, weight, hp: Math.round(chosen.hp * mult), atk: Math.round(chosen.atk * mult), speed: Math.round(chosen.speed + quality * .4), sell: Math.round(chosen.value * mult), difficulty: 0.75 + FISH.indexOf(chosen) * .18 + weight * .045 };
}
function startFishing() {
  if (fishing.active || fishing.preparing) return;
  fishing.preparing = true;
  const angler = $('#anglerSprite'); angler.className = 'angler-sprite casting';
  setTimeout(() => {
    fishing.preparing = false; fishing.catch = chooseFish(); fishing.active = true; fishing.holding = false; fishing.zone = 0; fishing.vel = 0; fishing.fish = 150; fishing.target = 150; fishing.progress = 12; fishing.last = performance.now(); fishing.difficulty = fishing.catch.difficulty;
    angler.className = 'angler-sprite reeling';
    $('#catchZone').style.height = `${96 + state.reel * 9}px`; $('#targetFish').textContent = fishing.catch.emoji; $('#fishingModal').classList.remove('hidden');
    fishing.raf = requestAnimationFrame(fishingLoop);
  }, 760);
}
function endFishing(success) {
  fishing.active = false; fishing.holding = false; cancelAnimationFrame(fishing.raf); $('#fishingModal').classList.add('hidden'); $('#anglerSprite').className = 'angler-sprite';
  if (success) { state.inventory.push(fishing.catch); state.catches++; updateHud(); showCatchResult(fishing.catch); }
  else { toast('O peixe escapou nas profundezas...'); }
}
function fishingLoop(now) {
  if (!fishing.active) return; const dt = Math.min(.032, (now - fishing.last) / 1000); fishing.last = now;
  fishing.vel += (fishing.holding ? 520 : -410) * dt; fishing.vel *= .92; fishing.zone = Math.max(0, Math.min(FISH_TRACK_HEIGHT - (96 + state.reel * 9), fishing.zone + fishing.vel * dt));
  if (Math.abs(fishing.fish - fishing.target) < 7) fishing.target = 15 + Math.random() * (FISH_TRACK_HEIGHT - 45);
  const chase = (fishing.target - fishing.fish) * dt * (1.3 + fishing.difficulty); fishing.fish += chase + Math.sin(now / 170) * fishing.difficulty * .55;
  const zoneH = 96 + state.reel * 9, fishCenter = fishing.fish + 22, inside = fishCenter > fishing.zone && fishCenter < fishing.zone + zoneH;
  const progressGain = 19;
  const progressLoss = Math.max(1.4, 3.25 - state.reel * .3) * 1.75;
  fishing.progress += (inside ? progressGain : -progressLoss) * dt; fishing.progress = Math.max(0, Math.min(100, fishing.progress));
  $('#catchZone').style.bottom = `${fishing.zone}px`; $('#targetFish').style.bottom = `${fishing.fish}px`; $('#catchProgress').style.height = `${fishing.progress}%`;
  if (fishing.progress >= 100) return endFishing(true); if (fishing.progress <= 0) return endFishing(false);
  fishing.raf = requestAnimationFrame(fishingLoop);
}
function setReel(on) { fishing.holding = on; }
$('#castBtn').onclick = startFishing; $('#closeFishing').onclick = () => endFishing(false);
['mousedown', 'touchstart'].forEach(e => $('#reelBtn').addEventListener(e, x => { x.preventDefault(); setReel(true); }, { passive: false }));
['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(e => $('#reelBtn').addEventListener(e, () => setReel(false)));

function showCatchResult(f) {
  $('#resultIcon').textContent = f.emoji; $('#resultEyebrow').textContent = 'NOVA CAPTURA!'; $('#resultTitle').textContent = f.name;
  $('#resultBody').innerHTML = `<p><span class="rarity ${rarityClass(f.rarity)}" style="position:static">${f.rarity}</span></p><div class="result-stats"><div><span>PESO</span><b>${f.weight.toFixed(1)} kg</b></div><div><span>QUALIDADE</span><b>${'★'.repeat(f.quality)}</b></div><div><span>VALOR</span><b>${f.sell} 🪙</b></div></div>`;
  $('#resultPrimary').textContent = 'Guardar no viveiro'; $('#resultPrimary').onclick = () => { $('#resultModal').classList.add('hidden'); showView('inventory'); }; $('#resultModal').classList.remove('hidden');
}

const battle = { running: false, boss: false, keys: {}, last: 0, timer: 70, selected: null, player: null, enemy: null, particles: [], shake: 0, raf: 0 };
function makeFighter(f, enemy = false) { const battleHp = Math.round(f.hp * BATTLE_HP_MULTIPLIER); return { ...f, x: enemy ? 730 : 140, y: 405, dir: enemy ? -1 : 1, maxHp: battleHp, curHp: battleHp, cooldown: 0, invuln: 0, flash: 0, attack: null, moving: false, decision: .25 + Math.random() * .25, enemy }; }
function startBattle(id) {
  const f = state.inventory.find(x => x.id === id); if (!f) return;
  const bossFight = state.fightsSinceBoss >= 5; let rival;
  if (bossFight) {
    const boss = BOSSES[state.bossesFaced % BOSSES.length], scale = 1 + state.bossesFaced * .04;
    rival = { ...boss, hp: Math.round(boss.hp * scale) + BOSS_HP_BONUS, atk: Math.round(boss.atk * Math.min(1.35, scale)), quality: 5, boss: true };
  } else {
    const playerTier = FISH.findIndex(x => x.name === f.name), targetTier = Math.min(FISH.length - 1, Math.max(0, playerTier + (Math.random() > .65 ? 1 : 0)));
    const opponents = FISH.filter(candidate => candidate.name !== f.name);
    const base = opponents.reduce((best, candidate) => Math.abs(FISH.indexOf(candidate) - targetTier) < Math.abs(FISH.indexOf(best) - targetTier) ? candidate : best), scale = .92 + state.wins * .025 + Math.random() * .12;
    rival = { ...base, name: `${base.name} Bravo`, hp: Math.round(base.hp * scale), atk: Math.round(base.atk * scale), speed: base.speed, quality: 2, weight: 1 };
  }
  battle.boss = bossFight; battle.selected = f; battle.player = makeFighter(f); battle.enemy = makeFighter(rival, true); battle.timer = bossFight ? 90 : 70; battle.running = true; battle.particles = []; battle.shake = 0; battle.last = performance.now();
  $('#arenaSelect').classList.add('hidden'); $('#battleWrap').classList.remove('hidden'); $('#playerName').textContent = f.name; $('#enemyName').textContent = bossFight ? `♛ ${rival.name}` : rival.name;
  $('#roundBadge').classList.toggle('boss', bossFight); $('#roundBadge span').textContent = bossFight ? 'BOSS' : 'RINHA'; updateBattleHud(); battle.raf = requestAnimationFrame(battleLoop);
}
function attack(who, type) {
  if (who.cooldown > 0 || who.attack) return;
  const heavy = type === 'heavy'; who.attack = { type, t: 0, hit: false }; who.cooldown = heavy ? .95 : .48;
}
function dodge(who) { if (who.cooldown > .15) return; who.invuln = .42; who.cooldown = .65; who.x += who.dir * 85; burst(who.x, who.y, '#d9f8ed', 5); }
function damage(attacker, defender, heavy) {
  if (defender.invuln > 0) { burst(defender.x, defender.y, '#e9ffff', 7); return; }
  const dmg = Math.round(attacker.atk * (heavy ? 1.8 : 1) * (.88 + Math.random() * .24)) + (attacker.boss ? BOSS_DAMAGE_BONUS : 0); defender.curHp = Math.max(0, defender.curHp - dmg); defender.flash = .16; defender.x += attacker.dir * (heavy ? 38 : 20); battle.shake = heavy ? 9 : 4; burst(defender.x, defender.y - 65, heavy ? '#ff8f32' : '#fff1a6', heavy ? 16 : 9, dmg);
}
function burst(x, y, color, count, number) { for (let i = 0; i < count; i++) battle.particles.push({ x, y, vx: (Math.random() - .5) * 260, vy: -50 - Math.random() * 180, t: .65, color, size: 4 + Math.random() * 8, number: i === 0 ? number : null }); }
function updateFighter(f, other, dt) {
  f.cooldown = Math.max(0, f.cooldown - dt); f.invuln = Math.max(0, f.invuln - dt); f.flash = Math.max(0, f.flash - dt); f.dir = other.x > f.x ? 1 : -1;
  if (f.attack) { f.attack.t += dt; const hitAt = f.attack.type === 'heavy' ? .34 : .17, reach = f.attack.type === 'heavy' ? 135 : 100; if (!f.attack.hit && f.attack.t >= hitAt) { f.attack.hit = true; if (Math.abs(other.x - f.x) < reach) damage(f, other, f.attack.type === 'heavy'); } if (f.attack.t > (f.attack.type === 'heavy' ? .62 : .34)) f.attack = null; }
  f.x = Math.max(60, Math.min(900, f.x));
}
function runAutoAI(f, other, dt) {
  if (f.attack || f.invuln > 0) return;
  f.decision -= dt;
  const distance = Math.abs(other.x - f.x), direction = Math.sign(other.x - f.x) || f.dir;
  if (distance > 102) {
    f.x += direction * (112 + f.speed * 4.5) * dt; f.moving = true;
    return;
  }
  if (f.decision > 0 || f.cooldown > 0) return;
  const threatened = other.attack && distance < 112, roll = Math.random();
  if (threatened && roll < .34) dodge(f);
  else if (roll < (f.boss ? .48 : .34)) attack(f, 'heavy');
  else attack(f, 'light');
  f.decision = (f.boss ? .16 : .24) + Math.random() * .32;
}
function battleLoop(now) {
  if (!battle.running) return; const dt = Math.min(.033, (now - battle.last) / 1000); battle.last = now; battle.timer -= dt;
  const p = battle.player, e = battle.enemy;
  p.moving = false; e.moving = false;
  runAutoAI(p, e, dt); runAutoAI(e, p, dt);
  updateFighter(p, e, dt); updateFighter(e, p, dt); battle.shake = Math.max(0, battle.shake - dt * 34); battle.particles.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 320 * dt; q.t -= dt; }); battle.particles = battle.particles.filter(q => q.t > 0);
  drawBattle(); updateBattleHud(); if (p.curHp <= 0 || e.curHp <= 0 || battle.timer <= 0) return finishBattle(e.curHp < p.curHp); battle.raf = requestAnimationFrame(battleLoop);
}
function drawBattle() {
  const c = $('#battleCanvas'), x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
  x.save(); if (battle.shake > 0) x.translate((Math.random() - .5) * battle.shake, (Math.random() - .5) * battle.shake);
  const sky = x.createLinearGradient(0, 0, 0, 480); sky.addColorStop(0, '#efae68'); sky.addColorStop(.52, '#ac6552'); sky.addColorStop(.53, '#326e68'); sky.addColorStop(1, '#173f43'); x.fillStyle = sky; x.fillRect(0, 0, 960, 480);
  x.fillStyle = '#173c3d'; for (let i = 0; i < 12; i++) { x.fillRect(i * 90, 185 + (i % 3) * 12, 55, 70); x.fillRect(i * 90 + 12, 150 + (i % 3) * 12, 30, 40); }
  x.fillStyle = '#875441'; x.fillRect(0, 250, 960, 35); x.fillStyle = '#5d3b35'; for (let i = 0; i < 20; i++) x.fillRect(i * 52, 255, 4, 225);
  x.strokeStyle = '#a5e9dc55'; x.lineWidth = 3; for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(20 + i * 110, 325 + i % 2 * 15); x.lineTo(85 + i * 110, 325 + i % 2 * 15); x.stroke(); }
  x.fillStyle = '#714330'; x.fillRect(0, 375, 960, 105); x.fillStyle = '#a86642'; x.fillRect(0, 382, 960, 98); x.fillStyle = '#c37a4b'; x.fillRect(0, 382, 960, 8);
  x.strokeStyle = '#75432f'; x.lineWidth = 4; for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(i * 74, 384); x.lineTo(i * 74 - 12, 480); x.stroke(); }
  x.fillStyle = '#102a2d66'; [battle.player, battle.enemy].forEach(f => { x.beginPath(); x.ellipse(f.x, f.y + 5, 58, 12, 0, 0, Math.PI * 2); x.fill(); });
  drawFighter(x, battle.player); drawFighter(x, battle.enemy);
  battle.particles.forEach(q => { x.globalAlpha = Math.min(1, q.t * 2); x.fillStyle = q.color; x.save(); x.translate(q.x, q.y); x.rotate(q.t * 7); x.fillRect(-q.size / 2, -q.size / 2, q.size, q.size); x.restore(); if (q.number) { x.font = 'bold 24px Nunito'; x.fillStyle = '#fff8cf'; x.strokeStyle = '#6d251c'; x.lineWidth = 5; x.strokeText(`-${q.number}`, q.x, q.y - 12); x.fillText(`-${q.number}`, q.x, q.y - 12); } }); x.globalAlpha = 1; x.restore();
}
function drawFighter(x, f) {
  x.save(); x.translate(f.x, f.y); x.scale(f.dir, 1); if (f.flash > 0) x.globalAlpha = .55;
  if (f.invuln > 0) { x.strokeStyle = '#c8fff4'; x.lineWidth = 6; x.beginPath(); x.arc(0, -42, 65, 0, Math.PI * 2); x.stroke(); }
  const speciesName = f.spriteKey || f.name.replace(' Bravo', ''), speciesSheet = speciesSprites[speciesName];
  let frame = 0;
  if (f.flash > 0) frame = 4;
  else if (f.invuln > 0) frame = 3;
  else if (f.attack?.type === 'heavy') frame = 2;
  else if (f.attack?.type === 'light') frame = 1;
  if (speciesSheet) {
    let speciesFrame = 0;
    if (f.flash > 0 || f.invuln > 0) speciesFrame = 5;
    else if (f.attack?.type === 'heavy') speciesFrame = 4;
    else if (f.attack?.type === 'light') speciesFrame = 3;
    else if (f.moving) speciesFrame = 1 + (Math.floor(performance.now() / (165 - Math.min(65, f.speed * 5))) % 2);
    const b = speciesSheet.bounds[speciesFrame], size = { Lambari: .86, 'Tilápia': 1.02, 'Traíra': 1.04, Dourado: 1, Pirarucu: 1.16, 'Bagre Fantasma': 1.03, 'Boss Rei Carniça': 1.24, 'Boss Barão do Lodo': 1.3, 'Boss Voltágua': 1.22 }[speciesName] || 1;
    const dh = 198 * size, dw = Math.min(225 * size, dh * (b.w / b.h));
    x.imageSmoothingEnabled = false; x.filter = 'drop-shadow(5px 7px 2px rgba(10,35,37,.38))';
    x.drawImage(speciesSheet.canvas, b.x, b.y, b.w, b.h, -dw / 2, -dh, dw, dh); x.filter = 'none';
  } else if (f.moving && !f.attack && f.invuln <= 0 && f.flash <= 0 && walkingSprite) {
    const sw = walkingSprite.width / 4, sy = 70, sh = Math.min(550, walkingSprite.height - sy);
    const walkSpeed = 150 - Math.min(60, f.speed * 5), walkFrame = Math.floor(performance.now() / walkSpeed) % 4;
    const scale = Math.min(1.18, .9 + (f.weight || 1) * .025);
    x.imageSmoothingEnabled = false;
    x.filter = fallbackSpeciesFilter(f.name, f.enemy);
    x.drawImage(walkingSprite, walkFrame * sw, sy, sw, sh, -78 * scale, -199 * scale, 156 * scale, 205 * scale);
    x.filter = 'none';
  } else if (fighterSprite.complete && fighterSprite.naturalWidth) {
    const sw = fighterSprite.naturalWidth / 5, sy = 70, sh = Math.min(600, fighterSprite.naturalHeight - sy);
    const scale = Math.min(1.18, .9 + (f.weight || 1) * .025);
    x.imageSmoothingEnabled = false;
    x.filter = fallbackSpeciesFilter(f.name, f.enemy);
    x.drawImage(fighterSprite, frame * sw, sy, sw, sh, -64 * scale, -183 * scale, 128 * scale, 200 * scale);
    x.filter = 'none';
  } else {
    x.font = `${80 + Math.min(35, f.weight * 3)}px serif`; x.textAlign = 'center'; x.fillText(f.emoji, 0, 0);
  }
  if (f.attack) drawAttackEffect(x, f);
  x.restore();
}
function drawAttackEffect(x, f) {
  const heavy = f.attack.type === 'heavy', duration = heavy ? .62 : .34;
  const phase = Math.min(1, f.attack.t / duration), glow = Math.sin(phase * Math.PI);
  const handX = heavy ? 12 + 55 * Math.min(1, phase * 1.45) : 61 + Math.sin(phase * Math.PI) * 9;
  const handY = heavy ? -168 + 66 * Math.min(1, phase * 1.45) : -108;
  x.save(); x.globalAlpha = Math.max(0, glow);
  const aura = x.createRadialGradient(handX, handY, 2, handX, handY, heavy ? 42 : 26);
  aura.addColorStop(0, '#fffbe1'); aura.addColorStop(.35, heavy ? '#ffb338' : '#8ff9ee'); aura.addColorStop(1, heavy ? '#ef432900' : '#20b9d000');
  x.fillStyle = aura; x.beginPath(); x.arc(handX, handY, heavy ? 42 : 26, 0, Math.PI * 2); x.fill();
  x.lineCap = 'round'; x.lineWidth = heavy ? 13 : 7; x.strokeStyle = heavy ? '#ff7b32cc' : '#b9fff1dd'; x.beginPath();
  if (heavy) x.arc(4, -117, 78, -1.45 + phase * .45, -.15 + phase * .8); else x.arc(handX - 23, handY, 34 + phase * 25, -.75, .65);
  x.stroke(); x.lineWidth = heavy ? 4 : 3; x.strokeStyle = '#fff9c9'; x.stroke();
  for (let i = 0; i < (heavy ? 5 : 3); i++) { const a = phase * 8 + i * 2.1; x.fillStyle = i % 2 ? '#fff5a8' : '#7fffe8'; x.fillRect(handX + Math.cos(a) * (22 + i * 4) - 3, handY + Math.sin(a) * (18 + i * 3) - 3, 6, 6); }
  x.restore();
}
function speciesHue(name) {
  const clean = name.replace(' Bravo', '');
  return { Lambari: 0, 'Tilápia': 42, 'Traíra': -45, Dourado: 68, Pirarucu: 145, 'Bagre Fantasma': -18 }[clean] || 0;
}
function fallbackSpeciesFilter(name, enemy) {
  const clean = name.replace(' Bravo', ''), lambariTone = clean === 'Lambari' ? ' saturate(.55) brightness(1.22)' : '';
  return `hue-rotate(${speciesHue(name)}deg) saturate(${enemy ? 1.08 : 1.18})${lambariTone} drop-shadow(5px 7px 2px rgba(10,35,37,.38))`;
}
function updateBattleHud() { $('#playerHp').style.width = `${battle.player.curHp / battle.player.maxHp * 100}%`; $('#enemyHp').style.width = `${battle.enemy.curHp / battle.enemy.maxHp * 100}%`; $('#battleTimer').textContent = Math.max(0, Math.ceil(battle.timer)); }
function finishBattle(win) {
  battle.running = false; cancelAnimationFrame(battle.raf); const idx = state.inventory.findIndex(f => f.id === battle.selected.id); if (idx >= 0) state.inventory.splice(idx, 1);
  const reward = win ? (battle.boss ? battle.enemy.reward + state.bossesFaced * 35 : Math.round(55 + (battle.enemy.maxHp / BATTLE_HP_MULTIPLIER) * .75 + state.wins * 4)) : 0;
  if (battle.boss) { state.fightsSinceBoss = 0; state.bossesFaced++; if (win) state.bossWins++; } else state.fightsSinceBoss++;
  if (win) { state.money += reward; state.wins++; } updateHud();
  $('#resultIcon').textContent = win ? (battle.boss ? '♛' : '🏆') : '💀'; $('#resultEyebrow').textContent = win ? (battle.boss ? 'BOSS DERROTADO!' : 'VITÓRIA NA DOCA!') : 'DERROTA'; $('#resultTitle').textContent = win ? `+${reward} moedas` : `${battle.selected.name} foi perdido`;
  $('#resultBody').innerHTML = `<p>${win ? (battle.boss ? `${battle.selected.name} venceu ${battle.enemy.name} e conquistou uma recompensa lendária!` : `${battle.selected.name} dominou a arena e entrou para a história do rio.`) : `O ${battle.boss ? 'boss' : 'rival'} foi mais forte desta vez. Volte ao lago e treine com um peixe melhor.`}</p><p><b>O lutador deixou seu viveiro após a rinha.</b></p>`;
  $('#resultPrimary').textContent = 'Voltar para a rinha'; $('#resultPrimary').onclick = () => { $('#resultModal').classList.add('hidden'); renderFighters(); }; $('#resultModal').classList.remove('hidden');
}

document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); if (fishing.active) setReel(true); else if ($('#lake').classList.contains('active')) startFishing(); } });
document.addEventListener('keyup', e => { if (e.code === 'Space') setReel(false); });

updateHud(); renderShop();
