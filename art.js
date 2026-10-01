/* 그림 도구: 학생 얼굴, 직업 아이콘, 사람 픽토그램, 완료 축하 효과 */
var Art = (function(){
  var SKIN = ['#f3cfb0','#eab894','#d9a27c','#f0c4a0','#e3b08a','#f5d3b6','#dba583','#f1c9a8','#e6b48f'];
  var HAIR = ['#2b2320','#3a2a22','#1f1a18','#4a3426','#2a2a2a','#5a3b28','#1f1a18','#3a2a22','#4a3426'];

  // look 0~8: 머리 모양
  var CAP = '<path d="M14 21 C13 10 35 10 34 21 C31 15 17 15 14 21Z"/>';
  var HAIRS = [
    CAP,
    '<path d="M13 26 C10 9 38 9 35 26 L35 30 L31 30 L31 19 C27 15 21 15 17 19 L17 30 L13 30Z"/>',
    CAP+'<circle cx="36" cy="17" r="4.5"/><path d="M36 20 q3 6 0 11 q-2-5 0-11z"/>',
    '<circle cx="16" cy="16" r="4.5"/><circle cx="21" cy="12.5" r="4.5"/><circle cx="27" cy="12.5" r="4.5"/><circle cx="32" cy="16" r="4.5"/>',
    CAP+'<path d="M14 19 C17 12 30 10 34 18 L23 16Z"/>',
    CAP+'<circle cx="24" cy="8.5" r="4.5"/>',
    '<path d="M14.5 19 C15 12 33 12 33.5 19 C30 16.5 18 16.5 14.5 19Z"/>',
    CAP+'<circle cx="12" cy="24" r="3.6"/><circle cx="36" cy="24" r="3.6"/>',
    '<path d="M13 32 C9 8 39 8 35 32 L31 32 L31 19 C27 16 21 16 17 19 L17 32Z"/>'
  ];

  function avatar(look, shirt, cls){
    var i = look % 9;
    return '<svg class="'+(cls||'av')+'" viewBox="0 0 48 48" aria-hidden="true">'+
      '<circle cx="24" cy="24" r="24" style="fill:var(--accent-soft)"/>'+
      '<path d="M8 48 C8 36 40 36 40 48Z" fill="'+(shirt||'#0d7a70')+'"/>'+
      '<rect x="21" y="29" width="6" height="6" fill="'+SKIN[i]+'"/>'+
      '<circle cx="24" cy="22" r="10" fill="'+SKIN[i]+'"/>'+
      '<g fill="'+HAIR[i]+'">'+HAIRS[i]+'</g>'+
      '<circle cx="20.5" cy="23" r="1.3" fill="#1b2a33"/><circle cx="27.5" cy="23" r="1.3" fill="#1b2a33"/>'+
      '<path d="M21 27 q3 2.6 6 0" stroke="#1b2a33" stroke-width="1.3" fill="none" stroke-linecap="round"/>'+
      '</svg>';
  }

  var JOB_PATHS = {
    dev:   '<polyline points="8,7 3,12 8,17"/><polyline points="16,7 21,12 16,17"/><line x1="14" y1="5" x2="10" y2="19"/>',
    sci:   '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><line x1="7.5" y1="15" x2="16.5" y2="15"/>',
    nurse: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 7.5v9M7.5 12h9"/>',
    teach: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/><line x1="7" y1="9" x2="13" y2="9"/>'
  };
  function job(id, cls){
    if(!JOB_PATHS[id]) return '';
    return '<svg class="'+(cls||'ji')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+JOB_PATHS[id]+'</svg>';
  }

  function person(color, cls){
    return '<svg class="'+(cls||'')+'" viewBox="0 0 10 16" aria-hidden="true"><circle cx="5" cy="3.4" r="2.8" fill="'+color+'"/><path d="M0.8 16 V10 a4.2 4.2 0 0 1 8.4 0 V16 Z" fill="'+color+'"/></svg>';
  }

  var MEDALS = {
    eye:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    box:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>'
  };

  function confetti(canvas){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d'); if(!ctx) return;
    var W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
    var colors = ['#0d7a70','#d9712b','#4b5cc4','#d9961c','#2c8a4b','#c44b6e'];
    var ps = [];
    for(var i=0;i<140;i++){
      ps.push({x:W/2+(Math.random()-.5)*W*.3, y:H*.35, vx:(Math.random()-.5)*14, vy:-Math.random()*14-4,
        r:Math.random()*6+4, c:colors[i%colors.length], a:Math.random()*6, va:(Math.random()-.5)*.4});
    }
    var t0 = performance.now();
    (function frame(t){
      var dt = t - t0; ctx.clearRect(0,0,W,H);
      ps.forEach(function(p){
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle=p.c;
        ctx.globalAlpha = Math.max(0, 1 - dt/2600);
        ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); ctx.restore();
      });
      if(dt < 2600) requestAnimationFrame(frame); else ctx.clearRect(0,0,W,H);
    })(t0);
  }

  return {avatar:avatar, job:job, person:person, MEDALS:MEDALS, confetti:confetti};
})();
