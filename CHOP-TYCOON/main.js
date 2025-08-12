/* =========================================
   Chop Tycoon — v4 (Mobile-optimized)
   - Pointer/touch to move & chop
   - Responsive canvas with devicePixelRatio scaling
   - Quick Store/Sell buttons on mobile
   ========================================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha:false });

// Logical world size follows CSS pixel size of the canvas
const WORLD = { w: 960, h: 600 };
let DPR = window.devicePixelRatio || 1;

// ===== Tree types & world data =====
const TYPES = {
  pine: { name:"Pine", radius:22, maxHp:20, yieldMin:8,  yieldMax:11, colorLeaf:"#2f7a45", reqLevel:1, xpGain:10 },
  oak:  { name:"Oak",  radius:26, maxHp:40, yieldMin:16, yieldMax:22, colorLeaf:"#2a6a2f", reqLevel:3, xpGain:25 },
};
const TREES = [];
const TREE_RESPAWN_MS = 12000;
const STORE_ZONE = { x: 780, y: 440, w: 150, h: 120 };

// ===== Player & progression =====
const player = {
  x: 120, y: 120, r: 14, speed: 3.1,        // slightly faster for mobile feel
  wood: 0, gold: 0,
  axeTier: 0, nextChopAt: 0,
  level: 1, xp: 0, xpNext: 50,
};
const AXES = [
  { name: "Wooden", power: 3,  cooldown: 700, price: 0,   minLevel: 1 },
  { name: "Stone",  power: 5,  cooldown: 580, price: 20,  minLevel: 2 },
  { name: "Bronze", power: 8,  cooldown: 500, price: 50,  minLevel: 3 },
  { name: "Iron",   power: 12, cooldown: 420, price: 120, minLevel: 4 },
  { name: "Steel",  power: 18, cooldown: 360, price: 240, minLevel: 5 },
];

// ===== Click-to-move & auto-chop =====
let moveTarget = null;     // {x,y} we’re walking to
let targetTree = null;     // tree we’re auto-chopping
const CHOP_RANGE = 50;

// ===== Responsive canvas (HiDPI) =====
function resizeCanvas(){
  // CSS size (displayed) → real pixel size for sharpness
  const cssW = Math.max(320, Math.floor(canvas.clientWidth));
  const cssH = Math.max(240, Math.floor(canvas.clientHeight));
  DPR = window.devicePixelRatio || 1;

  canvas.width  = Math.floor(cssW * DPR);
  canvas.height = Math.floor(cssH * DPR);

  // Draw in CSS pixel units (scale once)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  WORLD.w = cssW;
  WORLD.h = cssH;
}
resizeCanvas();
addEventListener("resize", resizeCanvas);

// ===== Input: Pointer events (works for mouse + touch) =====
canvas.style.touchAction = "none"; // avoid scroll/zoom gestures

function getCanvasPos(evt){
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left) * (canvas.width / rect.width) / DPR;
  const y = (evt.clientY - rect.top)  * (canvas.height / rect.height) / DPR;
  return { x, y };
}

canvas.addEventListener("pointerdown", (e) => {
  const p = getCanvasPos(e);

  // Shop tapped?
  if (pointInRect(p.x, p.y, STORE_ZONE)){
    toggleStore(storeEl.classList.contains("hidden"));
    return;
  }

  // Tree tapped?
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

// ===== Utility =====
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

// ===== Trees =====
function makeTree(x, y, type) {
  const t = TYPES[type];
  return { type, x, y, r: t.radius, hp: t.maxHp, alive: true, respawnAt: 0 };
}
const spots = [
  { x: 200, y: 160, type: "pine" },
  { x: 340, y: 420, type: "pine" },
  { x: 520, y: 220, type: "oak"  },
  { x: 680, y: 140, type: "pine" },
  { x: 480, y: 520, type: "oak"  },
];
for (const s of spots) TREES.push(makeTree(s.x, s.y, s.type));

// ===== Game loop =====
let last = performance.now();
function loop(t){
  const dt = Math.min(32, t - last);
  last = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ===== Update =====
function update(dt){
  // Move towards target
  if (moveTarget){
    const dx = moveTarget.x - player.x;
    const dy = moveTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > 1){
      const step = player.speed;
      player.x += (dx / d) * step;
      player.y += (dy / d) * step;
    } else {
      moveTarget = null;
    }
  }

  // Clamp
  player.x = clamp(player.x, player.r, WORLD.w - player.r);
  player.y = clamp(player.y, player.r, WORLD.h - player.r);

  // Auto-chop if we have a target
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

  // Respawn trees
  const now = performance.now();
  for (const tr of TREES){
    if (!tr.alive && now >= tr.respawnAt){
      tr.alive = true;
      tr.hp = TYPES[tr.type].maxHp;
      flashText(`${TYPES[tr.type].name} regrew 🌳`, tr.x, tr.y - 40, "#9bd0ff");
    }
  }
}

// Attempt a chop if allowed
function tryChop(tr){
  const now = performance.now();
  if (now < player.nextChopAt) return;

  const reqLvTree = TYPES[tr.type].reqLevel;
  const axe = AXES[player.axeTier];

  if (player.level < reqLvTree){
    flashText(`Need Lv ${reqLvTree} for ${TYPES[tr.type].name}`, tr.x, tr.y - 40, "#ffd17a");
    player.nextChopAt = now + 350;
    return;
  }
  if (player.level < axe.minLevel){
    flashText(`Need Lv ${axe.minLevel} for ${axe.name} axe`, player.x, player.y - 28, "#ffd17a");
    player.nextChopAt = now + 350;
    return;
  }

  tr.hp -= axe.power;
  player.nextChopAt = now + axe.cooldown;
  if (tr.hp <= 0){
    fellTree(tr);
    targetTree = null;
  } else {
    flashText("-" + axe.power, tr.x, tr.y - 30, "#ffe17a");
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

// ===== XP / Level =====
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
  refreshStore(); // update buttons if open
}

// ===== Render =====
function render(){
  ctx.clearRect(0,0,WORLD.w,WORLD.h);
  drawGrid();

  // store zone
  ctx.fillStyle = "rgba(90,169,255,0.12)";
  ctx.fillRect(STORE_ZONE.x, STORE_ZONE.y, STORE_ZONE.w, STORE_ZONE.h);
  ctx.strokeStyle = "rgba(90,169,255,0.6)";
  ctx.strokeRect(STORE_ZONE.x+0.5, STORE_ZONE.y+0.5, STORE_ZONE.w-1, STORE_ZONE.h-1);
  ctx.fillStyle = "#9bb3d1";
  ctx.font = "14px system-ui";
  ctx.fillText("🏪 STORE (Tap)", STORE_ZONE.x+36, STORE_ZONE.y+24);

  // trees
  for (const tr of TREES){
    if (!tr.alive){
      ctx.fillStyle = "#3b2a1f";
      ctx.beginPath(); ctx.arc(tr.x, tr.y, TYPES[tr.type].radius*0.5, 0, Math.PI*2); ctx.fill();
      continue;
    }
    ctx.fillStyle = "#5a3a28";
    ctx.beginPath(); ctx.arc(tr.x, tr.y+8, TYPES[tr.type].radius*0.45, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = TYPES[tr.type].colorLeaf;
    ctx.beginPath(); ctx.arc(tr.x, tr.y, TYPES[tr.type].radius, 0, Math.PI*2); ctx.fill();

    const maxHp = TYPES[tr.type].maxHp;
    const w = 40, h = 5, pct = Math.max(0, tr.hp)/maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(tr.x - w/2, tr.y - TYPES[tr.type].radius - 16, w, h);
    ctx.fillStyle = pct>0.5 ? "#8ef58e" : pct>0.25 ? "#ffd17a" : "#ff6b6b";
    ctx.fillRect(tr.x - w/2, tr.y - TYPES[tr.type].radius - 16, w*pct, h);

    // selected ring if auto-chopping that tree
    if (targetTree === tr){
      ctx.strokeStyle = "rgba(255,225,122,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tr.x, tr.y, TYPES[tr.type].radius+6, 0, Math.PI*2); ctx.stroke();
    }

    // type label
    ctx.fillStyle = "#cfe1ff";
    ctx.font = "bold 12px system-ui";
    ctx.fillText(TYPES[tr.type].name, tr.x - ctx.measureText(TYPES[tr.type].name).width/2, tr.y + TYPES[tr.type].radius + 14);
  }

  // destination marker
  if (moveTarget){
    ctx.strokeStyle = "rgba(122,199,255,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(moveTarget.x, moveTarget.y, 10, 0, Math.PI*2); ctx.stroke();
  }

  // player
  ctx.fillStyle = "#5aa9ff";
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#0b1420";
  ctx.beginPath(); ctx.arc(player.x + player.r*0.6, player.y-2, 2.5, 0, Math.PI*2); ctx.fill();

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

// ===== Store =====
const storeEl = document.getElementById("store");
const axesEl  = document.getElementById("axes");
document.getElementById("closeStore").onclick = () => toggleStore(false);
document.getElementById("sellAll").onclick = sellAll;
document.getElementById("quickStore")?.addEventListener("click", () => toggleStore(true));
document.getElementById("quickSell")?.addEventListener("click", sellAll);

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

// ===== HUD =====
const woodEl = document.getElementById("wood");
const goldEl = document.getElementById("gold");
const axeEl  = document.getElementById("axe");
const levelEl = document.getElementById("level");
const xpEl = document.getElementById("xp");
const xpNextEl = document.getElementById("xpNext");
function updateHUD(){
  woodEl.textContent = player.wood;
  goldEl.textContent = player.gold;
  axeEl.textContent  = AXES[player.axeTier].name;
  levelEl.textContent = player.level;
  xpEl.textContent = player.xp;
  xpNextEl.textContent = player.xpNext;
}
updateHUD();

// ===== Floaters =====
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