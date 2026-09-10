const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const FISH = [
  { name:'Lambari', emoji:'🐟', rarity:'Comum', chance:42, hp:72, atk:8, speed:9 },
  { name:'Tilápia', emoji:'🐠', rarity:'Comum', chance:26, hp:86, atk:9, speed:6 },
  { name:'Traíra', emoji:'🐟', rarity:'Raro', chance:16, hp:104, atk:13, speed:8 },
  { name:'Dourado', emoji:'🐠', rarity:'Épico', chance:9, hp:120, atk:17, speed:10 },
  { name:'Pirarucu', emoji:'🐡', rarity:'Épico', chance:5, hp:150, atk:19, speed:4 },
  { name:'Bagre Fantasma', emoji:'👻', rarity:'Lendário', chance:2, hp:172, atk:25, speed:11 }
];
const BOSSES = [
  { name:'Rei Carniça', key:'Boss Rei Carniça', emoji:'👑', hp:300, atk:33, speed:8, reward:420, size:1.34 },
  { name:'Barão do Lodo', key:'Boss Barão do Lodo', emoji:'🪨', hp:390, atk:30, speed:4, reward:500, size:1.42 },
  { name:'Voltágua', key:'Boss Voltágua', emoji:'⚡', hp:280, atk:36, speed:11, reward:540, size:1.32 }
];
const SHEET_FILES = {
  Lambari:'assets/lutador-lambari.png','Tilápia':'assets/lutador-tilapia.png','Traíra':'assets/lutador-traira.png',Dourado:'assets/lutador-dourado.png',Pirarucu:'assets/lutador-pirarucu.png','Bagre Fantasma':'assets/lutador-bagre-fantasma.png',
  'Boss Rei Carniça':'assets/boss-rei-carnica.png','Boss Barão do Lodo':'assets/boss-barao-lodo.png','Boss Voltágua':'assets/boss-voltagua.png'
};
const SIZE = { Lambari:.78,'Tilápia':.9,'Traíra':.94,Dourado:.92,Pirarucu:1.05,'Bagre Fantasma':.95 };
const sheets = {};
const laneBackground = new Image();
laneBackground.src = 'assets/arena-rio-v2.png';

Object.entries(SHEET_FILES).forEach(([key, src]) => {
  const image = new Image();
  image.onload = () => sheets[key] = prepareSheet(image);
  image.src = src;
});
function prepareSheet(image) {
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently:true }); ctx.drawImage(image, 0, 0);
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data, cw = canvas.width / 3, ch = canvas.height / 2, bounds = [];
  for (let frame = 0; frame < 6; frame++) {
    const col = frame % 3, row = frame > 2 ? 1 : 0, x0 = Math.floor(col*cw), y0 = Math.floor(row*ch), x1 = Math.ceil((col+1)*cw), y1 = Math.ceil((row+1)*ch);
    let minX=x1,minY=y1,maxX=x0,maxY=y0;
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) if(d[(y*canvas.width+x)*4+3]>20){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
    bounds.push(maxX>minX?{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1}:{x:x0,y:y0,w:cw,h:ch});
  }
  return { canvas, bounds };
}

const defaults = { money:70, rod:1, reel:1, fishermen:1, wins:0, catches:0 };
let state; try { state={...defaults,...JSON.parse(localStorage.getItem('rinhaDoRio'))}; } catch { state={...defaults}; }
state.fishermen=Math.max(1,Math.floor(state.fishermen||1));
const save = () => localStorage.setItem('rinhaDoRio', JSON.stringify(state));
function updateHud(){ $('#money').textContent=state.money; $('#rodQuick').textContent=`Nível ${state.rod}`; $('#reelQuick').textContent=`Nível ${state.reel}`; $('#winsQuick').textContent=state.wins; if($('#fishermenCount'))updateTycoonHud();save(); }
function showView(id){ $$('.view').forEach(v=>v.classList.toggle('active',v.id===id)); $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id)); if(id==='shop')renderShop(); }
$$('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
let toastTimer; function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}

function renderShop(){
  [['rod','Vara',90,'buyRod',20],['reel','Molinete',75,'buyReel',5]].forEach(([key,label,base,id,max])=>{
    const level=state[key],growth=key==='rod'?1.32:1.75,cost=Math.round(base*Math.pow(growth,level-1));
    $(`#${key}Level`).textContent=`NÍVEL ${level}`; $(`#${key}Segments`).innerHTML=Array.from({length:max},(_,i)=>`<i class="${i<level?'on':''}"></i>`).join('');
    const btn=$(`#${id}`);btn.textContent=level>=max?'MÁXIMO':`MELHORAR · ${cost} 🪙`;btn.disabled=level>=max||state.money<cost;
    btn.onclick=()=>{if(state.money<cost||state[key]>=max)return;state.money-=cost;state[key]++;updateHud();renderShop();toast(`${label} melhorado para o nível ${state[key]}!`)};
  });
}

function chooseFish(){
  const boost=(state.rod-1)*4,weights=FISH.map((f,i)=>Math.max(1,f.chance+(i<2?-boost:boost*(i/8))));let roll=Math.random()*weights.reduce((a,b)=>a+b,0),chosen=FISH[0];
  for(let i=0;i<FISH.length;i++){roll-=weights[i];if(roll<=0){chosen=FISH[i];break}}
  const quality=Math.min(5,1+Math.floor(Math.random()*Math.max(1,state.rod+1))),weight=+(0.4+Math.random()*(1.5+FISH.indexOf(chosen)*1.2)+state.rod*.08).toFixed(1),mult=1+(quality-1)*.09+weight*.025;
  return {...chosen,quality,weight,hp:Math.round(chosen.hp*mult),atk:Math.round(chosen.atk*mult),speed:Math.round(chosen.speed+quality*.35),difficulty:.72+FISH.indexOf(chosen)*.16+weight*.04};
}
const tycoon={progress:0,last:performance.now()};
const MAX_FISHERMEN=20;
function fishermanCost(){return Math.round(65*Math.pow(1.38,state.fishermen-1))}
function catchInterval(){const equipment=Math.max(5.8,10.5-state.reel*.75),teamPower=1+(state.fishermen-1)*.48;return Math.max(1.65,equipment/teamPower)}
function renderFishermen(){const visible=Math.min(10,state.fishermen);$('#fishermenStage').innerHTML=Array.from({length:visible},(_,i)=>{const row=i>=5?1:0,x=5+(i%5)*18,y=row?74:0,scale=row ? .78 : 1;return `<i class="tycoon-fisherman" style="--x:${x}%;--y:${y}px;--scale:${scale};--delay:${-(i*.23)}s"></i>`}).join('');const extra=$('#extraFishermen');extra.classList.toggle('hidden',state.fishermen<=visible);extra.textContent=`+${state.fishermen-visible} pescadores`}
function updateTycoonHud(){const interval=catchInterval(),cost=fishermanCost();$('#fishermenCount').textContent=state.fishermen;$('.tycoon-heading h3').lastChild.textContent=state.fishermen===1?' pescador':' pescadores';$('#catchRate').textContent=`${(60/interval).toFixed(1)} peixes/min`;const button=$('#hireFisherman');button.disabled=state.fishermen>=MAX_FISHERMEN||state.money<cost;button.textContent=state.fishermen>=MAX_FISHERMEN?'EQUIPE COMPLETA':`CONTRATAR · ${cost} 🪙`}
function automaticCatch(){const fish=chooseFish();state.catches++;spawnAlly(fish);$('#lastCatch').textContent=`${fish.emoji} ${fish.name} ${'★'.repeat(fish.quality)} foi enviado à batalha!`;$('#lastCatch').classList.remove('flash');requestAnimationFrame(()=>$('#lastCatch').classList.add('flash'));updateHud()}
function tycoonLoop(now){const dt=Math.min(.2,(now-tycoon.last)/1000);tycoon.last=now;tycoon.progress+=dt/catchInterval()*100;if(tycoon.progress>=100){tycoon.progress-=100;automaticCatch()}$('#autoCatchProgress').style.width=`${Math.min(100,tycoon.progress)}%`;$('#catchTimerText').textContent=`Peixe em ${Math.max(.1,catchInterval()*(1-tycoon.progress/100)).toFixed(1)}s`;requestAnimationFrame(tycoonLoop)}
$('#hireFisherman').onclick=()=>{const cost=fishermanCost();if(state.fishermen>=MAX_FISHERMEN||state.money<cost)return;state.money-=cost;state.fishermen++;renderFishermen();updateHud();toast(`Novo pescador contratado! Equipe: ${state.fishermen}`)};

const lane={units:[],particles:[],last:performance.now(),enemySpawn:2,bossTimer:60,bossIndex:0,elapsed:0,allyBase:700,enemyBase:700,maxBase:700,enemyHpMultiplier:1,messageTimer:0};
function makeUnit(data,team,boss=false){const id=globalThis.crypto?.randomUUID?.()||Math.random(),teamMultiplier=team==='enemy'?lane.enemyHpMultiplier:1,maxHp=Math.round(data.hp*(boss?1.25:1.45)*teamMultiplier);return{...data,id,team,boss,key:boss?data.key:data.name,x:team==='ally'?115:1085,y:315+(Math.random()-.5)*10,dir:team==='ally'?1:-1,maxHp,curHp:maxHp,cooldown:.3+Math.random()*.4,attack:null,moving:false,hurt:0,dead:false,size:boss?data.size:(SIZE[data.name]||.9)}}
function spawnAlly(fish){lane.units.push(makeUnit(fish,'ally'));setLaneMessage(`${fish.name} foi invocado no seu time!`)}
function spawnEnemy(){
  const allyNames=new Set(lane.units.filter(u=>u.team==='ally'&&!u.dead).map(u=>u.name)),available=FISH.filter(f=>!allyNames.has(f.name)),pool=available.length?available:FISH,base=pool[Math.floor(Math.random()*pool.length)],scale=1+Math.min(.55,lane.elapsed/600);
  lane.units.push(makeUnit({...base,hp:Math.round(base.hp*scale),atk:Math.round(base.atk*scale)},'enemy'));
}
function spawnBoss(){const boss=BOSSES[lane.bossIndex++%BOSSES.length];lane.units.push(makeUnit(boss,'enemy',true));setLaneMessage(`♛ ${boss.name} INVADIU A PISTA!`,5);toast(`BOSS INVOCADO: ${boss.name}!`)}
function setLaneMessage(msg,time=2.8){$('#laneMessage').textContent=msg;lane.messageTimer=time}
function nearestEnemy(unit){let best=null,dist=Infinity;for(const other of lane.units){if(other.dead||other.team===unit.team)continue;const d=Math.abs(other.x-unit.x);if(d<dist){dist=d;best=other}}return best}
function beginAttack(unit,target,heavy){unit.attack={t:0,hit:false,heavy,target};unit.cooldown=heavy ? .95 : .55}
function updateUnit(unit,dt){
  if(unit.dead)return;unit.cooldown=Math.max(0,unit.cooldown-dt);unit.hurt=Math.max(0,unit.hurt-dt);unit.moving=false;
  if(unit.attack){unit.attack.t+=dt;const hitAt=unit.attack.heavy ? .32 : .17;if(!unit.attack.hit&&unit.attack.t>=hitAt){unit.attack.hit=true;const target=unit.attack.target;if(target&&!target.dead&&Math.abs(target.x-unit.x)<105){const dmg=Math.round(unit.atk*(unit.attack.heavy?1.7:1)*(.9+Math.random()*.2));hurtUnit(target,dmg,unit)}}if(unit.attack.t>(unit.attack.heavy ? .58 : .34))unit.attack=null;return}
  const target=nearestEnemy(unit);if(target){unit.dir=target.x>unit.x?1:-1;const dist=Math.abs(target.x-unit.x);if(dist>78){unit.x+=unit.dir*(48+unit.speed*6)*dt;unit.moving=true}else if(unit.cooldown<=0)beginAttack(unit,target,Math.random()<(unit.boss ? .42 : .27));}
  else{const goal=unit.team==='ally'?1120:80;unit.dir=goal>unit.x?1:-1;if(Math.abs(goal-unit.x)>48){unit.x+=unit.dir*(48+unit.speed*6)*dt;unit.moving=true}else if(unit.cooldown<=0){unit.cooldown=.72;hitBase(unit)}}
  unit.x=Math.max(65,Math.min(1135,unit.x));
}
function hurtUnit(target,dmg,attacker){target.curHp-=dmg;target.hurt=.18;target.x+=attacker.dir*10;burst(target.x,target.y-70,attacker.boss?'#ff9b31':'#fff09a',dmg);if(target.curHp<=0){target.dead=true;if(target.team==='enemy'){const reward=target.boss?target.reward:12+Math.round(target.maxHp*.08);state.money+=reward;state.wins++;updateHud();setLaneMessage(target.boss?`♛ ${target.name} derrotado! +${reward} moedas`:`${target.name} derrotado! +${reward} moedas`,target.boss?5:2.5)}}}
function hitBase(unit){const dmg=Math.round(unit.atk*(unit.boss?1.5:1));if(unit.team==='ally'){lane.enemyBase-=dmg;burst(1125,300,'#ffe080',dmg)}else{lane.allyBase-=dmg;burst(75,300,'#ff806b',dmg)}}
function burst(x,y,color,number){for(let i=0;i<8;i++)lane.particles.push({x,y,vx:(Math.random()-.5)*150,vy:-30-Math.random()*100,t:.65,color,size:3+Math.random()*6,number:i?null:number})}
function resetBase(which){if(which==='enemy'){state.money+=220;lane.enemyHpMultiplier*=1.1;updateHud();toast(`Cais rival destruído! +220 moedas · Vida inimiga +10%`);setLaneMessage(`O próximo exército rival terá ${Math.round((lane.enemyHpMultiplier-1)*100)}% mais vida!`,4);lane.enemyBase=lane.maxBase;lane.units=lane.units.filter(u=>u.team==='ally')}else{state.money=Math.max(0,state.money-60);updateHud();toast('Seu cais caiu! -60 moedas');lane.allyBase=lane.maxBase;lane.units=[]}}
function laneLoop(now){
  const dt=Math.min(.04,(now-lane.last)/1000);lane.last=now;lane.elapsed+=dt;lane.enemySpawn-=dt;lane.bossTimer-=dt;lane.messageTimer-=dt;
  if(lane.enemySpawn<=0){spawnEnemy();lane.enemySpawn=7.5+Math.random()*3}if(lane.bossTimer<=0){spawnBoss();lane.bossTimer=60}
  lane.units.forEach(u=>updateUnit(u,dt));lane.units=lane.units.filter(u=>!u.dead);lane.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.t-=dt});lane.particles=lane.particles.filter(p=>p.t>0);
  if(lane.enemyBase<=0)resetBase('enemy');if(lane.allyBase<=0)resetBase('ally');if(lane.messageTimer<=0)$('#laneMessage').textContent=lane.units.some(u=>u.team==='ally')?'A batalha acontece enquanto você pesca.':'Pesque para reforçar seu time!';
  drawLane();updateLaneHud();requestAnimationFrame(laneLoop);
}
function updateLaneHud(){const sec=Math.max(0,Math.ceil(lane.bossTimer));$('#bossCountdown').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('#allyCount').textContent=lane.units.filter(u=>u.team==='ally').length;$('#enemyCount').textContent=lane.units.filter(u=>u.team==='enemy').length;$('#allyBaseHp').style.width=`${Math.max(0,lane.allyBase/lane.maxBase*100)}%`;$('#enemyBaseHp').style.width=`${Math.max(0,lane.enemyBase/lane.maxBase*100)}%`}
function drawLane(){
  const c=$('#laneCanvas'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
  if(laneBackground.complete&&laneBackground.naturalWidth){const sourceRatio=laneBackground.naturalWidth/laneBackground.naturalHeight,targetRatio=c.width/c.height;let sx=0,sy=0,sw=laneBackground.naturalWidth,sh=laneBackground.naturalHeight;if(sourceRatio<targetRatio){sh=sw/targetRatio;sy=(laneBackground.naturalHeight-sh)/2}else{sw=sh*targetRatio;sx=(laneBackground.naturalWidth-sw)/2}x.imageSmoothingEnabled=false;x.drawImage(laneBackground,sx,sy,sw,sh,0,0,c.width,c.height);x.fillStyle='#09292c18';x.fillRect(0,0,c.width,c.height)}else{const sky=x.createLinearGradient(0,0,0,380);sky.addColorStop(0,'#f2aa68');sky.addColorStop(.58,'#9c5650');sky.addColorStop(.59,'#26716d');sky.addColorStop(1,'#123b40');x.fillStyle=sky;x.fillRect(0,0,1200,380);x.fillStyle='#173b3d';for(let i=0;i<18;i++){x.fillRect(i*75,120+(i%3)*9,45,90);x.fillRect(i*75+10,92+(i%3)*10,25,35)}x.fillStyle='#75452f';x.fillRect(0,302,1200,78);x.fillStyle='#a96740';x.fillRect(0,309,1200,71);drawBase(x,55,'#38c8aa','SEU CAIS');drawBase(x,1145,'#d75b4b','RIVAL')}
  const ordered=[...lane.units].sort((a,b)=>a.y-b.y);ordered.forEach(u=>drawUnit(x,u));lane.particles.forEach(p=>{x.globalAlpha=Math.min(1,p.t*2);x.fillStyle=p.color;x.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);if(p.number){x.font='bold 18px Nunito';x.strokeStyle='#4b2420';x.lineWidth=4;x.strokeText(`-${p.number}`,p.x,p.y-8);x.fillStyle='#fff5c4';x.fillText(`-${p.number}`,p.x,p.y-8)}});x.globalAlpha=1;
}
function drawBase(x,pos,color,label){x.fillStyle='#3f2926';x.fillRect(pos-25,195,50,116);x.fillStyle=color;x.beginPath();x.moveTo(pos,190);x.lineTo(pos,105);x.lineTo(pos+(pos<600?65:-65),125);x.lineTo(pos,150);x.fill();x.fillStyle='#fff';x.font='bold 10px Nunito';x.textAlign='center';x.fillText(label,pos,215)}
function drawUnit(x,u){
  x.fillStyle='#0b252766';x.beginPath();x.ellipse(u.x,u.y+3,38*u.size,8*u.size,0,0,Math.PI*2);x.fill();x.save();x.translate(u.x,u.y);x.scale(u.dir,1);if(u.hurt>0)x.globalAlpha=.45;
  let frame=0;if(u.hurt>0)frame=5;else if(u.attack)frame=u.attack.heavy?4:3;else if(u.moving)frame=1+(Math.floor(performance.now()/(150-Math.min(55,u.speed*4)))%2);const sheet=sheets[u.key];
  if(sheet){const b=sheet.bounds[frame],dh=145*u.size,dw=Math.min(175*u.size,dh*b.w/b.h);x.imageSmoothingEnabled=false;x.filter='drop-shadow(4px 5px 2px #08282a66)';x.drawImage(sheet.canvas,b.x,b.y,b.w,b.h,-dw/2,-dh,dw,dh);x.filter='none'}else{x.font=`${65*u.size}px serif`;x.textAlign='center';x.fillText(u.emoji,0,-10)}x.restore();
  const barW=58*u.size;x.fillStyle='#301b20';x.fillRect(u.x-barW/2,u.y-155*u.size,barW,7);x.fillStyle=u.team==='ally'?'#44dc89':'#ee6554';x.fillRect(u.x-barW/2,u.y-155*u.size,barW*Math.max(0,u.curHp/u.maxHp),7);if(u.boss){x.fillStyle='#ffd25d';x.font='bold 10px Nunito';x.textAlign='center';x.fillText(`♛ ${u.name}`,u.x,u.y-164*u.size)}
}

renderFishermen();updateHud();renderShop();updateLaneHud();requestAnimationFrame(tycoonLoop);requestAnimationFrame(laneLoop);
