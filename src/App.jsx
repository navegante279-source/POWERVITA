import { useState, useEffect, useRef } from "react";

const FUXION_LINK = "https://ifuxion.com/andresvarela/enrollment/chooseperson";
const WA = "59898950206";
const META_PIXEL_ID = "2212676212813152";
const GOOGLE_TAG_ID = "TU_GOOGLE_TAG_ID";

const COUNTRIES = ["Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Ecuador","El Salvador","España","Estados Unidos","Guatemala","Honduras","México","Nicaragua","Panamá","Paraguay","Perú","República Dominicana","Uruguay","Venezuela","Alemania","Australia","Bélgica","Canadá","Francia","Italia","Japón","Portugal","Reino Unido","Suiza","Sudáfrica","Emiratos Árabes","Singapur","Nueva Zelanda","Países Bajos","Austria","Israel"];
const CERTS = ["Clean Label","FDA Registered","GMP Certified","Non-GMO","HACCP","Biotecnología Avanzada","37 Países","+15,000 Socios","Ingredientes Naturales","Sin Conservantes Artificiales","Ciencia + Naturaleza"];

const PRODUCTS = [
  {id:1,line:"Detox",name:"REXET",tag:"¡Reinicia tu cuerpo!",emoji:"🌿",desc:"Bebida efervescente que protege el hígado y elimina toxinas con tuna roja, alcachofa y clorofila.",benefits:["Depura el hígado","Elimina toxinas","Equilibra el metabolismo"],ing:"Tuna roja · Alcachofa · Hierba luisa · Clorofila · Zinc"},
  {id:2,line:"Detox",name:"LIQUID FIBER",tag:"¡Digestión puntual!",emoji:"🍋",desc:"Fibras prebióticas de achicoria para digestión saludable y flora intestinal equilibrada.",benefits:["Mejora flora intestinal","Regularidad digestiva","Salud digestiva"],ing:"Inulina · Oligofructuosa · Raíz de achicoria"},
  {id:3,line:"Detox",name:"FLORA LIV",tag:"¡Protege desde adentro!",emoji:"🫧",desc:"Probióticos + prebióticos con granadilla y aguaymanto. Regenera tu flora intestinal.",benefits:["Regenera flora intestinal","Activa defensas","Previene trastornos"],ing:"Cultivos probióticos · Fibra prebiótica · Granadilla"},
  {id:4,line:"Detox",name:"BALANCE",tag:"¡Cuerpo alcalino!",emoji:"🥬",desc:"Bebida alcalinizante con vegetales verdes que equilibra el pH y elimina toxinas.",benefits:["Equilibra pH corporal","Limpieza profunda","Más energía vital"],ing:"Alfalfa · Chlorella · Espirulina · Pasto de trigo"},
  {id:5,line:"Energy",name:"NUTRADAY",tag:"¡Vitalidad familiar!",emoji:"⚡",desc:"Refresco multivitamínico con moringa, camu camu y quinua germinada para toda la familia.",benefits:["12 vitaminas + 5 minerales","Fortalece defensas","Desarrollo integral"],ing:"Moringa · Guayaba · Camu Camu · Açaí · Quinua"},
  {id:6,line:"Energy",name:"VITA XTRA T+",tag:"¡Recupera tu vitalidad!",emoji:"🌟",desc:"Energizante antioxidante con guayusa amazónica, maca y goji berry.",benefits:["Energía sin caída","Reduce fatiga","Alto poder antioxidante"],ing:"Guayusa · Té verde · Açaí · Goji berry · Maca"},
  {id:7,line:"Energy",name:"XPEED",tag:"¡Energía líquida!",emoji:"🚀",desc:"Bebida energética saludable con maca, guaraná y teína. Natural sparkling effect.",benefits:["Energía inmediata","Efecto antioxidante","Sin caídas"],ing:"Maca · Guaraná · Teína · Taurina · Vitamina C"},
  {id:8,line:"Protein",name:"BIOPRO+ TECT",tag:"¡Activa tus defensas!",emoji:"🛡️",desc:"Batido con Bioprotein+ y Colostrum® de 100% valor biológico. Regeneración avanzada.",benefits:["Activa sistema inmune","Regeneración celular","Fortalece huesos"],ing:"Bioprotein+ · Colostrum® · Aminoácidos · DHA"},
  {id:9,line:"Protein",name:"PROTEIN ACTIVE",tag:"¡Nutrición vegetal!",emoji:"💪",desc:"Proteína 100% vegetal de quinua, arroz y algas germinadas.",benefits:["Alta biodisponibilidad","Regenera tejidos","Reduce daño oxidativo"],ing:"Quinua germinada · Arroz integral · Algas · DHA"},
  {id:10,line:"Immunity",name:"NO STRESS",tag:"¡Equilibrio mental!",emoji:"🧘",desc:"Fórmula natural para reducir el estrés y mejorar el desempeño mental y emocional.",benefits:["Reduce estrés","Mejora el sueño","Claridad mental"],ing:"Adaptógenos · Vitaminas B · Minerales"},
  {id:11,line:"Immunity",name:"YOUTH ELIXIR HGH",tag:"¡Activa tu juventud!",emoji:"✨",desc:"Elixir anti-edad que estimula la producción natural de hormona de crecimiento.",benefits:["Anti-envejecimiento","Regeneración celular","Vitalidad juvenil"],ing:"Aminoácidos · Vitaminas · Extractos premium"},
  {id:12,line:"Sport",name:"PRE SPORT",tag:"¡Rendimiento máximo!",emoji:"🏃",desc:"Fórmula pre-entrenamiento para maximizar rendimiento y resistencia física.",benefits:["Máximo rendimiento","Más resistencia","Enfoque mental"],ing:"Aminoácidos · Cafeína natural · Vitaminas"},
  {id:13,line:"Control",name:"THERMO T3",tag:"¡Activa tu metabolismo!",emoji:"🔥",desc:"Termogénico natural que activa el metabolismo y apoya el control de peso saludable.",benefits:["Activa el metabolismo","Quema grasa","Control de peso"],ing:"Té verde · Guaraná · Jengibre · Canela"},
];

const RECIPES = [
  {id:1,cat:"Detox",name:"Green Detox Elixir",img:"🥒",product:"REXET",ingredients:["1 pepino","jugo de limón","menta fresca","1 sobre REXET","300ml agua fría"],prep:"Mezcla todo en licuadora. Sirve sobre hielo al amanecer para máximo efecto depurativo."},
  {id:2,cat:"Energy",name:"Power Morning Boost",img:"⚡",product:"VITA XTRA T+",ingredients:["1 plátano","leche de almendras","1 sobre VITA XTRA T+","canela","hielo"],prep:"Licúa todo 30 segundos. Ideal 30 min antes de tu entrenamiento."},
  {id:3,cat:"Immunity",name:"Golden Shield Latte",img:"🌟",product:"NO STRESS",ingredients:["leche de coco caliente","1 sobre NO STRESS","cúrcuma","pimienta negra","miel orgánica"],prep:"Calienta la leche, añade ingredientes y bate. Toma antes de dormir."},
  {id:4,cat:"Detox",name:"Tropical Cleanse Bowl",img:"🍍",product:"LIQUID FIBER",ingredients:["papaya","piña","1 sobre LIQUID FIBER","chía","coco rallado"],prep:"Mezcla y sirve en bowl. La fibra prebiótica potencia la digestión."},
  {id:5,cat:"Energy",name:"Warrior Smoothie",img:"💪",product:"NUTRADAY",ingredients:["espinaca baby","manzana verde","jengibre","1 sobre NUTRADAY","agua de coco"],prep:"Procesa en licuadora. Perfecto post-entrenamiento."},
  {id:6,cat:"Immunity",name:"Citrus Defense Shot",img:"🍊",product:"BIOPRO+ TECT",ingredients:["naranja exprimida","zanahoria","1 sobre BIOPRO+ TECT","cúrcuma","jengibre"],prep:"Extrae el jugo, mezcla todo. Toma en ayunas cada mañana."},
  {id:7,cat:"Protein",name:"Vanilla Power Shake",img:"🥛",product:"PROTEIN ACTIVE",ingredients:["300ml leche de avena","1 sobre PROTEIN ACTIVE","vainilla","mantequilla de maní","hielo"],prep:"Licúa 30 segundos. Excelente para construcción muscular."},
  {id:8,cat:"Beauty",name:"Collagen Glow Drink",img:"✨",product:"YOUTH ELIXIR HGH",ingredients:["agua de rosas","jugo de granada","1 sobre YOUTH ELIXIR HGH","aloe vera","menta"],prep:"Mezcla sin licuadora. Agita bien. Toma 2x día para piel radiante."},
  {id:9,cat:"Detox",name:"Purple Rain Detox",img:"🫐",product:"BALANCE",ingredients:["arándanos","uva morada","1 sobre BALANCE","limón","agua mineral"],prep:"Licúa frutas, cuela y mezcla con el sobre. Sirve con hielo."},
  {id:10,cat:"Energy",name:"Matcha Vitality Latte",img:"🍵",product:"XPEED",ingredients:["1 cdita matcha","leche de almendra","1 sobre XPEED","canela","miel de agave"],prep:"Bate el matcha con agua, añade leche y el sobre. Espuma y sirve."},
  {id:11,cat:"Protein",name:"Chocolate Muscle Bowl",img:"🍫",product:"PROTEIN ACTIVE",ingredients:["banana congelada","cacao puro","1 sobre PROTEIN ACTIVE","granola","semillas de cáñamo"],prep:"Licúa banana con cacao y proteína. Añade toppings y sirve."},
  {id:12,cat:"Beauty",name:"Butterfly Pea Glow",img:"💙",product:"YOUTH ELIXIR HGH",ingredients:["flor de clitoria azul","agua caliente","1 sobre YOUTH ELIXIR HGH","limón","lavanda"],prep:"Infusiona la flor, añade limón (cambia a violeta) y el sobre. Magia visual."},
];

const PROD_TESTIMONIALS = [
  {name:"Elena García",country:"España",flag:"🇪🇸",gender:"female",role:"Cliente verificada",text:"Increíble el cambio en mi digestión. ¡El envío a Madrid fue súper rápido!"},
  {name:"Camila Rojas",country:"Chile",flag:"🇨🇱",gender:"female",role:"Usuaria Premium",text:"Desde que uso FuXion Energy tengo una vitalidad que no sentía desde mis 20s."},
  {name:"André Santos",country:"Brasil",flag:"🇧🇷",gender:"male",role:"Cliente verificado",text:"O sistema Immuno me ajudou a passar o inverno sem adoecer uma única vez!"},
  {name:"María López",country:"México",flag:"🇲🇽",gender:"female",role:"Usuaria Premium",text:"Perdí 8 kilos en 3 meses con el plan detox. Me siento renovada y con energía."},
  {name:"James Wilson",country:"USA",flag:"🇺🇸",gender:"male",role:"Verified Customer",text:"Clean, effective, and actually tastes good. FuXion is the real deal."},
  {name:"Valentina Cruz",country:"Colombia",flag:"🇨🇴",gender:"female",role:"Embajadora",text:"El Aloe Plus transformó mi piel. Todos preguntan mi secreto: Power Vita 🌿"},
];
const BIZ_TESTIMONIALS = [
  {name:"Marcus Johnson",country:"USA",flag:"🇺🇸",gender:"male",role:"Diamond Partner",text:"Llevar Power Vita a mi país ha sido la mejor decisión financiera. La logística global es invisible."},
  {name:"Sofía Morales",country:"Argentina",flag:"🇦🇷",gender:"female",role:"Gold Partner",text:"En 8 meses construí un equipo en 5 países. El soporte del sistema es incomparable."},
  {name:"Pedro Fernandes",country:"Portugal",flag:"🇵🇹",gender:"male",role:"Diamond Partner",text:"Comecei do zero e hoje tenho renda passiva de 6 dígitos. O modelo da FuXion é revolucionário."},
];
const SOCIAL_PROOF = ["🇲🇽 Carlos de México acaba de unirse","🇨🇴 Laura de Colombia compró Energy+","🇧🇷 Pedro de Brasil se registró","🇦🇷 Sofía de Argentina compró Detox Kit","🇪🇸 Elena de España se unió al equipo","🇨🇱 Diego de Chile compró Immuno Shield","🇺🇸 James de USA se convirtió en Partner","🇺🇾 Marcos de Uruguay se registró"];
const QUIZ_Q = [
  {q:{es:"¿Cuál es tu principal objetivo?",en:"What's your main goal?",pt:"Qual é seu objetivo?"},opts:[{es:"💪 Más energía",en:"💪 More energy",pt:"💪 Mais energia",tag:"energy"},{es:"🌿 Detox corporal",en:"🌿 Body detox",pt:"🌿 Detox corporal",tag:"detox"},{es:"🛡️ Fortalecer inmunidad",en:"🛡️ Boost immunity",pt:"🛡️ Fortalecer imunidade",tag:"immunity"},{es:"💼 Negocio global",en:"💼 Global business",pt:"💼 Negócio global",tag:"biz"}]},
  {q:{es:"¿Cómo es tu estilo de vida?",en:"How is your lifestyle?",pt:"Como é seu estilo de vida?"},opts:[{es:"🏃 Muy activo",en:"🏃 Very active",pt:"🏃 Muito ativo",tag:"energy"},{es:"💼 Trabajo intenso",en:"💼 Intense work",pt:"💼 Trabalho intenso",tag:"detox"},{es:"🏠 Sedentario",en:"🏠 Sedentary",pt:"🏠 Sedentário",tag:"immunity"},{es:"✈️ Emprendedor",en:"✈️ Entrepreneur",pt:"✈️ Empreendedor",tag:"biz"}]},
  {q:{es:"¿Qué resultado quieres en 30 días?",en:"What result in 30 days?",pt:"Que resultado em 30 dias?"},opts:[{es:"⚡ Energía sin café",en:"⚡ Energy no coffee",pt:"⚡ Energia sem café",tag:"energy"},{es:"🌱 Digestión perfecta",en:"🌱 Perfect digestion",pt:"🌱 Digestão perfeita",tag:"detox"},{es:"💚 Sin enfermedades",en:"💚 No sickness",pt:"💚 Sem doenças",tag:"immunity"},{es:"💰 Primera comisión",en:"💰 First commission",pt:"💰 Primeira comissão",tag:"biz"}]},
];
const QUIZ_RES = {
  energy:{emoji:"⚡",title:{es:"Tu Plan Energy Power",en:"Your Energy Power Plan",pt:"Seu Plano Energy Power"},products:["VITA XTRA T+","NUTRADAY","XPEED"]},
  detox:{emoji:"🌿",title:{es:"Tu Plan Detox Premium",en:"Your Detox Premium Plan",pt:"Seu Plano Detox Premium"},products:["REXET","LIQUID FIBER","BALANCE"]},
  immunity:{emoji:"🛡️",title:{es:"Tu Plan Immunity Shield",en:"Your Immunity Shield",pt:"Seu Plano Immunity Shield"},products:["BIOPRO+ TECT","NO STRESS","YOUTH ELIXIR HGH"]},
  biz:{emoji:"👑",title:{es:"Tu Plan Business Builder",en:"Your Business Builder",pt:"Seu Plano Business Builder"},products:["Kit de Inicio FuXion","Acceso 37 mercados","Soporte digital completo"]},
};

function detectLang(){const l=(navigator.language||"es").slice(0,2).toLowerCase();return ["es","en","pt"].includes(l)?l:"es";}
function detectCountry(){
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";
  if(tz.includes("Montevideo"))return "Uruguay";
  if(tz.includes("Argentina"))return "Argentina";
  if(tz.includes("Bogota"))return "Colombia";
  if(tz.includes("Mexico"))return "México";
  if(tz.includes("Sao_Paulo"))return "Brasil";
  if(tz.includes("Madrid"))return "España";
  return "mi país";
}

// ── TRACKING ──────────────────────────────────────────────────────────────────
function TrackingPixels(){
  useEffect(()=>{
    if(META_PIXEL_ID!=="2212676212813152"){
      (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init',META_PIXEL_ID);window.fbq('track','PageView');
    }
    if(GOOGLE_TAG_ID!=="TU_GOOGLE_TAG_ID"){
      const s=document.createElement('script');s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;document.head.appendChild(s);
      window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};window.gtag('js',new Date());window.gtag('config',GOOGLE_TAG_ID);
    }
  },[]);
  return null;
}
function trackEvent(name,params={}){
  if(window.fbq&&META_PIXEL_ID!=="2212676212813152")window.fbq('track',name,params);
  if(window.gtag&&GOOGLE_TAG_ID!=="TU_GOOGLE_TAG_ID")window.gtag('event',name,params);
}

// ── PARTICLES 3D ─────────────────────────────────────────────────────────────
function Particles(){
  const ref=useRef();
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");
    let W=c.width=c.offsetWidth,H=c.height=c.offsetHeight;
    const pts=Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3}));
    const rings=Array.from({length:4},(_,i)=>({rx:100+i*55,ry:25+i*10,rot:i*.5,speed:.003+i*.001}));
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      rings.forEach(r=>{r.rot+=r.speed;ctx.save();ctx.translate(W/2,H/2);ctx.rotate(r.rot);ctx.beginPath();ctx.ellipse(0,0,r.rx,r.ry,0,0,Math.PI*2);ctx.strokeStyle="rgba(27,94,59,0.07)";ctx.lineWidth=1.2;ctx.stroke();ctx.restore();});
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fillStyle="rgba(27,94,59,0.25)";ctx.fill();});
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<100){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(27,94,59,${0.08*(1-d/100)})`;ctx.lineWidth=.6;ctx.stroke();}}));
      raf=requestAnimationFrame(draw);
    };
    draw();
    const ro=new ResizeObserver(()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;});ro.observe(c);
    return()=>{cancelAnimationFrame(raf);ro.disconnect();};
  },[]);
  return <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}/>;
}

// ── COUNTER ───────────────────────────────────────────────────────────────────
function Counter({target,duration=2000}){
  const [v,setV]=useState(0);const ref=useRef();const done=useRef(false);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting&&!done.current){done.current=true;const s=Date.now();const tick=()=>{const p=Math.min((Date.now()-s)/duration,1);setV(Math.floor(p*target));if(p<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);}},{threshold:0.4});
    if(ref.current)obs.observe(ref.current);return()=>obs.disconnect();
  },[target,duration]);
  return <span ref={ref}>{v.toLocaleString()}</span>;
}

// ── AVATAR ────────────────────────────────────────────────────────────────────
function Avatar({name,gender,size=52}){
  const palettes={
    "Elena García":{skin:"#F5CBA7",hair:"#6E2C00",bg:"#FDE8D8"},
    "Camila Rojas":{skin:"#F0B27A",hair:"#1A1A1A",bg:"#FDDCB5"},
    "André Santos":{skin:"#C68642",hair:"#1A1A1A",bg:"#E8D5B7"},
    "María López":{skin:"#E59866",hair:"#4A235A",bg:"#FAD7A0"},
    "James Wilson":{skin:"#FAD7A0",hair:"#784212",bg:"#FEF5E7"},
    "Valentina Cruz":{skin:"#F5CBA7",hair:"#922B21",bg:"#FDEDEC"},
    "Marcus Johnson":{skin:"#8D5524",hair:"#1A1A1A",bg:"#D4C5B0"},
    "Sofía Morales":{skin:"#F5CBA7",hair:"#1A1A1A",bg:"#EBF5FB"},
    "Pedro Fernandes":{skin:"#F0B27A",hair:"#2C3E50",bg:"#EAF2FF"},
  };
  const p=palettes[name]||{skin:"#F5CBA7",hair:"#1A1A1A",bg:"#EAF2FF"};
  const f=gender==="female";
  return(
    <svg width={size} height={size} viewBox="0 0 60 60" style={{borderRadius:"50%",flexShrink:0,border:"2.5px solid #1B5E3B",boxShadow:"0 2px 8px rgba(27,94,59,0.2)"}}>
      <circle cx="30" cy="30" r="30" fill={p.bg}/>
      {/* Cabello */}
      {f?(
        <><ellipse cx="30" cy="17" rx="13" ry="6" fill={p.hair}/><ellipse cx="18" cy="26" rx="4" ry="9" fill={p.hair}/><ellipse cx="42" cy="26" rx="4" ry="9" fill={p.hair}/><rect x="17" y="13" width="26" height="10" rx="5" fill={p.hair}/></>
      ):(
        <><ellipse cx="30" cy="16" rx="13" ry="5" fill={p.hair}/><rect x="17" y="12" width="26" height="9" rx="4" fill={p.hair}/></>
      )}
      {/* Cabeza */}
      <ellipse cx="30" cy="25" rx="12" ry="13" fill={p.skin}/>
      {/* Ojos */}
      <ellipse cx="25" cy="24" rx="2.2" ry="2.4" fill="#2C3E50"/>
      <ellipse cx="35" cy="24" rx="2.2" ry="2.4" fill="#2C3E50"/>
      <circle cx="25.8" cy="23.2" r=".8" fill="#fff"/>
      <circle cx="35.8" cy="23.2" r=".8" fill="#fff"/>
      {/* Nariz */}
      <ellipse cx="30" cy="28" rx="1.5" ry="1" fill={p.skin} stroke="#D4A076" strokeWidth=".5"/>
      {/* Boca */}
      <path d="M26 31 Q30 35 34 31" stroke="#C0392B" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      {/* Cuerpo */}
      <ellipse cx="30" cy="50" rx="18" ry="12" fill={f?"#C9A84C":"#1B5E3B"}/>
      {/* Cuello */}
      <rect x="26" y="36" width="8" height="8" rx="2" fill={p.skin}/>
    </svg>
  );
}

// ── TESTIMONIO ────────────────────────────────────────────────────────────────
function TC({d,verified,large}){
  return(
    <div style={{minWidth:large?"auto":285,maxWidth:large?520:285,margin:large?"0 auto":undefined,
      background:"rgba(255,255,255,0.88)",backdropFilter:"blur(18px)",
      border:"1px solid rgba(27,94,59,0.14)",borderRadius:20,padding:20,
      flexShrink:0,boxShadow:"0 4px 20px rgba(27,94,59,0.09)"}}>
      <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
        <div style={{position:"relative",flexShrink:0}}>
          <Avatar name={d.name} gender={d.gender} size={50}/>
          <div style={{position:"absolute",bottom:-2,right:-2,width:18,height:18,borderRadius:"50%",
            background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>{d.flag}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,color:"#1B5E3B",fontSize:13}}>{d.name}</div>
          <div style={{fontSize:10,color:"#4a7c5e"}}>{d.country}</div>
          {d.role&&<div style={{fontSize:9,fontWeight:700,color:"#C9A84C",letterSpacing:.5,textTransform:"uppercase"}}>{d.role}</div>}
        </div>
        <div style={{background:"rgba(27,94,59,0.08)",border:"1px solid rgba(27,94,59,0.18)",borderRadius:999,padding:"2px 7px",fontSize:8,fontWeight:700,color:"#1B5E3B",whiteSpace:"nowrap"}}>✓ {verified}</div>
      </div>
      <div style={{fontSize:26,color:"#C9A84C",lineHeight:1,marginBottom:3,fontFamily:"Georgia,serif"}}>"</div>
      <p style={{fontSize:12,color:"#2d5a3d",lineHeight:1.65,fontStyle:"italic",marginBottom:10}}>{d.text}</p>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:"#C9A84C",fontSize:11}}>★</span>)}</div>
        <span style={{fontSize:9,color:"rgba(27,94,59,0.4)",fontWeight:600}}>FuXion Verified</span>
      </div>
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast(){
  const [vis,setVis]=useState(false);const [msg,setMsg]=useState("");
  useEffect(()=>{
    const show=()=>{setMsg(SOCIAL_PROOF[Math.floor(Math.random()*SOCIAL_PROOF.length)]);setVis(true);setTimeout(()=>setVis(false),3500);};
    const id=setInterval(show,7000);setTimeout(show,2500);return()=>clearInterval(id);
  },[]);
  return(
    <div style={{position:"fixed",bottom:90,left:16,zIndex:200,
      transform:vis?"translateY(0)":"translateY(130px)",opacity:vis?1:0,
      transition:"all .5s cubic-bezier(.34,1.56,.64,1)",
      background:"rgba(255,255,255,0.96)",backdropFilter:"blur(16px)",
      border:"1px solid rgba(27,94,59,0.2)",borderRadius:13,
      padding:"9px 14px",display:"flex",alignItems:"center",gap:9,
      boxShadow:"0 8px 32px rgba(27,94,59,0.15)",maxWidth:230}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:"#25D366",flexShrink:0,boxShadow:"0 0 0 3px rgba(37,211,102,0.3)"}}/>
      <span style={{fontSize:11,fontWeight:600,color:"#1B5E3B",lineHeight:1.3}}>{msg}</span>
    </div>
  );
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
function Quiz({lang}){
  const [step,setStep]=useState(-1);
  const [answers,setAnswers]=useState([]);
  const [result,setResult]=useState(null);
  const labels={es:{title:"¿Cuál es tu Power Profile?",sub:"Descubre tu plan en 30 segundos",start:"Iniciar Quiz",retake:"Repetir Quiz",profile:"POWER PROFILE"},en:{title:"What's Your Power Profile?",sub:"Discover your plan in 30 seconds",start:"Start Quiz",retake:"Retake Quiz",profile:"POWER PROFILE"},pt:{title:"Qual é o seu Power Profile?",sub:"Descubra seu plano em 30 segundos",start:"Iniciar Quiz",retake:"Refazer Quiz",profile:"POWER PROFILE"}};
  const l=labels[lang]||labels.es;
  const pick=(tag,i)=>{
    const a=[...answers,tag];
    if(i<QUIZ_Q.length-1){setAnswers(a);setStep(i+1);}
    else{const freq=a.reduce((acc,x)=>{acc[x]=(acc[x]||0)+1;return acc;},{});const top=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0];setResult(QUIZ_RES[top]||QUIZ_RES.energy);}
  };
  if(step===-1)return(<div style={{textAlign:"center",padding:"28px 20px"}}><div style={{fontSize:44,marginBottom:8}}>🧬</div><h3 style={{fontSize:17,fontWeight:900,color:"#1B5E3B",marginBottom:6}}>{l.title}</h3><p style={{color:"#4a7c5e",marginBottom:20,fontSize:12}}>{l.sub}</p><button onClick={()=>setStep(0)} style={{background:"#1B5E3B",color:"#fff",border:"none",padding:"12px 28px",borderRadius:12,fontWeight:800,fontSize:13,cursor:"pointer"}}>{l.start} →</button></div>);
  if(result)return(<div style={{textAlign:"center",padding:"24px 18px"}}><div style={{fontSize:40,marginBottom:5}}>{result.emoji}</div><div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:"#C9A84C",marginBottom:4}}>{l.profile}</div><h3 style={{fontSize:16,fontWeight:900,color:"#1B5E3B",marginBottom:11}}>{result.title[lang]||result.title.es}</h3><div style={{background:"rgba(27,94,59,0.06)",borderRadius:11,padding:"11px 14px",marginBottom:14,textAlign:"left"}}>{result.products.map((p,i)=><div key={i} style={{fontSize:12,color:"#2d5a3d",padding:"2px 0",display:"flex",gap:6}}><span style={{color:"#C9A84C"}}>·</span>{p}</div>)}</div><a href={FUXION_LINK} target="_blank" rel="noreferrer" style={{display:"inline-block",background:"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",padding:"9px 22px",borderRadius:10,fontWeight:800,textDecoration:"none",fontSize:12,marginBottom:9}}>Ver Productos →</a><br/><button onClick={()=>{setStep(-1);setAnswers([]);setResult(null);}} style={{background:"none",border:"1px solid rgba(27,94,59,0.3)",color:"#1B5E3B",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600}}>{l.retake}</button></div>);
  const q=QUIZ_Q[step];
  return(<div style={{padding:"24px 18px"}}><div style={{display:"flex",gap:4,marginBottom:14}}>{QUIZ_Q.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?"#1B5E3B":"rgba(27,94,59,0.18)",transition:"background .3s"}}/>)}</div><div style={{fontSize:9,color:"#4a7c5e",fontWeight:700,letterSpacing:1,marginBottom:6}}>PREGUNTA {step+1}/{QUIZ_Q.length}</div><h3 style={{fontSize:14,fontWeight:800,color:"#1B5E3B",marginBottom:14}}>{q.q[lang]||q.q.es}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{q.opts.map((o,i)=>(<button key={i} onClick={()=>pick(o.tag,step)} style={{background:"rgba(27,94,59,0.06)",border:"1.5px solid rgba(27,94,59,0.15)",borderRadius:10,padding:"11px 7px",cursor:"pointer",fontWeight:700,fontSize:11,color:"#1B5E3B",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(27,94,59,0.14)";e.currentTarget.style.borderColor="#1B5E3B";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(27,94,59,0.06)";e.currentTarget.style.borderColor="rgba(27,94,59,0.15)";}}>  {o[lang]||o.es}</button>))}</div></div>);
}

// ── LEAD FORM ─────────────────────────────────────────────────────────────────
function LeadForm({lang}){
  const [form,setForm]=useState({name:"",email:"",country:"",goal:""});
  const [sent,setSent]=useState(false);
  const [err,setErr]=useState("");
  const goals=[{v:"salud",l:"💚 Mejorar mi salud"},{v:"energia",l:"⚡ Más energía"},{v:"peso",l:"⚖️ Control de peso"},{v:"negocio",l:"💼 Negocio global"}];
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=()=>{
    if(!form.name||!form.country||!form.goal){setErr("Por favor completa todos los campos.");return;}
    setErr("");
    const gl=goals.find(g=>g.v===form.goal)?.l||form.goal;
    const msg=encodeURIComponent(`¡Hola! Soy ${form.name} de ${form.country} 🌍\nMe interesa: ${gl}\n${form.email?`Email: ${form.email}\n`:""}Quiero mi plan personalizado con Power Vita 🌿`);
    trackEvent('Lead',{content_name:gl,country:form.country});
    window.open(`https://wa.me/${WA}?text=${msg}`,"_blank");
    setSent(true);
  };
  const inp={width:"100%",background:"rgba(27,94,59,0.04)",border:"1.5px solid rgba(27,94,59,0.2)",borderRadius:11,padding:"11px 13px",fontSize:13,outline:"none",color:"#1a1a1a",boxSizing:"border-box"};
  const lbl={fontSize:10,fontWeight:700,color:"#1B5E3B",letterSpacing:.8,display:"block",marginBottom:5};
  if(sent)return(<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:48,marginBottom:8}}>🎉</div><h3 style={{fontSize:17,fontWeight:900,color:"#1B5E3B",marginBottom:6}}>¡Listo! Te esperamos en WhatsApp</h3><p style={{color:"#4a7c5e",fontSize:12,marginBottom:16}}>Tu mensaje fue preparado. Completa el envío y recibirás tu plan.</p><button onClick={()=>{setSent(false);setForm({name:"",email:"",country:"",goal:""}); }} style={{background:"none",border:"1.5px solid rgba(27,94,59,0.3)",color:"#1B5E3B",padding:"8px 20px",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700}}>Enviar otro →</button></div>);
  return(<div><div style={{marginBottom:12}}><label style={lbl}>NOMBRE *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Tu nombre" style={inp} onFocus={e=>e.target.style.borderColor="#1B5E3B"} onBlur={e=>e.target.style.borderColor="rgba(27,94,59,0.2)"}/></div><div style={{marginBottom:12}}><label style={lbl}>EMAIL <span style={{color:"#aaa",fontWeight:400}}>(opcional)</span></label><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="tu@email.com" type="email" style={inp} onFocus={e=>e.target.style.borderColor="#1B5E3B"} onBlur={e=>e.target.style.borderColor="rgba(27,94,59,0.2)"}/></div><div style={{marginBottom:12}}><label style={lbl}>PAÍS *</label><select value={form.country} onChange={e=>set("country",e.target.value)} style={{...inp,cursor:"pointer",color:form.country?"#1a1a1a":"#9ca3af"}}><option value="">Selecciona tu país...</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div><div style={{marginBottom:20}}><label style={lbl}>¿QUÉ BUSCAS? *</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{goals.map(g=>(<button key={g.v} onClick={()=>set("goal",g.v)} style={{padding:"10px 7px",borderRadius:10,fontWeight:700,fontSize:11,cursor:"pointer",border:"1.5px solid",transition:"all .2s",borderColor:form.goal===g.v?"#1B5E3B":"rgba(27,94,59,0.18)",background:form.goal===g.v?"#1B5E3B":"rgba(27,94,59,0.04)",color:form.goal===g.v?"#fff":"#1B5E3B"}}>{g.l}</button>))}</div></div>{err&&<p style={{color:"#e53e3e",fontSize:11,marginBottom:10,fontWeight:600}}>⚠️ {err}</p>}<button onClick={submit} style={{width:"100%",background:"linear-gradient(135deg,#1B5E3B,#2d7a50)",color:"#fff",border:"none",borderRadius:12,padding:"14px 0",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 8px 22px rgba(27,94,59,0.28)"}}>💬 Quiero mi plan gratis →</button><p style={{fontSize:9,color:"#9ca3af",textAlign:"center",marginTop:8}}>Sin spam. Solo abrimos WhatsApp con tu info lista.</p></div>);
}

// ── AI CHAT ───────────────────────────────────────────────────────────────────
function Chat({lang,open,onClose}){
  const labels={es:{title:"Vita Advisor IA",ph:"Pregúntame sobre salud o negocio...",welcome:"¡Hola! Soy tu Vita Advisor 🌿 ¿En qué puedo ayudarte? Puedo recomendarte productos FuXion según tus objetivos o contarte sobre el negocio en 37 países."},en:{title:"Vita Advisor AI",ph:"Ask me about health or business...",welcome:"Hi! I'm your Vita Advisor 🌿 How can I help? I can recommend FuXion products based on your goals or tell you about the business in 37 countries."},pt:{title:"Vita Advisor IA",ph:"Pergunte sobre saúde ou negócio...",welcome:"Olá! Sou seu Vita Advisor 🌿 Como posso ajudar? Posso recomendar produtos FuXion com base em seus objetivos ou contar sobre o negócio em 37 países."}};
  const l=labels[lang]||labels.es;
  const [msgs,setMsgs]=useState([{role:"assistant",text:l.welcome}]);
  const [inp,setInp]=useState("");const [loading,setLoading]=useState(false);
  const botRef=useRef();
  useEffect(()=>{botRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async()=>{
    if(!inp.trim()||loading)return;
    const um={role:"user",text:inp};setMsgs(m=>[...m,um]);setInp("");setLoading(true);
    try{
      const sys=`Eres Vita Advisor, asistente IA de Power Vita (distribuidor FuXion Global). Responde en ${lang==="en"?"inglés":lang==="pt"?"portugués":"español"}. Experto en nutrición biotecnológica FuXion y negocio en 37 países. Máx 3 oraciones, amable, usa emojis. Link compra: ${FUXION_LINK}. WhatsApp: +${WA}.`;
      const history=msgs.concat(um).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:sys,messages:history})});
      const data=await res.json();
      setMsgs(m=>[...m,{role:"assistant",text:data.content?.map(b=>b.text||"").join("")||"Intenta de nuevo 🌿"}]);
    }catch{setMsgs(m=>[...m,{role:"assistant",text:"Error. Contáctanos por WhatsApp 💬"}]);}
    finally{setLoading(false);}
  };
  if(!open)return null;
  return(<div style={{position:"fixed",bottom:88,right:20,width:300,zIndex:300,background:"rgba(245,240,232,0.97)",backdropFilter:"blur(20px)",border:"1.5px solid rgba(27,94,59,0.25)",borderRadius:20,boxShadow:"0 24px 60px rgba(27,94,59,0.22)",overflow:"hidden"}}><div style={{background:"#1B5E3B",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:"rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🌿</div><div><div style={{color:"#fff",fontWeight:800,fontSize:12}}>{l.title}</div><div style={{color:"rgba(255,255,255,0.55)",fontSize:9}}>● Online</div></div></div><button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",fontSize:16,cursor:"pointer"}}>✕</button></div><div style={{height:250,overflowY:"auto",padding:"11px 11px 5px",display:"flex",flexDirection:"column",gap:8}}>{msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"83%",background:m.role==="user"?"#1B5E3B":"rgba(27,94,59,0.09)",color:m.role==="user"?"#fff":"#1a1a1a",borderRadius:11,padding:"7px 10px",fontSize:12,lineHeight:1.5}}>{m.text}</div></div>))}{loading&&<div style={{display:"flex"}}><div style={{background:"rgba(27,94,59,0.09)",borderRadius:11,padding:"7px 12px",color:"#1B5E3B",fontSize:16}}>···</div></div>}<div ref={botRef}/></div><div style={{padding:"7px 10px 10px",borderTop:"1px solid rgba(27,94,59,0.1)",display:"flex",gap:6}}><input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={l.ph} style={{flex:1,background:"rgba(27,94,59,0.06)",border:"1px solid rgba(27,94,59,0.2)",borderRadius:8,padding:"8px 10px",fontSize:11,outline:"none",color:"#1a1a1a"}}/><button onClick={send} disabled={loading} style={{background:"#1B5E3B",border:"none",borderRadius:8,width:32,color:"#fff",fontSize:14,cursor:"pointer"}}>→</button></div></div>);
}

// ── NUTRI PLAN IA ─────────────────────────────────────────────────────────────
function NutriPlan({lang}){
  const [selGoal,setSelGoal]=useState("");const [selDiet,setSelDiet]=useState("");const [selSymptoms,setSelSymptoms]=useState([]);
  const [form,setForm]=useState({age:"",weight:""});
  const [plan,setPlan]=useState(null);const [loading,setLoading]=useState(false);
  const goals=["💪 Más energía","🌿 Detox y digestión","⚖️ Bajar de peso","🛡️ Reforzar inmunidad","😴 Dormir mejor","✨ Mejorar piel"];
  const diets=["🥩 Omnívoro","🐟 Pescetariano","🥚 Vegetariano","🌱 Vegano","🌾 Sin gluten"];
  const symptoms=["Fatiga crónica","Hinchazón","Insomnio","Estrés","Digestión lenta","Piel opaca","Inmunidad baja","Ansiedad"];
  const generate=async()=>{
    setLoading(true);
    try{
      const prompt=`Eres nutricionista experto en FuXion. Crea plan nutricional personalizado de 7 días en ${lang==="en"?"inglés":lang==="pt"?"portugués":"español"}.
Objetivo: ${selGoal}, Dieta: ${selDiet}, Síntomas: ${selSymptoms.join(",")||"ninguno"}, Edad: ${form.age||"N/A"}, Peso: ${form.weight||"N/A"}kg
Responde SOLO JSON:
{"titulo":"nombre plan","perfil":"descripción 1 oración","productos":[{"nombre":"producto FuXion","beneficio":"por qué","cuando":"horario"}],"dias":[{"dia":"Lunes","desayuno":"","almuerzo":"","cena":"","snack":""}],"tips":["tip1","tip2","tip3"]}
Usa solo: REXET, LIQUID FIBER, FLORA LIV, NUTRADAY, VITA XTRA T+, XPEED, BIOPRO+ TECT, PROTEIN ACTIVE, NO STRESS, THERMO T3, BALANCE. Exactamente 3 productos y 7 días.`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const txt=data.content?.map(b=>b.text||"").join("")||"";
      setPlan(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    }catch{setPlan({error:true});}
    finally{setLoading(false);}
  };
  if(plan){
    if(plan.error)return(<div style={{textAlign:"center",padding:20}}><p style={{color:"#e53e3e",fontSize:13}}>Error. Intenta de nuevo.</p><button onClick={()=>setPlan(null)} style={{marginTop:10,background:"#1B5E3B",color:"#fff",border:"none",padding:"9px 18px",borderRadius:9,cursor:"pointer",fontWeight:700}}>Reintentar</button></div>);
    return(<div style={{padding:"18px 20px"}}><div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:32}}>🥗</div><h3 style={{fontSize:15,fontWeight:900,color:"#1B5E3B",margin:"6px 0 3px"}}>{plan.titulo}</h3><p style={{fontSize:11,color:"#4a7c5e",fontStyle:"italic"}}>{plan.perfil}</p></div><div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:800,color:"#1B5E3B",letterSpacing:1.5,marginBottom:6}}>✦ PRODUCTOS RECOMENDADOS</div>{plan.productos?.map((p,i)=>(<div key={i} style={{background:"rgba(27,94,59,0.06)",borderRadius:9,padding:"8px 10px",marginBottom:5,display:"flex",gap:8}}><span style={{fontSize:16}}>🌿</span><div><div style={{fontWeight:800,color:"#1B5E3B",fontSize:11}}>{p.nombre}</div><div style={{fontSize:10,color:"#4a7c5e"}}>{p.beneficio}</div><div style={{fontSize:9,color:"#C9A84C",fontWeight:600}}>⏰ {p.cuando}</div></div></div>))}</div><div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:800,color:"#1B5E3B",letterSpacing:1.5,marginBottom:6}}>📅 PLAN 7 DÍAS</div><div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>{plan.dias?.map((d,i)=>(<div key={i} style={{minWidth:120,background:"rgba(255,255,255,0.9)",border:"1px solid rgba(27,94,59,0.12)",borderRadius:9,padding:"8px",flexShrink:0}}><div style={{fontWeight:800,color:"#1B5E3B",fontSize:9,textAlign:"center",background:"rgba(27,94,59,0.08)",borderRadius:5,padding:"2px 0",marginBottom:5}}>{d.dia}</div>{[{k:"desayuno",i:"🌅"},{k:"almuerzo",i:"☀️"},{k:"cena",i:"🌙"},{k:"snack",i:"🍎"}].map(({k,i:ic})=>(<div key={k} style={{fontSize:8,color:"#4a5568",marginBottom:3}}><span>{ic}</span> {d[k]}</div>))}</div>))}</div></div>{plan.tips&&<div style={{marginBottom:14}}>{plan.tips.map((tip,i)=><div key={i} style={{fontSize:10,color:"#2d5a3d",padding:"3px 0",display:"flex",gap:6}}><span style={{color:"#C9A84C"}}>✓</span>{tip}</div>)}</div>}<div style={{display:"flex",gap:7}}><a href={`https://wa.me/${WA}?text=${encodeURIComponent("¡Hola! Generé mi plan nutricional con Power Vita IA 🌿 Quiero empezar.")}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"10px 0",fontWeight:800,fontSize:11,textAlign:"center",textDecoration:"none"}}>💬 Empezar mi plan</a><button onClick={()=>{setPlan(null);setSelGoal("");setSelDiet("");setSelSymptoms([]);}} style={{flex:1,background:"rgba(27,94,59,0.08)",border:"1px solid rgba(27,94,59,0.2)",color:"#1B5E3B",borderRadius:9,padding:"10px 0",fontWeight:700,fontSize:11,cursor:"pointer"}}>🔄 Nuevo plan</button></div></div>);
  }
  return(<div style={{padding:"18px 20px"}}><div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:36}}>🥗</div><h3 style={{fontSize:15,fontWeight:900,color:"#1B5E3B",margin:"5px 0 3px"}}>Plan Nutricional IA</h3><p style={{fontSize:11,color:"#4a7c5e"}}>Personalizado · 7 días · Productos FuXion</p></div><div style={{marginBottom:11}}><div style={{fontSize:9,fontWeight:700,color:"#1B5E3B",letterSpacing:1,marginBottom:7}}>OBJETIVO</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>{goals.map(g=><button key={g} onClick={()=>setSelGoal(g)} style={{padding:"8px 5px",borderRadius:8,fontWeight:600,fontSize:10,cursor:"pointer",border:"1.5px solid",borderColor:selGoal===g?"#1B5E3B":"rgba(27,94,59,0.18)",background:selGoal===g?"#1B5E3B":"rgba(27,94,59,0.04)",color:selGoal===g?"#fff":"#1B5E3B",transition:"all .2s"}}>{g}</button>)}</div></div><div style={{marginBottom:11}}><div style={{fontSize:9,fontWeight:700,color:"#1B5E3B",letterSpacing:1,marginBottom:7}}>SÍNTOMAS</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{symptoms.map(s=>{const sel=selSymptoms.includes(s);return(<button key={s} onClick={()=>setSelSymptoms(p=>sel?p.filter(x=>x!==s):[...p,s])} style={{padding:"4px 8px",borderRadius:999,fontWeight:600,fontSize:9,cursor:"pointer",border:"1.5px solid",borderColor:sel?"#C9A84C":"rgba(27,94,59,0.18)",background:sel?"rgba(201,168,76,0.15)":"transparent",color:sel?"#8B6914":"#1B5E3B",transition:"all .2s"}}>{s}</button>);})}</div></div><div style={{marginBottom:11}}><div style={{fontSize:9,fontWeight:700,color:"#1B5E3B",letterSpacing:1,marginBottom:7}}>DIETA</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{diets.map(d=><button key={d} onClick={()=>setSelDiet(d)} style={{padding:"6px 10px",borderRadius:999,fontWeight:600,fontSize:10,cursor:"pointer",border:"1.5px solid",borderColor:selDiet===d?"#1B5E3B":"rgba(27,94,59,0.18)",background:selDiet===d?"#1B5E3B":"transparent",color:selDiet===d?"#fff":"#1B5E3B",transition:"all .2s"}}>{d}</button>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:16}}><div><div style={{fontSize:9,fontWeight:700,color:"#1B5E3B",marginBottom:4}}>EDAD (opcional)</div><input value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} placeholder="32" style={{width:"100%",background:"rgba(27,94,59,0.04)",border:"1.5px solid rgba(27,94,59,0.18)",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",boxSizing:"border-box"}}/></div><div><div style={{fontSize:9,fontWeight:700,color:"#1B5E3B",marginBottom:4}}>PESO kg (opcional)</div><input value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} placeholder="70" style={{width:"100%",background:"rgba(27,94,59,0.04)",border:"1.5px solid rgba(27,94,59,0.18)",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",boxSizing:"border-box"}}/></div></div><button onClick={generate} disabled={!selGoal||!selDiet||loading} style={{width:"100%",background:(!selGoal||!selDiet)?"rgba(27,94,59,0.3)":"linear-gradient(135deg,#1B5E3B,#2d7a50)",color:"#fff",border:"none",borderRadius:11,padding:"13px 0",fontWeight:800,fontSize:13,cursor:(!selGoal||!selDiet)?"not-allowed":"pointer"}}>{loading?"🧠 Generando tu plan...":"✨ Generar mi plan con IA →"}</button>{(!selGoal||!selDiet)&&<p style={{fontSize:9,color:"#9ca3af",textAlign:"center",marginTop:5}}>Selecciona objetivo y dieta para continuar</p>}</div>);
}

// ── SYMPTOM ANALYZER ─────────────────────────────────────────────────────────
function SymptomAnalyzer({lang}){
  const [text,setText]=useState("");const [result,setResult]=useState(null);const [loading,setLoading]=useState(false);
  const examples=["Me siento cansado todo el día aunque duermo bien","Tengo el estómago hinchado después de comer","Me cuesta concentrarme y tengo mucho estrés","Quiero bajar de peso pero no sé por dónde empezar"];
  const analyze=async()=>{
    if(!text.trim())return;setLoading(true);
    try{
      const prompt=`Experto en nutrición FuXion. Analiza síntomas y responde SOLO JSON en ${lang==="en"?"inglés":lang==="pt"?"portugués":"español"}:
Síntomas: "${text}"
{"diagnostico":"análisis 2 oraciones","nivel_urgencia":"bajo|medio|alto","causa_probable":"causa 1 oración","productos":[{"nombre":"producto FuXion","match":90,"razon":"por qué ayuda"}],"habitos":["hábito1","hábito2","hábito3"],"mensaje_motivador":"mensaje empático corto"}
Usa solo productos FuXion reales. 2-3 productos.`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const txt=data.content?.map(b=>b.text||"").join("")||"";
      setResult(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    }catch{setResult({error:true});}
    finally{setLoading(false);}
  };
  const urgC={"bajo":"#25D366","medio":"#C9A84C","alto":"#e53e3e"};
  const urgL={"bajo":"✅ Nivel Bajo","medio":"⚠️ Nivel Medio","alto":"🔴 Nivel Alto"};
  if(result&&!result.error)return(<div style={{padding:"18px 20px"}}><div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:32}}>🔬</div><h3 style={{fontSize:14,fontWeight:900,color:"#1B5E3B",margin:"5px 0 6px"}}>Análisis completado</h3><div style={{display:"inline-flex",alignItems:"center",gap:5,background:`${urgC[result.nivel_urgencia]}18`,border:`1px solid ${urgC[result.nivel_urgencia]}`,borderRadius:999,padding:"3px 10px"}}><span style={{fontSize:10,fontWeight:700,color:urgC[result.nivel_urgencia]}}>{urgL[result.nivel_urgencia]}</span></div></div><div style={{background:"rgba(27,94,59,0.06)",borderRadius:10,padding:"10px 12px",marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:"#1B5E3B",marginBottom:3}}>🧠 DIAGNÓSTICO</div><p style={{fontSize:11,color:"#2d5a3d",lineHeight:1.6}}>{result.diagnostico}</p><p style={{fontSize:10,color:"#4a7c5e",marginTop:4,fontStyle:"italic"}}>📍 {result.causa_probable}</p></div><div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:"#1B5E3B",letterSpacing:1,marginBottom:6}}>🌿 PRODUCTOS COMPATIBLES</div>{result.productos?.map((p,i)=>(<div key={i} style={{background:"rgba(255,255,255,0.9)",border:"1px solid rgba(27,94,59,0.12)",borderRadius:9,padding:"8px 10px",marginBottom:5}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontWeight:800,color:"#1B5E3B",fontSize:11}}>{p.nombre}</span><span style={{background:"#1B5E3B",color:"#fff",borderRadius:999,padding:"1px 7px",fontSize:9,fontWeight:700}}>{p.match}% match</span></div><div style={{height:3,background:"rgba(27,94,59,0.12)",borderRadius:2,marginBottom:4}}><div style={{height:"100%",width:`${p.match}%`,background:"linear-gradient(90deg,#1B5E3B,#C9A84C)",borderRadius:2}}/></div><p style={{fontSize:10,color:"#4a7c5e"}}>{p.razon}</p></div>))}</div><div style={{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.22)",borderRadius:9,padding:"9px 11px",marginBottom:12}}><p style={{fontSize:11,color:"#8B6914",fontStyle:"italic"}}>{result.mensaje_motivador}</p></div><div style={{display:"flex",gap:7}}><a href={`https://wa.me/${WA}?text=${encodeURIComponent("¡Hola! Analicé mis síntomas con Power Vita IA y quiero empezar 🌿")}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontWeight:800,fontSize:11,textAlign:"center",textDecoration:"none"}}>💬 Quiero empezar</a><button onClick={()=>{setResult(null);setText("");}} style={{flex:1,background:"rgba(27,94,59,0.08)",border:"1px solid rgba(27,94,59,0.2)",color:"#1B5E3B",borderRadius:9,padding:"9px 0",fontWeight:700,fontSize:11,cursor:"pointer"}}>🔄 Nuevo análisis</button></div></div>);
  return(<div style={{padding:"18px 20px"}}><div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:36}}>🔬</div><h3 style={{fontSize:15,fontWeight:900,color:"#1B5E3B",margin:"5px 0 3px"}}>Analizador de Síntomas IA</h3><p style={{fontSize:11,color:"#4a7c5e"}}>Describe cómo te sientes y la IA recomienda tus productos FuXion ideales</p></div><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Ej: Me siento cansado todo el día, tengo el estómago hinchado y me cuesta dormir..." rows={3} style={{width:"100%",background:"rgba(27,94,59,0.04)",border:"1.5px solid rgba(27,94,59,0.2)",borderRadius:11,padding:"11px 13px",fontSize:12,outline:"none",resize:"vertical",color:"#1a1a1a",boxSizing:"border-box",marginBottom:9,fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor="#1B5E3B"} onBlur={e=>e.target.style.borderColor="rgba(27,94,59,0.2)"}/>  <div style={{marginBottom:12}}><div style={{fontSize:9,color:"#4a7c5e",marginBottom:5,fontWeight:600}}>💡 EJEMPLOS:</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{examples.map((e,i)=><button key={i} onClick={()=>setText(e)} style={{fontSize:9,color:"#1B5E3B",background:"rgba(27,94,59,0.06)",border:"1px solid rgba(27,94,59,0.15)",borderRadius:7,padding:"4px 8px",cursor:"pointer",textAlign:"left"}}>{e}</button>)}</div></div><button onClick={analyze} disabled={!text.trim()||loading} style={{width:"100%",background:!text.trim()?"rgba(27,94,59,0.3)":"linear-gradient(135deg,#1B5E3B,#2d7a50)",color:"#fff",border:"none",borderRadius:11,padding:"13px 0",fontWeight:800,fontSize:13,cursor:!text.trim()?"not-allowed":"pointer"}}>{loading?"🧠 Analizando tus síntomas...":"🔬 Analizar con IA →"}</button></div>);
}

// ── ROI PREDICTOR ─────────────────────────────────────────────────────────────
function ROIPredictor({lang}){
  const [form,setForm]=useState({country:"",hours:"",contacts:"",experience:""});
  const [result,setResult]=useState(null);const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const hours=["⏰ 5-10 hrs/sem","⏰ 10-20 hrs/sem","⏰ 20-30 hrs/sem","⏰ +30 hrs/sem"];
  const contacts=["👥 0-50","👥 50-200","👥 200-500","👥 +500"];
  const experience=["🌱 Sin experiencia","📊 Algo de exp.","💼 Con experiencia","🏆 Muy exp."];
  const predict=async()=>{
    if(!form.country||!form.hours||!form.contacts||!form.experience)return;
    setLoading(true);
    try{
      const prompt=`Experto en negocios FuXion. Proyección realista en ${lang==="en"?"inglés":lang==="pt"?"portugués":"español"}.
País: ${form.country}, Horas: ${form.hours}, Contactos: ${form.contacts}, Experiencia: ${form.experience}
Responde SOLO JSON:
{"mes1":{"min":100,"max":400,"descripcion":"qué lograr"},"mes3":{"min":400,"max":1500,"descripcion":"qué lograr"},"mes6":{"min":1000,"max":4000,"descripcion":"qué lograr"},"mes12":{"min":3000,"max":12000,"descripcion":"qué lograr"},"estrategia":["acción1","acción2","acción3"],"ventaja_pais":"ventaja de ${form.country}","perfil":"perfil 1 oración","potencial":"bajo|medio|alto|muy_alto"}
Números en USD. Sé realista y motivador.`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const txt=data.content?.map(b=>b.text||"").join("")||"";
      setResult(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    }catch{setResult({error:true});}
    finally{setLoading(false);}
  };
  const potL={"bajo":"🌱 Potencial Bueno","medio":"🚀 Potencial Alto","alto":"💎 Potencial Muy Alto","muy_alto":"👑 Potencial Excepcional"};
  if(result&&!result.error)return(<div style={{padding:"18px 20px"}}><div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:32}}>💰</div><h3 style={{fontSize:13,fontWeight:900,color:"#fff",margin:"5px 0 6px"}}>{result.perfil}</h3><div style={{display:"inline-flex",alignItems:"center",background:"rgba(201,168,76,0.2)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:999,padding:"3px 12px"}}><span style={{fontSize:10,fontWeight:800,color:"#C9A84C"}}>{potL[result.potencial]||"🚀 Alto Potencial"}</span></div></div><div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.6)",letterSpacing:1,marginBottom:8}}>📈 PROYECCIÓN USD</div>{[{k:"mes1",l:"1 mes"},{k:"mes3",l:"3 meses"},{k:"mes6",l:"6 meses"},{k:"mes12",l:"12 meses"}].map(({k,l})=>{const d=result[k];if(!d)return null;return(<div key={k} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.6)"}}>{l}</span><span style={{fontSize:10,fontWeight:900,color:"#C9A84C"}}>${d.min?.toLocaleString()} – ${d.max?.toLocaleString()}</span></div><div style={{height:5,background:"rgba(255,255,255,0.1)",borderRadius:2}}><div style={{height:"100%",width:`${Math.min((d.max/12000)*100,100)}%`,background:"linear-gradient(90deg,#C9A84C,#FFD700)",borderRadius:2}}/></div><p style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:2,fontStyle:"italic"}}>{d.descripcion}</p></div>);})}</div><div style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.22)",borderRadius:9,padding:"9px 10px",marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:"#C9A84C",marginBottom:3}}>🌍 VENTAJA EN {form.country.toUpperCase()}</div><p style={{fontSize:10,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{result.ventaja_pais}</p></div><div style={{marginBottom:12}}>{result.estrategia?.map((s,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:5,alignItems:"flex-start"}}><div style={{width:18,height:18,borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#FFD700)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,flexShrink:0}}>{i+1}</div><span style={{fontSize:10,color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{s}</span></div>)}</div><div style={{display:"flex",gap:7}}><a href={`https://wa.me/${WA}?text=${encodeURIComponent(`¡Hola! Calculé mi potencial de negocio desde ${form.country} con Power Vita IA 💰 Quiero ser socio FuXion.`)}`} target="_blank" rel="noreferrer" style={{flex:1,background:"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",borderRadius:9,padding:"10px 0",fontWeight:800,fontSize:11,textAlign:"center",textDecoration:"none"}}>👑 Quiero ser socio</a><button onClick={()=>{setResult(null);setForm({country:"",hours:"",contacts:"",experience:""}); }} style={{flex:1,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.8)",borderRadius:9,padding:"10px 0",fontWeight:700,fontSize:11,cursor:"pointer"}}>🔄 Recalcular</button></div></div>);
  return(<div style={{padding:"18px 20px"}}><div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:36}}>💰</div><h3 style={{fontSize:15,fontWeight:900,color:"#fff",margin:"5px 0 3px"}}>ROI Predictor IA</h3><p style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>Proyección de ingresos personalizada con IA real</p></div><div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.6)",letterSpacing:1,marginBottom:5}}>PAÍS</div><select value={form.country} onChange={e=>set("country",e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:9,padding:"9px 11px",color:form.country?"#fff":"rgba(255,255,255,0.4)",fontSize:12,outline:"none",cursor:"pointer",boxSizing:"border-box"}}><option value="">Selecciona tu país...</option>{COUNTRIES.map(c=><option key={c} value={c} style={{color:"#1a1a1a"}}>{c}</option>)}</select></div>{[{label:"HORAS / SEMANA",opts:hours,key:"hours"},{label:"RED DE CONTACTOS",opts:contacts,key:"contacts"},{label:"EXPERIENCIA EN VENTAS",opts:experience,key:"experience"}].map(({label,opts,key})=>(<div key={key} style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.6)",letterSpacing:1,marginBottom:5}}>{label}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{opts.map(o=><button key={o} onClick={()=>set(key,o)} style={{padding:"7px 5px",borderRadius:8,fontWeight:600,fontSize:10,cursor:"pointer",border:"1.5px solid",borderColor:form[key]===o?"#C9A84C":"rgba(255,255,255,0.15)",background:form[key]===o?"rgba(201,168,76,0.2)":"rgba(255,255,255,0.06)",color:form[key]===o?"#C9A84C":"rgba(255,255,255,0.65)",transition:"all .2s"}}>{o}</button>)}</div></div>))}<button onClick={predict} disabled={!form.country||!form.hours||!form.contacts||!form.experience||loading} style={{width:"100%",background:(!form.country||!form.hours||!form.contacts||!form.experience)?"rgba(201,168,76,0.3)":"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",border:"none",borderRadius:11,padding:"13px 0",fontWeight:800,fontSize:13,cursor:"pointer",marginTop:4}}>{loading?"🧠 Calculando tu potencial...":"💰 Calcular mi potencial →"}</button></div>);
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App(){
  const [lang,setLang]=useState(detectLang);
  const [selCountry]=useState(detectCountry);
  const [recipeFilter,setRecipeFilter]=useState(0);
  const [activeRecipe,setActiveRecipe]=useState(null);
  const [prodLine,setProdLine]=useState(0);
  const [tTab,setTTab]=useState("product");
  const [bizIdx,setBizIdx]=useState(0);
  const [chatOpen,setChatOpen]=useState(false);

  const waLink=`https://wa.me/${WA}?text=${encodeURIComponent(`Hola! Te contacto desde ${selCountry} para más info sobre Power Vita 🌿`)}`;
  const certDouble=[...CERTS,...CERTS];
  const testDouble=[...PROD_TESTIMONIALS,...PROD_TESTIMONIALS];
  const sectionIds=["inicio","productos","catalogo","recetario","negocio","testimonios","contacto"];
  const navLabels={es:["Inicio","Productos","Catálogo","Recetario","IA Tools","Testimonios","Contacto"],en:["Home","Products","Catalog","Kitchen","AI Tools","Testimonials","Contact"],pt:["Início","Produtos","Catálogo","Receitas","IA Tools","Depoimentos","Contato"]};
  const nav=navLabels[lang]||navLabels.es;
  const scrollTo=(id)=>{document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});};
  const lineKeys=["","Detox","Energy","Protein","Immunity","Sport","Control"];
  const lineLabels={es:["Todos","Detox","Energy","Protein","Immunity","Sport","Control"],en:["All","Detox","Energy","Protein","Immunity","Sport","Control"],pt:["Todos","Detox","Energia","Proteína","Imunidade","Sport","Controle"]};
  const lineColors={Detox:"#2E7D32",Energy:"#C9A84C",Protein:"#7B1FA2",Immunity:"#1565C0",Sport:"#E65100",Control:"#00695C"};
  const filtProds=prodLine===0?PRODUCTS:PRODUCTS.filter(p=>p.line===lineKeys[prodLine]);
  const catKeys=["","Detox","Energy","Immunity","Protein","Beauty"];
  const recipeLabels={es:["Todos","Detox","Energy","Immunity","Protein","Beauty"],en:["All","Detox","Energy","Immunity","Protein","Beauty"],pt:["Todos","Detox","Energia","Imunidade","Proteína","Beleza"]};
  const filtRecipes=recipeFilter===0?RECIPES:RECIPES.filter(r=>r.cat===catKeys[recipeFilter]);
  const verifiedLabel={es:"Usuario Verificado",en:"Verified User",pt:"Usuário Verificado"};

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#F5F0E8",color:"#1a1a1a",overflowX:"hidden"}}>
      <TrackingPixels/>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(245,240,232,0.92)",backdropFilter:"blur(18px)",borderBottom:"1px solid rgba(27,94,59,0.12)",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
        <div style={{cursor:"pointer",fontWeight:900,fontSize:17,color:"#1B5E3B",letterSpacing:3,fontFamily:"Georgia,serif"}} onClick={()=>scrollTo("inicio")}>POWER VITA</div>
        <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          {nav.map((n,i)=>(<button key={i} onClick={()=>scrollTo(sectionIds[i])} style={{background:"none",border:"none",color:"#1B5E3B",fontSize:11,fontWeight:700,letterSpacing:.5,cursor:"pointer",opacity:.8}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=.8}>{n}</button>))}
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:"transparent",border:"1px solid #1B5E3B",borderRadius:8,color:"#1B5E3B",padding:"3px 7px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            <option value="es">🇺🇾 ES</option><option value="en">🇺🇸 EN</option><option value="pt">🇧🇷 PT</option>
          </select>
        </div>
      </nav>

      {/* HERO */}
      <section id="inicio" style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"100px 24px 60px",background:"linear-gradient(160deg,#F5F0E8 0%,#E8F0E9 55%,#F5F0E8 100%)",position:"relative",overflow:"hidden"}}>
        <Particles/>
        <div style={{textAlign:"center",maxWidth:700,marginBottom:48,position:"relative",zIndex:1}}>
          <div style={{fontWeight:900,fontSize:"clamp(2.5rem,6vw,4.5rem)",color:"#1B5E3B",letterSpacing:6,fontFamily:"Georgia,serif",marginBottom:16}}>POWER VITA</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(27,94,59,0.08)",border:"1px solid rgba(27,94,59,0.2)",borderRadius:999,padding:"5px 16px",marginBottom:16}}>
            <span style={{fontSize:10,fontWeight:700,color:"#1B5E3B",letterSpacing:2,textTransform:"uppercase"}}>FuXion Global · 37 Países</span>
          </div>
          <h1 style={{fontSize:"clamp(1.6rem,4vw,3rem)",fontWeight:900,lineHeight:1.12,color:"#1B5E3B",marginBottom:14,letterSpacing:-1}}>Nutrición Biotecnológica de Vanguardia</h1>
          <p style={{fontSize:"clamp(.9rem,2vw,1.1rem)",color:"#4a7c5e",lineHeight:1.65,marginBottom:28}}>Transforma tu bienestar y construye un legado global con Power Vita.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <a href={waLink} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",padding:"13px 26px",borderRadius:13,fontWeight:700,textDecoration:"none",fontSize:14}}>💬 WhatsApp</a>
            <a href="https://instagram.com/powervita_uy" target="_blank" rel="noreferrer" style={{background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",color:"#fff",padding:"13px 26px",borderRadius:13,fontWeight:700,textDecoration:"none",fontSize:14}}>📸 @powervita_uy</a>
          </div>
        </div>
        {/* Dual cards */}
        <div id="productos" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(265px,1fr))",gap:20,width:"100%",maxWidth:820,position:"relative",zIndex:1}}>
          {[
            {href:FUXION_LINK,icon:"🌿",tag:"HEALTH & WELLNESS",title:"The Clean Label Revolution",body:"Accede a nutrición biotecnológica pura en 37 países.",cta:"Shop Products",bg:"rgba(255,255,255,0.78)",border:"rgba(27,94,59,0.22)",btn:"#1B5E3B",tagC:"#1B5E3B",titleC:"#1B5E3B",bodyC:"#4a7c5e"},
            {href:FUXION_LINK,icon:"👑",tag:"GLOBAL BUSINESS",title:"Build a Global Legacy",body:"Escala tu negocio a 37 países con logística llave en mano.",cta:"Become a Partner",bg:"linear-gradient(135deg,rgba(201,168,76,0.16),rgba(255,255,255,0.88))",border:"rgba(201,168,76,0.46)",btn:"linear-gradient(135deg,#C9A84C,#E8C86A)",tagC:"#C9A84C",titleC:"#8B6914",bodyC:"#7a6020"},
          ].map((card,i)=>(
            <a key={i} href={card.href} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div style={{background:card.bg,backdropFilter:"blur(20px)",border:`1.5px solid ${card.border}`,borderRadius:22,padding:"30px 26px",cursor:"pointer",transition:"transform .25s,box-shadow .25s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow="0 20px 50px rgba(27,94,59,0.2)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{fontSize:30,marginBottom:9}}>{card.icon}</div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:card.tagC,textTransform:"uppercase",marginBottom:6}}>{card.tag}</div>
                <h2 style={{fontSize:19,fontWeight:900,color:card.titleC,marginBottom:7}}>{card.title}</h2>
                <p style={{color:card.bodyC,fontSize:12,lineHeight:1.6,marginBottom:18}}>{card.body}</p>
                <div style={{background:card.btn,color:"#fff",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:12,textAlign:"center"}}>{card.cta} →</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* CERTS */}
      <div style={{background:"#1B5E3B",padding:"13px 0",overflow:"hidden"}}>
        <div style={{display:"flex",gap:40,animation:"marquee 24s linear infinite",width:"max-content"}}>
          {certDouble.map((c,i)=><span key={i} style={{color:"#C9A84C",fontWeight:700,fontSize:11,letterSpacing:1.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>✦ {c}</span>)}
        </div>
      </div>



      {/* CATÁLOGO */}
      <section id="catalogo" style={{padding:"68px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <h2 style={{fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,color:"#1B5E3B",marginBottom:6}}>🧬 Catálogo FuXion</h2>
          <p style={{color:"#4a7c5e",fontSize:13}}>Nutrición biotecnológica certificada · Sin químicos · Etiqueta limpia</p>
        </div>
        <div style={{display:"flex",gap:7,justifyContent:"center",marginBottom:26,flexWrap:"wrap"}}>
          {(lineLabels[lang]||lineLabels.es).map((l,i)=>{const lc=["#1B5E3B","#2E7D32","#C9A84C","#7B1FA2","#1565C0","#E65100","#00695C"][i];return(<button key={i} onClick={()=>setProdLine(i)} style={{padding:"7px 14px",borderRadius:999,fontWeight:700,fontSize:10,cursor:"pointer",border:"2px solid",borderColor:prodLine===i?lc:"rgba(27,94,59,0.18)",background:prodLine===i?lc:"transparent",color:prodLine===i?"#fff":lc,transition:"all .2s"}}>{l}</button>);})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
          {filtProds.map(p=>{const lc=lineColors[p.line]||"#1B5E3B";return(
            <div key={p.id} style={{background:"rgba(255,255,255,0.86)",backdropFilter:"blur(14px)",border:"1px solid rgba(27,94,59,0.11)",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",transition:"transform .25s,box-shadow .25s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 32px ${lc}25`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{background:`linear-gradient(135deg,${lc}14,${lc}06)`,padding:"18px 16px 12px",borderBottom:`2px solid ${lc}16`}}>
                <div style={{fontSize:36,marginBottom:6}}>{p.emoji}</div>
                <div style={{fontSize:8,fontWeight:800,letterSpacing:2,color:lc,textTransform:"uppercase",marginBottom:3}}>{p.line}</div>
                <h3 style={{fontSize:14,fontWeight:900,color:"#1B5E3B",marginBottom:2}}>{p.name}</h3>
                <p style={{fontSize:9,color:lc,fontWeight:700}}>{p.tag}</p>
              </div>
              <div style={{padding:"12px 14px 14px",flex:1,display:"flex",flexDirection:"column",gap:8}}>
                <p style={{fontSize:11,color:"#4a5568",lineHeight:1.55}}>{p.desc}</p>
                <div>{p.benefits.map((b,i)=><div key={i} style={{display:"flex",gap:5,marginBottom:2}}><span style={{color:lc,fontSize:9}}>✓</span><span style={{fontSize:10,color:"#4a5568"}}>{b}</span></div>)}</div>
                <div style={{background:"rgba(27,94,59,0.04)",borderRadius:8,padding:"6px 10px"}}><div style={{fontSize:8,fontWeight:700,color:"#1B5E3B",marginBottom:2}}>INGREDIENTES</div><p style={{fontSize:9,color:"#4a7c5e",lineHeight:1.5}}>{p.ing}</p></div>
                <div style={{display:"flex",gap:6,marginTop:"auto"}}>
                  <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hola! Me interesa ${p.name} de FuXion. ¿Precio en mi país? 🌿`)}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#25D366",color:"#fff",borderRadius:8,padding:"7px 0",fontWeight:700,fontSize:9,textAlign:"center",textDecoration:"none"}}>💬 Precio</a>
                  <a href={FUXION_LINK} target="_blank" rel="noreferrer" style={{flex:1,background:lc,color:"#fff",borderRadius:8,padding:"7px 0",fontWeight:700,fontSize:9,textAlign:"center",textDecoration:"none"}}>🛒 Comprar</a>
                </div>
              </div>
            </div>
          );})}
        </div>
      </section>

      {/* RECETARIO */}
      <section id="recetario" style={{padding:"68px 24px",background:"rgba(232,240,233,0.4)",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <h2 style={{fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,color:"#1B5E3B",marginBottom:6}}>🍃 Power Vita Kitchen</h2>
          <p style={{color:"#4a7c5e",fontSize:13}}>Recetas exclusivas potenciadas con productos FuXion</p>
        </div>
        <div style={{display:"flex",gap:7,justifyContent:"center",marginBottom:26,flexWrap:"wrap"}}>
          {(recipeLabels[lang]||recipeLabels.es).map((f,i)=><button key={i} onClick={()=>setRecipeFilter(i)} style={{padding:"7px 16px",borderRadius:999,fontWeight:700,fontSize:10,cursor:"pointer",border:"2px solid",borderColor:recipeFilter===i?"#1B5E3B":"rgba(27,94,59,0.18)",background:recipeFilter===i?"#1B5E3B":"transparent",color:recipeFilter===i?"#fff":"#1B5E3B",transition:"all .2s"}}>{f}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {filtRecipes.map(r=>(
            <div key={r.id} style={{background:"rgba(255,255,255,0.82)",backdropFilter:"blur(14px)",border:"1px solid rgba(27,94,59,0.12)",borderRadius:14,overflow:"hidden",transition:"transform .25s,box-shadow .25s",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 10px 30px rgba(201,168,76,0.24)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{background:"linear-gradient(135deg,#E8F0E9,#D0E8D2)",height:90,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>{r.img}</div>
              <div style={{padding:12}}>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3,color:r.cat==="Detox"?"#2E7D32":r.cat==="Energy"?"#C9A84C":r.cat==="Immunity"?"#1565C0":r.cat==="Protein"?"#7B1FA2":"#C2185B"}}>{r.cat}</div>
                <h3 style={{fontSize:12,fontWeight:800,color:"#1B5E3B",marginBottom:4}}>{r.name}</h3>
                <div style={{fontSize:9,color:"#C9A84C",fontWeight:700,marginBottom:5}}>✦ {r.product}</div>
                <ul style={{listStyle:"none",padding:0,margin:"0 0 10px"}}>{r.ingredients.slice(0,4).map((ing,i)=><li key={i} style={{fontSize:9,color:"#4a7c5e",padding:"1px 0",display:"flex",gap:4}}><span style={{color:"#1B5E3B"}}>·</span>{ing}</li>)}{r.ingredients.length>4&&<li style={{fontSize:8,color:"#C9A84C"}}>+{r.ingredients.length-4} más...</li>}</ul>
                <button onClick={()=>setActiveRecipe(r)} style={{width:"100%",background:"#1B5E3B",color:"#fff",border:"none",borderRadius:7,padding:"7px 0",fontWeight:700,fontSize:9,cursor:"pointer"}}>Ver Preparación →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL RECETA */}
      {activeRecipe&&(
        <div onClick={()=>setActiveRecipe(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.58)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#F5F0E8",borderRadius:18,padding:28,maxWidth:400,width:"100%",position:"relative"}}>
            <button onClick={()=>setActiveRecipe(null)} style={{position:"absolute",top:12,right:12,background:"none",border:"none",fontSize:17,cursor:"pointer",color:"#1B5E3B"}}>✕</button>
            <div style={{fontSize:44,textAlign:"center",marginBottom:8}}>{activeRecipe.img}</div>
            <h3 style={{fontSize:16,fontWeight:900,color:"#1B5E3B",textAlign:"center",marginBottom:2}}>{activeRecipe.name}</h3>
            <div style={{textAlign:"center",color:"#C9A84C",fontWeight:700,fontSize:9,marginBottom:12}}>✦ {activeRecipe.product}</div>
            <ul style={{listStyle:"none",padding:0,margin:"0 0 11px"}}>{activeRecipe.ingredients.map((ing,i)=><li key={i} style={{fontSize:11,color:"#4a7c5e",padding:"2px 0",display:"flex",gap:6}}><span style={{color:"#C9A84C"}}>·</span>{ing}</li>)}</ul>
            <div style={{background:"rgba(27,94,59,0.07)",borderRadius:10,padding:"11px 14px",borderLeft:"3px solid #1B5E3B"}}><p style={{fontSize:12,lineHeight:1.65,color:"#2d5a3d",fontStyle:"italic"}}>{activeRecipe.prep}</p></div>
          </div>
        </div>
      )}



      {/* IA TOOLS */}
      <section id="negocio" style={{padding:"68px 24px",background:"linear-gradient(160deg,#0a1628,#0d3d24 50%,#0a1628)"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.1))",border:"1px solid rgba(201,168,76,0.5)",borderRadius:999,padding:"6px 18px",marginBottom:16,boxShadow:"0 0 20px rgba(201,168,76,0.15)"}}>
              <span style={{fontSize:10,fontWeight:800,color:"#FFD700",letterSpacing:2.5,textTransform:"uppercase"}}>✦ Powered by Claude AI ✦</span>
            </div>
            <h2 style={{fontSize:"clamp(1.6rem,4vw,2.6rem)",fontWeight:900,color:"#fff",marginBottom:10,lineHeight:1.15}}>🤖 Inteligencia Artificial<br/><span style={{background:"linear-gradient(135deg,#C9A84C,#FFD700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>exclusiva para ti</span></h2>
            <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,maxWidth:520,margin:"0 auto",lineHeight:1.7}}>3 herramientas con IA real que <strong style={{color:"#FFD700"}}>ningún otro distribuidor FuXion</strong> en el mundo tiene.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
            <div style={{background:"rgba(255,255,255,0.96)",border:"1.5px solid rgba(27,94,59,0.2)",borderRadius:22,overflow:"hidden",boxShadow:"0 12px 40px rgba(27,94,59,0.25)"}}>
              <div style={{background:"linear-gradient(135deg,#1B5E3B,#2d7a50)",padding:"14px 18px",display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🥗</div>
                <div><div style={{color:"#fff",fontWeight:900,fontSize:13}}>Plan Nutricional IA</div><div style={{color:"rgba(255,255,255,0.6)",fontSize:9}}>7 días personalizado con FuXion</div></div>
                <div style={{marginLeft:"auto",background:"rgba(201,168,76,0.3)",border:"1px solid #FFD700",borderRadius:999,padding:"2px 8px",fontSize:8,fontWeight:800,color:"#FFD700"}}>AI</div>
              </div>
              <NutriPlan lang={lang}/>
            </div>
            <div style={{background:"rgba(255,255,255,0.96)",border:"1.5px solid rgba(21,101,192,0.25)",borderRadius:22,overflow:"hidden",boxShadow:"0 12px 40px rgba(21,101,192,0.18)"}}>
              <div style={{background:"linear-gradient(135deg,#1565C0,#1976D2)",padding:"14px 18px",display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔬</div>
                <div><div style={{color:"#fff",fontWeight:900,fontSize:13}}>Analizador de Síntomas IA</div><div style={{color:"rgba(255,255,255,0.6)",fontSize:9}}>Detecta qué productos necesitas</div></div>
                <div style={{marginLeft:"auto",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:999,padding:"2px 8px",fontSize:8,fontWeight:800,color:"#fff"}}>AI</div>
              </div>
              <SymptomAnalyzer lang={lang}/>
            </div>
            <div style={{background:"linear-gradient(160deg,#1a2a1a,#0d3d24)",border:"1.5px solid rgba(201,168,76,0.32)",borderRadius:22,overflow:"hidden",boxShadow:"0 12px 40px rgba(201,168,76,0.12)"}}>
              <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.32),rgba(201,168,76,0.14))",padding:"14px 18px",display:"flex",alignItems:"center",gap:9,borderBottom:"1px solid rgba(201,168,76,0.18)"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(201,168,76,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💰</div>
                <div><div style={{color:"#FFD700",fontWeight:900,fontSize:13}}>ROI Predictor IA</div><div style={{color:"rgba(255,255,255,0.55)",fontSize:9}}>Proyección de ingresos real</div></div>
                <div style={{marginLeft:"auto",background:"rgba(201,168,76,0.3)",border:"1px solid #FFD700",borderRadius:999,padding:"2px 8px",fontSize:8,fontWeight:800,color:"#FFD700"}}>AI</div>
              </div>
              <ROIPredictor lang={lang}/>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="testimonios" style={{padding:"68px 24px",background:"#F5F0E8"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <h2 style={{fontSize:"clamp(1.5rem,3.5vw,2.2rem)",fontWeight:900,color:"#1B5E3B",marginBottom:6}}>🌍 Impacto Global Real</h2>
            <p style={{color:"#4a7c5e",fontSize:13}}>Historias que inspiran de los 37 países</p>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
            {[["product","🌿 Resultados de Salud"],["biz","👑 Libertad de Negocio"]].map(([v,l])=>(
              <button key={v} onClick={()=>setTTab(v)} style={{padding:"8px 20px",borderRadius:999,fontWeight:700,fontSize:11,cursor:"pointer",border:"2px solid",borderColor:tTab===v?"#1B5E3B":"rgba(27,94,59,0.18)",background:tTab===v?"#1B5E3B":"transparent",color:tTab===v?"#fff":"#1B5E3B",transition:"all .2s"}}>{l}</button>
            ))}
          </div>
          {tTab==="product"&&<div style={{overflow:"hidden"}}><div style={{display:"flex",gap:14,animation:"marquee 34s linear infinite",width:"max-content"}}>{testDouble.map((d,i)=><TC key={i} d={d} verified={verifiedLabel[lang]||verifiedLabel.es}/>)}</div></div>}
          {tTab==="biz"&&(
            <div>
              <TC d={BIZ_TESTIMONIALS[bizIdx]} verified={verifiedLabel[lang]||verifiedLabel.es} large/>
              <div style={{display:"flex",justifyContent:"center",gap:11,marginTop:14,alignItems:"center"}}>
                <button onClick={()=>setBizIdx(i=>(i-1+BIZ_TESTIMONIALS.length)%BIZ_TESTIMONIALS.length)} style={{background:"#1B5E3B",color:"#fff",border:"none",width:32,height:32,borderRadius:"50%",fontSize:15,cursor:"pointer"}}>‹</button>
                {BIZ_TESTIMONIALS.map((_,i)=><div key={i} onClick={()=>setBizIdx(i)} style={{width:7,height:7,borderRadius:"50%",cursor:"pointer",background:bizIdx===i?"#1B5E3B":"rgba(27,94,59,0.2)"}}/>)}
                <button onClick={()=>setBizIdx(i=>(i+1)%BIZ_TESTIMONIALS.length)} style={{background:"#1B5E3B",color:"#fff",border:"none",width:32,height:32,borderRadius:"50%",fontSize:15,cursor:"pointer"}}>›</button>
              </div>
            </div>
          )}
          <div style={{textAlign:"center",marginTop:44,background:"linear-gradient(135deg,rgba(27,94,59,0.07),rgba(201,168,76,0.07))",border:"1px solid rgba(27,94,59,0.12)",borderRadius:16,padding:"26px 20px"}}>
            <div style={{fontSize:"clamp(1.8rem,4vw,3rem)",fontWeight:900,color:"#1B5E3B",marginBottom:3}}>+<Counter target={15000}/></div>
            <div style={{fontSize:13,color:"#4a7c5e",fontWeight:600,marginBottom:14}}>Vidas impactadas en 37 países</div>
            <div style={{display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
              {[["37","Países"],["15K+","Socios"],["98%","Satisfacción"]].map(([v,l])=>(
                <div key={l}><div style={{fontSize:18,fontWeight:900,color:"#C9A84C"}}>{v}</div><div style={{fontSize:9,color:"#4a7c5e",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LEAD FORM */}
      <section style={{padding:"68px 24px",background:"linear-gradient(160deg,#E8F0E9,#F5F0E8)"}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{background:"rgba(255,255,255,0.94)",backdropFilter:"blur(20px)",border:"1.5px solid rgba(27,94,59,0.14)",borderRadius:24,padding:"36px 32px",boxShadow:"0 16px 52px rgba(27,94,59,0.1)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:8}}>🎯</div>
            <h2 style={{fontSize:"clamp(1.2rem,2.5vw,1.7rem)",fontWeight:900,color:"#1B5E3B",marginBottom:6}}>Recibe tu Plan Personalizado</h2>
            <p style={{color:"#4a7c5e",fontSize:12,lineHeight:1.7,marginBottom:24}}>Déjanos tus datos y te enviamos por WhatsApp un plan adaptado a tus objetivos — sin costo.</p>
            <LeadForm lang={lang}/>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" style={{background:"#0d3d24",padding:"44px 24px",textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:20,color:"#C9A84C",letterSpacing:4,fontFamily:"Georgia,serif",marginBottom:4}}>POWER VITA</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:10,marginBottom:20}}>Distribuidor FuXion Global Autorizado</div>
        <div style={{display:"flex",gap:11,justifyContent:"center",flexWrap:"wrap",marginBottom:22}}>
          <a href={waLink} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",padding:"10px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>💬 WhatsApp</a>
          <a href="https://instagram.com/powervita_uy" target="_blank" rel="noreferrer" style={{background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",color:"#fff",padding:"10px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>📸 Instagram</a>
          <a href={FUXION_LINK} target="_blank" rel="noreferrer" style={{background:"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",padding:"10px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>🌐 FuXion Store</a>
        </div>
        <div style={{color:"rgba(255,255,255,0.18)",fontSize:9}}>© 2025 Power Vita · @powervita_uy · +598 98 950 206</div>
      </footer>

      <Chat lang={lang} open={chatOpen} onClose={()=>setChatOpen(false)}/>
      <button onClick={()=>setChatOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:250,width:50,height:50,borderRadius:"50%",border:"none",background:chatOpen?"#0d3d24":"linear-gradient(135deg,#1B5E3B,#2d7a50)",color:"#fff",fontSize:20,cursor:"pointer",boxShadow:"0 8px 22px rgba(27,94,59,0.4)",transition:"all .3s"}}>
        {chatOpen?"✕":"🌿"}
      </button>
      <Toast/>

      <style>{`
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#F5F0E8}
        ::-webkit-scrollbar-thumb{background:#1B5E3B;border-radius:3px}
      `}</style>
    </div>
  );
}