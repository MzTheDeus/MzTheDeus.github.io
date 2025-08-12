/* ==========================================================
   Chop Tycoon — Portrait v6 (mobile-first)
   - Portrait world (600x900)
   - Header HUD (top), Help modal auto-opens
   - Tap to move; tap tree to auto-chop; bottom quick actions
   - Canvas scales to fill between header & bottom buttons
   ========================================================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha:false });
const axeSprite = new Image();
axeSprite.src = "assets/axe.png";

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
  pine: { name:"Pine", radius:22, maxHp:24, yieldMin:8,  yieldMax:12, colorLeaf:"#2f7a45", reqLevel:1, xpGain:10 },
  oak:  { name:"Oak",  radius:26, maxHp:46, yieldMin:16, yieldMax:22, colorLeaf:"#2a6a2f", reqLevel:3, xpGain:25 },
};
const TREES = [];
const TREE_RESPAWN_MS = 12000;
const STORE_ZONE = { x: 390, y: 740, w: 170, h: 110 }; // bottom-right area in portrait

const player = {
  x: 120, y: 180, r: 14, speed: 3.2,
  wood: 0, gold: 0,
  axeTier: 0, nextChopAt: 0,
  level: 1, xp: 0, xpNext: 50,
  swing: { active:false, start:0, duration:0, dir:1 },
};
const AXES = [
  { name:"Wooden", power:3,  cooldown:700, price:0,   minLevel:1, animMs:280, reach:22, color:"#8b5a2b", blade:"#d4d0c8", sprite:"assets/wood.png" },
  { name:"Stone",  power:5,  cooldown:580, price:20,  minLevel:2, animMs:260, reach:24, color:"#6b7280", blade:"#d1d5db", sprite:"assets/stone.png"   },
  { name:"Bronze", power:8,  cooldown:500, price:50,  minLevel:3, animMs:240, reach:26, color:"#b45309", blade:"#f59e0b", sprite:"assets/bronze.png"  },
  { name:"Iron",   power:12, cooldown:420, price:120, minLevel:4, animMs:220, reach:28, color:"#9ca3af", blade:"#e5e7eb", sprite:"assets/iron.png"    },
  { name:"Steel",  power:18, cooldown:360, price:240, minLevel:5, animMs:200, reach:30, color:"#94a3b8", blade:"#f8fafc", sprite:"assets/steel.png"   },
];

// Preload axe images
const AXE_SPRITES = AXES.map(ax => {
  const img = new Image();
  img.decoding = "async";
  img.src = ax.sprite;
  img.decode?.().catch(()=>{ /* ignore decode errors; draw will skip until ready */ });
  return img;
});


/* ---------- Input: pointer (mouse + touch) ---------- */
let moveTarget = null;     // {x,y}
let targetTree = null;     // tree to auto-chop
const CHOP_RANGE = 50;

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", (e) => {
  const p = getCanvasPos(e);

  // Shop tap?
  if (pointInRect(p.x, p.y, STORE_ZONE)){
    toggleStore(storeEl.classList.contains("hidden"));
    return;
  }

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
// Layout: 5 trees, spaced for portrait
[
  { x: 140, y: 260, type: "pine" },
  { x: 300, y: 360, type: "oak"  },
  { x: 460, y: 260, type: "pine" },
  { x: 200, y: 520, type: "pine" },
  { x: 420, y: 520, type: "oak"  },
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
  if (player.swing.active && performance.now() >= player.swing.start + player.swing.duration){
  player.swing.active = false;
}

  // Move
  if (moveTarget){
    const dx = moveTarget.x - player.x;
    const dy = moveTarget.y - player.y;
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
  if (targetTree){
    if (!targetTree.alive){
      targetTree = null;
    } else {
      const d2 = (player.x - targetTree.x) ** 2 + (player.y - targetTree.y) ** 2;
      if (d2 > CHOP_RANGE * CHOP_RANGE){
        moveTarget = { x: targetTree.x, y: targetTree.y };
      } else {
        tryChop(targetTree);
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
  }
  updateHUD();
  refreshStore();
}

/* ---------- Render ---------- */
function render(){
  ctx.clearRect(0,0,WORLD.w,WORLD.h);
  drawGrid();

  // Store zone (bottom-right)
  ctx.fillStyle = "rgba(90,169,255,0.12)";
  ctx.fillRect(STORE_ZONE.x, STORE_ZONE.y, STORE_ZONE.w, STORE_ZONE.h);
  ctx.strokeStyle = "rgba(90,169,255,0.6)";
  ctx.strokeRect(STORE_ZONE.x+0.5, STORE_ZONE.y+0.5, STORE_ZONE.w-1, STORE_ZONE.h-1);
  ctx.fillStyle = "#9bb3d1"; ctx.font = "14px system-ui";
  ctx.fillText("🏪 STORE (Tap)", STORE_ZONE.x+32, STORE_ZONE.y+24);

  // Trees
  for (const tr of TREES){
    if (!tr.alive){
      ctx.fillStyle = "#3b2a1f";
      ctx.beginPath(); ctx.arc(tr.x, tr.y, TYPES[tr.type].radius*0.5, 0, Math.PI*2); ctx.fill();
      continue;
    }
    ctx.fillStyle = "#5a3a28"; // trunk
    ctx.beginPath(); ctx.arc(tr.x, tr.y+8, TYPES[tr.type].radius*0.45, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = TYPES[tr.type].colorLeaf; // leaves
    ctx.beginPath(); ctx.arc(tr.x, tr.y, TYPES[tr.type].radius, 0, Math.PI*2); ctx.fill();

    // HP bar
    const maxHp = TYPES[tr.type].maxHp;
    const w = 44, h = 6, pct = Math.max(0, tr.hp)/maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(tr.x - w/2, tr.y - TYPES[tr.type].radius - 18, w, h);
    ctx.fillStyle = pct>0.5 ? "#8ef58e" : pct>0.25 ? "#ffd17a" : "#ff6b6b";
    ctx.fillRect(tr.x - w/2, tr.y - TYPES[tr.type].radius - 18, w*pct, h);

    // Selected ring
    if (targetTree === tr){
      ctx.strokeStyle = "rgba(255,225,122,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tr.x, tr.y, TYPES[tr.type].radius+6, 0, Math.PI*2); ctx.stroke();
    }

    // Label
    ctx.fillStyle = "#cfe1ff"; ctx.font = "bold 12px system-ui";
    const label = TYPES[tr.type].name;
    ctx.fillText(label, tr.x - ctx.measureText(label).width/2, tr.y + TYPES[tr.type].radius + 14);
  }

  // Destination marker
  if (moveTarget){
    ctx.strokeStyle = "rgba(122,199,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(moveTarget.x, moveTarget.y, 10, 0, Math.PI*2); ctx.stroke();
  }

  // Player
  ctx.fillStyle = "#5aa9ff";
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#0b1420";
  ctx.beginPath(); ctx.arc(player.x + player.r*0.6, player.y-2, 2.5, 0, Math.PI*2); ctx.fill();

  drawAxe();

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
            ? `<button class="buy ${canBuyGold && meetsLevel ? 'afford' : ''}" data-idx="${idx}" ${(!canBuyGold || !meetsLevel) ? 'disabled' : ''}>
                 ${meetsLevel ? 'Buy' : 'Need Lv ' + ax.minLevel}
               </button>`
            : `<span class="muted">Buy previous tier first</span>`}
      </div>
    `;
    axesEl.appendChild(card);
  });

  axesEl.querySelectorAll("button.buy").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      const ax = AXES[idx];
      if (player.gold >= ax.price && player.level >= ax.minLevel && idx === player.axeTier + 1){
        player.gold -= ax.price;
        player.axeTier = idx;
        flashText(`Bought ${ax.name}!`, player.x, player.y-26, "#8ef58e");
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
  ctx.translate(player.x, player.y);
  ctx.rotate(swingA + SPRITE_ALIGN);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, -gripX, -gripY, size, size);
  ctx.restore();
}
