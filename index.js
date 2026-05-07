function goTo(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.proto-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const nb = document.getElementById('nav-'+id);
  if(nb) nb.classList.add('active');
  if(id==='s-editor') buildEditor();
}

// ---- Segment data ----
const SEG_DATA = [
  {id:0, time:'0:00', dur:'0:47', speaker:'Host', status:'ontopic', kept:true,  profane:false, text:'Welcome back. Today we\'re talking about focus systems and what actually works for ADHD brains.'},
  {id:1, time:'0:48', dur:'0:32', speaker:'Host', status:'drift',   kept:false, profane:false, text:'Before we dive in — quick mention of my new newsletter, link in description. Subscribe at my website.'},
  {id:2, time:'1:24', dur:'0:51', speaker:'Host', status:'ontopic', kept:true,  profane:false, text:'Context-switching destroys deep work. Every interruption costs 23 minutes to recover from fully.'},
  {id:3, time:'2:15', dur:'1:04', speaker:'Host', status:'drift',   kept:false, profane:false, text:'Oh and that new app I mentioned last week — totally unrelated, but I\'ve been thinking about it.'},
  {id:4, time:'3:19', dur:'0:44', speaker:'Host', status:'profane', kept:true,  profane:true,  text:'The Pomodoro method works well because it makes time tangible. That\'s the whole damn point — time blindness is the real enemy.', profWord:'damn'},
  {id:5, time:'4:03', dur:'2:10', speaker:'Host', status:'ontopic', kept:true,  profane:false, text:'Body doubling, visual timers, and environmental anchors are the three tools I actually use every single day.'},
];
let segOrder = [0,1,2,3,4,5];
let profaneMuted = {4:true};
let adhdMode = false;
let dragSrc = null;

// ---- Waveform ----
function buildWave(){
  const box = document.getElementById('waveBox');
  if(!box || box.querySelector('.bar')) return;
  const W = box.offsetWidth;
  const count = Math.floor(W / 6);
  const types = [];
  for(let i=0;i<count;i++){
    const p = i/count;
    if(p>0.04 && p<0.08) types.push('drift');
    else if(p>0.13 && p<0.19) types.push('drift');
    else if(p>0.19 && p<0.28) types.push('removed');
    else if(p>0.37 && p<0.41) types.push('profane');
    else types.push('ontopic');
  }
  const frag = document.createDocumentFragment();
  types.forEach((t,i)=>{
    const b = document.createElement('div');
    b.className = 'bar '+t;
    const h = 18 + Math.abs(Math.sin(i*0.38+1)*22) + Math.abs(Math.sin(i*0.15)*16);
    b.style.height = Math.max(6, Math.round(h))+'px';
    frag.appendChild(b);
  });
  box.insertBefore(frag, box.querySelector('.playhead'));
}

// ---- Build segments ----
function buildEditor(){
  buildWave();
  renderSegments();
}

function renderSegments(){
  const list = document.getElementById('segList');
  const header = list.querySelector('.seg-header');
  list.innerHTML='';
  list.appendChild(header);

  let kept=0, drifts=0;
  segOrder.forEach(i=>{
    if(SEG_DATA[i].kept) kept++;
    if(SEG_DATA[i].status==='drift' && !SEG_DATA[i].kept) drifts++;
  });
  document.getElementById('driftPill').textContent = drifts+' drift'+(drifts!==1?'s':'');
  document.getElementById('keptVal').textContent = kept+' kept';
  document.getElementById('scoreVal').textContent = Math.round((kept/SEG_DATA.length)*100)+'%';

  segOrder.forEach(idx=>{
    const s = SEG_DATA[idx];
    const card = document.createElement('div');
    const classes = ['seg-card'];
    if(!s.kept) classes.push('is-removed');
    if(s.status==='drift') classes.push('is-drift');
    if(s.status==='profane') classes.push('is-profane');
    if(adhdMode){ classes.push('adhd-card'); classes.push(s.status==='ontopic'?'is-ontopic':''); }
    card.className = classes.join(' ');
    card.draggable = true;
    card.dataset.idx = idx;

    const chipClass = s.status==='ontopic'?'chip-on':s.status==='drift'?'chip-drift':s.status==='profane'?'chip-profane':'chip-review';
    const chipLabel = s.status==='ontopic'?'On-topic':s.status==='drift'?'Drift':s.status==='profane'?'Profanity':'Review';

    let textHtml = s.text;
    if(s.profane && s.profWord){
      const muted = profaneMuted[idx] !== false;
      textHtml = textHtml.replace(s.profWord,
        `<span class="profane-hl${muted?'':' restored'}" onclick="toggleProfane(${idx})" title="Click to ${muted?'restore':'mute'}">${s.profWord}</span>`);
    }

    card.innerHTML = `
      <div class="seg-inner">
        <div class="drag-grip"><span></span><span></span><span></span></div>
        <div class="seg-content">
          <div class="seg-meta">
            <span class="timestamp">${s.time}</span>
            <span class="speaker">${s.speaker}</span>
            <span class="status-chip ${chipClass}">${chipLabel}</span>
            ${s.profane?'<span class="status-chip chip-profane">Profanity</span>':''}
          </div>
          <div class="seg-text${s.kept?'':' struck'}">${textHtml}</div>
          <div class="seg-actions">
            ${s.kept
              ? `<button class="btn-sm btn-remove" onclick="toggleKept(${idx})">Remove</button>`
              : `<button class="btn-sm btn-keep" onclick="toggleKept(${idx})">Restore</button>`}
            <button class="btn-sm btn-review-sm">Review</button>
            <span class="seg-dur">${s.dur}</span>
          </div>
          ${adhdMode && s.status==='drift'?'<div class="adhd-hint">↕ Drag to group with related segments</div>':''}
          ${adhdMode && s.profane?'<div class="adhd-hint">⚠ Tap the highlighted word to mute or restore it</div>':''}
          ${s.status==='drift'&&s.kept?'<div class="reorder-tip">↕ Grab handle to reorder</div>':''}
        </div>
      </div>`;

    card.addEventListener('dragstart', e=>{ dragSrc=idx; card.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
    card.addEventListener('dragend', ()=>{ card.classList.remove('dragging'); document.querySelectorAll('.seg-card').forEach(c=>c.classList.remove('drag-over')); });
    card.addEventListener('dragover', e=>{ e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', ()=>card.classList.remove('drag-over'));
    card.addEventListener('drop', e=>{
      e.preventDefault(); card.classList.remove('drag-over');
      if(dragSrc===null||dragSrc===idx) return;
      const from=segOrder.indexOf(dragSrc), to=segOrder.indexOf(idx);
      segOrder.splice(from,1); segOrder.splice(to,0,dragSrc);
      dragSrc=null; renderSegments();
    });

    list.appendChild(card);
  });
}

function toggleKept(idx){ SEG_DATA[idx].kept=!SEG_DATA[idx].kept; renderSegments(); }
function toggleProfane(idx){ profaneMuted[idx] = profaneMuted[idx]===false; renderSegments(); }
function removeAllDrifts(){ SEG_DATA.forEach(s=>{if(s.status==='drift')s.kept=false;}); renderSegments(); }
function toggleAdhd(){
  adhdMode=!adhdMode;
  document.getElementById('adhdToggle').classList.toggle('on',adhdMode);
  document.getElementById('adhdBar').classList.toggle('visible',adhdMode);
  renderSegments();
}

window.addEventListener('resize', ()=>{ if(document.getElementById('s-editor').classList.contains('active')) buildWave(); });