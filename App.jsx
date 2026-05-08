import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, set, update } from "firebase/database";

/* ─── DESIGN TOKENS ────────────────────────────────────── */
const U = [
  { pastel: "#ff6eb4", dark: "#d6006e", bg: "#fff0f8", emoji: "👑" },
  { pastel: "#6ec6ff", dark: "#0077cc", bg: "#f0f8ff", emoji: "💅" },
];
const TARGETS     = [{ weight: 65, deadline: "2025-07-01" }, { weight: 53, deadline: "2025-07-01" }];
const WORKOUT_TYPES = ["🏃 Бег","🏋️ Зал","🧘 Йога","🚴 Велик","🏊 Плавание","💃 Танцы","🤸 Другое"];

const METRICS = [
  { key:"weight",  label:"Вес",        icon:"⚖️",  unit:"кг",   step:0.1,  meme:"и это без телефона" },
  { key:"waist",   label:"Талия",      icon:"📏",  unit:"см",   step:0.5,  meme:"дыши, дыши!" },
  { key:"steps",   label:"Шаги",       icon:"👟",  unit:"шаг",  step:100,  meme:"холодильник — не считается" },
  { key:"water",   label:"Вода",       icon:"💧",  unit:"ст",   step:1,    meme:"водичка — это личность" },
  { key:"sleep",   label:"Сон",        icon:"😴",  unit:"ч",    step:0.5,  meme:"ещё 5 минут..." },
  { key:"mood",    label:"Настроение", icon:"✨",  unit:"/10",  step:1, min:1, max:10, meme:"объективно, конечно" },
  { key:"calories",label:"Калории",    icon:"🥗",  unit:"ккал", step:50,   meme:"торт — тоже еда" },
];

const MOTIVATIONS = [
  { text:"Сегодня ты либо тренируешься, либо придумываешь почему нет 😂", vibe:"💀" },
  { text:"Пицца видела твои усилия. Пицца одобряет. Но ты сильнее!", vibe:"🍕" },
  { text:"Твоё тело — это храм. Немного запущенный, но работаем!", vibe:"⛪" },
  { text:"Кто-то сейчас ест торт. Этот кто-то — не ты. Молодец!", vibe:"💪" },
  { text:"Встала с дивана? Уже тренировка. Записываем!", vibe:"🛋️" },
  { text:"Ваш стрик смотрит с надеждой. Не подведи его!", vibe:"🔥" },
  { text:"Красота требует воду вместо колы!", vibe:"💅" },
  { text:"The Rock не пропускал. Ты — The Rock. Почти.", vibe:"🪨" },
  { text:"Сегодня тяжело — завтра красиво. Философия!", vibe:"🧠" },
  { text:"Подруга смотрит. Веди себя хорошо!", vibe:"👀" },
  { text:"Это не диета. Это LIFESTYLE. Звучит дороже!", vibe:"✨" },
  { text:"Маленький шаг сегодня — большая победа потом!", vibe:"🏅" },
];

const ACHIEVEMENTS_DEF = [
  { id:"first_entry", icon:"🌱", label:"Ожила!",            desc:"Первая запись — уже подвиг",       check:(d)=>Object.keys(d).length>=1 },
  { id:"streak3",     icon:"🔥", label:"3 дня огонь",       desc:"Стрик 3+ дней подряд",              check:(d,s)=>s>=3 },
  { id:"streak7",     icon:"🔥🔥",label:"Неделя без срывов", desc:"Стрик 7 дней",                     check:(d,s)=>s>=7 },
  { id:"streak14",    icon:"🏆", label:"2 недели — ЛЕГЕНДА",desc:"Стрик 14 дней",                     check:(d,s)=>s>=14 },
  { id:"workout5",    icon:"💪", label:"5 тренировок!",     desc:"Не диван — герой",                  check:(d)=>Object.values(d).filter(e=>(e.workouts||[]).length>0).length>=5 },
  { id:"workout20",   icon:"🥊", label:"20 тренировок 😱",  desc:"Ты монстр (в хорошем смысле)",     check:(d)=>Object.values(d).filter(e=>(e.workouts||[]).length>0).length>=20 },
  { id:"water7",      icon:"💧", label:"Рыба-мечта",        desc:"8+ стаканов воды 3 раза",           check:(d)=>Object.values(d).filter(e=>parseFloat(e.water)>=8).length>=3 },
  { id:"steps10k",    icon:"👟", label:"10к шагов! вау",    desc:"Твои ноги — герои дня",             check:(d)=>Object.values(d).some(e=>parseFloat(e.steps)>=10000) },
  { id:"logged10",    icon:"📅", label:"10 записей!",       desc:"Дисциплина — это сексуально",       check:(d)=>Object.keys(d).length>=10 },
  { id:"logged30",    icon:"📆", label:"30 дней! Легенда",  desc:"Месяц трекинга — это МОЩЬ",         check:(d)=>Object.keys(d).length>=30 },
];

const CHALLENGES_DEF = [
  { id:"ch_water",   icon:"💧", label:"Водный марафон",  desc:"8 стаканов воды 7 дней подряд",    check:(d,d7)=>d7.every(dd=>parseFloat((d[dd]||{}).water)>=8) },
  { id:"ch_steps",   icon:"👟", label:"Шаговый вызов",   desc:"7000+ шагов 5 дней из 7",          check:(d,d7)=>d7.filter(dd=>parseFloat((d[dd]||{}).steps)>=7000).length>=5 },
  { id:"ch_workout3",icon:"🏋️", label:"3 тренировки",   desc:"3 тренировки за неделю",            check:(d,d7)=>d7.filter(dd=>((d[dd]||{}).workouts||[]).length>0).length>=3 },
  { id:"ch_sleep",   icon:"😴", label:"Сон-красота",     desc:"7+ часов сна 5 дней из 7",          check:(d,d7)=>d7.filter(dd=>parseFloat((d[dd]||{}).sleep)>=7).length>=5 },
  { id:"ch_log7",    icon:"📝", label:"7 дней трекинга", desc:"Вносить данные каждый день",         check:(d,d7)=>d7.every(dd=>Object.keys(d[dd]||{}).length>0) },
];

/* ─── HELPERS ────────────────────────────────────────────── */
const today      = () => new Date().toISOString().slice(0,10);
const daysUntil  = s  => Math.max(0, Math.ceil((new Date(s)-new Date(today()))/86400000));
const getWeekDays = (offset=0) => {
  const now=new Date(), day=now.getDay(), mon=new Date(now);
  mon.setDate(now.getDate()-(day===0?6:day-1)+offset*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d.toISOString().slice(0,10); });
};
const getLast7 = () => Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().slice(0,10); });
const getStreak = ud => {
  let s=0; const d=new Date();
  while(true){ const k=d.toISOString().slice(0,10); if(ud[k]&&Object.keys(ud[k]).length>0){s++;d.setDate(d.getDate()-1);}else break; }
  return s;
};
// Firebase keys can't have dots — use dashes for dates
const safeKey = s => s.replace(/\./g,"-");

const DAY_LABELS  = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const todayMeme   = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];

/* ─── CSS INJECTION ─────────────────────────────────────── */
if (typeof document !== "undefined") {
  const el = document.createElement("style");
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Bangers&display=swap');
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    body{margin:0;background:#fffdf0;}
    @keyframes wiggle  {0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    @keyframes pop     {0%{transform:scale(.8);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
    @keyframes slide-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes bounce-in{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
    @keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
    @keyframes glow-pink{0%,100%{box-shadow:0 0 10px #ff6eb4aa}50%{box-shadow:0 0 28px #ff6eb4}}
    .tab-btn:active{transform:translate(2px,2px)!important;}
    .press:active{transform:translate(2px,2px)!important;box-shadow:1px 1px 0 #111!important;}
  `;
  document.head.appendChild(el);
}

/* ─── APP ────────────────────────────────────────────────── */
export default function App() {
  // ── Firebase-synced state ──
  const [data,        setData]        = useState([{},{}]);          // [{date: {metrics}}, {...}]
  const [names,       setNames]       = useState(["Подруга 1","Подруга 2"]);
  const [gifts,       setGifts]       = useState(["🎀 Новое платье мечты!","👗 Шоппинг-день на всё!"]);
  const [fbLoading,   setFbLoading]   = useState(true);

  // ── Local UI state ──
  const [activeUser,  setActiveUser]  = useState(0);
  const [form,        setForm]        = useState({});
  const [view,        setView]        = useState("log");
  const [saved,       setSaved]       = useState(false);
  const [savingFb,    setSavingFb]    = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [nameInput,   setNameInput]   = useState("");
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [workoutModal,setWorkoutModal]= useState(null);
  const [editingGift, setEditingGift] = useState(null);
  const [giftInput,   setGiftInput]   = useState("");
  const [newAchievements,setNewAchievements]=useState([]);
  const [confetti,    setConfetti]    = useState([]);

  const prevUnlocked = useRef([null, null]); // track per-user achievements before save

  const u       = U[activeUser];
  const dateKey = today();
  const todayEntry = data[activeUser]?.[dateKey] || {};

  /* ── Firebase: subscribe to realtime updates ── */
  useEffect(() => {
    const unsub = onValue(ref(db, "slimtogether"), snap => {
      const val = snap.val() || {};
      if (val.data)  setData([val.data[0]||{}, val.data[1]||{}]);
      if (val.names) setNames([val.names[0]||"Подруга 1", val.names[1]||"Подруга 2"]);
      if (val.gifts) setGifts([val.gifts[0]||gifts[0], val.gifts[1]||gifts[1]]);
      setFbLoading(false);
    });
    return () => unsub();
  }, []);

  /* ── Save helpers ── */
  const fbSet = (path, value) => set(ref(db, "slimtogether/" + path), value);

  const spawnConfetti = () => {
    setConfetti(Array.from({length:20},(_,i)=>({
      id:i, left:Math.random()*96, color:["#ff6eb4","#6ec6ff","#ffe66d","#a8ff78","#ffb347"][i%5],
      delay:Math.random()*0.5, size:7+Math.random()*9,
    })));
    setTimeout(()=>setConfetti([]),2500);
  };

  const handleSave = async () => {
    setSavingFb(true);
    const newData  = [...data];
    const prevUser = { ...newData[activeUser] };
    newData[activeUser] = {
      ...prevUser,
      [dateKey]: { ...(prevUser[dateKey]||{}), ...form },
    };

    // check achievements
    const prevStreak  = getStreak(prevUser);
    const newStreak   = getStreak(newData[activeUser]);
    const nowUnlocked = ACHIEVEMENTS_DEF.filter(a => a.check(newData[activeUser], newStreak));
    const wasUnlocked = ACHIEVEMENTS_DEF.filter(a => a.check(prevUser, prevStreak));
    const fresh = nowUnlocked.filter(a => !wasUnlocked.some(w=>w.id===a.id));
    if (fresh.length) { setNewAchievements(fresh); spawnConfetti(); }

    await fbSet(`data`, [newData[0], newData[1]]);
    setSaved(true); setSavingFb(false);
    setTimeout(()=>setSaved(false), 1800);
    setForm({});
  };

  const toggleWorkout = async (date, type) => {
    const newData  = [...data];
    const entry    = newData[activeUser][date] || {};
    const wk       = entry.workouts || [];
    newData[activeUser] = {
      ...newData[activeUser],
      [date]: { ...entry, workouts: wk.includes(type) ? wk.filter(w=>w!==type) : [...wk,type] },
    };
    await fbSet("data", [newData[0], newData[1]]);
    setData(newData);
  };

  const saveName = async (i, val) => {
    if (!val.trim()) return;
    const n = [...names]; n[i] = val.trim();
    await fbSet("names", n);
  };

  const saveGift = async (i, val) => {
    const g = [...gifts]; g[i] = val || g[i];
    await fbSet("gifts", g);
    setEditingGift(null);
  };

  /* ── Derived ── */
  const allDates = () => {
    const s=new Set(); data.forEach(ud=>Object.keys(ud||{}).forEach(d=>s.add(d)));
    return [...s].sort().reverse();
  };
  const getProgress = i => {
    const entries=Object.entries(data[i]||{}).filter(([,v])=>v.weight).sort(([a],[b])=>a.localeCompare(b));
    if(!entries.length) return null;
    const startW=parseFloat(entries[0][1].weight), curW=parseFloat(entries[entries.length-1][1].weight), targetW=TARGETS[i].weight;
    if(startW<=targetW) return null;
    const pct=Math.min(100,Math.max(0,Math.round(((startW-curW)/(startW-targetW))*100)));
    return {curW,targetW,pct,needed:Math.max(0,curW-targetW).toFixed(1)};
  };
  const getUnlocked  = i => { const s=getStreak(data[i]); return ACHIEVEMENTS_DEF.filter(a=>a.check(data[i],s)); };
  const getChallenges = i => CHALLENGES_DEF.map(c=>({...c, done:c.check(data[i],getLast7())}));
  const weekDays     = getWeekDays(weekOffset);

  /* ── Reusable components ── */
  const Btn = ({children,onClick,style={},variant="primary"}) => (
    <button className="press" onClick={onClick} style={{
      border:"3px solid #111", borderRadius:16, fontFamily:"'Nunito',sans-serif",
      fontWeight:900, cursor:"pointer", transition:"all .1s",
      boxShadow:"4px 4px 0 #111",
      background: variant==="primary"?u.pastel : variant==="dark"?"#111":"#fff",
      color: variant==="dark"?u.pastel:"#111",
      ...style,
    }}>{children}</button>
  );

  /* ── Loading screen ── */
  if (fbLoading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#fffdf0",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontSize:60,animation:"wiggle 0.8s infinite"}}>🌷</div>
      <div style={{fontFamily:"'Bangers',cursive",fontSize:28,letterSpacing:3,marginTop:12}}>ЗАГРУЖАЕМ...</div>
      <div style={{color:"#aaa",fontSize:13,marginTop:6,fontWeight:700}}>подключаемся к Firebase 🔥</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#fffdf0",fontFamily:"'Nunito',sans-serif",paddingBottom:80,position:"relative",overflow:"hidden"}}>

      {/* ── CONFETTI ── */}
      {confetti.map(c=>(
        <div key={c.id} style={{
          position:"fixed",top:"-20px",left:`${c.left}%`,width:c.size,height:c.size,
          background:c.color,borderRadius:3,zIndex:300,pointerEvents:"none",
          animation:`confetti-fall 2.2s ease-in forwards`,animationDelay:`${c.delay}s`,
        }}/>
      ))}

      {/* ── ACHIEVEMENT POPUP ── */}
      {newAchievements.length>0 && (
        <div style={{position:"fixed",inset:0,background:"#0007",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>setNewAchievements([])}>
          <div style={{background:"#fffdf0",borderRadius:28,padding:"30px 24px",textAlign:"center",maxWidth:300,margin:"0 16px",
            border:"4px solid #111",boxShadow:"8px 8px 0 #111",animation:"bounce-in .4s ease"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:56,animation:"wiggle .6s infinite"}}>🎉</div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:30,letterSpacing:2,margin:"8px 0"}}>НОВАЯ АЧИВКА!</div>
            {newAchievements.map(a=>(
              <div key={a.id} style={{margin:"8px 0",background:u.bg,borderRadius:14,padding:"10px",border:"2px solid #111"}}>
                <div style={{fontSize:36}}>{a.icon}</div>
                <div style={{fontWeight:900,fontSize:15}}>{a.label}</div>
                <div style={{fontSize:11,color:"#666",marginTop:2}}>{a.desc}</div>
              </div>
            ))}
            <Btn onClick={()=>setNewAchievements([])} style={{marginTop:14,width:"100%",padding:"12px",fontSize:15}}>
              ДА, Я ЛУЧШАЯ! 💪
            </Btn>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{background:u.pastel,padding:"16px 20px 12px",borderBottom:"4px solid #111"}}>
        <div style={{fontFamily:"'Bangers',cursive",fontSize:36,letterSpacing:4,color:"#111",textAlign:"center",textShadow:"3px 3px 0 #fff"}}>
          🌷 SLIM TOGETHER
        </div>
        <div style={{textAlign:"center",marginTop:6}}>
          <span style={{background:"#111",color:"#ffe66d",borderRadius:12,padding:"6px 14px",fontSize:12,fontWeight:700,display:"inline-block"}}>
            {todayMeme.vibe} {todayMeme.text}
          </span>
        </div>
      </div>

      {/* ── USER SWITCH ── */}
      <div style={{display:"flex",gap:10,padding:"14px 16px 0"}}>
        {[0,1].map(i=>{
          const streak=getStreak(data[i]); const active=activeUser===i;
          return (
            <button key={i} className="press" onClick={()=>{setActiveUser(i);setForm({});}} style={{
              flex:1,padding:"11px 8px",borderRadius:20,border:"3px solid #111",
              background:active?U[i].pastel:"#fff",color:"#111",
              fontWeight:900,fontSize:14,cursor:"pointer",
              boxShadow:active?"4px 4px 0 #111":"2px 2px 0 #ccc",
              transform:active?"translate(-1px,-1px)":"none",
              transition:"all .15s",fontFamily:"'Nunito',sans-serif",
            }}>
              <div style={{fontSize:22}}>{U[i].emoji}</div>
              {editingName===i
                ? <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}
                    onBlur={()=>{saveName(i,nameInput);setEditingName(null);}}
                    onKeyDown={e=>e.key==="Enter"&&e.target.blur()}
                    style={{width:80,border:"none",background:"transparent",fontWeight:900,fontSize:13,outline:"none",fontFamily:"inherit",textAlign:"center"}}
                    onClick={e=>e.stopPropagation()}/>
                : <div onDoubleClick={e=>{e.stopPropagation();setEditingName(i);setNameInput(names[i]);}}>{names[i]}</div>}
              {streak>0
                ? <div style={{fontSize:11,background:"#111",color:"#ffe66d",borderRadius:10,padding:"2px 8px",marginTop:4,display:"inline-block"}}>🔥 {streak} дн.</div>
                : <div style={{fontSize:11,color:"#aaa",marginTop:4}}>стрик 0 😬</div>}
            </button>
          );
        })}
      </div>
      <div style={{textAlign:"center",color:"#bbb",fontSize:11,marginTop:3}}>2× нажми на имя → изменить</div>

      {/* ── TARGET CARDS ── */}
      <div style={{display:"flex",gap:10,padding:"12px 16px 0"}}>
        {[0,1].map(i=>{
          const prog=getProgress(i);
          return (
            <div key={i} style={{flex:1,background:U[i].pastel,borderRadius:18,padding:"12px 14px",border:"3px solid #111",boxShadow:"4px 4px 0 #111"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:900,fontSize:13}}>{U[i].emoji} ЦЕЛЬ</span>
                <span style={{fontSize:10,background:"#111",color:"#ffe66d",borderRadius:8,padding:"2px 7px",fontWeight:700}}>{daysUntil(TARGETS[i].deadline)} дн. ⏰</span>
              </div>
              <div style={{fontFamily:"'Bangers',cursive",fontSize:28,letterSpacing:1,margin:"4px 0 0"}}>{TARGETS[i].weight} кг</div>
              <div style={{fontSize:10,color:"#333",marginBottom:6}}>к 1 июля 2025</div>
              {prog ? (<>
                <div style={{height:10,background:"#fff",borderRadius:99,border:"2px solid #111",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${prog.pct}%`,background:"#111",borderRadius:99,transition:"width .7s"}}/>
                </div>
                <div style={{fontSize:11,marginTop:4,fontWeight:700,display:"flex",justifyContent:"space-between"}}>
                  <span>{prog.pct}% 💪</span><span>ещё -{prog.needed}кг</span>
                </div>
              </>) : <div style={{fontSize:11,color:"#555"}}>Введи свой вес ↑</div>}
            </div>
          );
        })}
      </div>

      {/* ── TABS ── */}
      <div style={{padding:"12px 16px 0"}}>
        {[
          [["log","📝 Данные"],["workout","🏋️ Трен."],["compare","📊 Итого"]],
          [["achievements","🏅 Ачивки"],["challenges","🎯 Чел."],["gifts","🎁 Подарок"]],
        ].map((row,ri)=>(
          <div key={ri} style={{display:"flex",gap:6,marginBottom:ri===0?4:0}}>
            {row.map(([v,label])=>(
              <button key={v} className="tab-btn press" onClick={()=>setView(v)} style={{
                flex:1,padding:"9px 4px",borderRadius:14,border:"2.5px solid #111",
                background:view===v?(ri===0?"#111":u.pastel):"#fff",
                color:view===v?(ri===0?"#ffe66d":"#111"):"#111",
                fontWeight:900,fontSize:11,cursor:"pointer",transition:"all .15s",
                boxShadow:view===v?"none":"2px 2px 0 #ccc",fontFamily:"'Nunito',sans-serif",
              }}>{label}</button>
            ))}
          </div>
        ))}
      </div>

      {/* ═══════════ LOG ═══════════ */}
      {view==="log" && (
        <div style={{padding:"14px 16px 0",animation:"slide-up .3s ease"}}>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:20,letterSpacing:2,marginBottom:12}}>
            {U[activeUser].emoji} {names[activeUser]} — СЕГОДНЯ СЧИТАЕМ
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {METRICS.map(m=>(
              <div key={m.key} style={{
                background:form[m.key]!==undefined?u.bg:"#fff",borderRadius:18,padding:"12px",
                border:`3px solid ${form[m.key]!==undefined?u.dark:"#111"}`,
                boxShadow:`3px 3px 0 ${form[m.key]!==undefined?u.dark:"#111"}`,
                transition:"all .15s",
              }}>
                <div style={{fontSize:22}}>{m.icon}</div>
                <div style={{fontWeight:900,fontSize:12}}>{m.label}</div>
                <input type="number" step={m.step} min={m.min||0} max={m.max}
                  value={form[m.key]??(todayEntry[m.key]??"")}
                  onChange={e=>setForm(f=>({...f,[m.key]:e.target.value}))}
                  placeholder="?"
                  style={{width:"100%",border:"none",background:"transparent",fontSize:22,fontWeight:900,color:u.dark,outline:"none",fontFamily:"'Nunito',sans-serif"}}
                />
                <div style={{fontSize:9,color:"#aaa",marginTop:2}}>{m.unit} · {m.meme}</div>
              </div>
            ))}
          </div>
          <button className="press" onClick={handleSave} disabled={savingFb} style={{
            width:"100%",marginTop:14,padding:"15px",
            background:saved?"#a8ff78":"#111",color:saved?"#111":u.pastel,
            border:"3px solid #111",borderRadius:18,fontSize:17,fontWeight:900,
            cursor:"pointer",boxShadow:`4px 4px 0 ${u.dark}`,fontFamily:"'Nunito',sans-serif",
            animation:saved?"pop .3s ease":"none",
          }}>
            {savingFb?"⏳ СОХРАНЯЕМ...":(saved?"✅ ЗАПИСАЛА, КРАСАВИЦА!":"💾 СОХРАНИТЬ")}
          </button>
        </div>
      )}

      {/* ═══════════ WORKOUT ═══════════ */}
      {view==="workout" && (
        <div style={{padding:"14px 16px 0",animation:"slide-up .3s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <Btn onClick={()=>setWeekOffset(o=>o-1)} style={{padding:"8px 16px",fontSize:18}} variant="outline">‹</Btn>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:20,letterSpacing:2}}>
              {weekOffset===0?"ЭТА НЕДЕЛЯ 🔥":weekOffset===-1?"ПРОШЛАЯ НЕДЕЛЯ":`${weekOffset>0?"+":""}${weekOffset} НЕД.`}
            </div>
            <Btn onClick={()=>setWeekOffset(o=>o+1)} style={{padding:"8px 16px",fontSize:18}} variant="outline">›</Btn>
          </div>
          <div style={{background:"#fff",borderRadius:20,border:"3px solid #111",boxShadow:"4px 4px 0 #111",overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"38px 1fr 1fr",background:"#111",padding:"10px 12px"}}>
              <div/>{[0,1].map(i=><div key={i} style={{textAlign:"center",fontWeight:900,color:U[i].pastel,fontSize:13}}>{U[i].emoji} {names[i]}</div>)}
            </div>
            {weekDays.map((date,di)=>{
              const isToday=date===today();
              return (
                <div key={date} style={{display:"grid",gridTemplateColumns:"38px 1fr 1fr",
                  background:isToday?"#fffbe6":di%2===0?"#fafafa":"#fff",
                  borderBottom:"1px solid #eee",alignItems:"center",minHeight:48}}>
                  <div style={{textAlign:"center",padding:"4px"}}>
                    <div style={{fontSize:9,color:"#bbb",fontWeight:700}}>{DAY_LABELS[di]}</div>
                    <div style={{fontSize:14,fontWeight:isToday?900:700,color:isToday?u.dark:"#555"}}>
                      {new Date(date+"T12:00:00").getDate()}
                    </div>
                  </div>
                  {[0,1].map(i=>{
                    const wk=(data[i]?.[date]||{}).workouts||[];
                    return (
                      <div key={i} style={{padding:"4px 6px",cursor:"pointer",minHeight:40,display:"flex",alignItems:"center",justifyContent:"center",borderLeft:"1px solid #eee"}}
                        onClick={()=>{setActiveUser(i);setWorkoutModal(date);}}>
                        {wk.length>0
                          ?<div style={{fontSize:17,textAlign:"center"}}>{wk.map(w=>w.split(" ")[0]).join(" ")}</div>
                          :<div style={{fontSize:11,color:"#ccc",fontWeight:700}}>+ добавь</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            {[0,1].map(i=>{
              const count=weekDays.filter(d=>((data[i]?.[d]||{}).workouts||[]).length>0).length;
              const msgs=["диван скучает 🛋️","уже что-то!","неплохо!","хорошо идёшь!","огонь 🔥","ЖЕСТЬ! 😱","МОНСТР 💪"];
              return (
                <div key={i} style={{flex:1,background:U[i].pastel,borderRadius:16,padding:"12px",textAlign:"center",border:"3px solid #111",boxShadow:"3px 3px 0 #111"}}>
                  <div style={{fontFamily:"'Bangers',cursive",fontSize:34}}>{count}</div>
                  <div style={{fontSize:11,fontWeight:900}}>{U[i].emoji} {msgs[Math.min(count,msgs.length-1)]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ COMPARE ═══════════ */}
      {view==="compare" && (
        <div style={{padding:"14px 16px 0",animation:"slide-up .3s ease"}}>
          <div style={{background:"#fff",borderRadius:20,border:"3px solid #111",boxShadow:"4px 4px 0 #111",overflow:"hidden",marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:"#111",padding:"10px 14px"}}>
              <div style={{fontSize:11,color:"#aaa",fontWeight:700}}>СЕГОДНЯ</div>
              {[0,1].map(i=><div key={i} style={{fontWeight:900,color:U[i].pastel,fontSize:13,textAlign:"center"}}>{U[i].emoji} {names[i]}</div>)}
            </div>
            {METRICS.map((m,idx)=>{
              const vals=[0,1].map(i=>(data[i]?.[dateKey]||{})[m.key]);
              const bothHave=vals[0]&&vals[1];
              const winner=bothHave?(["weight","waist","calories"].includes(m.key)?(parseFloat(vals[0])<=parseFloat(vals[1])?0:1):(parseFloat(vals[0])>=parseFloat(vals[1])?0:1)):null;
              return (
                <div key={m.key} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"9px 14px",background:idx%2===0?"#fafafa":"#fff",borderBottom:"1px solid #eee",alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700}}>{m.icon} {m.label}</div>
                  {[0,1].map(i=>(
                    <div key={i} style={{textAlign:"center"}}>
                      <span style={{fontWeight:900,fontSize:14,color:vals[i]?U[i].dark:"#ccc",
                        background:winner===i?U[i].pastel:"transparent",borderRadius:10,padding:"2px 8px",
                        border:winner===i?`2px solid ${U[i].dark}`:"none"}}>
                        {vals[i]?`${vals[i]}${m.unit}`:"—"}{winner===i&&vals[i]?"🏆":""}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:20,letterSpacing:2,marginBottom:10}}>📅 ИСТОРИЯ</div>
          {allDates().length===0 && <div style={{textAlign:"center",padding:30,color:"#aaa",fontWeight:700}}>Данных пока нет...<br/>Иди вноси! 😤</div>}
          {allDates().slice(0,10).map(date=>(
            <div key={date} style={{background:"#fff",borderRadius:16,marginBottom:8,border:"2px solid #111",boxShadow:"3px 3px 0 #ccc",overflow:"hidden"}}>
              <div style={{background:"#111",color:"#ffe66d",padding:"6px 14px",fontSize:12,fontWeight:700}}>
                {new Date(date+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                {[0,1].map(i=>{
                  const entry=data[i]?.[date]||{}; const filled=METRICS.filter(m=>entry[m.key]); const wk=entry.workouts||[];
                  return (
                    <div key={i} style={{padding:"8px 12px",borderRight:i===0?"1px solid #eee":"none"}}>
                      <div style={{fontWeight:900,fontSize:12,color:U[i].dark,marginBottom:3}}>{U[i].emoji} {names[i]}</div>
                      {wk.length>0&&<div style={{fontSize:11,marginBottom:2}}>{wk.join(", ")}</div>}
                      {filled.map(m=><div key={m.key} style={{fontSize:11,color:"#666",marginBottom:1}}>{m.icon} {entry[m.key]}{m.unit}</div>)}
                      {filled.length===0&&wk.length===0&&<div style={{color:"#ccc",fontSize:11}}>ничего... 😴</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ ACHIEVEMENTS ═══════════ */}
      {view==="achievements" && (
        <div style={{padding:"14px 16px 0",animation:"slide-up .3s ease"}}>
          {[0,1].map(uIdx=>{
            const unlocked=getUnlocked(uIdx); const streak=getStreak(data[uIdx]);
            return (
              <div key={uIdx} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{fontSize:20}}>{U[uIdx].emoji}</span>
                  <span style={{fontFamily:"'Bangers',cursive",fontSize:20,letterSpacing:1}}>{names[uIdx]}</span>
                  <span style={{background:"#111",color:"#ffe66d",borderRadius:10,padding:"2px 10px",fontSize:12,fontWeight:700}}>🔥 {streak} дн.</span>
                  <span style={{marginLeft:"auto",background:U[uIdx].pastel,borderRadius:10,padding:"2px 10px",fontSize:12,fontWeight:700,border:"2px solid #111"}}>
                    {unlocked.length}/{ACHIEVEMENTS_DEF.length} 🏅
                  </span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {ACHIEVEMENTS_DEF.map(a=>{
                    const done=unlocked.some(u=>u.id===a.id);
                    return (
                      <div key={a.id} style={{
                        background:done?U[uIdx].pastel:"#f0f0f0",borderRadius:16,padding:"12px 14px",
                        border:`2.5px solid ${done?"#111":"#ddd"}`,boxShadow:done?"3px 3px 0 #111":"none",
                        opacity:done?1:0.5,transform:done?"rotate(-1deg)":"none",
                      }}>
                        <div style={{fontSize:28}}>{a.icon}</div>
                        <div style={{fontWeight:900,fontSize:12}}>{a.label}</div>
                        <div style={{fontSize:10,color:"#555",marginTop:2}}>{a.desc}</div>
                        {done&&<div style={{fontSize:10,fontWeight:900,marginTop:4}}>✓ ВЫПОЛНЕНО!</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ CHALLENGES ═══════════ */}
      {view==="challenges" && (
        <div style={{padding:"14px 16px 0",animation:"slide-up .3s ease"}}>
          <div style={{background:"#ffe66d",borderRadius:18,padding:"14px 16px",marginBottom:14,border:"3px solid #111",boxShadow:"4px 4px 0 #111"}}>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:22,letterSpacing:2}}>🎯 ЕЖЕНЕДЕЛЬНЫЙ ВЫЗОВ</div>
            <div style={{fontSize:12,fontWeight:700,color:"#555"}}>Последние 7 дней. Слабо? 👀</div>
          </div>
          {[0,1].map(uIdx=>{
            const statuses=getChallenges(uIdx); const doneCount=statuses.filter(s=>s.done).length;
            return (
              <div key={uIdx} style={{marginBottom:18}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{fontSize:20}}>{U[uIdx].emoji}</span>
                  <span style={{fontFamily:"'Bangers',cursive",fontSize:18,letterSpacing:1}}>{names[uIdx]}</span>
                  <span style={{marginLeft:"auto",background:U[uIdx].pastel,borderRadius:10,padding:"2px 10px",fontSize:13,fontWeight:900,border:"2px solid #111"}}>
                    {doneCount}/{CHALLENGES_DEF.length} {doneCount===CHALLENGES_DEF.length?"👑":"💀"}
                  </span>
                </div>
                {statuses.map(c=>(
                  <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,
                    background:c.done?U[uIdx].pastel:"#fff",borderRadius:16,padding:"12px 14px",
                    border:`2.5px solid ${c.done?"#111":"#ddd"}`,boxShadow:c.done?"3px 3px 0 #111":"none",
                    transform:c.done?"rotate(.5deg)":"none"}}>
                    <div style={{fontSize:28}}>{c.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:900,fontSize:13}}>{c.label}</div>
                      <div style={{fontSize:11,color:"#666"}}>{c.desc}</div>
                    </div>
                    <div style={{fontSize:24}}>{c.done?"✅":"⬜"}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ GIFTS ═══════════ */}
      {view==="gifts" && (
        <div style={{padding:"14px 16px 0",animation:"slide-up .3s ease"}}>
          <div style={{background:"#ffe66d",borderRadius:18,padding:"16px",marginBottom:14,border:"3px solid #111",boxShadow:"4px 4px 0 #111",textAlign:"center"}}>
            <div style={{fontSize:48}}>🎁</div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:26,letterSpacing:2}}>ПОДАРОК ЗА ЦЕЛЬ</div>
            <div style={{fontSize:12,fontWeight:700,color:"#555"}}>Достигни — открой! Пока — интрига 🔐</div>
          </div>
          {[0,1].map(i=>{
            const prog=getProgress(i); const achieved=prog&&prog.pct>=100;
            return (
              <div key={i} style={{background:"#fff",borderRadius:22,padding:"18px",marginBottom:14,
                border:`3px solid ${achieved?U[i].dark:"#111"}`,
                boxShadow:achieved?`6px 6px 0 ${U[i].dark}`:"4px 4px 0 #111",
                animation:achieved?"glow-pink 2s infinite":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <span style={{fontSize:24}}>{U[i].emoji}</span>
                  <span style={{fontFamily:"'Bangers',cursive",fontSize:22,letterSpacing:1}}>{names[i]}</span>
                  {achieved&&<span style={{marginLeft:"auto",background:"#111",color:"#ffe66d",borderRadius:12,padding:"4px 12px",fontSize:13,fontWeight:900,animation:"wiggle 1s infinite"}}>🎊 ДОСТИГНУТО!</span>}
                </div>
                <div style={{background:achieved?U[i].bg:"#f5f5f5",borderRadius:16,padding:"20px",textAlign:"center",
                  border:`2.5px dashed ${achieved?U[i].dark:"#ccc"}`,marginBottom:12,position:"relative",overflow:"hidden",
                  minHeight:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  {!achieved&&(
                    <div style={{position:"absolute",inset:0,backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",background:"#ffffff88",borderRadius:14,zIndex:2}}>
                      <div style={{background:"#111",color:"#ffe66d",borderRadius:14,padding:"10px 18px",fontWeight:900,fontSize:13,textAlign:"center"}}>
                        🔒 СНАЧАЛА ПОХУДЕЙ<br/><span style={{fontSize:11,color:"#aaa"}}>(ещё {prog?.needed??"?"} кг, давай!)</span>
                      </div>
                    </div>
                  )}
                  <div style={{fontSize:46}}>🎀</div>
                  {editingGift===i
                    ? <>
                        <input autoFocus value={giftInput} onChange={e=>setGiftInput(e.target.value)}
                          style={{width:"100%",border:`2px solid ${U[i].dark}`,borderRadius:10,background:"#fff",fontSize:15,textAlign:"center",color:"#111",fontWeight:900,outline:"none",fontFamily:"'Nunito',sans-serif",padding:"8px",boxSizing:"border-box",marginTop:8}}
                          placeholder="Мечтай по-крупному! ✨"/>
                        <div style={{display:"flex",gap:8,marginTop:10,width:"100%"}}>
                          <Btn onClick={()=>saveGift(i,giftInput)} style={{flex:1,padding:"9px",fontSize:13}}>Сохранить 💾</Btn>
                          <Btn onClick={()=>setEditingGift(null)} variant="outline" style={{flex:1,padding:"9px",fontSize:13}}>Отмена</Btn>
                        </div>
                      </>
                    : <div style={{fontWeight:900,fontSize:16,color:"#111",marginTop:6,filter:achieved?"none":"blur(6px)"}}>{gifts[i]}</div>}
                </div>
                {editingGift!==i&&(
                  <Btn onClick={()=>{setEditingGift(i);setGiftInput(gifts[i]);}} variant="outline" style={{width:"100%",padding:"11px",fontSize:13}}>
                    ✏️ Изменить мечту
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ WORKOUT MODAL ═══════════ */}
      {workoutModal&&(
        <div style={{position:"fixed",inset:0,background:"#0006",display:"flex",alignItems:"flex-end",zIndex:100}} onClick={()=>setWorkoutModal(null)}>
          <div style={{background:"#fffdf0",borderRadius:"24px 24px 0 0",padding:"24px 20px 44px",width:"100%",boxSizing:"border-box",border:"3px solid #111",borderBottom:"none"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:22,letterSpacing:2,color:U[activeUser].dark,marginBottom:4}}>
              {U[activeUser].emoji} {names[activeUser]} — ЧТО БЫЛО?
            </div>
            <div style={{fontSize:13,color:"#aaa",fontWeight:700,marginBottom:14}}>
              {new Date(workoutModal+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long"})}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
              {WORKOUT_TYPES.map(type=>{
                const selected=((data[activeUser]?.[workoutModal]||{}).workouts||[]).includes(type);
                return (
                  <button key={type} className="press" onClick={()=>toggleWorkout(workoutModal,type)} style={{
                    padding:"10px 16px",borderRadius:18,
                    background:selected?"#111":"#fff",color:selected?u.pastel:"#111",
                    border:"2.5px solid #111",fontWeight:900,fontSize:14,cursor:"pointer",
                    boxShadow:selected?"none":"2px 2px 0 #ccc",fontFamily:"'Nunito',sans-serif",
                  }}>{type}</button>
                );
              })}
            </div>
            <Btn onClick={()=>setWorkoutModal(null)} style={{width:"100%",padding:"14px",fontSize:16}}>ГОТОВО, ЧО! ✓</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
