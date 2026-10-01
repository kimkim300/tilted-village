/* 화면 흐름과 상호작용 */
function boot(){
  var M = Model, S = Model.S;
  var flow = {predict:null, flipped:false, solved2:false, achieved:false, lastAdd:null,
              prevTilt:null, renderSnap:null, commitSnap:null, peek:null, opened4:false, maxStep:0};
  var TARGET = {devF:'민서', devM:'민준', sciF:'서윤', nurseM:'태호'};
  var cur = 0;

  function $(id){ return document.getElementById(id); }
  function el(tag, cls, html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
  function showFb(box, kind, html){ box.className='fb '+kind; box.innerHTML=html; box.hidden=false; }
  function num(n){ return n.toLocaleString('ko-KR'); }
  function genderTag(g){ return '<span class="tag '+g+'">'+(g==='m'?'남':'여')+'</span>'; }
  function josa(word, a, b){ var c=word.charCodeAt(word.length-1)-44032; return (c>=0 && c%28) ? a : b; }
  var GC = {m:'var(--g1)', f:'var(--g2)'};

  /* ---------- 알림 ---------- */
  var toastTimer;
  function toast(text, kind){
    var t=$('toast'); t.textContent=text; t.className='toast '+(kind||''); t.hidden=false;
    clearTimeout(toastTimer); toastTimer=setTimeout(function(){ t.hidden=true; }, 2400);
  }
  function openModal(id){
    var m=$(id); m.hidden=false;
    var b=m.querySelector('.btn'); if(b) setTimeout(function(){ b.focus(); }, 50);
  }
  function closeModal(id){ $(id).hidden=true; }
  if(!window.__tvKeys){
    window.__tvKeys=true;
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape') ['goalModal','levelModal','guideModal'].forEach(function(id){ var m=document.getElementById(id); if(m) m.hidden=true; });
    });
  }

  /* ---------- 마을 기울기 ---------- */
  function setLevel(){
    var t = M.tilt();
    $('land').style.transform = 'rotate('+t+'deg)';
    document.querySelectorAll('[data-level]').forEach(function(lv){
      lv.querySelector('.bubble').style.transform = 'translateX('+(-t*3.4)+'px)';
      lv.querySelector('.level-n').textContent = t+'°';
      lv.classList.toggle('ok', t===0);
    });
    document.querySelectorAll('.tilt-num').forEach(function(x){ x.textContent=t+'°'; });
    $('newHouse').classList.toggle('show', cur>=4.5);
    if(flow.prevTilt!==null && t!==flow.prevTilt && (cur===3||cur===4)){
      var down = t<flow.prevTilt;
      toast('마을 기울기 '+flow.prevTilt+'° → '+t+'°'+(down?'  평평해지고 있어요!':'  다시 기울었어요'), down?'good':'bad');
      document.querySelectorAll('.level.mini').forEach(function(lv){
        lv.classList.remove('pulse','up'); void lv.offsetWidth; lv.classList.add(down?'pulse':'up');
      });
    }
    flow.prevTilt = t;
  }
  function go(n){
    cur = n;
    document.querySelectorAll('[data-screen]').forEach(function(s){ s.hidden = (+s.dataset.screen!==n); });
    var step=Math.min(4, Math.floor(n));
    flow.maxStep=Math.max(flow.maxStep, step);
    document.querySelectorAll('#steps li').forEach(function(li){
      var s=+li.dataset.s;
      li.classList.toggle('now', s===step && n<5); li.classList.toggle('done', s<step || n>=5);
      var b=li.querySelector('.stepbtn');
      b.disabled = s>flow.maxStep || n===0;
      b.setAttribute('aria-current', s===step && n<5 ? 'step' : 'false');
      b.title = b.disabled ? '' : s+'단계로 이동';
    });
    $('scene').classList.toggle('big', n===0 || n===6);
    if(n===3) $('dataWrap3').open=true;
    if(n===4) $('dataWrap4').open=true;
    setLevel();
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); }
  }

  /* ---------- 공통 그리기 ---------- */
  function renderData(box){
    var h = '<div class="box-h"><h3>AI가 배운 데이터 상자</h3><small>전체 사례 '+num(M.total())+'개</small></div>'+
      '<div class="legend"><span><i class="sw" style="background:var(--g1)"></i>남성 사례</span><span><i class="sw" style="background:var(--g2)"></i>여성 사례</span><span><i class="sw new"></i>새로 모은 사례</span><span>사람 1명 = 사례 '+M.CASE_PER_ICON+'개</span></div>';
    M.JOB_ORDER.forEach(function(j){
      var m=M.jobGender(j,'m'), f=M.jobGender(j,'f'), ic='';
      [['m',m],['f',f]].forEach(function(p){
        var i, g=p[0], nb=Math.round(p[1].base/M.CASE_PER_ICON), na=Math.round(p[1].add/M.CASE_PER_ICON);
        for(i=0;i<nb;i++) ic += Art.person(GC[g]);
        for(i=0;i<na;i++){
          var pop = flow.lastAdd && flow.lastAdd.job===j && flow.lastAdd.g===g && i===na-1;
          ic += Art.person(GC[g], 'new'+(pop?' pop':''));
        }
      });
      h += '<div class="drow"><div class="top"><b>'+Art.job(j)+M.JOBS[j]+'</b><span>남 <span class="a">'+num(m.base+m.add)+'</span> · 여 <span class="b">'+num(f.base+f.add)+'</span></span></div>'+
        '<div class="icons" role="img" aria-label="'+M.JOBS[j]+' 남성 '+(m.base+m.add)+', 여성 '+(f.base+f.add)+'">'+ic+'</div></div>';
    });
    box.innerHTML = h;
  }
  function simBars(r){
    var sim=r.sim, keys=Object.keys(sim), max=0, h='';
    if(!keys.length) return '<p class="sim-h">데이터에서 비슷한 사람을 찾지 못했어요.</p>';
    keys.forEach(function(k){ max=Math.max(max,sim[k]); });
    keys.sort(function(a,b){ return sim[b]-sim[a]; }).forEach(function(j){
      var win = (r.rec===j) || (r.rec==='tie' && sim[j]===max);
      h += '<div class="sb'+(win?' win':'')+'"><span class="jn">'+Art.job(j)+M.JOBS[j]+'</span><span class="bar" style="width:'+(sim[j]/max*100)+'%"></span><span class="c">'+num(sim[j])+'</span></div>';
    });
    return h;
  }
  function recHtml(r){ return (r.rec && r.rec!=='tie' ? Art.job(r.rec) : '')+'<b>'+M.recLabel(r)+'</b>'; }
  function buildOpts(id, items, onPick){
    var wrap=$(id);
    items.forEach(function(it,i){
      var b=el('button','opt','<span class="k">'+String.fromCharCode(9312+i)+'</span><span>'+it.t+'</span>');
      b.type='button';
      b.addEventListener('click', function(){
        wrap.querySelectorAll('.opt').forEach(function(o){ o.className='opt'; });
        onPick(it,b);
      });
      wrap.appendChild(b);
    });
  }
  function snapshot(){ var o={}; M.STUDENTS.forEach(function(st){ o[st.n]=M.recommend(st).rec; }); return o; }

  /* ---------- 진행 단계 클릭 이동 ---------- */
  document.querySelectorAll('.stepbtn').forEach(function(b){
    b.addEventListener('click', function(){
      var s=+b.dataset.go;
      if(s===cur) return;
      if(s===3) renderAll();
      if(s===4){ enter4(false); return; }
      go(s);
    });
  });

  /* ---------- 0. 시작 ---------- */
  $('startBtn').addEventListener('click', function(){ go(1); openModal('goalModal'); });
  $('goalOk').addEventListener('click', function(){ closeModal('goalModal'); });
  document.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', function(){ closeModal(b.dataset.close); }); });
  /* 교사용 안내: 메뉴 */
  var tabs=[].slice.call(document.querySelectorAll('#guideModal .tab'));
  function showTab(name){
    tabs.forEach(function(t){
      var on=t.dataset.tab===name;
      t.setAttribute('aria-selected', on?'true':'false'); t.tabIndex = on?0:-1;
    });
    document.querySelectorAll('#guideModal .tabpanel').forEach(function(p){ p.hidden = p.dataset.panel!==name; });
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click', function(){ showTab(t.dataset.tab); });
    t.addEventListener('keydown', function(e){
      var d = e.key==='ArrowRight'?1:(e.key==='ArrowLeft'?-1:0); if(!d) return;
      var nx=tabs[(i+d+tabs.length)%tabs.length]; showTab(nx.dataset.tab); nx.focus(); e.preventDefault();
    });
  });
  function openGuide(name){ showTab(name); $('guideModal').hidden=false; setTimeout(function(){ document.querySelector('#guideModal .tab[aria-selected="true"]').focus(); },50); }
  document.querySelectorAll('[data-guide]').forEach(function(b){ b.addEventListener('click', function(){ openGuide('intent'); }); });
  $('guideX').addEventListener('click', function(){ closeModal('guideModal'); });
  $('levelOk').addEventListener('click', function(){ closeModal('levelModal'); go(4.5); });
  ['goalModal','levelModal','guideModal'].forEach(function(id){
    $(id).addEventListener('click', function(e){ if(e.target.id===id) closeModal(id); });
  });

  /* ---------- 1. 결과 확인 ---------- */
  ['민준','민서'].forEach(function(name, i){
    var st=M.student(name);
    $('pair').appendChild(el('div','student',
      '<div class="who">'+Art.avatar(st.look, st.shirt)+'<h3>'+st.n+' '+genderTag(st.g)+'</h3></div>'+
      '<ul><li>만들기</li><li>수학</li><li>컴퓨터</li><li>문제 해결</li></ul>'+
      '<div class="result" id="r'+(i+1)+'"><span class="chip">AI</span>추천을 기다리는 중…</div>'));
  });
  $('runBtn').addEventListener('click', function(){
    var btn=this; btn.disabled=true;
    $('scan1').classList.add('on');
    ['과거 직업 데이터 '+num(M.total())+'개 불러오는 중…','민준, 민서와 비슷한 사람 찾는 중…','추천 직업 계산 중…'].forEach(function(t,i){
      setTimeout(function(){ $('consoleT').textContent='> '+t; }, i*450);
    });
    setTimeout(function(){
      $('scan1').classList.remove('on');
      $('consoleT').textContent='> 추천 완료.';
      ['민준','민서'].forEach(function(n,i){
        var r=$('r'+(i+1)); r.innerHTML='<span class="chip">AI</span>'+recHtml(M.recommend(M.student(n))); r.classList.add('show');
      });
      btn.hidden=true; $('q1wrap').hidden=false;
    }, 1500);
  });
  buildOpts('q1', [
    {t:'관심과 적성이 달라서', f:'두 학생 카드를 다시 볼까요? 적힌 관심과 적성은 하나도 다르지 않아요. 그렇다면 결과를 바꾼 것은 무엇일까요?'},
    {t:'AI가 학습한 데이터에 문제가 있을 수 있어서', f:'좋은 추측이에요. 하지만 추측만으로는 알 수 없어요. AI가 무엇을 보고 배웠는지 직접 확인해 봅시다.'},
    {t:'이름이 달라서', f:'날카로운 관찰이에요. 이름 옆의 성별 표시를 보세요. 관심은 같은데 성별만 달라요. AI가 성별에 영향을 받았을까요? 데이터를 확인해 봅시다.'},
    {t:'그냥 우연히', f:'AI는 배운 패턴에 따라 결과를 내요. 같은 조건에서 결과가 달라졌다면 이유가 있을 거예요. AI가 배운 데이터에서 단서를 찾아봅시다.'}
  ], function(it,b){
    b.classList.add('picked');
    showFb($('fb1'),'hint','<p>'+it.f+'</p>');
    $('toData').hidden=false;
  });
  $('toData').addEventListener('click', function(){
    $('simMinseo').innerHTML = simBars(M.recommend(M.student('민서')));
    renderData($('dataBox2'));
    go(2);
  });

  /* ---------- 2. 데이터 탐색 ---------- */
  buildOpts('q2', [
    {t:'모든 직업에 다양한 사례가 고르게 들어 있다.', f:'소프트웨어 개발자 줄을 다시 볼까요? 두 색 사람의 수를 비교해 보세요.'},
    {t:'특정 직업에 한쪽 성별의 사례가 많이 나타난다.', ok:true},
    {t:'데이터의 양이 너무 적다.', f:'데이터는 710개나 있어요. 양보다 <b>어떤 사람들의 사례가 들어 있는지</b>를 살펴보세요. 여성 소프트웨어 개발자는 몇 명인가요?'},
    {t:'아무 문제가 없다.', f:'민서와 비슷한 사람 막대를 보세요. 소프트웨어 개발자는 몇 명뿐인가요? 데이터 상자에서 그 이유를 찾아보세요.'}
  ], function(it,b){
    if(flow.solved2) return;
    if(!it.ok){ b.classList.add('nope'); showFb($('fb2'),'hint','<p>'+it.f+'</p>'); return; }
    flow.solved2=true; b.classList.add('yes');
    showFb($('fb2'),'good',
      '<h3>사각지대 발견!</h3>'+
      '<p>데이터가 710개나 있지만, 소프트웨어 개발자 190명 중 여성은 30명뿐이에요. 그래서 민서와 비슷한 사람을 찾았을 때 교사(50명)가 개발자(30명)보다 많았어요.</p>'+
      '<p>AI가 일부러 차별한 것은 아니에요. 데이터 속 패턴을 그대로 배운 거예요. 그래서 개발자가 확인하고 고쳐야 해요.</p>');
    $('note2').hidden=false; $('toFix').hidden=false;
  });
  $('toFix').addEventListener('click', function(){ renderAll(); go(3); });

  /* ---------- 3. 개선: 실험 1 ---------- */
  $('multRange').addEventListener('input', function(){
    var v=+this.value; S.mult=v;
    this.setAttribute('aria-valuetext', v+'배');
    var r=M.recommend(M.student('민서'));
    $('multTotal').textContent=num(M.total())+'개';
    $('multRatio').textContent='개발자 '+num(r.sim.dev)+' : 교사 '+num(r.sim.teach);
    renderAll();
    if(v>1){
      showFb($('fbA'),'hint','<h3>데이터 '+num(M.total())+'개!</h3><p>데이터가 '+v+'배가 되었지만 민서의 추천은 여전히 <b>'+M.recLabel(r)+'</b>예요. 개발자와 교사의 비율은 <b>3 : 5 그대로</b>예요.</p><p>기울어진 데이터를 더 넣으면 기울기도 그대로 따라와요.</p>');
      $('unfloodBtn').hidden=false;
    }
  });
  $('unfloodBtn').addEventListener('click', function(){
    S.mult=1; $('multRange').value=1;
    $('phA').hidden=true; $('phB').hidden=false;
    renderAll();
  });
  buildOpts('qPredict', [
    {t:'10개면 충분해요', v:10},
    {t:'50개쯤 필요해요', v:50},
    {t:'130개 (남녀 수가 똑같아질 때까지)', v:130}
  ], function(it,b){
    b.classList.add('picked'); flow.predict=it.v;
    setTimeout(function(){
      $('phB').hidden=true;
      buildCollect($('collect3'), 3);
      $('collect3').hidden=false;
      flow.commitSnap=snapshot();
      showFb($('fb3'),'info','<p>예측: <b>+'+it.v+'개</b>. 이제 막대를 움직여 사례를 모아 보세요. 결과는 오른쪽에서 바로 바뀌어요.</p>');
    }, 350);
  });

  /* ---------- 데이터 수집 막대 ---------- */
  function buildCollect(box, stage){
    var fresh = !box.children.length;
    if(fresh){
      box.appendChild(el('div','chances','<span class="l">데이터 수집 기회</span><span><b data-left>'+M.left()+'</b><small>회 남음 / '+M.CHANCES+'회</small></span><span class="meter"><i data-meter></i></span>'));
    }
    M.SLIDERS.forEach(function(c){
      if(c.stage>stage || box.querySelector('[data-id="'+c.id+'"]')) return;
      var row=el('div','sl'+(stage===4 && c.stage===4 ? ' new' : ''),
        '<div class="sl-h">'+Art.avatar(c.look, c.shirt,'av')+
        '<label class="sl-t" for="r_'+c.id+'_'+stage+'"><small>'+c.sub+'</small><b>'+c.t+' 사례 모으기</b></label>'+
        '<span class="sl-v" data-v>+0</span></div>'+
        '<div class="sl-row"><button type="button" class="step" data-d="-1" aria-label="'+c.t+' 사례 10개 줄이기">−</button>'+
        '<input type="range" id="r_'+c.id+'_'+stage+'" min="0" max="'+M.SLIDER_MAX+'" step="'+M.SLIDER_STEP+'" value="'+S.added[c.id]+'">'+
        '<button type="button" class="step" data-d="1" aria-label="'+c.t+' 사례 10개 늘리기">+</button></div>'+
        '<div class="sl-scale" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div>');
      row.dataset.id=c.id;
      var range=row.querySelector('input');
      range.addEventListener('input', function(){ setAdded(c, +range.value, false); });
      range.addEventListener('change', function(){ setAdded(c, +range.value, true); });
      row.querySelectorAll('.step').forEach(function(b){
        b.addEventListener('click', function(){ setAdded(c, S.added[c.id] + (+b.dataset.d)*M.SLIDER_STEP, true); });
      });
      box.appendChild(row);
    });
    refreshCollect();
  }
  function refreshCollect(){
    document.querySelectorAll('.collect').forEach(function(box){
      var lf=box.querySelector('[data-left]'); if(!lf) return;
      lf.textContent=M.left();
      box.querySelector('[data-meter]').style.width=(M.left()/M.CHANCES*100)+'%';
      box.querySelector('.chances').classList.toggle('empty', M.left()===0);
      box.querySelectorAll('.sl').forEach(function(row){
        var id=row.dataset.id, v=S.added[id];
        row.querySelector('input').value=v;
        row.querySelector('input').setAttribute('aria-valuetext', '사례 '+v+'개 추가');
        var vv=row.querySelector('[data-v]'); vv.textContent='+'+v; vv.classList.toggle('zero', v===0);
        row.classList.toggle('has', v>0);
        row.querySelector('[data-d="-1"]').disabled = v===0;
        row.querySelector('[data-d="1"]').disabled = v>=M.SLIDER_MAX || M.left()<M.SLIDER_STEP;
      });
    });
  }
  var shortWarned=false;
  function setAdded(c, v, commit){
    v=Math.max(0, Math.min(M.SLIDER_MAX, v));
    var room = S.added[c.id] + M.left();
    if(v>room){
      v = Math.floor(room/M.SLIDER_STEP)*M.SLIDER_STEP;
      if(!shortWarned){
        shortWarned=true;
        document.querySelectorAll('.chances').forEach(function(x){ x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); });
        toast('데이터 수집 기회가 부족해요! 다른 막대를 내려 기회를 되찾으세요.', 'bad');
        setTimeout(function(){ shortWarned=false; }, 1500);
      }
    }
    if(v>S.added[c.id]) flow.lastAdd={job:c.job, g:c.g};
    var changed = v!==S.added[c.id];
    S.added[c.id]=v;
    if(changed) renderAll();
    else refreshCollect();
    if(commit) feedback(c);
    flow.lastAdd=null;
  }

  /* ---------- 결과 그리기 (3·4 공통) ---------- */
  function renderAll(){
    var now=snapshot(), prev=flow.renderSnap||now;
    var changed=Object.keys(now).filter(function(n){ return now[n]!==prev[n]; });
    flow.renderSnap=now;
    refreshCollect();
    renderLive3(changed);
    if(flow.opened4) renderTable(changed);
    renderData($('dataBox3'));
    if(flow.opened4) renderData($('dataBox4'));
    setLevel();
  }
  function renderLive3(changed){
    var live=$('live3'); live.innerHTML='';
    ['민준','민서'].forEach(function(name){
      var st=M.student(name), r=M.recommend(st), fl=changed.indexOf(name)>-1;
      live.appendChild(el('div','sr',
        '<div class="who">'+Art.avatar(st.look, st.shirt)+st.n+' '+genderTag(st.g)+'<span class="int">관심: '+M.INTEREST[st.type]+'</span></div>'+
        '<div class="rec'+(r.rec==='tie'?' tie':'')+(fl?' flash':'')+'"><span class="chip">AI</span>'+recHtml(r)+'</div>'+
        '<div class="sim"><span class="sim-h">'+st.n+josa(st.n,'이와','와')+' 비슷한 사람</span>'+simBars(r)+'</div>'));
    });
    $('toTest').hidden=!flow.flipped;
  }
  function cell(name, changed){
    var st=M.student(name), r=M.recommend(st);
    var short = r.rec && r.rec!=='tie' ? M.JOBS[r.rec].replace('소프트웨어 ','') : M.recLabel(r);
    return '<button type="button" class="fc'+(flow.peek===name?' sel':'')+(changed.indexOf(name)>-1?' flash':'')+'" data-n="'+name+'" aria-label="'+name+': '+M.recLabel(r)+'">'+
      Art.avatar(st.look, st.shirt)+'<span class="fn"><small>'+name+'</small><b>'+(r.rec&&r.rec!=='tie'?Art.job(r.rec):'')+short+'</b></span></button>';
  }
  function renderTable(changed){
    var h='<div class="fh int" role="columnheader">관심</div><div class="fh c" role="columnheader">남학생</div><div class="fh c" role="columnheader">여학생</div><div class="fh c" role="columnheader">결과</div>';
    M.ROWS.forEach(function(row){
      var s=M.rowStatus(row);
      var lab = s==='same' ? '<i>✓</i>같음' : (s==='tie' ? '<i>△</i>고민 중' : '<i>✗</i>다름');
      h+='<div class="ft-int">'+M.INTEREST_SHORT[row.type]+'</div>'+cell(row.m, changed)+cell(row.f, changed)+'<div class="fs '+s+'">'+lab+'</div>';
    });
    $('ftable').innerHTML=h;
    $('ftable').querySelectorAll('.fc').forEach(function(b){
      b.addEventListener('click', function(){ flow.peek = flow.peek===b.dataset.n ? null : b.dataset.n; renderTable([]); });
    });
    renderPeek();
  }
  function renderPeek(){
    var p=$('peek');
    if(!flow.peek){ p.hidden=true; return; }
    var st=M.student(flow.peek), r=M.recommend(st);
    p.innerHTML='<div class="peek-h"><span>'+st.n+josa(st.n,'이','')+'가 참고한 비슷한 사람 ('+(st.g==='m'?'남':'여')+' · '+M.INTEREST_SHORT[st.type]+')</span><button type="button" class="peek-x" aria-label="닫기">×</button></div><div class="sim">'+simBars(r)+'</div>';
    p.querySelector('.peek-x').addEventListener('click', function(){ flow.peek=null; renderTable([]); });
    p.hidden=false;
  }

  /* ---------- 피드백 (막대를 놓았을 때) ---------- */
  function feedback(c){
    var now=snapshot(), before=flow.commitSnap||now;
    flow.commitSnap=now;
    var names = cur===3 ? ['민준','민서'] : M.ROWS.reduce(function(a,r){ return a.concat([r.m,r.f]); }, []);
    var ch = names.filter(function(n){ return now[n]!==before[n]; });

    if(cur===3){
      var fb=$('fb3');
      if(!flow.flipped && now['민서']==='dev'){
        flow.flipped=true; $('toTest').hidden=false;
        var need=S.added.devF, dm=M.count('dev','m','code'), df=M.count('dev','f','code');
        var cmp = flow.predict>need ? '예상보다 적게 필요했어요.' : (flow.predict<need ? '예상보다 더 필요했어요.' : '예측이 정확했어요!');
        showFb(fb,'good','<h3>민서의 추천이 바뀌었어요!</h3><p>예측 +'+flow.predict+'개 → 실제 +'+need+'개. '+cmp+'</p><p>소프트웨어 개발자 데이터는 아직 남 '+dm+' · 여 '+df+'이에요. 50:50이 아니에요. 그래도 <b>민서 같은 학생의 사례가 충분히 들어가자</b> 추천이 바뀌었어요.</p>');
        toast('사각지대 하나를 고쳤어요!','good');
        return;
      }
      showFb(fb, msgKind(ch), msgFor(c, ch)+(M.left()<M.SLIDER_STEP && now['민서']!=='dev' ? wasteHint() : ''));
      return;
    }
    // 4단계
    var unfair=M.unfairRows();
    if(!unfair.length){
      $('toHaeun').hidden=false;
      showFb($('fb4'),'good','<h3>모든 줄이 ✓ 같아졌어요!</h3><p>관심이 같으면 성별과 관계없이 같은 직업이 추천돼요. 데이터 수집 기회 '+M.CHANCES+'회 중 '+M.used()+'회를 썼어요.</p><p>그런데 마을에 새 친구가 이사 왔대요. 새 친구에게도 공정한지 확인하러 가 봐요.</p>');
      if(!flow.achieved){
        flow.achieved=true;
        $('levelNote').innerHTML=Art.avatar(8,'#6b7c86')+'<span class="lines"><span>그런데… 마을에 <b>새 친구가 이사 왔대요!</b></span><span>새 친구에게도 AI가 잘 추천할 수 있을까요?</span></span>';
        setTimeout(function(){ openModal('levelModal'); Art.confetti($('confetti')); }, 500);
      }
      return;
    }
    $('toHaeun').hidden = true;
    var msg = ch.length || c ? msgFor(c, ch) : '';
    showFb($('fb4'),'hint', msg+'<p>아직 <b>✗ 또는 △</b>인 줄: '+unfair.map(function(r){ return M.INTEREST_SHORT[r.type]; }).join(', ')+'. 누구와 비슷한 사람이 부족한지 칸을 눌러 확인해 보세요.</p>'+
      (M.left()<M.SLIDER_STEP ? wasteHint() : '')+
      (flow.achieved?'<p>막대를 조정하다가 다시 기울어졌어요. 다른 친구의 공정함도 지키면서 조정해요.</p>':''));
  }
  function wasteHint(){
    return '<p class="waste"><b>수집 기회를 모두 썼어요.</b> 혹시 꼭 필요하지 않은 사례에 기회를 쓰지 않았나요? 막대를 내리면 기회를 되찾을 수 있어요.</p>';
  }
  function msgKind(ch){ return ch.length ? 'good' : 'info'; }
  function msgFor(c, ch){
    if(ch.length){
      return '<p>'+ch.map(function(n){
        var r=M.recommend(M.student(n));
        if(r.rec==='tie') return '<b>'+n+'</b>'+josa(n,'이와','와')+' 비슷한 사람 중 '+M.JOBS[r.top[0]]+'와 '+M.JOBS[r.top[1]]+'가 같아졌어요. AI가 고민 중이에요.';
        return '<b>'+n+'</b>의 추천이 바뀌었어요 → <b>'+M.recLabel(r)+'</b>';
      }).join('<br>')+'</p>';
    }
    if(!c) return '';
    if(c.id==='devM') return '<p>남성 개발자 사례는 이미 160개나 있어요. 민서와 비슷한 사람이 아니라서 결과가 달라지지 않아요. <b>누가 빠져 있는지</b>가 중요해요.</p>';
    var who=TARGET[c.id], r=M.recommend(M.student(who));
    var parts=Object.keys(r.sim).sort(function(a,b){ return r.sim[b]-r.sim[a]; }).map(function(j){ return M.JOBS[j]+' '+r.sim[j]; });
    return '<p>'+who+josa(who,'이와','와')+' 비슷한 사람: '+parts.join(' · ')+'</p>';
  }

  /* ---------- 4. 재검증 ---------- */
  $('toTest').addEventListener('click', function(){ enter4(true); });
  function enter4(fromTest){
    var first=!flow.opened4;
    flow.opened4=true;
    buildCollect($('collect4'), 4);
    flow.peek=null;
    renderAll();
    flow.commitSnap=snapshot();
    go(4);
    feedback(null);
    if(first && fromTest) setTimeout(function(){ toast('새로운 수집 항목 2개가 열렸어요','good'); }, 600);
  }
  $('toHaeun').addEventListener('click', function(){ go(4.5); });

  /* ---------- 4.5 새 친구 하은 ---------- */
  var haeun=M.student('하은');
  $('haeunAv').innerHTML=Art.avatar(haeun.look, haeun.shirt);
  $('runHaeun').addEventListener('click', function(){
    var btn=this; btn.disabled=true;
    $('scanH').classList.add('on');
    ['데이터 '+num(M.total())+'개에서 하은이와 비슷한 사람 찾는 중…','찾은 사람: 0명','추천 직업 계산 불가'].forEach(function(t,i){
      setTimeout(function(){ $('consoleH').textContent='> '+t; }, i*500);
    });
    setTimeout(function(){
      $('scanH').classList.remove('on');
      $('simHaeun').innerHTML=M.JOB_ORDER.map(function(j){
        return '<div class="sb zero"><span class="jn">'+Art.job(j)+M.JOBS[j]+'</span><span class="bar"></span><span class="c">0</span></div>';
      }).join('');
      btn.hidden=true; $('haeunOut').hidden=false;
    }, 1600);
  });
  buildOpts('qH', [
    {t:'가장 비슷해 보이는 직업을 아무거나 추천한다', f:'억지로 추천하면 하은이에게 맞지 않는 직업을 알려 줄 수 있어요. 틀린 추천은 추천이 없는 것보다 더 해로울 수 있어요.'},
    {t:'하은이에게 관심을 하나만 고르라고 한다', f:'AI에 사람을 맞추면 안 돼요. AI가 다양한 사람에게 맞춰지도록 개발자가 고쳐야 해요.'},
    {t:'하은이 같은 친구의 데이터가 없다고 솔직히 알리고, 데이터를 모을 계획을 세운다', ok:true, f:'맞아요! 모를 때 "아직 잘 모르겠어요"라고 솔직하게 알리는 것도 책임 있는 AI예요. 그리고 인공지능이 보지 못하는 사각지대가 있는지 확인하고 계속 고쳐 나가야 해요.'},
    {t:'이미 공정해졌으니 그대로 둔다', f:'마을에는 새로운 사람이 계속 와요. 한 번 공정해졌다고 끝이 아니라, 새 사람이 올 때마다 다시 살펴봐야 해요.'}
  ], function(it,b){
    b.classList.add(it.ok?'yes':'nope');
    showFb($('fbH'), it.ok?'good':'hint', '<p>'+it.f+'</p>');
    if(it.ok) $('toMirror').hidden=false;
  });
  $('toMirror').addEventListener('click', function(){ go(5); });

  /* ---------- 5. 윤리 거울 ---------- */
  document.querySelectorAll('.chk').forEach(function(b){ b.addEventListener('click', function(){ b.classList.toggle('on'); }); });
  buildOpts('q5', [
    {t:'AI 결과만 믿기', f:'오늘 본 것처럼 AI 결과에도 사각지대가 있을 수 있어요. 결과를 그대로 믿기보다 살펴보는 태도가 필요해요.'},
    {t:'AI의 사각지대에 놓인 사람이 없는지 살펴보기', ok:true, f:'맞아요. AI의 사각지대에 놓인 사람은 없는지, 데이터가 기울어져 있지 않은지 살펴보는 것이 포용적인 AI의 시작이에요.'},
    {t:'데이터의 양만 늘리기', f:'실험 1을 떠올려 보세요. 데이터를 5배로 늘려도 민서의 결과는 그대로였어요.'},
    {t:'한 번 만든 AI는 수정하지 않기', f:'민서를 고친 뒤에도 다른 줄이 남아 있었고, 새 친구 하은이에게는 추천하지 못했어요. AI는 계속 확인하고 고쳐 나가야 해요.'}
  ], function(it,b){
    b.classList.add(it.ok?'yes':'nope');
    showFb($('fb5'), it.ok?'good':'hint', '<p>'+it.f+'</p>');
    if(it.ok) $('doneBtn').disabled=false;
  });

  /* ---------- 6. 완료 ---------- */
  $('doneBtn').addEventListener('click', function(){
    $('summary').textContent='데이터 수집 기회 '+M.used()+'회로 네 줄을 모두 공정하게 만들었어요. 여러분이 거쳐 온 과정이에요.';
    var B=[['eye','사각지대 탐지자','기울어진 데이터를 찾아냈어요'],['box','데이터 설계자','빠진 사람의 사례를 모았어요'],['check','끝까지 확인하는 개발자','공정성 표로 다시 확인했어요']];
    $('badges').innerHTML = B.map(function(b){ return '<div class="badge"><div class="medal">'+Art.MEDALS[b[0]]+'</div><b>'+b[1]+'</b><span>'+b[2]+'</span></div>'; }).join('');
    go(6);
    setTimeout(function(){ Art.confetti($('confetti')); }, 700);
  });
  $('againBtn').addEventListener('click', function(){ window.__tvRestart(); });

  renderLive3([]);
  go(0);
}

(function(){
  var H = window.claude && window.claude.hot;
  var ORIGINAL = null;
  window.__tvRestart = function(){
    var S=Model.S; S.mult=1; for(var k in S.added) S.added[k]=0;
    var app=document.getElementById('app');
    app.innerHTML = ORIGINAL;
    boot();
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); }
  };
  function start(){
    ORIGINAL = document.getElementById('app').innerHTML;
    if(H && H.ready) H.ready(boot); else boot();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
