/* 직업 추천 AI 모델
 * 과거 데이터에서 "관심 유형과 성별이 같은 사람들"을 찾아
 * 그 사람들이 가장 많이 가진 직업을 추천한다. 1등이 둘이면 'tie'.
 * 수업에 맞게 숫자를 바꾸려면 BASE, SLIDERS, CHANCES만 고치면 된다. */
var Model = (function(){
  var JOBS = {dev:'소프트웨어 개발자', sci:'과학자', nurse:'간호사', teach:'교사'};
  var JOB_ORDER = ['dev','sci','nurse','teach'];
  var INTEREST = {
    code:'만들기·수학·컴퓨터·문제 해결', exp:'생명·실험·관찰', care:'사람 돌보기·대화',
    talk:'가르치기·설명하기', mix:'그림·동물·기계'
  };
  var INTEREST_SHORT = {code:'만들기·컴퓨터', exp:'실험·관찰', care:'돌보기·대화', talk:'가르치기·설명'};

  // 과거 데이터: [직업, 성별, 관심 유형, 사례 수] — 전체 710개
  var BASE = [
    ['dev','m','code',160],['dev','f','code',30],['teach','f','code',50],['teach','m','code',10],
    ['sci','m','exp',120],['sci','f','exp',30],['nurse','f','exp',40],
    ['nurse','f','care',120],['nurse','m','care',20],['teach','m','care',30],
    ['teach','f','talk',60],['teach','m','talk',40]
  ];
  var CASE_PER_ICON = 10;

  // 새로 모을 수 있는 사례 (조절 막대). stage: 몇 번째 미션부터 열리는지
  var SLIDERS = [
    {id:'devF',  job:'dev',   g:'f', type:'code', t:'여성 소프트웨어 개발자', sub:'컴퓨터·수학을 좋아한', look:1, shirt:'#d9961c', stage:3},
    {id:'devM',  job:'dev',   g:'m', type:'code', t:'남성 소프트웨어 개발자', sub:'컴퓨터·수학을 좋아한', look:0, shirt:'#4b5cc4', stage:3},
    {id:'sciF',  job:'sci',   g:'f', type:'exp',  t:'여성 과학자',           sub:'실험·관찰을 좋아한',   look:2, shirt:'#d9961c', stage:4},
    {id:'nurseM',job:'nurse', g:'m', type:'care', t:'남성 간호사',           sub:'사람 돌보기를 좋아한', look:3, shirt:'#4b5cc4', stage:4}
  ];
  var SLIDER_MAX = 100, SLIDER_STEP = 10;
  var CHANCES = 80;   // 데이터 수집 기회 (1회 = 사례 1개)

  var STUDENTS = [
    {n:'민준', g:'m', type:'code', look:0, shirt:'#4b5cc4'},
    {n:'민서', g:'f', type:'code', look:1, shirt:'#0d7a70'},
    {n:'도윤', g:'m', type:'exp',  look:4, shirt:'#3f7fa8'},
    {n:'서윤', g:'f', type:'exp',  look:2, shirt:'#8a5cc4'},
    {n:'태호', g:'m', type:'care', look:3, shirt:'#d9712b'},
    {n:'수아', g:'f', type:'care', look:5, shirt:'#c44b6e'},
    {n:'지훈', g:'m', type:'talk', look:6, shirt:'#2c8a4b'},
    {n:'예린', g:'f', type:'talk', look:7, shirt:'#b0721c'},
    {n:'하은', g:'f', type:'mix',  look:8, shirt:'#6b7c86'}
  ];
  // 공정성 표: 관심이 같은 남학생·여학생 한 쌍씩
  var ROWS = [
    {type:'code', m:'민준', f:'민서'},
    {type:'exp',  m:'도윤', f:'서윤'},
    {type:'care', m:'태호', f:'수아'},
    {type:'talk', m:'지훈', f:'예린'}
  ];

  var S = {mult:1, added:{devF:0, devM:0, sciF:0, nurseM:0}};

  function count(job,g,type){
    var n=0;
    BASE.forEach(function(b){ if(b[0]===job&&b[1]===g&&b[2]===type) n+=b[3]*S.mult; });
    SLIDERS.forEach(function(c){ if(c.job===job&&c.g===g&&c.type===type) n+=S.added[c.id]; });
    return n;
  }
  function similar(g,type){
    var out={}; JOB_ORDER.forEach(function(j){ var n=count(j,g,type); if(n) out[j]=n; }); return out;
  }
  function recommend(st){
    var sim=similar(st.g,st.type), keys=Object.keys(sim);
    if(!keys.length) return {rec:null, sim:sim};
    keys.sort(function(a,b){ return sim[b]-sim[a]; });
    if(keys.length>1 && sim[keys[0]]===sim[keys[1]]) return {rec:'tie', sim:sim, top:[keys[0],keys[1]]};
    return {rec:keys[0], sim:sim};
  }
  function student(name){ return STUDENTS.filter(function(s){ return s.n===name; })[0]; }
  function rowStatus(row){
    var a=recommend(student(row.m)).rec, b=recommend(student(row.f)).rec;
    if(a==='tie'||b==='tie') return 'tie';
    return a===b ? 'same' : 'diff';
  }
  function unfairRows(){ return ROWS.filter(function(r){ return rowStatus(r)!=='same'; }); }
  // 마을 기울기: ✗ 줄은 1, △ 줄은 0.5로 세어 처음(3줄) 8°에서 0°까지
  var MAX_TILT = 8;
  function tilt(){
    var score = ROWS.reduce(function(a,r){ var s=rowStatus(r); return a + (s==='diff'?1:(s==='tie'?0.5:0)); }, 0);
    return Math.round(MAX_TILT*score/3);
  }
  function used(){ var u=0; for(var k in S.added) u+=S.added[k]; return u; }
  function left(){ return CHANCES-used(); }
  function total(){ var t=0; BASE.forEach(function(b){ t+=b[3]*S.mult; }); return t+used(); }
  function jobGender(job,g){
    var base=0, add=0;
    BASE.forEach(function(b){ if(b[0]===job&&b[1]===g) base+=b[3]*S.mult; });
    SLIDERS.forEach(function(c){ if(c.job===job&&c.g===g) add+=S.added[c.id]; });
    return {base:base, add:add};
  }
  function recLabel(r){
    if(r.rec===null) return '추천할 수 없어요';
    if(r.rec==='tie') return '고민 중…';
    return JOBS[r.rec];
  }

  return {
    JOBS:JOBS, JOB_ORDER:JOB_ORDER, INTEREST:INTEREST, INTEREST_SHORT:INTEREST_SHORT,
    SLIDERS:SLIDERS, SLIDER_MAX:SLIDER_MAX, SLIDER_STEP:SLIDER_STEP, CHANCES:CHANCES,
    CASE_PER_ICON:CASE_PER_ICON, STUDENTS:STUDENTS, ROWS:ROWS, S:S,
    count:count, recommend:recommend, student:student, rowStatus:rowStatus,
    unfairRows:unfairRows, tilt:tilt, used:used, left:left, total:total,
    jobGender:jobGender, recLabel:recLabel
  };
})();
