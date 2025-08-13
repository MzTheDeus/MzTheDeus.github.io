/* ==========================================================
   Chop Tycoon — Portrait v6 (mobile-first)
   - Portrait world (600x900)
   - Header HUD (top), Help modal auto-opens
   - Tap to move; tap tree to auto-chop; bottom quick actions
   - Canvas scales to fill between header & bottom buttons
   ========================================================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha:false });

// Player sprite (transparent PNG). Put at: ./assets/player.png
const playerSprite = new Image();
playerSprite.src = "assets/player.png";

// Player visual sizing + where the "hand" is on the sprite (in sprite pixels)
const PLAYER_BASE = 56;           // how big to draw the player sprite
const HAND_OFFSET = { x: 10, y: 4 }; // hand position relative to sprite center (tweak per your art)


/* ---------- Portrait world & scaling ---------- */
const WORLD_BASE = { w: 600, h: 900 };   // portrait
const WORLD = { w: 600, h: 900 };        // logic units
let SCALE = 1;
let DPR = window.devicePixelRatio || 1;

function reservedBottomPx(){
  const quick = document.getElementById("quick");
  const styles = getComputedStyle(quick);
  const safe = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0;
  return quick.offsetHeight + 10 + safe; // buttons height + gap + safe area
}
function headerPx(){
  const top = document.getElementById("topbar");
  const safe = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
  return top.offsetHeight + safe;
}

function resizeCanvas(){
  // Available viewport minus header and bottom controls
  const availW = window.innerWidth;
  const availH = Math.max(320, window.innerHeight - headerPx() - reservedBottomPx());

  // Fit whole world
  SCALE = Math.min(availW / WORLD_BASE.w, availH / WORLD_BASE.h, 1);
  DPR   = window.devicePixelRatio || 1;

  // CSS display size
  const cssW = Math.floor(WORLD_BASE.w * SCALE);
  const cssH = Math.floor(WORLD_BASE.h * SCALE);
  canvas.style.width  = cssW + "px";
  canvas.style.height = cssH + "px";

  // Backing resolution
  canvas.width  = Math.floor(cssW * DPR);
  canvas.height = Math.floor(cssH * DPR);

  // Render transform (draw in WORLD units)
  ctx.setTransform(SCALE * DPR, 0, 0, SCALE * DPR, 0, 0);

  WORLD.w = WORLD_BASE.w;
  WORLD.h = WORLD_BASE.h;
}
addEventListener("resize", resizeCanvas);
setTimeout(resizeCanvas, 0); // after layout

/* Convert pointer coords → world coords */
function getCanvasPos(evt){
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left) * (WORLD_BASE.w / rect.width);
  const y = (evt.clientY - rect.top)  * (WORLD_BASE.h / rect.height);
  return { x, y };
}

/* ---------- Game data ---------- */
const TYPES = {
  pine:  { name:"Pine",  radius:22, maxHp:24,  yieldMin:8,  yieldMax:12, reqLevel:1, xpGain:10,
           sprite:"assets/trees/pine.png",   stump:"assets/trees/stump.png",   spriteW:72, spriteH:82, basePad:30 },
  oak:   { name:"Oak",   radius:26, maxHp:46,  yieldMin:16, yieldMax:22, reqLevel:3, xpGain:25,
           sprite:"assets/trees/oak.png",    stump:"assets/trees/stump.png",   spriteW:84, spriteH:96, basePad:36 },
  birch: { name:"Birch", radius:24, maxHp:70,  yieldMin:22, yieldMax:30, reqLevel:5, xpGain:45,
           sprite:"assets/trees/birch.png",  stump:"assets/trees/stump.png",   spriteW:70, spriteH:86, basePad:33 },
  maple: { name:"Maple", radius:28, maxHp:110, yieldMin:30, yieldMax:40, reqLevel:7, xpGain:70,
           sprite:"assets/trees/maple.png",  stump:"assets/trees/stump.png",   spriteW:90, spriteH:104, basePad:39 },
};
const TREES = [];
const TREE_RESPAWN_MS = 12000;

/* ---------- Tree sprite preload ---------- */
const TREE_SPRITES = {};
const STUMP_SPRITES = {};
const TREE_SCALE = 2.4; // 1.0 = original size, >1.0 = bigger


for (const [key, t] of Object.entries(TYPES)) {
  // full tree
  if (t.sprite){
    const img = new Image();
    img.loading = "eager";
    img.decoding = "async";
    img.src = t.sprite;
    img.decode?.().catch(()=>{});
    TREE_SPRITES[key] = img;
  }
  // stump (can be shared)
  if (t.stump){
    if (!STUMP_SPRITES[t.stump]) {
      const s = new Image();
      s.loading = "eager";
      s.decoding = "async";
      s.src = t.stump;
      s.decode?.().catch(()=>{});
      STUMP_SPRITES[t.stump] = s;
    }
  }
}

const player = {
  x: 120, y: 180, r: 14, speed: 0.5,
  wood: 0, gold: 0,
  axeTier: 0, shoeTier: 0, nextChopAt: 0,
  level: 1, xp: 0, xpNext: 50,
  swing: { active:false, start:0, duration:0, dir:1 },
  facing: 1, // 1 = right, -1 = left
  faceLockUntil: 0,
  levelPulseUntil: 0,

};
const AXES = [
  { name:"Wooden", power:3,  cooldown:700, price:0,   minLevel:1, animMs:280, reach:22, color:"#8b5a2b", blade:"#d4d0c8", sprite:"assets/wood.png" },
  { name:"Stone",  power:5,  cooldown:580, price:20,  minLevel:2, animMs:260, reach:24, color:"#6b7280", blade:"#d1d5db", sprite:"assets/stone.png"   },
  { name:"Bronze", power:8,  cooldown:500, price:50,  minLevel:3, animMs:240, reach:26, color:"#b45309", blade:"#f59e0b", sprite:"assets/bronze.png"  },
  { name:"Iron",   power:12, cooldown:420, price:120, minLevel:4, animMs:220, reach:28, color:"#9ca3af", blade:"#e5e7eb", sprite:"assets/iron.png"    },
  { name:"Steel",  power:18, cooldown:360, price:240, minLevel:5, animMs:200, reach:30, color:"#94a3b8", blade:"#f8fafc", sprite:"assets/steel.png"   },
];

const SHOES = [
  { name: "Barefoot",      speed: 0.5, price: 0,   minLevel: 1 },
  { name: "Leather Shoes", speed: 0.8, price: 50,  minLevel: 2 },
  { name: "Running Shoes", speed: 1.2, price: 120, minLevel: 3 },
  { name: "Speed Boots",   speed: 2.2, price: 250, minLevel: 4 },
];

// Win-state + timer
const GAME = { startAt: performance.now(), over: false };

// format mm:ss
function formatTime(ms){
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  return `${m}:${String(s%60).padStart(2,'0')}`;
}

// Preload axe images
const AXE_SPRITES = AXES.map(ax => {
  const img = new Image();
  img.decoding = "sync";            // hint: decode sooner
  img.loading = "eager";            // hint: fetch sooner
  img.fetchPriority = "high";       // hint: prioritize
  img.src = ax.sprite;
  img.decode?.().catch(()=>{ /* ignore decode errors; draw will skip until ready */ });
  return img;
});


/* ---------- Input: pointer (mouse + touch) ---------- */
let moveTarget = null;     // {x,y}
let targetTree = null;     // tree to auto-chop
const CHOP_RANGE = 55;
const CLIP_INSET = 3;
const REACH_SLACK = 8;
const XP_BAR = { h: 14, pad: 8 }; // height and margin from edges


canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", (e) => {
  if (GAME.over) return;  // prevent clicks after game ends
  const p = getCanvasPos(e);
  setFacing(p.x - player.x);


  // Tree tap?
  const tr = treeAtPoint(p.x, p.y);
  if (tr){
    targetTree = tr;
    moveTarget = { x: tr.x, y: tr.y };
    return;
  }

  // Ground: move there
  targetTree = null;
  moveTarget = { x: clamp(p.x, player.r, WORLD.w - player.r),
                 y: clamp(p.y, player.r, WORLD.h - player.r) };
}, { passive:false });

/* ---------- Trees ---------- */
function makeTree(x, y, type) {
  const t = TYPES[type];
  return { type, x, y, r: t.radius, hp: t.maxHp, alive: true, respawnAt: 0 };
}
// Layout: 10 trees, spaced for portrait
TREES.length = 0;
[
  // Top cluster
  { x: 120, y: 180, type: "pine"  },
  { x: 300, y: 170, type: "oak"   },
  { x: 480, y: 190, type: "birch" },

  // Upper mid
  { x: 180, y: 320, type: "pine"  },
  { x: 360, y: 320, type: "oak"   },

  // Center band
  { x: 100, y: 460, type: "birch" },
  { x: 300, y: 470, type: "pine"  },
  { x: 500, y: 460, type: "maple" },

  // Lower (avoid store zone: x:390–560, y:740–850)
  { x: 160, y: 640, type: "oak"   },
  { x: 320, y: 650, type: "maple" },
].forEach(s => TREES.push(makeTree(s.x, s.y, s.type)));

/* ---------- Main loop ---------- */
let last = performance.now();
function loop(t){
  const dt = Math.min(32, t - last); last = t;
  update(dt); render(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- Update ---------- */
function update(dt){
  if (GAME.over) return;
  if (player.swing.active && performance.now() >= player.swing.start + player.swing.duration){
  player.swing.active = false;
}

  // Move
  if (moveTarget){
    const dx = moveTarget.x - player.x;
    const dy = moveTarget.y - player.y;
    setFacing(dx);
    const d = Math.hypot(dx,dy);
    if (d > 1){
      const step = player.speed;
      player.x += (dx / d) * step;
      player.y += (dy / d) * step;
    } else {
      moveTarget = null;
    }
  }
  player.x = clamp(player.x, player.r, WORLD.w - player.r);
  player.y = clamp(player.y, player.r, WORLD.h - player.r);

// Auto-chop
if (targetTree) {
  if (!targetTree.alive) {
    targetTree = null;
  } else {
    const dx = targetTree.x - player.x;
    const dy = targetTree.y - player.y;
    const dist = Math.hypot(dx, dy) || 0.0001; // avoid divide-by-zero

    // Stop just outside the tree’s edge
    const stopDist = Math.max(0, targetTree.r + player.r - CLIP_INSET);

    if (dist > stopDist + STOP_EPS) {
      // Move to the exact stop point (on the line from tree -> player)
      const nx = dx / dist, ny = dy / dist;
      const tx = targetTree.x - nx * stopDist;
      const ty = targetTree.y - ny * stopDist;
      moveTarget = { x: tx, y: ty };

      // Face while approaching (with hysteresis)
      setFacing(dx);
    } else {
  // In range (with a little slack): stop moving, face the tree, chop
  if (dist <= stopDist + REACH_SLACK) {
    moveTarget = null;
    setFacing(dx);
    tryChop(targetTree);
  }
}
  }
}

  // Respawn
  const now = performance.now();
  for (const tr of TREES){
    if (!tr.alive && now >= tr.respawnAt){
      tr.alive = true; tr.hp = TYPES[tr.type].maxHp;
      flashText(`${TYPES[tr.type].name} regrew 🌳`, tr.x, tr.y - 40, "#9bd0ff");
    }
  }
  updateFireworks(dt);
}

/* ---------- Chop logic ---------- */
function tryChop(tr){
  const now = performance.now();
  if (now < player.nextChopAt) return;

  const tt = TYPES[tr.type];
  const axe = AXES[player.axeTier];

  if (player.level < tt.reqLevel){
    flashText(`Need Lv ${tt.reqLevel} for ${tt.name}`, tr.x, tr.y - 40, "#ffd17a");
    player.nextChopAt = now + 350; return;
  }
  if (player.level < axe.minLevel){
    flashText(`Need Lv ${axe.minLevel} for ${axe.name} axe`, player.x, player.y - 28, "#ffd17a");
    player.nextChopAt = now + 350; return;
  }

    {
    const swingAxe = AXES[player.axeTier];
    player.swing.active   = true;             // ADD
    player.swing.start    = now;              // ADD
    player.swing.duration = swingAxe.animMs || 240; // ADD
    player.swing.dir      = Math.random() < 0.5 ? -1 : 1; // ADD

    player.faceLockUntil = now + (player.swing.duration || 240) + 80; // lock until swing ends (+80ms)
  }



  tr.hp -= axe.power;
  player.nextChopAt = now + axe.cooldown;

  if (tr.hp <= 0){
    fellTree(tr);
    targetTree = null;
  } else {
    flashText("-" + axe.power, tr.x, tr.y - 60, "#ffe17a");
  }
}

function fellTree(tr){
  tr.alive = false;
  tr.respawnAt = performance.now() + TREE_RESPAWN_MS;
  tr.hp = 0;
  const tt = TYPES[tr.type];
  const yieldLogs = tt.yieldMin + Math.floor(Math.random() * (tt.yieldMax - tt.yieldMin + 1));
  player.wood += yieldLogs;
  flashText(`+${yieldLogs} wood`, tr.x, tr.y - 40, "#8ef58e");
  gainXp(tt.xpGain);
  updateHUD();
}

/* ---------- XP / Level ---------- */
function gainXp(amount){
  player.xp += amount;
  flashText(`+${amount} XP`, player.x, player.y - 48, "#9bd0ff");
  while (player.xp >= player.xpNext){
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.35);
    flashText(`Level Up! ★${player.level}`, player.x, player.y - 64, "#ffd17a");
    // Fireworks bursts slightly above the head
    const burstY = player.y - (PLAYER_BASE ? PLAYER_BASE/2 : 20) - 6;
    spawnFireworks(player.x, burstY, 26);
    setTimeout(() => spawnFireworks(player.x, burstY - 8, 22), 90);
    setTimeout(() => spawnFireworks(player.x, burstY + 6, 18), 180);
    player.levelPulseUntil = performance.now() + 900;


    // (optional) a tiny haptic tap on mobile
    if (navigator.vibrate) navigator.vibrate(20);

  }
  updateHUD();
  refreshStore();

    // Win condition
  if (!GAME.over && player.level >= 10) {
    endGame();
  }
}

function endGame(){
  GAME.over = true;
  moveTarget = null;
  targetTree = null;
  const ms = performance.now() - GAME.startAt;
  winTimeEl.textContent = formatTime(ms);
  winEl.classList.remove("hidden");
}


/* ---------- Render ---------- */
function render(){
  ctx.clearRect(0,0,WORLD.w,WORLD.h);
  drawGrid();

  function drawXPBar(){
  const isMax = player.level >= 10 || GAME.over;
  const x = XP_BAR.pad;
  const w = WORLD.w - XP_BAR.pad * 2;
  const y = WORLD.h - XP_BAR.h - XP_BAR.pad;
  const h = XP_BAR.h;

  // background
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x, y, w, h);

  // fill
  const pct = isMax ? 1 : Math.max(0, Math.min(1, player.xp / player.xpNext));
  ctx.fillStyle = pct > 0.66 ? "#8ef58e" : pct > 0.33 ? "#ffd17a" : "#ff9b7a";
  ctx.fillRect(x, y, w * pct, h);

  // border
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // text
  ctx.fillStyle = "#cfe1ff";
  ctx.font = "bold 12px system-ui";
  const label = isMax
    ? `Lv ${player.level} — MAX`
    : `Lv ${player.level} · ${player.xp}/${player.xpNext} XP`;
  const tw = ctx.measureText(label).width;
  ctx.fillText(label, x + (w - tw) / 2, y - 4); // text just above the bar
}


  // Store zone (bottom-right)
  /*
  ctx.fillStyle = "rgba(90,169,255,0.12)";
  ctx.fillRect(STORE_ZONE.x, STORE_ZONE.y, STORE_ZONE.w, STORE_ZONE.h);
  ctx.strokeStyle = "rgba(90,169,255,0.6)";
  ctx.strokeRect(STORE_ZONE.x+0.5, STORE_ZONE.y+0.5, STORE_ZONE.w-1, STORE_ZONE.h-1);
  ctx.fillStyle = "#9bb3d1"; ctx.font = "14px system-ui";
  ctx.fillText("🏪 STORE (Tap)", STORE_ZONE.x+32, STORE_ZONE.y+24);
  */

// Trees
for (const tr of TREES){
  const tt = TYPES[tr.type];

  if (!tr.alive){
    // draw stump if available; else small brown circle
    if (tt.stump) {
      const stumpImg = STUMP_SPRITES[tt.stump];
      if (stumpImg && stumpImg.complete) {
        const w = Math.round(tt.spriteW * 0.55 * TREE_SCALE);
        const h = Math.round(tt.spriteH * 0.35 * TREE_SCALE);
        ctx.drawImage(stumpImg, tr.x - w/2, tr.y - h/2 + 6, w, h);
      } else {
        ctx.fillStyle = "#3b2a1f";
        ctx.beginPath(); ctx.arc(tr.x, tr.y, tt.radius*0.5, 0, Math.PI*2); ctx.fill();
      }
    }
    continue;
  }

  // draw tree sprite
  const img = TREE_SPRITES[tr.type];
  if (img && img.complete){
    const w = tt.spriteW * TREE_SCALE;
    const h = tt.spriteH * TREE_SCALE;
    // anchor the sprite so its bottom center is at (tr.x, tr.y + basePad)
    const drawX = tr.x - w/2;
    const drawY = tr.y - h + tt.basePad * TREE_SCALE;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, drawX, drawY, w, h);
  } else {
    // fallback while loading: simple placeholder
    ctx.fillStyle = "#5a3a28";
    ctx.beginPath(); ctx.arc(tr.x, tr.y+8, tt.radius*0.45, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#2f7a45";
    ctx.beginPath(); ctx.arc(tr.x, tr.y, tt.radius, 0, Math.PI*2); ctx.fill();
  }

  // HP bar
  const maxHp = tt.maxHp;
  const barW = 44, barH = 6, pct = Math.max(0, tr.hp)/maxHp;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(tr.x - barW/2, tr.y - tt.radius - 55, barW, barH);
  ctx.fillStyle = pct>0.5 ? "#8ef58e" : pct>0.25 ? "#ffd17a" : "#ff6b6b";
  ctx.fillRect(tr.x - barW/2, tr.y - tt.radius - 55, barW*pct, barH);

  // Selected ring (optional)
  if (targetTree === tr){
    ctx.strokeStyle = "rgba(255,225,122,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tr.x, tr.y, tt.radius+6, 0, Math.PI*2); ctx.stroke();
  }

  // Label (optional)
  ctx.fillStyle = "#cfe1ff"; ctx.font = "bold 12px system-ui";
  const label = tt.name;
  ctx.fillText(label, tr.x - ctx.measureText(label).width/2, tr.y + tt.radius + 14);
}

  // Destination marker
  if (moveTarget){
    ctx.strokeStyle = "rgba(122,199,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(moveTarget.x, moveTarget.y, 10, 0, Math.PI*2); ctx.stroke();
  }

  // Player




  drawPlayer();
  drawAxe();
  renderFireworks();
  drawXPBar();
  renderFloaters();
}

function drawGrid(){
  ctx.fillStyle = "#0d1524";
  ctx.fillRect(0,0,WORLD.w,WORLD.h);
  ctx.strokeStyle = "#14243a";
  ctx.lineWidth = 1;
  for (let x=0; x<WORLD.w; x+=40){
    ctx.beginPath(); ctx.moveTo(x+0.5,0); ctx.lineTo(x+0.5,WORLD.h); ctx.stroke();
  }
  for (let y=0; y<WORLD.h; y+=40){
    ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(WORLD.w,y+0.5); ctx.stroke();
  }
}

/* ---------- Store UI ---------- */
const storeEl = document.getElementById("store");
const axesEl  = document.getElementById("axes");
document.getElementById("closeStore").onclick = () => toggleStore(false);
document.getElementById("sellAll").onclick = sellAll;
document.getElementById("quickStore").addEventListener("click", () => toggleStore(true));
document.getElementById("quickSell").addEventListener("click", sellAll);

// Win modal DOM
const winEl = document.getElementById("win");
const winTimeEl = document.getElementById("winTime");
document.getElementById("again").onclick = () => location.reload();

// backdrop click to close; Esc closes on desktop
storeEl.addEventListener("pointerdown", (e) => { if (e.target === storeEl) toggleStore(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape") toggleStore(false); });

function sellAll(){
  if (player.wood <= 0){ flashText("No wood to sell", player.x, player.y-24, "#ffd17a"); return; }
  player.gold += player.wood * 1;
  flashText(`+${player.wood} gold`, player.x, player.y-30, "#ffe17a");
  player.wood = 0;
  updateHUD();
  refreshStore();
}

function toggleStore(open){
  if (open === true || (open !== false && storeEl.classList.contains("hidden"))){
    refreshStore();
    storeEl.classList.remove("hidden");
  }else{
    storeEl.classList.add("hidden");
  }
}

function refreshStore(){
  axesEl.innerHTML = "";

  // --- Axes section ---
  AXES.forEach((ax, idx) => {
    const owned = idx <= player.axeTier;
    const canBuyGold = player.gold >= ax.price;
    const meetsLevel = player.level >= ax.minLevel;
    const nextNeeded = idx === player.axeTier + 1;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div>
          <div style="font-weight:800">🪓 ${ax.name}</div>
          <div class="muted">Power: ${ax.power} · Cooldown: ${ax.cooldown}ms</div>
          <div class="muted">Req: Lv ${ax.minLevel}</div>
        </div>
        <div class="price">${ax.price}g</div>
      </div>
      <div class="row">
        ${owned ? `<span class="muted">Owned</span>` :
          nextNeeded
            ? `<button class="buy-axe ${canBuyGold && meetsLevel ? 'afford' : ''}" data-idx="${idx}" ${(!canBuyGold || !meetsLevel) ? 'disabled' : ''}>
                 ${meetsLevel ? 'Buy' : 'Need Lv ' + ax.minLevel}
               </button>`
            : `<span class="muted">Buy previous tier first</span>`}
      </div>
    `;
    axesEl.appendChild(card);
  });

  // --- Shoes section ---
  SHOES.forEach((sh, idx) => {
    const owned = idx <= player.shoeTier;
    const canBuyGold = player.gold >= sh.price;
    const meetsLevel = player.level >= sh.minLevel;
    const nextNeeded = idx === player.shoeTier + 1;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div>
          <div style="font-weight:800">👟 ${sh.name}</div>
          <div class="muted">Speed: ${sh.speed.toFixed(1)}</div>
          <div class="muted">Req: Lv ${sh.minLevel}</div>
        </div>
        <div class="price">${sh.price}g</div>
      </div>
      <div class="row">
        ${owned ? `<span class="muted">Owned</span>` :
          nextNeeded
            ? `<button class="buy-shoe ${canBuyGold && meetsLevel ? 'afford' : ''}" data-idx="${idx}" ${(!canBuyGold || !meetsLevel) ? 'disabled' : ''}>
                 ${meetsLevel ? 'Buy' : 'Need Lv ' + sh.minLevel}
               </button>`
            : `<span class="muted">Buy previous tier first</span>`}
      </div>
    `;
    axesEl.appendChild(card);
  });

  // --- Axe buy buttons ---
  axesEl.querySelectorAll("button.buy-axe").forEach(btn => {
    btn.addEventListener("click", async () => {
      const idx = +btn.dataset.idx;
      const ax = AXES[idx];
      if (player.gold >= ax.price && player.level >= ax.minLevel && idx === player.axeTier + 1){
        player.gold -= ax.price;
        // Preload axe sprite to avoid lag
        const img = AXE_SPRITES[idx];
        try { if (img && (!img.complete || !img.naturalWidth)) await img.decode(); } catch {}
        player.axeTier = idx;
        flashText(`Bought ${ax.name}!`, player.x, player.y-26, "#8ef58e");
        updateHUD();
        refreshStore();
      }
    });
  });

  // --- Shoe buy buttons ---
  axesEl.querySelectorAll("button.buy-shoe").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      const sh = SHOES[idx];
      if (player.gold >= sh.price && player.level >= sh.minLevel && idx === player.shoeTier + 1){
        player.gold -= sh.price;
        player.shoeTier = idx;
        player.speed = sh.speed;
        flashText(`Bought ${sh.name}!`, player.x, player.y-26, "#8ef58e");
        updateHUD();
        refreshStore();
      }
    });
  });
}

/* ---------- Help / Guide ---------- */
const guideEl = document.getElementById("guide");
document.getElementById("helpBtn").addEventListener("click", () => guideEl.classList.remove("hidden"));
document.getElementById("closeGuide").addEventListener("click", () => guideEl.classList.add("hidden"));
// open guide on first load (per session)
if (!sessionStorage.getItem("chop_seen_guide")){
  guideEl.classList.remove("hidden");
  sessionStorage.setItem("chop_seen_guide", "1");
}
guideEl.addEventListener("pointerdown", (e) => { if (e.target === guideEl) guideEl.classList.add("hidden"); });

/* ---------- HUD ---------- */
const woodEl = document.getElementById("wood");
const goldEl = document.getElementById("gold");
const axeEl  = document.getElementById("axe");
const levelEl= document.getElementById("level");
function updateHUD(){
  woodEl.textContent = player.wood;
  goldEl.textContent = player.gold;
  axeEl.textContent  = AXES[player.axeTier].name;
  levelEl.textContent= player.level;
  axeEl.textContent  = AXES[player.axeTier].name + " / " + SHOES[player.shoeTier].name;

}
updateHUD();

/* ---------- Floaters ---------- */
const floaters = [];
function flashText(txt, x, y, color="#fff"){
  floaters.push({txt,x,y,vy:-0.25,life:900,color});
}
function renderFloaters(){
  for (let i=floaters.length-1;i>=0;i--){
    const f = floaters[i];
    f.y += f.vy;
    f.life -= 16;
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life/900));
    ctx.fillStyle = f.color;
    ctx.font = "bold 14px system-ui";
    ctx.fillText(f.txt, f.x - ctx.measureText(f.txt).width/2, f.y);
    ctx.globalAlpha = 1;
    if (f.life <= 0) floaters.splice(i,1);
  }
}

/* ---------- Helpers ---------- */
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function pointInRect(x,y,r){ return x>r.x && x<r.x+r.w && y>r.y && y<r.y+r.h; }
function treeAtPoint(x,y){
  for (const tr of TREES){
    if (!tr.alive) continue;
    const rr = TYPES[tr.type].radius + 8;
    const dx = x - tr.x, dy = y - tr.y;
    if (dx*dx + dy*dy <= rr*rr) return tr;
  }
  return null;
}

// Math helpers
const TAU = Math.PI * 2;
const rad = (deg) => deg * Math.PI / 180;
const clamp01 = (v)=> Math.max(0, Math.min(1, v));
const easeOutCubic = (t)=> 1 - Math.pow(1 - t, 3);

// Player swing animation state


// stop swing after its duration


function drawAxe(){
  if (!player.swing?.active) return;

  const axe = AXES[player.axeTier];
  const img = AXE_SPRITES[player.axeTier]; // pick correct sprite
  if (!img || !img.complete) return;       // wait until loaded

  // progress of swing (0→1)
  const t = clamp01((performance.now() - player.swing.start) / (player.swing.duration || 240));
  const p = easeOutCubic(t);

  // swing from -80° to +40° (mirrored by dir)
  const startA = rad(-80) * player.swing.dir;
  const endA   = rad( 40) * player.swing.dir;
  const swingA = startA + (endA - startA) * p;

  const SPRITE_ALIGN = rad(-45);
  const baseSize = 80;
  const scale    = 0.9 + (axe.reach - 22) / 20;
  const size     = baseSize * scale;

  const gripX = 0.20 * size;
  const gripY = 0.70 * size;

  ctx.save();
    // Move to the player's hand (offset flips with facing)
  ctx.translate(
    player.x + HAND_OFFSET.x * player.facing,
    player.y + HAND_OFFSET.y
  );
  // Flip first, so rotation is mirrored naturally
  ctx.scale(player.facing, 1);
  ctx.rotate(swingA + SPRITE_ALIGN);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, -gripX, -gripY, size, size);
  ctx.restore();
}

function drawPlayer(){
  if (!playerSprite.complete || !playerSprite.naturalWidth){
    ctx.fillStyle = "#5aa9ff";
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
    return;
  }

  const size = PLAYER_BASE;
  const half = size / 2;

  // Draw the player sprite (affected by facing flip)
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.facing, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(playerSprite, -half, -half, size, size);
  ctx.restore();

// Draw the level text (not affected by facing flip)
const pulsing = performance.now() < (player.levelPulseUntil || 0);
const fontSize = pulsing ? 16 : 14;
ctx.fillStyle = "#ffd17a";
ctx.font = `bold ${fontSize}px system-ui`;
const lvlText = `Lv ${player.level}`;
ctx.fillText(lvlText, player.x - ctx.measureText(lvlText).width / 2, player.y - half - 6);

}

const FACE_EPS = 1.5;   // need at least this many px to change facing
const STOP_EPS = 0.75;  // deadzone around stop distance to avoid oscillation

function setFacing(dx){
  if (performance.now() < player.faceLockUntil) return; // locked during swing
  if (dx > FACE_EPS)      player.facing = 1;
  else if (dx < -FACE_EPS) player.facing = -1;
}

/* ---------- Fireworks (level-up) ---------- */
const fireworks = [];
const FW_COLORS = ["#ffd17a", "#8ef58e", "#9bd0ff", "#ff9bd4", "#ffe17a"];

function spawnFireworks(x, y, count = 26, spread = Math.PI * 2){
  for (let i = 0; i < count; i++){
    const ang = Math.random() * spread;
    const spd = 1.6 + Math.random() * 2.2;   // initial speed
    fireworks.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 0.3,         // slight upward bias
      life: 650 + Math.random() * 250,       // ms
      max: 700,
      size: 2 + Math.random() * 2,
      color: FW_COLORS[(Math.random() * FW_COLORS.length) | 0],
    });
  }
}

function updateFireworks(dt){
  for (let i = fireworks.length - 1; i >= 0; i--){
    const p = fireworks[i];
    p.life -= dt;
    if (p.life <= 0){ fireworks.splice(i, 1); continue; }
    // motion
    p.x += p.vx;
    p.y += p.vy;
    // gravity + drag
    p.vy += 0.04;
    p.vx *= 0.985;
    p.vy *= 0.985;
  }
}

function renderFireworks(){
  if (!fireworks.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter"; // pretty glow
  for (const p of fireworks){
    const a = Math.max(0, p.life / p.max);  // fade
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();


}