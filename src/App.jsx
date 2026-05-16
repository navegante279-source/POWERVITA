import { useState, useEffect, useRef } from "react";

const WA = "59898950206";
const FUXION_LINK = "https://ifuxion.com/andresvarela/enrollment/chooseperson";
const META_PIXEL_ID = "2212676212813152";

const COUNTRIES = ["Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Ecuador","El Salvador","España","Estados Unidos","Guatemala","Honduras","México","Nicaragua","Panamá","Paraguay","Perú","República Dominicana","Uruguay","Venezuela","Alemania","Australia","Bélgica","Canadá","Francia","Italia","Japón","Portugal","Reino Unido","Suiza","Sudáfrica","Emiratos Árabes","Singapur","Nueva Zelanda","Países Bajos","Austria","Israel"];

const COUNTRY_DATA = {
  "Uruguay":        { flag:"🇺🇾", currency:"UYU", shipping:"Envío express 24-48hs",       note:"Precios en pesos uruguayos con IVA incluido",              popular:["REXET","VITA XTRA T+","THERMO T3"] },
  "Argentina":      { flag:"🇦🇷", currency:"ARS", shipping:"Envío en 3-5 días hábiles",   note:"Precios en pesos argentinos. Aceptamos transferencia y MP", popular:["NUTRADAY","NO STRESS","REXET"] },
  "Colombia":       { flag:"🇨🇴", currency:"COP", shipping:"Envío nacional en 2-4 días",  note:"Precios en pesos colombianos con IVA incluido",             popular:["VITA XTRA T+","PROTEIN ACTIVE FIT","FLORA LIV"] },
  "México":         { flag:"🇲🇽", currency:"MXN", shipping:"Envío en 3-5 días hábiles",   note:"Precios en pesos mexicanos. Envío gratis sobre $500 MXN",   popular:["REXET","THERMO T3","NUTRADAY"] },
  "España":         { flag:"🇪🇸", currency:"EUR", shipping:"Envío en 5-7 días hábiles",   note:"Precios en euros. Envío gratis sobre €50",                  popular:["VITA XTRA T+","NO STRESS","YOUTH ELIXIR HGH"] },
  "Brasil":         { flag:"🇧🇷", currency:"BRL", shipping:"Frete em 5-7 dias úteis",     note:"Preços em reais. Frete grátis acima de R$150",              popular:["NUTRADAY","BIOPRO+ TECT","REXET"] },
  "Chile":          { flag:"🇨🇱", currency:"CLP", shipping:"Envío en 2-4 días hábiles",   note:"Precios en pesos chilenos con despacho incluido",           popular:["THERMO T3","VITA XTRA T+","FLORA LIV"] },
  "Perú":           { flag:"🇵🇪", currency:"PEN", shipping:"Envío en 3-5 días hábiles",   note:"Precios en soles. Contra entrega disponible",               popular:["REXET","NUTRADAY","NO STRESS"] },
  "Estados Unidos": { flag:"🇺🇸", currency:"USD", shipping:"Shipping in 5-7 business days",note:"Prices in USD. Free shipping over $75",                    popular:["VITA XTRA T+","PROTEIN ACTIVE FIT","BIOPRO+ TECT"] },
};

const PRODUCTS = [
  { id:1,  name:"REXET",            line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"https://powervita.vercel.app/rexet.jpg",   emoji:"🌿", tag:"Reinicia tu cuerpo",     desc:"Bebida efervescente con tuna roja y alcachofa que protege el hígado y elimina toxinas.", benefits:["Depura el hígado","Elimina toxinas","Equilibra el metabolismo"], ing:"Tuna roja · Alcachofa · Hierba luisa · Clorofila · Zinc" },
  { id:2,  name:"LIQUID FIBER",     line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:null, emoji:"🍋", tag:"Digestión puntual",     desc:"Fibras prebióticas de achicoria para digestión saludable y flora intestinal equilibrada.", benefits:["Mejora flora intestinal","Regularidad digestiva","Salud digestiva"], ing:"Inulina · Oligofructuosa · Raíz de achicoria" },
  { id:3,  name:"FLORA LIV",        line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:null, emoji:"🫧", tag:"Protege desde adentro",  desc:"Probióticos + prebióticos con granadilla y aguaymanto. Regenera tu flora intestinal.", benefits:["Regenera flora intestinal","Activa defensas","Previene trastornos"], ing:"Cultivos probióticos · Fibra prebiótica · Granadilla" },
  { id:4,  name:"BALANCE",          line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:null, emoji:"🥬", tag:"Cuerpo alcalino",        desc:"Bebida alcalinizante con vegetales verdes que equilibra el pH y elimina toxinas.", benefits:["Equilibra pH corporal","Limpieza profunda","Más energía vital"], ing:"Alfalfa · Chlorella · Espirulina · Pasto de trigo" },
  { id:5,  name:"NUTRADAY",         line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:null, emoji:"⚡", tag:"Vitalidad familiar",     desc:"Refresco multivitamínico con moringa, camu camu y quinua germinada para toda la familia.", benefits:["12 vitaminas + 5 minerales","Fortalece defensas","Desarrollo integral"], ing:"Moringa · Guayaba · Camu Camu · Açaí · Quinua" },
  { id:6,  name:"VITA XTRA T+",    line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"https://powervita.vercel.app/vitaxtra.jpg", emoji:"🌟", tag:"Recupera tu vitalidad",  desc:"Energizante antioxidante con maíz morado, açaí y goji berry. Energía sin caídas.", benefits:["Energía sostenida","Alto poder antioxidante","Reduce fatiga"], ing:"Guayusa · Té verde · Açaí · Goji berry · Maca" },
  { id:7,  name:"XPEED",            line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:null, emoji:"🚀", tag:"Energía líquida",        desc:"Bebida energética saludable con maca, guaraná y teína. Natural sparkling effect.", benefits:["Energía inmediata","Efecto antioxidante","Sin caídas"], ing:"Maca · Guaraná · Teína · Taurina · Vitamina C" },
  { id:8,  name:"BIOPRO+ TECT",    line:"Protein", color:"#1565C0", bg:"#f0f4fb", img:null, emoji:"🛡️", tag:"Activa tus defensas",    desc:"Batido con Bioprotein+ y Colostrum® de 100% valor biológico. Regeneración avanzada.", benefits:["Activa sistema inmune","Regeneración celular","Fortalece huesos"], ing:"Bioprotein+ · Colostrum® · Aminoácidos · DHA" },
  { id:9,  name:"PROTEIN ACTIVE FIT",line:"Protein",color:"#1565C0",bg:"#f0f4fb", img:"https://powervita.vercel.app/protein.jpg", emoji:"💪", tag:"Nutrición vegetal",        desc:"Proteína 100% vegetal de quinua, arroz y algas. Sabor vainilla y canela.", benefits:["100% vegetal","Alta biodisponibilidad","Regenera tejidos"], ing:"Quinua germinada · Arroz integral · Algas · DHA" },
  { id:10, name:"NO STRESS",        line:"Immunity",color:"#1565C0", bg:"#f0f4fb", img:null, emoji:"🧘", tag:"Equilibrio mental",      desc:"Fórmula natural para reducir el estrés y mejorar el sueño.", benefits:["Reduce estrés","Mejora el sueño","Claridad mental"], ing:"Adaptógenos · Vitaminas B · Minerales" },
  { id:11, name:"YOUTH ELIXIR HGH", line:"Immunity",color:"#1565C0", bg:"#f0f4fb", img:null, emoji:"✨", tag:"Activa tu juventud",     desc:"Elixir anti-edad que estimula la producción natural de hormona de crecimiento.", benefits:["Anti-envejecimiento","Regeneración celular","Vitalidad juvenil"], ing:"Aminoácidos · Vitaminas · Extractos premium" },
  { id:12, name:"PRE SPORT",        line:"Sport",   color:"#E65100", bg:"#fdf4ef", img:null, emoji:"🏃", tag:"Rendimiento máximo",     desc:"Fórmula pre-entrenamiento para maximizar rendimiento y resistencia física.", benefits:["Máximo rendimiento","Más resistencia","Enfoque mental"], ing:"Aminoácidos · Cafeína natural · Vitaminas" },
  { id:13, name:"THERMO T3",        line:"Control", color:"#E65100", bg:"#fdf4ef", img:"https://powervita.vercel.app/thermo.jpg", emoji:"🔥", tag:"Activa tu metabolismo", desc:"Termogénico natural que activa el metabolismo y apoya el control de peso.", benefits:["Activa metabolismo","Quema grasa natural","Control de peso"], ing:"Té verde · Guaraná · Jengibre · Canela" },
];

const RECIPES = [
  { id:1, cat:"Detox",   name:"Green Detox Elixir",    img:"🥒", product:"REXET",            ingredients:["1 pepino","jugo de limón","menta fresca","1 sobre REXET","300ml agua fría"],          prep:"Mezcla todo en licuadora. Sirve sobre hielo al amanecer para máximo efecto depurativo." },
  { id:2, cat:"Energy",  name:"Power Morning Boost",   img:"⚡", product:"VITA XTRA T+",      ingredients:["1 plátano","leche de almendras","1 sobre VITA XTRA T+","canela","hielo"],             prep:"Licúa todo 30 segundos. Ideal 30 min antes de tu entrenamiento." },
  { id:3, cat:"Immunity",name:"Golden Shield Latte",   img:"🌟", product:"NO STRESS",         ingredients:["leche de coco caliente","1 sobre NO STRESS","cúrcuma","pimienta negra","miel"],        prep:"Calienta la leche, añade ingredientes y bate. Toma antes de dormir." },
  { id:4, cat:"Detox",   name:"Tropical Cleanse Bowl", img:"🍍", product:"LIQUID FIBER",      ingredients:["papaya","piña","1 sobre LIQUID FIBER","chía","coco rallado"],                         prep:"Mezcla y sirve en bowl. La fibra prebiótica potencia la digestión." },
  { id:5, cat:"Energy",  name:"Warrior Smoothie",      img:"💪", product:"NUTRADAY",          ingredients:["espinaca baby","manzana verde","jengibre","1 sobre NUTRADAY","agua de coco"],         prep:"Procesa en licuadora. Perfecto post-entrenamiento." },
  { id:6, cat:"Immunity",name:"Citrus Defense Shot",   img:"🍊", product:"BIOPRO+ TECT",     ingredients:["naranja exprimida","zanahoria","1 sobre BIOPRO+ TECT","cúrcuma","jengibre"],          prep:"Extrae el jugo, mezcla todo. Toma en ayunas cada mañana." },
  { id:7, cat:"Protein", name:"Vanilla Power Shake",   img:"🥛", product:"PROTEIN ACTIVE FIT",ingredients:["300ml leche de avena","1 sobre PROTEIN ACTIVE FIT","vainilla","maní","hielo"],       prep:"Licúa 30 segundos. Excelente para construcción muscular." },
  { id:8, cat:"Beauty",  name:"Collagen Glow Drink",   img:"✨", product:"YOUTH ELIXIR HGH",  ingredients:["agua de rosas","jugo de granada","1 sobre YOUTH ELIXIR HGH","aloe vera","menta"],    prep:"Mezcla sin licuadora. Agita bien. Toma 2x día para piel radiante." },
];

const TESTIMONIALS = [
  { name:"Elena García",   country:"España",    flag:"🇪🇸", role:"Cliente verificada",  text:"Increíble el cambio en mi digestión. ¡El envío a Madrid fue súper rápido!", pack:"Transform Kit",  days:45, color:"#2d6a4f" },
  { name:"Camila Rojas",   country:"Chile",     flag:"🇨🇱", role:"Usuaria Premium",     text:"Desde que uso FuXion Energy tengo una vitalidad que no sentía desde mis 20s.", pack:"Elite Program",  days:90, color:"#7B3FA0" },
  { name:"André Santos",   country:"Brasil",    flag:"🇧🇷", role:"Cliente verificado",  text:"O sistema Immuno me ajudou a passar o inverno sem adoecer uma única vez!", pack:"Starter Pack",  days:30, color:"#1565C0" },
  { name:"María López",    country:"México",    flag:"🇲🇽", role:"Usuaria Premium",     text:"Perdí 8 kilos en 3 meses con el plan detox. Me siento renovada y con energía.", pack:"Transform Kit", days:90, color:"#2d6a4f" },
  { name:"James Wilson",   country:"USA",       flag:"🇺🇸", role:"Verified Customer",   text:"Clean, effective, and actually tastes good. FuXion is the real deal.", pack:"Starter Pack",  days:30, color:"#E65100" },
  { name:"Valentina Cruz", country:"Colombia",  flag:"🇨🇴", role:"Embajadora",          text:"El Aloe Plus transformó mi piel. Todos preguntan mi secreto: Power Vita 🌿", pack:"Elite Program", days:60, color:"#C9A84C" },
  { name:"Marcus Johnson", country:"USA",       flag:"🇺🇸", role:"Diamond Partner",     text:"Llevar Power Vita a mi país ha sido la mejor decisión financiera de mi vida.", pack:"Elite Program", days:90, color:"#1a2e1a" },
  { name:"Sofía Morales",  country:"Argentina", flag:"🇦🇷", role:"Gold Partner",        text:"En 8 meses construí un equipo en 5 países. El soporte del sistema es incomparable.", pack:"Elite Program", days:90, color:"#C9A84C" },
  { name:"Pedro Fernandes",country:"Portugal",  flag:"🇵🇹", role:"Diamond Partner",     text:"Comecei do zero e hoje tenho renda passiva de 6 dígitos. Revolucionário.", pack:"Elite Program", days:90, color:"#1565C0" },
];

const BEFORE_AFTER = [
  { name:"María G.", age:34, country:"Uruguay", flag:"🇺🇾", pack:"Transform Kit", days:60, goal:"Bajar de peso", color:"#2d6a4f", before:{Peso:"78 kg",Energía:"⬇️ Baja",Digestión:"⬇️ Lenta",Sueño:"⬇️ Irregular"}, after:{Peso:"70 kg",Energía:"⬆️ Alta",Digestión:"⬆️ Fluida",Sueño:"⬆️ Profundo"}, diff:{Peso:"-8 kg",Energía:"+85%",Digestión:"+90%",Sueño:"+70%"}, quote:"En 2 meses cambié completamente. Tengo energía para todo.", products:["REXET","THERMO T3","NO STRESS"] },
  { name:"Carlos R.", age:41, country:"Argentina", flag:"🇦🇷", pack:"Elite Program", days:90, goal:"Más energía y músculo", color:"#1565C0", before:{Peso:"82 kg",Energía:"⬇️ Agotado",Digestión:"⬇️ Pesada",Rendimiento:"⬇️ Bajo"}, after:{Peso:"86 kg",Energía:"⬆️ Máxima",Digestión:"⬆️ Perfecta",Rendimiento:"⬆️ Alto"}, diff:{Peso:"+4kg músculo",Energía:"+120%",Digestión:"+95%",Rendimiento:"+110%"}, quote:"El Elite Program fue lo mejor que hice. Gané músculo y energía.", products:["BIOPRO+ TECT","PROTEIN ACTIVE FIT","VITA XTRA T+"] },
  { name:"Ana P.", age:29, country:"España", flag:"🇪🇸", pack:"Starter Pack", days:30, goal:"Detox y digestión", color:"#7B3FA0", before:{Peso:"65 kg",Energía:"⬇️ Cansada",Digestión:"⬇️ Hinchada",Piel:"⬇️ Opaca"}, after:{Peso:"63 kg",Energía:"⬆️ Activa",Digestión:"⬆️ Plana",Piel:"⬆️ Radiante"}, diff:{Peso:"-2 kg",Energía:"+70%",Digestión:"+95%",Piel:"+85%"}, quote:"Solo 30 días y mi digestión cambió completamente.", products:["REXET","FLORA LIV","LIQUID FIBER"] },
];

const SOCIAL_PROOF = ["🇲🇽 Carlos de México acaba de unirse","🇨🇴 Laura de Colombia compró Energy+","🇧🇷 Pedro de Brasil se registró","🇦🇷 Sofía compró Detox Kit","🇪🇸 Elena de España se unió","🇨🇱 Diego compró Immuno Shield","🇺🇸 James se convirtió en Partner","🇺🇾 Marcos de Uruguay se registró"];
const PACK_COLOR = { "Starter Pack":"#2d6a4f", "Transform Kit":"#C9A84C", "Elite Program":"#1565C0" };
const CERTS = ["Clean Label","FDA Registered","GMP Certified","Non-GMO","HACCP","Biotecnología Avanzada","37 Países","+15,000 Socios","Ingredientes Naturales","Sin Conservantes"];
const LINE_COLORS = { Detox:"#2d6a4f", Energy:"#7B3FA0", Protein:"#1565C0", Immunity:"#1565C0", Sport:"#E65100", Control:"#E65100" };

function detectCountry() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (tz.includes("Montevideo")) return "Uruguay";
  if (tz.includes("Argentina"))  return "Argentina";
  if (tz.includes("Bogota"))     return "Colombia";
  if (tz.includes("Mexico"))     return "México";
  if (tz.includes("Sao_Paulo"))  return "Brasil";
  if (tz.includes("Madrid"))     return "España";
  if (tz.includes("Santiago"))   return "Chile";
  return "";
}
function trackEvent(n, p={}) { if (window.fbq) window.fbq("track", n, p); }

// ── META PIXEL ────────────────────────────────────────────────────────────────
function TrackingPixels() {
  useEffect(() => {
    (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID); window.fbq("track", "PageView");
  }, []);
  return null;
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast() {
  const [vis, setVis] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const show = () => { setMsg(SOCIAL_PROOF[Math.floor(Math.random()*SOCIAL_PROOF.length)]); setVis(true); setTimeout(() => setVis(false), 3500); };
    const id = setInterval(show, 7000); setTimeout(show, 2500); return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position:"fixed", bottom:90, left:16, zIndex:200, transform:vis?"translateY(0)":"translateY(130px)", opacity:vis?1:0, transition:"all .5s cubic-bezier(.34,1.56,.64,1)", background:"rgba(255,255,255,0.96)", backdropFilter:"blur(16px)", border:"1px solid rgba(45,106,79,0.18)", borderRadius:12, padding:"9px 14px", display:"flex", alignItems:"center", gap:9, boxShadow:"0 8px 28px rgba(45,106,79,0.14)", maxWidth:230 }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:"#25D366", flexShrink:0 }}/>
      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:"#1a2e1a", lineHeight:1.3 }}>{msg}</span>
    </div>
  );
}

// ── INITIALS AVATAR ───────────────────────────────────────────────────────────
function Avatar({ name, color="#2d6a4f", size=52 }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const pairs = { "#2d6a4f":["#2d6a4f","#52b788"], "#7B3FA0":["#7B3FA0","#9d4edd"], "#1565C0":["#1565C0","#1976D2"], "#E65100":["#E65100","#ff7043"], "#C9A84C":["#C9A84C","#e8c86a"], "#1a2e1a":["#1a2e1a","#2d6a4f"] };
  const [c1,c2] = pairs[color] || ["#2d6a4f","#52b788"];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${c1},${c2})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 3px 12px ${c1}40` }}>
      <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:size*0.34, fontWeight:700, color:"#fff" }}>{initials}</span>
    </div>
  );
}

// ── COUNTER ───────────────────────────────────────────────────────────────────
function Counter({ target, duration=2000 }) {
  const [v, setV] = useState(0); const ref = useRef(); const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !done.current) { done.current=true; const s=Date.now(); const tick=()=>{ const p=Math.min((Date.now()-s)/duration,1); setV(Math.floor(p*target)); if(p<1)requestAnimationFrame(tick); }; requestAnimationFrame(tick); } }, { threshold:0.4 });
    if (ref.current) obs.observe(ref.current); return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{v.toLocaleString()}</span>;
}

// ── NUTRI PLAN IA ─────────────────────────────────────────────────────────────
function NutriPlan() {
  const [selGoal,setSelGoal]=useState(""); const [selDiet,setSelDiet]=useState(""); const [selSymptoms,setSelSymptoms]=useState([]);
  const [form,setForm]=useState({age:"",weight:""}); const [plan,setPlan]=useState(null); const [loading,setLoading]=useState(false);
  const goals = ["💪 Más energía","🌿 Detox y digestión","⚖️ Bajar de peso","🛡️ Reforzar inmunidad","😴 Dormir mejor","✨ Mejorar piel"];
  const diets = ["🥩 Omnívoro","🐟 Pescetariano","🥚 Vegetariano","🌱 Vegano","🌾 Sin gluten"];
  const symptoms = ["Fatiga crónica","Hinchazón","Insomnio","Estrés","Digestión lenta","Piel opaca","Inmunidad baja","Ansiedad"];
  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Eres nutricionista experto en FuXion. Plan nutricional 7 días en español.
Objetivo: ${selGoal}, Dieta: ${selDiet}, Síntomas: ${selSymptoms.join(",")||"ninguno"}, Edad: ${form.age||"N/A"}, Peso: ${form.weight||"N/A"}kg
SOLO JSON sin texto extra: {"titulo":"nombre corto","perfil":"1 oración breve","productos":[{"nombre":"producto","beneficio":"breve","cuando":"horario"}],"dias":[{"dia":"Lun","desayuno":"breve","almuerzo":"breve","cena":"breve","snack":"breve"}],"tips":["tip1","tip2"]}
Usa solo: REXET,LIQUID FIBER,NUTRADAY,VITA XTRA T+,XPEED,BIOPRO+,PROTEIN FIT,NO STRESS,THERMO T3,BALANCE. 3 productos, 7 días. Textos MUY cortos (máx 6 palabras por campo).`;
      const res = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:4000, messages:[{role:"user",content:prompt}] }) });
      const data = await res.json();
      if (data.error) throw new Error(JSON.stringify(data.error));
      const rawText = data.content?.map(b=>b.text||"").join("").replace(/```json\n?|```/g,"").trim();
      setPlan(JSON.parse(rawText));
      trackEvent("Lead", { content_name:"NutriPlan_AI" });
    } catch(e) { console.error("NutriPlan error:", e); setPlan({ error:true, msg: e.message }); }
    finally { setLoading(false); }
  };
  const inp = { width:"100%", background:"rgba(45,106,79,0.04)", border:"1.5px solid rgba(45,106,79,0.18)", borderRadius:10, padding:"9px 11px", fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"'Inter',sans-serif" };
  if (plan) {
    if (plan.error) return <div style={{textAlign:"center",padding:20}}><p style={{color:"#e53e3e",fontSize:13}}>Error. Intenta de nuevo.</p>{plan.msg&&<p style={{color:"#e53e3e",fontSize:10,marginTop:4,wordBreak:"break-all",maxWidth:260,margin:"4px auto"}}>{plan.msg}</p>}<button onClick={()=>setPlan(null)} style={{marginTop:10,background:"#2d6a4f",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontWeight:700}}>Reintentar</button></div>;
    return (
      <div style={{padding:"20px"}}>
        <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>🥗</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#1a2e1a",margin:"4px 0 2px"}}>{plan.titulo}</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#7a9a7a",fontStyle:"italic"}}>{plan.perfil}</p></div>
        <div style={{marginBottom:10}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#2d6a4f",letterSpacing:1.5,marginBottom:5}}>✦ PRODUCTOS</div>{plan.productos?.map((p,i)=><div key={i} style={{background:"rgba(45,106,79,0.05)",borderRadius:9,padding:"7px 10px",marginBottom:4,display:"flex",gap:7,alignItems:"flex-start"}}><span>🌿</span><div><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,color:"#1a2e1a",fontSize:11}}>{p.nombre}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#7a9a7a"}}>{p.beneficio}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"#C9A84C",fontWeight:600}}>⏰ {p.cuando}</div></div></div>)}</div>
        <div style={{marginBottom:10}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#2d6a4f",letterSpacing:1.5,marginBottom:5}}>📅 7 DÍAS</div><div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:3}}>{plan.dias?.map((d,i)=><div key={i} style={{minWidth:95,background:"#fff",border:"1px solid rgba(45,106,79,0.1)",borderRadius:8,padding:"6px",flexShrink:0}}><div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,color:"#2d6a4f",fontSize:8,textAlign:"center",background:"rgba(45,106,79,0.07)",borderRadius:4,padding:"1px 0",marginBottom:3}}>{d.dia}</div>{[{k:"desayuno",i:"🌅"},{k:"almuerzo",i:"☀️"},{k:"cena",i:"🌙"},{k:"snack",i:"🍎"}].map(({k,i:ic})=><div key={k} style={{fontFamily:"'Inter',sans-serif",fontSize:7,color:"#4a5568",marginBottom:2}}>{ic} {d[k]}</div>)}</div>)}</div></div>
        {plan.tips && <div style={{marginBottom:12}}>{plan.tips.map((t,i)=><div key={i} style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#2d5a3d",padding:"2px 0",display:"flex",gap:5}}><span style={{color:"#C9A84C"}}>✓</span>{t}</div>)}</div>}
        <div style={{display:"flex",gap:7}}>
          <a href={`https://wa.me/${WA}?text=${encodeURIComponent("¡Hola! Generé mi plan nutricional con Power Vita IA 🌿 Quiero empezar.")}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>💬 Empezar</a>
          <button onClick={()=>setPlan(null)} style={{flex:1,background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",color:"#2d6a4f",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>🔄 Nuevo</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>🥗</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#1a2e1a",margin:"4px 0 2px"}}>Plan Nutricional IA</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#7a9a7a"}}>Personalizado · 7 días · FuXion</p></div>
      <div style={{marginBottom:9}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f",letterSpacing:1,marginBottom:5}}>OBJETIVO</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{goals.map(g=><button key={g} onClick={()=>setSelGoal(g)} style={{padding:"6px 4px",borderRadius:7,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,cursor:"pointer",border:"1.5px solid",borderColor:selGoal===g?"#2d6a4f":"rgba(45,106,79,0.15)",background:selGoal===g?"#2d6a4f":"transparent",color:selGoal===g?"#fff":"#2d6a4f",transition:"all .2s"}}>{g}</button>)}</div></div>
      <div style={{marginBottom:9}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f",letterSpacing:1,marginBottom:5}}>SÍNTOMAS</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{symptoms.map(s=>{const sel=selSymptoms.includes(s);return <button key={s} onClick={()=>setSelSymptoms(p=>sel?p.filter(x=>x!==s):[...p,s])} style={{padding:"3px 7px",borderRadius:999,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:8,cursor:"pointer",border:"1.5px solid",borderColor:sel?"#C9A84C":"rgba(45,106,79,0.15)",background:sel?"rgba(201,168,76,0.12)":"transparent",color:sel?"#8B6914":"#2d6a4f",transition:"all .2s"}}>{s}</button>;})}</div></div>
      <div style={{marginBottom:9}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f",letterSpacing:1,marginBottom:5}}>DIETA</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{diets.map(d=><button key={d} onClick={()=>setSelDiet(d)} style={{padding:"4px 9px",borderRadius:999,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,cursor:"pointer",border:"1.5px solid",borderColor:selDiet===d?"#2d6a4f":"rgba(45,106,79,0.15)",background:selDiet===d?"#2d6a4f":"transparent",color:selDiet===d?"#fff":"#2d6a4f",transition:"all .2s"}}>{d}</button>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:3}}>EDAD</div><input value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} placeholder="32" style={inp}/></div>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:3}}>PESO kg</div><input value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} placeholder="70" style={inp}/></div>
      </div>
      <button onClick={generate} disabled={!selGoal||!selDiet||loading} style={{width:"100%",background:(!selGoal||!selDiet)?"rgba(45,106,79,0.25)":"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:(!selGoal||!selDiet)?"not-allowed":"pointer"}}>
        {loading?"🧠 Generando con IA...":"✨ Generar mi plan con IA →"}
      </button>
    </div>
  );
}

// ── SYMPTOM ANALYZER ─────────────────────────────────────────────────────────
function SymptomAnalyzer() {
  const [text,setText]=useState(""); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const examples = ["Me siento cansado todo el día","Tengo el estómago hinchado","Mucho estrés y no puedo dormir","Quiero bajar de peso"];
  const analyze = async () => {
    if (!text.trim()) return; setLoading(true);
    try {
      const prompt = `Eres experto FuXion. Responde en español. SOLO JSON: Síntomas: "${text}"
{"diagnostico":"2 oraciones","nivel_urgencia":"bajo|medio|alto","causa_probable":"1 oración","productos":[{"nombre":"producto","match":90,"razon":"por qué"}],"mensaje_motivador":"mensaje corto"}
2-3 productos FuXion reales.`;
      const res = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:800, messages:[{role:"user",content:prompt}] }) });
      const data = await res.json();
      setResult(JSON.parse(data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()));
      trackEvent("Lead", { content_name:"SymptomAnalyzer_AI" });
    } catch(e) { console.error(e); setResult({ error:true }); }
    finally { setLoading(false); }
  };
  const urgC = { bajo:"#25D366", medio:"#C9A84C", alto:"#e53e3e" };
  const urgL = { bajo:"✅ Nivel Bajo", medio:"⚠️ Nivel Medio", alto:"🔴 Nivel Alto" };
  if (result && !result.error) return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:26}}>🔬</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:"#1a2e1a",margin:"4px 0 5px"}}>Análisis completado</h3><div style={{display:"inline-flex",alignItems:"center",background:`${urgC[result.nivel_urgencia]}15`,border:`1px solid ${urgC[result.nivel_urgencia]}`,borderRadius:999,padding:"2px 10px"}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:urgC[result.nivel_urgencia]}}>{urgL[result.nivel_urgencia]}</span></div></div>
      <div style={{background:"rgba(45,106,79,0.05)",borderRadius:10,padding:"8px 10px",marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:2}}>🧠 DIAGNÓSTICO</div><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#2d5a3d",lineHeight:1.6}}>{result.diagnostico}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#7a9a7a",marginTop:2,fontStyle:"italic"}}>📍 {result.causa_probable}</p></div>
      <div style={{marginBottom:8}}>{result.productos?.map((p,i)=><div key={i} style={{background:"#fff",border:"1px solid rgba(45,106,79,0.1)",borderRadius:9,padding:"7px 9px",marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,color:"#1a2e1a",fontSize:11}}>{p.nombre}</span><span style={{fontFamily:"'Inter',sans-serif",background:"#2d6a4f",color:"#fff",borderRadius:999,padding:"1px 6px",fontSize:8,fontWeight:700}}>{p.match}%</span></div><div style={{height:3,background:"rgba(45,106,79,0.1)",borderRadius:2,marginBottom:3}}><div style={{height:"100%",width:`${p.match}%`,background:"linear-gradient(90deg,#2d6a4f,#C9A84C)",borderRadius:2}}/></div><p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#7a9a7a"}}>{p.razon}</p></div>)}</div>
      <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:9,padding:"8px 10px",marginBottom:10}}><p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#8B6914",fontStyle:"italic"}}>{result.mensaje_motivador}</p></div>
      <div style={{display:"flex",gap:7}}>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent("¡Hola! Analicé mis síntomas con Power Vita IA 🌿")}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>💬 Empezar</a>
        <button onClick={()=>{setResult(null);setText("");}} style={{flex:1,background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",color:"#2d6a4f",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>🔄 Nuevo</button>
      </div>
    </div>
  );
  return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>🔬</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#1a2e1a",margin:"4px 0 2px"}}>Analizador de Síntomas IA</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#7a9a7a"}}>Describí cómo te sentís · IA recomienda</p></div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Ej: Me siento cansado, tengo el estómago hinchado..." rows={3} style={{width:"100%",background:"rgba(45,106,79,0.04)",border:"1.5px solid rgba(45,106,79,0.18)",borderRadius:10,padding:"9px 11px",fontFamily:"'Inter',sans-serif",fontSize:11,outline:"none",resize:"none",color:"#1a2e1a",boxSizing:"border-box",marginBottom:7}} onFocus={e=>e.target.style.borderColor="#2d6a4f"} onBlur={e=>e.target.style.borderColor="rgba(45,106,79,0.18)"}/>
      <div style={{marginBottom:10}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#7a9a7a",marginBottom:4,fontWeight:600}}>💡 EJEMPLOS:</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{examples.map((e,i)=><button key={i} onClick={()=>setText(e)} style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"#2d6a4f",background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.13)",borderRadius:6,padding:"3px 7px",cursor:"pointer"}}>{e}</button>)}</div></div>
      <button onClick={analyze} disabled={!text.trim()||loading} style={{width:"100%",background:!text.trim()?"rgba(45,106,79,0.25)":"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:!text.trim()?"not-allowed":"pointer"}}>
        {loading?"🧠 Analizando...":"🔬 Analizar con IA →"}
      </button>
    </div>
  );
}

// ── ROI PREDICTOR ─────────────────────────────────────────────────────────────
function ROIPredictor() {
  const [form,setForm]=useState({country:"",hours:"",contacts:"",experience:""}); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const hours = ["⏰ 5-10 hrs/sem","⏰ 10-20 hrs/sem","⏰ 20-30 hrs/sem","⏰ +30 hrs/sem"];
  const contacts = ["👥 0-50","👥 50-200","👥 200-500","👥 +500"];
  const experience = ["🌱 Sin experiencia","📊 Algo de exp.","💼 Con experiencia","🏆 Muy exp."];
  const predict = async () => {
    if (!form.country||!form.hours||!form.contacts||!form.experience) return; setLoading(true);
    try {
      const prompt = `Eres experto FuXion. Responde en español. País: ${form.country}, Horas: ${form.hours}, Contactos: ${form.contacts}, Experiencia: ${form.experience}
SOLO JSON: {"mes1":{"min":100,"max":400,"descripcion":""},"mes3":{"min":400,"max":1500,"descripcion":""},"mes6":{"min":1000,"max":4000,"descripcion":""},"mes12":{"min":3000,"max":12000,"descripcion":""},"estrategia":["acción1","acción2","acción3"],"ventaja_pais":"ventaja","perfil":"1 oración","potencial":"bajo|medio|alto|muy_alto"}`;
      const res = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:800, messages:[{role:"user",content:prompt}] }) });
      const data = await res.json();
      setResult(JSON.parse(data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()));
      trackEvent("Lead", { content_name:"ROIPredictor_AI" });
    } catch(e) { console.error(e); setResult({ error:true }); }
    finally { setLoading(false); }
  };
  const potL = { bajo:"🌱 Potencial Bueno", medio:"🚀 Potencial Alto", alto:"💎 Potencial Muy Alto", muy_alto:"👑 Potencial Excepcional" };
  if (result && !result.error) return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:10}}><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,fontWeight:700,color:"#fff",margin:"4px 0 5px"}}>{result.perfil}</h3><div style={{display:"inline-flex",background:"rgba(201,168,76,0.18)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:999,padding:"3px 10px"}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:800,color:"#C9A84C"}}>{potL[result.potencial]}</span></div></div>
      <div style={{marginBottom:9}}>{[{k:"mes1",l:"1 mes"},{k:"mes3",l:"3 meses"},{k:"mes6",l:"6 meses"},{k:"mes12",l:"12 meses"}].map(({k,l})=>{const d=result[k];if(!d)return null;return(<div key={k} style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.9)"}}>{l}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:900,color:"#C9A84C"}}>${d.min?.toLocaleString()} – ${d.max?.toLocaleString()}</span></div><div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2}}><div style={{height:"100%",width:`${Math.min((d.max/12000)*100,100)}%`,background:"linear-gradient(90deg,#C9A84C,#FFD700)",borderRadius:2}}/></div></div>);})}</div>
      <div style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:9,padding:"7px 9px",marginBottom:8}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.95)",lineHeight:1.5}}>{result.ventaja_pais}</p></div>
      <div style={{marginBottom:9}}>{result.estrategia?.map((s,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:4}}><div style={{width:15,height:15,borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#FFD700)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:900,flexShrink:0,color:"#1a1a1a"}}>{i+1}</div><span style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.95)",lineHeight:1.5}}>{s}</span></div>)}</div>
      <div style={{display:"flex",gap:7}}>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`¡Hola! Calculé mi potencial desde ${form.country} con Power Vita IA 💰 Quiero ser socio.`)}`} target="_blank" rel="noreferrer" style={{flex:1,background:"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>👑 Quiero ser socio</a>
        <button onClick={()=>{setResult(null);setForm({country:"",hours:"",contacts:"",experience:""}); }} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",color:"rgba(255,255,255,0.8)",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>🔄 Recalcular</button>
      </div>
    </div>
  );
  return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>💰</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#FFD700",margin:"4px 0 2px"}}>ROI Predictor IA</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.88)"}}>Proyección de ingresos con IA real</p></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.9)",marginBottom:4}}>PAÍS</div><select value={form.country} onChange={e=>set("country",e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(201,168,76,0.22)",borderRadius:9,padding:"8px 10px",fontFamily:"'Inter',sans-serif",color:form.country?"#fff":"rgba(255,255,255,0.35)",fontSize:11,outline:"none",cursor:"pointer",boxSizing:"border-box"}}><option value="">Seleccioná tu país...</option>{COUNTRIES.map(c=><option key={c} value={c} style={{color:"#1a1a1a"}}>{c}</option>)}</select></div>
      {[{label:"HORAS / SEMANA",opts:hours,key:"hours"},{label:"RED DE CONTACTOS",opts:contacts,key:"contacts"},{label:"EXPERIENCIA",opts:experience,key:"experience"}].map(({label,opts,key})=><div key={key} style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.9)",marginBottom:4}}>{label}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{opts.map(o=><button key={o} onClick={()=>set(key,o)} style={{padding:"6px 4px",borderRadius:7,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,cursor:"pointer",border:"1.5px solid",borderColor:form[key]===o?"#C9A84C":"rgba(255,255,255,0.1)",background:form[key]===o?"rgba(201,168,76,0.18)":"rgba(255,255,255,0.04)",color:form[key]===o?"#C9A84C":"rgba(255,255,255,0.85)",transition:"all .2s"}}>{o}</button>)}</div></div>)}
      <button onClick={predict} disabled={!form.country||!form.hours||!form.contacts||!form.experience||loading} style={{width:"100%",background:(!form.country||!form.hours||!form.contacts||!form.experience)?"rgba(201,168,76,0.25)":"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",marginTop:4}}>
        {loading?"🧠 Calculando...":"💰 Calcular mi potencial →"}
      </button>
    </div>
  );
}

// ── ELITE PROGRAM ─────────────────────────────────────────────────────────────
function EliteProgram() {
  const [step,setStep]=useState(1); const [form,setForm]=useState({name:"",country:"",goal:"",symptoms:[],age:"",weight:""}); const [plan,setPlan]=useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const goals = ["💪 Ganar masa muscular","🌿 Detox profundo","⚖️ Bajar de peso","🛡️ Reforzar inmunidad","⚡ Más energía","✨ Anti-envejecimiento"];
  const symptoms = ["Fatiga","Sobrepeso","Digestión lenta","Estrés","Insomnio","Piel opaca","Inmunidad baja","Dolores musculares"];
  const generate = async () => {
    if (!form.name||!form.country||!form.goal) return; setStep(2);
    try {
      const prompt = `Eres experto FuXion. Responde en español. Plan Elite 90 días. Nombre: ${form.name}, País: ${form.country}, Objetivo: ${form.goal}, Síntomas: ${form.symptoms.join(",")||"ninguno"}, Edad: ${form.age||"N/A"}, Peso: ${form.weight||"N/A"}kg
SOLO JSON: {"titulo":"nombre","tagline":"frase","perfil":"1 oración","resultado_esperado":"en 90 días","fases":[{"numero":1,"nombre":"","semanas":"Semanas 1-4","objetivo":"","emoji":"","productos":["p1","p2"],"resultado":""}],"metricas":[{"label":"Productos","valor":"5"},{"label":"Días","valor":"90"},{"label":"Seguimientos","valor":"12"},{"label":"Éxito","valor":"94%"}],"hitos":["sem 2","sem 4","sem 8","sem 12"],"mensaje_final":"mensaje para ${form.name}"}
3 fases. Productos FuXion reales.`;
      const res = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:2000, messages:[{role:"user",content:prompt}] }) });
      const data = await res.json();
      setPlan(JSON.parse(data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()));
      setStep(3); trackEvent("Lead", { content_name:"EliteProgram_AI" });
    } catch(e) {
      console.error(e);
      setPlan({ titulo:`Plan Elite 90 · ${form.name}`, tagline:"Tu mejor versión en 3 meses", perfil:`Protocolo avanzado para ${form.goal}`, resultado_esperado:"Transformación completa en 90 días.", fases:[{numero:1,nombre:"Limpieza & Reset",semanas:"Semanas 1-4",objetivo:"Eliminar toxinas",emoji:"🌿",productos:["REXET","LIQUID FIBER","BALANCE"],resultado:"Digestión mejorada"},{numero:2,nombre:"Activación & Energía",semanas:"Semanas 5-8",objetivo:"Maximizar energía",emoji:"⚡",productos:["VITA XTRA T+","NUTRADAY","NO STRESS"],resultado:"Energía sostenida"},{numero:3,nombre:"Consolidación",semanas:"Semanas 9-12",objetivo:"Fijar resultados",emoji:"✨",productos:["BIOPRO+ TECT","YOUTH ELIXIR HGH","PROTEIN ACTIVE FIT"],resultado:"Cuerpo transformado"}], metricas:[{label:"Productos",valor:"6"},{label:"Días",valor:"90"},{label:"Seguimientos",valor:"12"},{label:"Éxito",valor:"94%"}], hitos:["Semana 2: primeros cambios","Semana 4: menos hinchazón","Semana 8: transformación notoria","Semana 12: resultado final"], mensaje_final:`${form.name}, en 90 días tu vida va a ser diferente 🌿` });
      setStep(3);
    }
  };
  const openWA = () => { if (!plan) return; const msg=encodeURIComponent(`¡Hola! Generé mi Plan Elite 90 días con Power Vita IA 👑\nNombre: ${form.name}\nPaís: ${form.country}\nObjetivo: ${form.goal}\nFase 1: ${plan.fases?.[0]?.nombre}\nFase 2: ${plan.fases?.[1]?.nombre}\nFase 3: ${plan.fases?.[2]?.nombre}\n\n¿Cuál es el precio en ${form.country}?`); window.open(`https://wa.me/${WA}?text=${msg}`,"_blank"); };
  const inp = { width:"100%", background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(201,168,76,0.22)", borderRadius:9, padding:"8px 10px", fontSize:11, outline:"none", color:"#fff", boxSizing:"border-box", fontFamily:"'Inter',sans-serif" };
  if (step===1) return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:28}}>👑</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#FFD700",marginBottom:2}}>Elite Program</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.85)"}}>La IA genera tu protocolo de 90 días</p></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>NOMBRE</div><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="¿Cómo te llamás?" style={inp} onFocus={e=>e.target.style.borderColor="#C9A84C"} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.22)"}/></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>PAÍS</div><select value={form.country} onChange={e=>set("country",e.target.value)} style={{...inp,cursor:"pointer",color:form.country?"#fff":"rgba(255,255,255,0.35)"}}><option value="">Seleccioná tu país...</option>{COUNTRIES.map(c=><option key={c} value={c} style={{color:"#1a1a1a"}}>{c}</option>)}</select></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:4}}>OBJETIVO</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{goals.map(g=><button key={g} onClick={()=>set("goal",g)} style={{padding:"6px 4px",borderRadius:7,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:8,cursor:"pointer",border:"1.5px solid",borderColor:form.goal===g?"#C9A84C":"rgba(255,255,255,0.1)",background:form.goal===g?"rgba(201,168,76,0.18)":"rgba(255,255,255,0.04)",color:form.goal===g?"#FFD700":"rgba(255,255,255,0.82)",transition:"all .2s"}}>{g}</button>)}</div></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:4}}>SÍNTOMAS</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{symptoms.map(s=>{const sel=form.symptoms.includes(s);return <button key={s} onClick={()=>set("symptoms",sel?form.symptoms.filter(x=>x!==s):[...form.symptoms,s])} style={{padding:"2px 6px",borderRadius:999,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:8,cursor:"pointer",border:"1.5px solid",borderColor:sel?"#C9A84C":"rgba(255,255,255,0.1)",background:sel?"rgba(201,168,76,0.15)":"transparent",color:sel?"#C9A84C":"rgba(255,255,255,0.78)",transition:"all .2s"}}>{s}</button>;})}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>EDAD</div><input value={form.age} onChange={e=>set("age",e.target.value)} placeholder="32" style={inp}/></div>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>PESO kg</div><input value={form.weight} onChange={e=>set("weight",e.target.value)} placeholder="70" style={inp}/></div>
      </div>
      <button onClick={generate} disabled={!form.name||!form.country||!form.goal} style={{width:"100%",background:(!form.name||!form.country||!form.goal)?"rgba(201,168,76,0.22)":"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:(!form.name||!form.country||!form.goal)?"not-allowed":"pointer"}}>
        👑 Generar mi Plan Elite 90 días →
      </button>
    </div>
  );
  if (step===2) return (
    <div style={{padding:"40px 20px",textAlign:"center"}}>
      <div style={{fontSize:38,marginBottom:12,animation:"floatAnim 1.5s ease-in-out infinite"}}>🧠</div>
      <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:"#FFD700",marginBottom:6}}>Diseñando tu protocolo...</h3>
      <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.85)",marginBottom:16,lineHeight:1.6}}>Claude AI analiza tu perfil y construye tu plan único de 90 días</p>
      <div style={{height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,#C9A84C,#FFD700)",borderRadius:2,animation:"loadingBar 2s ease-in-out infinite"}}/></div>
    </div>
  );
  if (step===3 && plan) return (
    <div style={{padding:"18px 20px"}}>
      <div style={{textAlign:"center",marginBottom:10}}><div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(201,168,76,0.14)",border:"1px solid rgba(201,168,76,0.28)",borderRadius:999,padding:"3px 9px",marginBottom:5}}><span style={{width:5,height:5,borderRadius:"50%",background:"#FFD700",display:"inline-block"}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:800,color:"#C9A84C",letterSpacing:1.5}}>PLAN GENERADO CON IA ✓</span></div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:"#FFD700",marginBottom:1}}>{plan.titulo}</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.75)",fontStyle:"italic"}}>{plan.tagline}</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginBottom:10}}>{plan.metricas?.map((m,i)=><div key={i} style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.14)",borderRadius:8,padding:"6px 3px",textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:"#FFD700",lineHeight:1}}>{m.valor}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:7,color:"rgba(255,255,255,0.95)",marginTop:2,lineHeight:1.2}}>{m.label}</div></div>)}</div>
      <div style={{background:"rgba(45,106,79,0.14)",border:"1px solid rgba(45,106,79,0.28)",borderRadius:9,padding:"7px 10px",marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#52b788",marginBottom:2}}>🎯 RESULTADO EN 90 DÍAS</div><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.95)",lineHeight:1.5}}>{plan.resultado_esperado}</p></div>
      <div style={{marginBottom:10}}>{plan.fases?.map((fase,i)=><div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"8px 10px",marginBottom:4,display:"flex",gap:8}}><div style={{width:30,height:30,borderRadius:8,background:"rgba(201,168,76,0.18)",border:"1px solid rgba(201,168,76,0.28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{fase.emoji}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}><span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,fontWeight:700,color:"#fff"}}>Fase {fase.numero}: {fase.nombre}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"#C9A84C",fontWeight:700}}>{fase.semanas}</span></div><p style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.85)",marginBottom:3}}>{fase.objetivo}</p><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{fase.productos?.map(p=><span key={p} style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color:"#C9A84C",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.18)",borderRadius:4,padding:"1px 5px"}}>{p}</span>)}</div></div></div>)}</div>
      <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.22)",borderRadius:10,padding:"8px 11px",marginBottom:12}}><p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#FFD700",fontStyle:"italic",lineHeight:1.6}}>"{plan.mensaje_final}"</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <button onClick={()=>{trackEvent("Purchase",{content_name:"Elite Program 90 días",content_type:"product",currency:"USD"});openWA();}} style={{width:"100%",background:"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>👑 Quiero este plan · Ver precio en {form.country} →</button>
        <div style={{display:"flex",gap:6}}><button onClick={()=>{setStep(1);setPlan(null);}} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.92)",borderRadius:9,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,cursor:"pointer"}}>🔄 Nuevo</button><button onClick={()=>{const txt=`${plan.titulo}\nFase 1: ${plan.fases?.[0]?.nombre}\nFase 2: ${plan.fases?.[1]?.nombre}\nFase 3: ${plan.fases?.[2]?.nombre}`;navigator.clipboard?.writeText(txt);}} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.92)",borderRadius:9,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,cursor:"pointer"}}>📋 Copiar</button></div>
      </div>
    </div>
  );
  return null;
}

// ── CONTADOR TIEMPO REAL ──────────────────────────────────────────────────────
function ContadorTiempoReal() {
  const NAMES = [{name:"María G.",country:"Uruguay",flag:"🇺🇾",product:"Transform Kit"},{name:"Carlos R.",country:"Argentina",flag:"🇦🇷",product:"Elite Program"},{name:"Laura M.",country:"Colombia",flag:"🇨🇴",product:"REXET"},{name:"Diego F.",country:"México",flag:"🇲🇽",product:"Starter Pack"},{name:"Ana P.",country:"España",flag:"🇪🇸",product:"THERMO T3"},{name:"Pedro L.",country:"Brasil",flag:"🇧🇷",product:"Transform Kit"},{name:"Sofía V.",country:"Chile",flag:"🇨🇱",product:"Elite Program"},{name:"James W.",country:"USA",flag:"🇺🇸",product:"BIOPRO+ TECT"}];
  const [count,setCount]=useState(0); const [joins,setJoins]=useState([]);
  const getBase = () => { const h=new Date().getHours(); if(h<6)return 8; if(h<9)return 22; if(h<12)return 47; if(h<15)return 74; if(h<18)return 93; if(h<21)return 78; return 41; };
  useEffect(() => {
    setCount(getBase()); setJoins(Array.from({length:3},(_,i)=>({...NAMES[i],mins:3+i*7,id:i})));
    const ci = setInterval(()=>{const h=new Date().getHours();if(h>=9&&h<21)setCount(p=>p+Math.floor(Math.random()*3)+1);},60000);
    let ji=3; const jt=setInterval(()=>{setJoins(p=>[{...NAMES[ji%NAMES.length],mins:1,id:Date.now()},...p.slice(0,4)]);ji++;},10000);
    return()=>{clearInterval(ci);clearInterval(jt);};
  }, []);
  const h = new Date().getHours();
  const bars = [8,12,18,25,34,42,56,74,89,98,106,98,84,74,67,58,47,39,28,19,14,10,8,6];
  return (
    <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:20,overflow:"hidden",boxShadow:"0 6px 24px rgba(45,106,79,0.07)"}}>
      <div style={{background:"linear-gradient(135deg,#1a2e1a,#2d6a4f)",padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:"#fff",marginBottom:1}}>Actividad en tiempo real</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.88)"}}>Últimas 24 horas · Global</div></div>
        <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(37,211,102,0.14)",border:"1px solid rgba(37,211,102,0.28)",borderRadius:999,padding:"3px 9px"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#25D366",animation:"pulse 1.5s ease-in-out infinite"}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color:"#25D366"}}>EN VIVO</span></div>
      </div>
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid rgba(45,106,79,0.06)"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:9}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:44,fontWeight:700,color:"#1a2e1a",lineHeight:1}}>{count}</div><div style={{paddingBottom:5,fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#2d6a4f",lineHeight:1.3}}>personas se unieron<br/>en las últimas 24hs</div></div>
        <div style={{marginBottom:7}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"#9ca3af",marginBottom:3,fontWeight:600}}>ACTIVIDAD HOY POR HORA</div><div style={{display:"flex",gap:2,alignItems:"flex-end",height:24}}>{bars.map((v,i)=>{const isNow=i===h,isPast=i<h;return(<div key={i} style={{flex:1,background:isNow?"#2d6a4f":isPast?"rgba(45,106,79,0.32)":"rgba(45,106,79,0.08)",borderRadius:"2px 2px 0 0",height:`${(v/106)*100}%`,position:"relative"}}>{isNow&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#2d6a4f",color:"#fff",borderRadius:3,padding:"1px 3px",fontFamily:"'Inter',sans-serif",fontSize:6,whiteSpace:"nowrap"}}>ahora</div>}</div>);})}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>{["00:00","12:00","23:00"].map(t=><span key={t} style={{fontFamily:"'Inter',sans-serif",fontSize:7,color:"#9ca3af"}}>{t}</span>)}</div></div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#4a7c5e",fontWeight:600}}>{h>=9&&h<21?"🟢 Alta actividad ahora":"🔵 Actividad normal"}</div>
      </div>
      <div style={{padding:"9px 14px"}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color:"#9ca3af",letterSpacing:1,marginBottom:6}}>ÚLTIMAS INCORPORACIONES</div>{joins.map((j,i)=><div key={j.id} style={{display:"flex",alignItems:"center",gap:9,padding:"4px 0",borderBottom:i<joins.length-1?"1px solid rgba(45,106,79,0.05)":"none"}}><div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#E8F0E9,#2d6a4f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{j.flag}</div><div style={{flex:1}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:"#1a2e1a"}}>{j.name} <span style={{color:"#9ca3af",fontWeight:400}}>de {j.country}</span></div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#7a9a7a"}}>Se unió con <span style={{color:"#2d6a4f",fontWeight:700}}>{j.product}</span></div></div><div style={{fontFamily:"'Inter',sans-serif",fontSize:8,color:"#9ca3af"}}>hace {j.mins}min</div></div>)}</div>
    </div>
  );
}

// ── ANTES / DESPUÉS ───────────────────────────────────────────────────────────
function AntesDespues() {
  const [active,setActive]=useState(0); const [showAfter,setShowAfter]=useState(false);
  useEffect(()=>{setShowAfter(false);},[active]);
  const c=BEFORE_AFTER[active]; const metrics=Object.keys(c.before); const color=PACK_COLOR[c.pack]||"#2d6a4f";
  return (
    <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:20,overflow:"hidden",boxShadow:"0 6px 24px rgba(45,106,79,0.07)"}}>
      <div style={{background:"linear-gradient(135deg,#1a2e1a,#2d6a4f)",padding:"13px 16px"}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:"#fff",marginBottom:1}}>Transformaciones reales</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,0.88)"}}>Casos verificados</div></div>
      <div style={{display:"flex",borderBottom:"1px solid rgba(45,106,79,0.06)"}}>
        {BEFORE_AFTER.map((cas,i)=><button key={i} onClick={()=>setActive(i)} style={{flex:1,padding:"9px 6px",background:active===i?"rgba(45,106,79,0.06)":"transparent",border:"none",borderBottom:active===i?`2px solid ${PACK_COLOR[cas.pack]}`:"2px solid transparent",cursor:"pointer",transition:"all .2s",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <Avatar name={cas.name} color={cas.color} size={32}/>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color:active===i?PACK_COLOR[cas.pack]:"#9ca3af"}}>{cas.name.split(" ")[0]}</div>
        </button>)}
      </div>
      <div style={{padding:"13px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
          <Avatar name={c.name} color={c.color} size={48}/>
          <div style={{flex:1}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:"#1a2e1a",marginBottom:1}}>{c.name}, {c.age} años</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"#9ca3af",marginBottom:3}}>{c.country} {c.flag} · {c.goal}</div><div style={{display:"flex",gap:4}}><div style={{background:`${color}10`,border:`1px solid ${color}25`,borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color}}>{c.pack}</div><div style={{background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.1)",borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:600,color:"#4a7c5e"}}>⏱ {c.days} días</div></div></div>
        </div>
        <div style={{display:"flex",background:"rgba(45,106,79,0.05)",borderRadius:10,padding:3,marginBottom:10,gap:3}}>
          {[false,true].map(isAfter=><button key={String(isAfter)} onClick={()=>setShowAfter(isAfter)} style={{flex:1,padding:"6px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,transition:"all .25s",background:showAfter===isAfter?(isAfter?color:"#e53e3e"):"transparent",color:showAfter===isAfter?"#fff":"#9ca3af"}}>{isAfter?"✨ Después":"📸 Antes"}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:9}}>
          {metrics.map(key=>{const val=showAfter?c.after[key]:c.before[key];return(<div key={key} style={{background:showAfter?`${color}07`:"rgba(229,57,53,0.04)",border:`1px solid ${showAfter?color+"18":"rgba(229,57,53,0.1)"}`,borderRadius:8,padding:"7px 9px",transition:"all .3s"}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",marginBottom:2}}>{key}</div><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:showAfter?color:"#e53e3e"}}>{val}</div>{showAfter&&<div style={{fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color:"#25D366",marginTop:1}}>{c.diff[key]}</div>}</div>);})}
        </div>
        <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.16)",borderRadius:9,padding:"7px 9px",marginBottom:9}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:"#C9A84C",lineHeight:0.8,marginBottom:3}}>"</div><p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,fontStyle:"italic",color:"#1a2e1a",lineHeight:1.6}}>{c.quote}</p></div>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`¡Hola! Vi el caso de ${c.name} y quiero resultados similares con Power Vita 🌿`)}`} target="_blank" rel="noreferrer" style={{display:"block",width:"100%",background:`linear-gradient(135deg,#1a2e1a,${color})`,color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>💬 Quiero resultados como {c.name.split(" ")[0]} →</a>
      </div>
    </div>
  );
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
function Chat({ open, onClose }) {
  const [msgs,setMsgs]=useState([{role:"assistant",text:"¡Hola! Soy tu Vita Advisor 🌿 ¿En qué puedo ayudarte?"}]);
  const [inp,setInp]=useState(""); const [loading,setLoading]=useState(false); const botRef=useRef();
  useEffect(()=>{botRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send = async () => {
    if (!inp.trim()||loading) return;
    const um={role:"user",text:inp}; setMsgs(m=>[...m,um]); setInp(""); setLoading(true);
    try {
      const sys=`Eres Vita Advisor, asistente IA de Power Vita (distribuidor FuXion Global). Responde en español. Experto en nutrición biotecnológica FuXion y negocio en 37 países. Máx 3 oraciones, amable, usa emojis. Link: ${FUXION_LINK}. WhatsApp: +${WA}.`;
      const history=msgs.concat(um).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:300,system:sys,messages:history})});
      const data=await res.json();
      setMsgs(m=>[...m,{role:"assistant",text:data.content?.map(b=>b.text||"").join("")||"Intenta de nuevo 🌿"}]);
    } catch { setMsgs(m=>[...m,{role:"assistant",text:"Error. Contáctanos por WhatsApp 💬"}]); }
    finally { setLoading(false); }
  };
  if (!open) return null;
  return (
    <div style={{position:"fixed",bottom:84,right:20,width:295,zIndex:300,background:"rgba(250,250,247,0.97)",backdropFilter:"blur(20px)",border:"1.5px solid rgba(45,106,79,0.22)",borderRadius:18,boxShadow:"0 20px 52px rgba(45,106,79,0.2)",overflow:"hidden"}}>
      <div style={{background:"#1a2e1a",padding:"11px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:"50%",background:"rgba(201,168,76,0.28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🌿</div><div><div style={{fontFamily:"'Playfair Display',Georgia,serif",color:"#fff",fontWeight:700,fontSize:12}}>Vita Advisor IA</div><div style={{fontFamily:"'Inter',sans-serif",color:"rgba(255,255,255,0.88)",fontSize:9}}>● Online</div></div></div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.85)",fontSize:15,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{height:240,overflowY:"auto",padding:"10px 10px 4px",display:"flex",flexDirection:"column",gap:7}}>
        {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",background:m.role==="user"?"#1a2e1a":"rgba(45,106,79,0.08)",color:m.role==="user"?"#fff":"#1a2e1a",borderRadius:10,padding:"6px 9px",fontFamily:"'Inter',sans-serif",fontSize:11,lineHeight:1.5}}>{m.text}</div></div>)}
        {loading&&<div style={{display:"flex"}}><div style={{background:"rgba(45,106,79,0.08)",borderRadius:10,padding:"6px 11px",color:"#2d6a4f",fontSize:15}}>···</div></div>}
        <div ref={botRef}/>
      </div>
      <div style={{padding:"6px 9px 9px",borderTop:"1px solid rgba(45,106,79,0.09)",display:"flex",gap:5}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Pregúntame sobre salud o negocio..." style={{flex:1,background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.18)",borderRadius:7,padding:"7px 9px",fontFamily:"'Inter',sans-serif",fontSize:10,outline:"none",color:"#1a2e1a"}}/>
        <button onClick={send} disabled={loading} style={{background:"#1a2e1a",border:"none",borderRadius:7,width:30,color:"#fff",fontSize:13,cursor:"pointer"}}>→</button>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [scrollY,setScrollY]=useState(0); const [loaded,setLoaded]=useState(false);
  const [selCountry]=useState(detectCountry); const [recipeFilter,setRecipeFilter]=useState(0);
  const [activeRecipe,setActiveRecipe]=useState(null); const [prodLine,setProdLine]=useState(0);
  const [hovCard,setHovCard]=useState(null); const [chatOpen,setChatOpen]=useState(false);
  const [selectedCountry,setSelectedCountry]=useState(()=>detectCountry()||"");
  const [packModal,setPackModal]=useState(null); const [catalogOpen,setCatalogOpen]=useState(false);

  useEffect(()=>{
    setTimeout(()=>setLoaded(true),150);
    const onScroll=()=>setScrollY(window.scrollY);
    window.addEventListener("scroll",onScroll); return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  const waLink = `https://wa.me/${WA}?text=${encodeURIComponent(`Hola! Te contacto desde ${selCountry||"mi país"} para más info sobre Power Vita 🌿`)}`;
  const certDouble = [...CERTS,...CERTS];
  const testDouble = [...TESTIMONIALS,...TESTIMONIALS];
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
  const lineKeys = ["","Detox","Energy","Protein","Immunity","Sport","Control"];
  const lineLabels = ["Todos","Detox","Energy","Protein","Immunity","Sport","Control"];
  const filtProds = prodLine===0 ? PRODUCTS : PRODUCTS.filter(p=>p.line===lineKeys[prodLine]);
  const catKeys = ["","Detox","Energy","Immunity","Protein","Beauty"];
  const recipeLabels = ["Todos","Detox","Energy","Immunity","Protein","Beauty"];
  const filtRecipes = recipeFilter===0 ? RECIPES : RECIPES.filter(r=>r.cat===catKeys[recipeFilter]);
  const countryData = COUNTRY_DATA[selectedCountry] || (selectedCountry ? {
    flag: "🌍", currency: "USD", shipping: "Envío internacional disponible",
    note: "Los precios varían según tu país. Te enviamos la cotización exacta por WhatsApp.",
    popular: ["REXET","VITA XTRA T+","NUTRADAY"]
  } : null);

  const navSections = [["inicio","Inicio"],["catalogo","Catálogo"],["recetario","Recetario"],["precios","Precios"],["iatools","IA Tools"],["testimonios","Testimonios"],["contacto","Contacto"]];

  return (
    <div style={{fontFamily:"Georgia,serif",background:"#FAFAF7",color:"#1a2e1a",overflowX:"hidden"}}>
      <TrackingPixels/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        .pf{font-family:'Playfair Display',Georgia,serif}
        .int{font-family:'Inter',sans-serif}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes floatAnim{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes marquee2{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes loadingBar{0%{width:0%}100%{width:100%}}
        .fade-up{animation:fadeUp 0.75s ease forwards}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#2d6a4f;border-radius:3px}
      `}</style>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"0 40px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",background:scrollY>30?"rgba(250,250,247,0.95)":"transparent",backdropFilter:scrollY>30?"blur(20px)":"none",borderBottom:scrollY>30?"1px solid rgba(26,46,26,0.08)":"none",transition:"all 0.4s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>scrollTo("inicio")}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#2d6a4f,#1a2e1a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🌿</div>
          <span className="pf" style={{fontWeight:700,fontSize:17,color:"#1a2e1a",letterSpacing:-0.5}}>Power Vita</span>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
          {navSections.map(([id,n])=><button key={id} onClick={()=>scrollTo(id)} className="int" style={{background:"none",border:"none",color:"#4a6741",fontSize:11,fontWeight:500,cursor:"pointer",padding:"5px 9px",borderRadius:999,opacity:.85}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=.85}>{n}</button>)}
          <a href={waLink} target="_blank" rel="noreferrer" className="int" style={{background:"#1a2e1a",color:"#fff",padding:"8px 18px",borderRadius:100,fontSize:12,fontWeight:600,textDecoration:"none",marginLeft:4}}>Empezar →</a>
        </div>
      </nav>

      {/* HERO */}
      <section id="inicio" style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"100px 40px 70px",background:"linear-gradient(160deg,#FAFAF7 0%,#F0F4ED 55%,#E8F0E9 100%)",position:"relative",overflow:"hidden",textAlign:"center"}}>
        <div style={{position:"absolute",top:-70,right:-70,width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(45,106,79,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className={loaded?"fade-up":""} style={{position:"relative",zIndex:1,maxWidth:640}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",borderRadius:999,padding:"5px 16px",marginBottom:22}}>
            <span className="int" style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>FuXion Global · 37 Países</span>
          </div>
          <h1 className="pf" style={{fontSize:"clamp(2.4rem,5vw,4rem)",fontWeight:700,lineHeight:1.06,color:"#1a2e1a",letterSpacing:-2,marginBottom:20}}>
            Nutrición que<br/><em style={{fontStyle:"italic",color:"#2d6a4f"}}>transforma</em><br/>desde adentro.
          </h1>
          <p className="int" style={{fontSize:16,lineHeight:1.8,color:"#5a7a5a",maxWidth:460,margin:"0 auto 36px",fontWeight:300}}>
            Biotecnología avanzada en cada producto FuXion. Certificado, natural y con entrega directa en 37 países.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:52}}>
            <button onClick={()=>scrollTo("catalogo")} className="int" style={{background:"#1a2e1a",color:"#fff",padding:"13px 28px",borderRadius:100,fontWeight:600,fontSize:13,border:"none",cursor:"pointer"}}>Ver productos</button>
            <a href={waLink} target="_blank" rel="noreferrer" className="int" style={{background:"transparent",color:"#1a2e1a",border:"1.5px solid rgba(26,46,26,0.22)",padding:"13px 28px",borderRadius:100,fontWeight:600,fontSize:13,textDecoration:"none"}}>💬 WhatsApp</a>
          </div>
          <div style={{display:"flex",gap:40,justifyContent:"center"}}>
            {[["37","países"],["15K+","socios"],["100%","natural"]].map(([n,l])=>(
              <div key={l}><div className="pf" style={{fontSize:26,fontWeight:700,color:"#1a2e1a",lineHeight:1}}>{n}</div><div className="int" style={{fontSize:10,color:"#7a9a7a",marginTop:3,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTS */}
      <div style={{background:"#1a2e1a",padding:"12px 0",overflow:"hidden"}}>
        <div style={{display:"flex",gap:48,animation:"marquee 28s linear infinite",width:"max-content"}}>
          {certDouble.map((c,i)=><span key={i} className="int" style={{color:"rgba(255,255,255,0.75)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>✦ {c}</span>)}
        </div>
      </div>

      {/* DUAL CARDS */}
      <section style={{padding:"72px 40px",background:"#F0F4ED"}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
          {[
            {icon:"🌿",tag:"HEALTH & WELLNESS",title:"The Clean Label Revolution",body:"Accede a nutrición biotecnológica pura en 37 países.",cta:"Shop Products",bg:"#fff",border:"rgba(45,106,79,0.18)",btn:"#1a2e1a",titleC:"#1a2e1a",tagC:"#2d6a4f",bodyC:"#7a9a7a"},
            {icon:"👑",tag:"GLOBAL BUSINESS",title:"Build a Global Legacy",body:"Escala tu negocio a 37 países con logística llave en mano.",cta:"Become a Partner",bg:"linear-gradient(135deg,rgba(201,168,76,0.1),#fff)",border:"rgba(201,168,76,0.36)",btn:"linear-gradient(135deg,#C9A84C,#E8C86A)",titleC:"#8B6914",tagC:"#C9A84C",bodyC:"#7a6020"},
          ].map((card,i)=>(
            <a key={i} href={FUXION_LINK} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div style={{background:card.bg,border:`1.5px solid ${card.border}`,borderRadius:20,padding:"28px 24px",cursor:"pointer",transition:"transform .3s,box-shadow .3s",boxShadow:"0 4px 18px rgba(0,0,0,0.05)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.boxShadow="0 16px 44px rgba(0,0,0,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,0.05)";}}>
                <div style={{fontSize:26,marginBottom:9}}>{card.icon}</div>
                <div className="int" style={{fontSize:9,fontWeight:800,letterSpacing:2.5,color:card.tagC,textTransform:"uppercase",marginBottom:7}}>{card.tag}</div>
                <h3 className="pf" style={{fontSize:19,fontWeight:700,color:card.titleC,marginBottom:7}}>{card.title}</h3>
                <p className="int" style={{fontSize:12,color:card.bodyC,lineHeight:1.65,marginBottom:20}}>{card.body}</p>
                <div style={{background:card.btn,color:"#fff",borderRadius:10,padding:"10px 16px",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,textAlign:"center"}}>{card.cta} →</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* SISTEMA FUXION + PACKS */}
      <section id="catalogo" style={{padding:"80px 40px",background:"#FAFAF7"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>Sistema FuXion</span>
            <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a",lineHeight:1.1,marginBottom:12}}>Salud plena en <em style={{color:"#2d6a4f",fontStyle:"italic"}}>3 pasos</em></h2>
            <p className="int" style={{color:"#7a9a7a",fontSize:13,maxWidth:480,margin:"0 auto",lineHeight:1.7}}>Un sistema progresivo diseñado por biotecnólogos. Cada paso potencia al siguiente.</p>
          </div>

          {/* 3 pasos */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,marginBottom:56}}>
            {[
              {step:"01",icon:"🌿",color:"#2d6a4f",bg:"#f0f7f3",title:"Limpieza & Detox",sub:"Libera tu cuerpo de toxinas",desc:"Prepara tu organismo eliminando lo que bloquea tu salud.",prods:["Reset","Flora Liv","Liquid Fibra","Berry Balance","Alpha Balance"]},
              {step:"02",icon:"💪",color:"#1565C0",bg:"#f0f4fb",title:"Regeneración Celular",sub:"Proteínas de alta biodisponibilidad",desc:"Reconstruye tus células y eleva tus defensas desde adentro.",prods:["Biopro+ Tect","Biopro+ Fit","Protein Active Fit","Protein Active Sport"]},
              {step:"03",icon:"⚡",color:"#7B3FA0",bg:"#f5f0f9",title:"Energía & Vitalidad",sub:"Revitalización profunda",desc:"Recuperá tu energía natural y rendí al máximo cada día.",prods:["Vita Xtra T+","Nutraday","On","No Stress"]},
            ].map((p,i)=>(
              <div key={i} style={{background:"#fff",border:`1.5px solid ${p.color}18`,borderRadius:22,overflow:"hidden",boxShadow:"0 4px 18px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column"}}>
                <div style={{background:p.bg,padding:"24px 22px 18px",borderBottom:`1px solid ${p.color}12`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:40,height:40,borderRadius:12,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{p.icon}</div>
                    <div><div className="int" style={{fontSize:9,fontWeight:800,color:p.color,letterSpacing:2,textTransform:"uppercase"}}>PASO {p.step}</div><div className="pf" style={{fontSize:15,fontWeight:700,color:"#1a2e1a"}}>{p.title}</div></div>
                  </div>
                  <div className="int" style={{fontSize:10,fontWeight:700,color:p.color,marginBottom:4}}>{p.sub}</div>
                  <p className="int" style={{fontSize:12,color:"#7a9a7a",lineHeight:1.6}}>{p.desc}</p>
                </div>
                <div style={{padding:"14px 22px 18px",flex:1}}>
                  <div className="int" style={{fontSize:9,fontWeight:800,color:"#9ca3af",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Productos incluidos</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {p.prods.map(pr=><span key={pr} style={{background:p.color+"10",border:`1px solid ${p.color}22`,borderRadius:999,padding:"3px 9px",fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:600,color:p.color}}>{pr}</span>)}
                    <span style={{background:"rgba(0,0,0,0.04)",borderRadius:999,padding:"3px 9px",fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9ca3af"}}>+más</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Packs */}
          <div style={{textAlign:"center",marginBottom:28}}>
            <h3 className="pf" style={{fontSize:"clamp(1.3rem,2.5vw,1.9rem)",fontWeight:700,color:"#1a2e1a",marginBottom:8}}>Armá tu <em style={{color:"#2d6a4f",fontStyle:"italic"}}>pack</em></h3>
            <p className="int" style={{color:"#7a9a7a",fontSize:12}}>Combinamos los mejores productos según tu objetivo y tu país</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20,marginBottom:40}}>
            {[
              {id:"pack3",name:"Pack 3 Productos",emoji:"🌱",tag:"Para comenzar el sistema",color:"#2d6a4f",badge:null,desc:"Un producto de cada paso: Detox + Proteína + Energía. El inicio ideal para transformar tu salud.",includes:["1 producto Detox","1 producto Proteína","1 producto Energía","Guía de uso personalizada","Soporte por WhatsApp"]},
              {id:"pack5",name:"Pack 5 Productos",emoji:"👑",tag:"Cobertura completa",color:"#C9A84C",badge:"RECOMENDADO",desc:"Cobertura completa del sistema en los 3 pasos. Resultados visibles desde las primeras semanas.",includes:["2 productos Detox","2 productos Proteína","1 producto Energía","Plan nutricional 30 días","Seguimiento personalizado","Comunidad VIP Power Vita"]},
            ].map((pack,i)=>(
              <div key={pack.id} style={{background:"#fff",border:`2px solid ${i===1?pack.color+"40":"rgba(0,0,0,0.06)"}`,borderRadius:22,padding:"26px 22px",position:"relative",boxShadow:i===1?`0 12px 36px ${pack.color}18`:"0 3px 14px rgba(0,0,0,0.04)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.boxShadow=`0 20px 52px ${pack.color}25`;}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=i===1?`0 12px 36px ${pack.color}18`:"0 3px 14px rgba(0,0,0,0.04)";}}>
                {pack.badge&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:pack.color,color:"#fff",borderRadius:999,padding:"3px 14px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,letterSpacing:1.5,whiteSpace:"nowrap"}}>{pack.badge}</div>}
                <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
                  <div style={{width:48,height:48,borderRadius:14,background:`${pack.color}12`,border:`2px solid ${pack.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{pack.emoji}</div>
                  <div><div className="pf" style={{fontSize:16,fontWeight:700,color:"#1a2e1a"}}>{pack.name}</div><div className="int" style={{fontSize:9,fontWeight:700,color:pack.color,letterSpacing:1,textTransform:"uppercase"}}>{pack.tag}</div></div>
                </div>
                <p className="int" style={{fontSize:12,color:"#7a9a7a",lineHeight:1.65,marginBottom:14}}>{pack.desc}</p>
                <div style={{marginBottom:18}}>{pack.includes.map((item,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}><div style={{width:15,height:15,borderRadius:"50%",background:`${pack.color}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:pack.color,fontSize:8,fontWeight:800}}>✓</span></div><span className="int" style={{fontSize:11,color:"#4a5568"}}>{item}</span></div>)}</div>
                <div style={{display:"flex",gap:8}}>
                  <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hola! Me interesa el ${pack.name} de Power Vita FuXion 🌿 ¿Cuál es el precio en mi país?`)}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#25D366",color:"#fff",borderRadius:10,padding:"10px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>💬 Consultar precio</a>
                  <button onClick={()=>{trackEvent("Purchase",{content_name:pack.name,content_type:"product",currency:"USD"});setPackModal(pack.name);}} style={{flex:1,background:`linear-gradient(135deg,${pack.color}cc,${pack.color})`,color:"#fff",border:"none",borderRadius:10,padding:"10px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>🛒 Armar mi pack</button>
                </div>
              </div>
            ))}
          </div>

          {/* Catálogo colapsado */}
          <div style={{textAlign:"center"}}>
            <button onClick={()=>setCatalogOpen(o=>!o)} className="int" style={{background:"none",border:"1.5px solid rgba(45,106,79,0.2)",borderRadius:999,padding:"10px 24px",fontSize:12,fontWeight:600,color:"#2d6a4f",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(45,106,79,0.05)";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
              {catalogOpen?"▲ Ocultar catálogo completo":"▼ Ver todos los productos"}
            </button>
          </div>
          {catalogOpen&&(
            <div style={{marginTop:32}}>
              <div style={{display:"flex",gap:7,marginBottom:24,flexWrap:"wrap"}}>
                {lineLabels.map((l,i)=>{const lc=i===0?"#1a2e1a":LINE_COLORS[lineKeys[i]]||"#1a2e1a";return(<button key={i} onClick={()=>setProdLine(i)} className="int" style={{padding:"6px 14px",borderRadius:999,fontWeight:700,fontSize:10,cursor:"pointer",border:"2px solid",borderColor:prodLine===i?lc:"rgba(26,46,26,0.14)",background:prodLine===i?lc:"transparent",color:prodLine===i?"#fff":lc,transition:"all .2s"}}>{l}</button>);})}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
                {filtProds.map(p=>(
                  <div key={p.id} onMouseEnter={()=>setHovCard(p.id)} onMouseLeave={()=>setHovCard(null)} style={{background:"#fff",borderRadius:18,overflow:"hidden",border:`1px solid ${hovCard===p.id?p.color+"45":"rgba(0,0,0,0.06)"}`,boxShadow:hovCard===p.id?`0 14px 36px ${p.color}18`:"0 2px 10px rgba(0,0,0,0.04)",transition:"all .3s",transform:hovCard===p.id?"translateY(-4px)":"translateY(0)",display:"flex",flexDirection:"column"}}>
                    <div style={{background:hovCard===p.id?p.color:p.bg,height:120,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"background .3s"}}>
                      <div style={{position:"absolute",top:8,left:8,background:hovCard===p.id?"rgba(255,255,255,0.22)":p.color,color:"#fff",borderRadius:999,padding:"2px 8px",fontFamily:"'Inter',sans-serif",fontSize:7,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{p.line}</div>
                      {p.img?<img src={p.img} alt={p.name} style={{maxHeight:100,maxWidth:"85%",objectFit:"contain",filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.1))"}} onError={e=>{e.target.style.display="none";if(e.target.nextSibling)e.target.nextSibling.style.display="flex";}}/>:null}
                      <div style={{display:p.img?"none":"flex",fontSize:40,alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>{p.emoji}</div>
                    </div>
                    <div style={{padding:"13px 14px",flex:1,display:"flex",flexDirection:"column",gap:4}}>
                      <div className="pf" style={{fontSize:12,fontWeight:700,color:"#1a2e1a"}}>{p.name}</div>
                      <p className="int" style={{fontSize:10,color:"#7a9a7a",lineHeight:1.5,flex:1}}>{p.desc}</p>
                      <div style={{display:"flex",gap:5,marginTop:6}}>
                        <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hola! Me interesa ${p.name} de FuXion. ¿Precio en mi país? 🌿`)}`} target="_blank" rel="noreferrer" style={{flex:1,background:"#25D366",color:"#fff",borderRadius:8,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,textAlign:"center",textDecoration:"none"}}>💬 Precio</a>
                        <button onClick={()=>{trackEvent("Purchase",{content_name:p.name,content_type:"product",currency:"USD"});setPackModal(p.name);}} style={{flex:1,background:p.color,color:"#fff",border:"none",borderRadius:8,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,cursor:"pointer"}}>🛒 Comprar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RECETARIO */}
      <section id="recetario" style={{padding:"80px 40px",background:"#F0F4ED"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>Power Vita Kitchen</span>
            <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a",lineHeight:1.1}}>Recetas que <em style={{color:"#2d6a4f",fontStyle:"italic"}}>nutren y deleitan</em></h2>
          </div>
          <div style={{display:"flex",gap:7,justifyContent:"center",marginBottom:28,flexWrap:"wrap"}}>
            {recipeLabels.map((f,i)=><button key={i} onClick={()=>setRecipeFilter(i)} className="int" style={{padding:"7px 16px",borderRadius:999,fontWeight:700,fontSize:10,cursor:"pointer",border:"2px solid",borderColor:recipeFilter===i?"#1a2e1a":"rgba(26,46,26,0.14)",background:recipeFilter===i?"#1a2e1a":"transparent",color:recipeFilter===i?"#fff":"#1a2e1a",transition:"all .2s"}}>{f}</button>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(215px,1fr))",gap:14}}>
            {filtRecipes.map(r=>(
              <div key={r.id} style={{background:"#fff",borderRadius:18,overflow:"hidden",transition:"transform .25s,box-shadow .25s",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(201,168,76,0.2)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{background:"linear-gradient(135deg,#F0F4ED,#E0EBE0)",height:88,display:"flex",alignItems:"center",justifyContent:"center",fontSize:42}}>{r.img}</div>
                <div style={{padding:"12px 13px"}}>
                  <div className="int" style={{fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3,color:r.cat==="Detox"?"#2d6a4f":r.cat==="Energy"?"#7B3FA0":r.cat==="Immunity"?"#1565C0":r.cat==="Protein"?"#1565C0":"#C2185B"}}>{r.cat}</div>
                  <h3 className="pf" style={{fontSize:12,fontWeight:700,color:"#1a2e1a",marginBottom:3}}>{r.name}</h3>
                  <div className="int" style={{fontSize:9,color:"#C9A84C",fontWeight:700,marginBottom:6}}>✦ {r.product}</div>
                  <ul style={{listStyle:"none",padding:0,margin:"0 0 9px"}}>{r.ingredients.slice(0,4).map((ing,i)=><li key={i} className="int" style={{fontSize:9,color:"#7a9a7a",padding:"1px 0",display:"flex",gap:4}}><span style={{color:"#2d6a4f"}}>·</span>{ing}</li>)}{r.ingredients.length>4&&<li className="int" style={{fontSize:8,color:"#C9A84C"}}>+{r.ingredients.length-4} más...</li>}</ul>
                  <button onClick={()=>setActiveRecipe(r)} style={{width:"100%",background:"#1a2e1a",color:"#fff",border:"none",borderRadius:8,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:9,cursor:"pointer"}}>Ver Preparación →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL RECETA */}
      {activeRecipe && (
        <div onClick={()=>setActiveRecipe(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.52)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#FAFAF7",borderRadius:18,padding:26,maxWidth:390,width:"100%",position:"relative"}}>
            <button onClick={()=>setActiveRecipe(null)} style={{position:"absolute",top:11,right:11,background:"none",border:"none",fontSize:16,cursor:"pointer",color:"#1a2e1a"}}>✕</button>
            <div style={{fontSize:40,textAlign:"center",marginBottom:7}}>{activeRecipe.img}</div>
            <h3 className="pf" style={{fontSize:16,fontWeight:700,color:"#1a2e1a",textAlign:"center",marginBottom:2}}>{activeRecipe.name}</h3>
            <div className="int" style={{textAlign:"center",color:"#C9A84C",fontWeight:700,fontSize:9,marginBottom:11}}>✦ {activeRecipe.product}</div>
            <ul style={{listStyle:"none",padding:0,margin:"0 0 10px"}}>{activeRecipe.ingredients.map((ing,i)=><li key={i} className="int" style={{fontSize:11,color:"#7a9a7a",padding:"2px 0",display:"flex",gap:6}}><span style={{color:"#C9A84C"}}>·</span>{ing}</li>)}</ul>
            <div style={{background:"rgba(45,106,79,0.06)",borderRadius:10,padding:"10px 13px",borderLeft:"3px solid #2d6a4f"}}><p className="int" style={{fontSize:12,lineHeight:1.65,color:"#2d5a3d",fontStyle:"italic"}}>{activeRecipe.prep}</p></div>
          </div>
        </div>
      )}

      {/* PRECIOS POR PAÍS */}
      <section id="precios" style={{padding:"80px 40px",background:"#FAFAF7"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>Precios & Packs</span>
            <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a",lineHeight:1.1,marginBottom:10}}>¿Cuánto cuesta <em style={{color:"#2d6a4f",fontStyle:"italic"}}>empezar?</em></h2>
            <p className="int" style={{color:"#7a9a7a",fontSize:13,maxWidth:440,margin:"0 auto",lineHeight:1.7}}>Los precios varían según tu país. Seleccioná y te enviamos la info exacta.</p>
          </div>
          {/* Selector */}
          <div style={{maxWidth:460,margin:"0 auto 44px",background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:20,padding:"22px 24px",boxShadow:"0 6px 24px rgba(45,106,79,0.06)"}}>
            {detectCountry()&&COUNTRY_DATA[detectCountry()]&&<div style={{display:"flex",alignItems:"center",gap:9,background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.1)",borderRadius:10,padding:"8px 11px",marginBottom:11}}><span style={{fontSize:16}}>{COUNTRY_DATA[detectCountry()]?.flag}</span><div style={{flex:1}}><div className="int" style={{fontSize:10,fontWeight:700,color:"#2d6a4f"}}>📍 Tu ubicación detectada</div><div className="int" style={{fontSize:9,color:"#7a9a7a"}}>Estás en <strong>{detectCountry()}</strong></div></div><div style={{width:6,height:6,borderRadius:"50%",background:"#25D366",animation:"pulse 2s ease-in-out infinite"}}/></div>}
            <label className="int" style={{fontSize:10,fontWeight:700,color:"#2d6a4f",letterSpacing:1,display:"block",marginBottom:5}}>SELECCIONÁ TU PAÍS</label>
            <select value={selectedCountry} onChange={e=>setSelectedCountry(e.target.value)} style={{width:"100%",background:"rgba(45,106,79,0.04)",border:"1.5px solid rgba(45,106,79,0.16)",borderRadius:10,padding:"9px 12px",fontFamily:"'Inter',sans-serif",fontSize:12,outline:"none",cursor:"pointer",color:selectedCountry?"#1a2e1a":"#9ca3af",boxSizing:"border-box",marginBottom:12}}>
              <option value="">🌍 Seleccioná tu país...</option>
              {COUNTRIES.map(c=><option key={c} value={c}>{COUNTRY_DATA[c]?.flag||"🌐"} {c}</option>)}
            </select>
            {selectedCountry && countryData && (
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:9}}>
                  <div style={{background:"rgba(45,106,79,0.05)",borderRadius:9,padding:"9px 11px"}}><div className="int" style={{fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:2}}>💱 MONEDA</div><div className="int" style={{fontSize:14,fontWeight:800,color:"#1a2e1a"}}>{countryData.currency}</div></div>
                  <div style={{background:"rgba(45,106,79,0.05)",borderRadius:9,padding:"9px 11px"}}><div className="int" style={{fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:2}}>🚚 ENVÍO</div><div className="int" style={{fontSize:10,fontWeight:700,color:"#1a2e1a",lineHeight:1.3}}>{countryData.shipping}</div></div>
                </div>
                <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.16)",borderRadius:9,padding:"7px 10px",marginBottom:9}}><p className="int" style={{fontSize:10,color:"#8B6914",lineHeight:1.5}}>ℹ️ {countryData.note}</p></div>
                <div style={{marginBottom:11}}><div className="int" style={{fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:4}}>🔥 MÁS PEDIDOS EN {selectedCountry.toUpperCase()}</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{countryData.popular.map(p=><div key={p} style={{background:"#fff",border:"1px solid rgba(45,106,79,0.13)",borderRadius:7,padding:"2px 8px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f"}}>{p}</div>)}</div></div>
                <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`¡Hola! Estoy en ${selectedCountry} ${countryData.flag} y quiero ver los precios de FuXion 🌿`)}`} target="_blank" rel="noreferrer" style={{display:"block",width:"100%",background:"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",borderRadius:10,padding:"11px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>{countryData.flag} Ver precios para {selectedCountry} →</a>
              </div>
            )}
            {!selectedCountry&&<div style={{textAlign:"center",padding:"8px 0"}}><div style={{fontSize:24,marginBottom:4}}>🌍</div><p className="int" style={{fontSize:11,color:"#9ca3af"}}>Seleccioná tu país para ver precios</p></div>}
          </div>
        </div>
      </section>

      {/* IA TOOLS */}
      <section id="iatools" style={{padding:"80px 40px",background:"linear-gradient(160deg,#020b18,#041a0e 50%,#020b18)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(45,106,79,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(45,106,79,0.06) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"10%",left:"15%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(45,106,79,0.15) 0%,transparent 70%)",pointerEvents:"none",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",bottom:"10%",right:"10%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.1) 0%,transparent 70%)",pointerEvents:"none",filter:"blur(40px)"}}/>
        <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:60}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.36)",borderRadius:999,padding:"7px 20px",marginBottom:18}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#FFD700",display:"inline-block",animation:"pulse 2s ease-in-out infinite"}}/>
              <span className="int" style={{fontSize:10,fontWeight:800,color:"#FFD700",letterSpacing:3,textTransform:"uppercase"}}>Powered by Claude AI</span>
            </div>
            <h2 className="pf" style={{fontSize:"clamp(1.8rem,4vw,3rem)",fontWeight:700,color:"#fff",marginBottom:14,lineHeight:1.1}}>
              Herramientas con<br/>
              <span style={{background:"linear-gradient(135deg,#C9A84C,#FFD700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontStyle:"italic"}}>Inteligencia Artificial</span>
            </h2>
            <p className="int" style={{color:"rgba(255,255,255,0.85)",fontSize:14,maxWidth:480,margin:"0 auto",lineHeight:1.8}}>4 herramientas que <span style={{color:"#FFD700",fontWeight:700}}>ningún otro distribuidor FuXion</span> en el mundo tiene. Gratis.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:22}}>
            {/* NutriPlan */}
            <div style={{background:"rgba(10,28,18,0.8)",backdropFilter:"blur(20px)",border:"1px solid rgba(45,106,79,0.3)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.45)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.55),0 0 100px rgba(45,106,79,0.18)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.45)";}}>
              <div style={{height:2,background:"linear-gradient(90deg,transparent,#2d6a4f,#52b788,#2d6a4f,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(45,106,79,0.14)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(45,106,79,0.28)",border:"1px solid rgba(45,106,79,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🥗</div><div style={{flex:1}}><div className="pf" style={{color:"#fff",fontWeight:700,fontSize:12,marginBottom:1}}>Plan Nutricional IA</div><div className="int" style={{color:"rgba(255,255,255,0.8)",fontSize:9}}>7 días · Personalizado · FuXion</div></div><div style={{background:"rgba(82,183,136,0.18)",border:"1px solid rgba(82,183,136,0.45)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#52b788"}}>AI ✦</div></div>
              <NutriPlan/>
            </div>
            {/* SymptomAnalyzer */}
            <div style={{background:"rgba(8,18,42,0.82)",backdropFilter:"blur(20px)",border:"1px solid rgba(21,101,192,0.3)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.45)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.55),0 0 100px rgba(21,101,192,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.45)";}}>
              <div style={{height:2,background:"linear-gradient(90deg,transparent,#1565C0,#42a5f5,#1565C0,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(21,101,192,0.14)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(21,101,192,0.28)",border:"1px solid rgba(66,165,245,0.36)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🔬</div><div style={{flex:1}}><div className="pf" style={{color:"#fff",fontWeight:700,fontSize:12,marginBottom:1}}>Analizador de Síntomas</div><div className="int" style={{color:"rgba(255,255,255,0.8)",fontSize:9}}>Diagnóstico · Productos ideales</div></div><div style={{background:"rgba(66,165,245,0.18)",border:"1px solid rgba(66,165,245,0.45)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#42a5f5"}}>AI ✦</div></div>
              <SymptomAnalyzer/>
            </div>
            {/* ROI Predictor */}
            <div style={{background:"rgba(18,12,3,0.88)",backdropFilter:"blur(20px)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.45)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.55),0 0 100px rgba(201,168,76,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.45)";}}>
              <div style={{height:2,background:"linear-gradient(90deg,transparent,#C9A84C,#FFD700,#C9A84C,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,168,76,0.14)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(201,168,76,0.28)",border:"1px solid rgba(255,215,0,0.36)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>💰</div><div style={{flex:1}}><div className="pf" style={{color:"#FFD700",fontWeight:700,fontSize:12,marginBottom:1}}>ROI Predictor IA</div><div className="int" style={{color:"rgba(255,255,255,0.8)",fontSize:9}}>Proyección · Ingresos reales</div></div><div style={{background:"rgba(255,215,0,0.13)",border:"1px solid rgba(255,215,0,0.45)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#FFD700"}}>AI ✦</div></div>
              <ROIPredictor/>
            </div>
            {/* Elite Program */}
            <div style={{background:"rgba(10,5,1,0.9)",backdropFilter:"blur(20px)",border:"1px solid rgba(201,168,76,0.45)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.5),0 0 70px rgba(201,168,76,0.07)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.6),0 0 120px rgba(201,168,76,0.18)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.5),0 0 70px rgba(201,168,76,0.07)";}}>
              <div style={{height:3,background:"linear-gradient(90deg,transparent,#C9A84C,#FFD700,#FFD700,#C9A84C,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,168,76,0.18)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(201,168,76,0.36)",border:"1px solid rgba(255,215,0,0.48)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👑</div><div style={{flex:1}}><div className="pf" style={{color:"#FFD700",fontWeight:700,fontSize:12,marginBottom:1}}>Elite Program 90 días</div><div className="int" style={{color:"rgba(255,255,255,0.8)",fontSize:9}}>Plan completo · IA genera tu protocolo</div></div><div style={{background:"rgba(255,215,0,0.13)",border:"1px solid rgba(255,215,0,0.55)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#FFD700"}}>AI ✦</div></div>
              <EliteProgram/>
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:40}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 24px",flexWrap:"wrap",justifyContent:"center"}}>
              {[["🔒","100% Privado"],["⚡","Respuesta inmediata"],["🌿","Solo FuXion"],["🌍","37 países"]].map(([ic,lb],i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:5}}>{i>0&&<div style={{width:1,height:18,background:"rgba(255,255,255,0.08)"}}/>}<span style={{fontSize:13}}>{ic}</span><span className="int" style={{fontSize:10,color:"rgba(255,255,255,0.75)",fontWeight:600}}>{lb}</span></div>))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS + CONTADOR + ANTES/DESPUÉS */}
      <section id="testimonios" style={{padding:"80px 0",background:"#FAFAF7"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 40px"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>Testimonios reales</span>
            <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a"}}>Impacto <em style={{color:"#2d6a4f",fontStyle:"italic"}}>global real</em></h2>
          </div>
        </div>
        {/* Marquee fila 1 */}
        <div style={{overflow:"hidden",marginBottom:14}}>
          <div style={{display:"flex",gap:14,animation:"marquee 44s linear infinite",width:"max-content",paddingLeft:40}}>
            {testDouble.map((t,i)=>{const color=PACK_COLOR[t.pack]||"#2d6a4f";return(
              <div key={i} style={{minWidth:275,maxWidth:275,background:"#fff",border:"1px solid rgba(26,46,26,0.06)",borderRadius:18,padding:"17px",flexShrink:0,boxShadow:"0 2px 14px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",gap:9}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <Avatar name={t.name} color={t.color} size={46}/>
                    <div style={{position:"absolute",bottom:-2,right:-2,width:16,height:16,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}}>{t.flag}</div>
                  </div>
                  <div style={{flex:1}}><div className="int" style={{fontWeight:700,color:"#1a2e1a",fontSize:12}}>{t.name}</div><div className="int" style={{fontSize:9,color:"#9ca3af"}}>{t.country}</div><div className="int" style={{fontSize:8,fontWeight:700,color:"#C9A84C",textTransform:"uppercase",marginTop:1}}>{t.role}</div></div>
                  <div style={{background:"rgba(45,106,79,0.06)",border:"1px solid rgba(45,106,79,0.12)",borderRadius:999,padding:"2px 6px",fontFamily:"'Inter',sans-serif",fontSize:7,fontWeight:700,color:"#2d6a4f",alignSelf:"flex-start"}}>✓</div>
                </div>
                <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:"#C9A84C",fontSize:11}}>★</span>)}</div>
                <div><div className="pf" style={{fontSize:20,color:"#2d6a4f",lineHeight:0.8,marginBottom:4}}>"</div><p className="pf" style={{fontSize:11,fontStyle:"italic",color:"#1a2e1a",lineHeight:1.65}}>{t.text}</p></div>
                <div style={{display:"flex",gap:4,marginTop:"auto"}}>
                  <div style={{background:`${color}09`,border:`1px solid ${color}24`,borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color}}>{t.pack==="Elite Program"?"👑":t.pack==="Transform Kit"?"⚡":"🌱"} {t.pack}</div>
                  <div style={{background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.1)",borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:600,color:"#4a7c5e"}}>⏱ {t.days}d</div>
                </div>
              </div>
            );})}
          </div>
        </div>
        {/* Marquee fila 2 inversa */}
        <div style={{overflow:"hidden",marginBottom:52}}>
          <div style={{display:"flex",gap:14,animation:"marquee2 54s linear infinite",width:"max-content",paddingLeft:40}}>
            {[...testDouble.slice(5),...testDouble.slice(0,5)].map((t,i)=>{const color=PACK_COLOR[t.pack]||"#2d6a4f";return(
              <div key={i} style={{minWidth:275,maxWidth:275,background:"#fff",border:"1px solid rgba(26,46,26,0.06)",borderRadius:18,padding:"17px",flexShrink:0,boxShadow:"0 2px 14px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",gap:9}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <Avatar name={t.name} color={t.color} size={46}/>
                    <div style={{position:"absolute",bottom:-2,right:-2,width:16,height:16,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}}>{t.flag}</div>
                  </div>
                  <div style={{flex:1}}><div className="int" style={{fontWeight:700,color:"#1a2e1a",fontSize:12}}>{t.name}</div><div className="int" style={{fontSize:9,color:"#9ca3af"}}>{t.country}</div><div className="int" style={{fontSize:8,fontWeight:700,color:"#C9A84C",textTransform:"uppercase",marginTop:1}}>{t.role}</div></div>
                </div>
                <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:"#C9A84C",fontSize:11}}>★</span>)}</div>
                <div><div className="pf" style={{fontSize:20,color:"#2d6a4f",lineHeight:0.8,marginBottom:4}}>"</div><p className="pf" style={{fontSize:11,fontStyle:"italic",color:"#1a2e1a",lineHeight:1.65}}>{t.text}</p></div>
                <div style={{display:"flex",gap:4,marginTop:"auto"}}>
                  <div style={{background:`${color}09`,border:`1px solid ${color}24`,borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,color}}>{t.pack==="Elite Program"?"👑":t.pack==="Transform Kit"?"⚡":"🌱"} {t.pack}</div>
                </div>
              </div>
            );})}
          </div>
        </div>
        {/* Contador + Antes/Después */}
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 40px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:22,marginBottom:48}}>
            <ContadorTiempoReal/>
            <AntesDespues/>
          </div>
          {/* Stats */}
          <div style={{textAlign:"center",background:"linear-gradient(135deg,rgba(45,106,79,0.06),rgba(201,168,76,0.06))",border:"1px solid rgba(45,106,79,0.1)",borderRadius:18,padding:"32px 20px"}}>
            <div className="pf" style={{fontSize:"clamp(1.8rem,4vw,3rem)",fontWeight:700,color:"#1a2e1a",marginBottom:3}}>+<Counter target={15000}/></div>
            <div className="int" style={{fontSize:13,color:"#7a9a7a",fontWeight:600,marginBottom:18}}>Vidas impactadas en 37 países</div>
            <div style={{display:"flex",justifyContent:"center",gap:32,flexWrap:"wrap"}}>
              {[["37","Países"],["15K+","Socios"],["98%","Satisfacción"]].map(([v,l])=>(<div key={l}><div className="pf" style={{fontSize:20,fontWeight:700,color:"#C9A84C"}}>{v}</div><div className="int" style={{fontSize:9,color:"#7a9a7a",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>))}
            </div>
          </div>
        </div>
      </section>

      {/* LEAD FORM */}
      <section style={{padding:"80px 40px",background:"#F0F4ED"}}>
        <div style={{maxWidth:500,margin:"0 auto"}}>
          <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:22,padding:"38px 34px",boxShadow:"0 12px 44px rgba(45,106,79,0.07)",textAlign:"center"}}>
            <div style={{fontSize:38,marginBottom:9}}>🎯</div>
            <h2 className="pf" style={{fontSize:"clamp(1.2rem,2.5vw,1.8rem)",fontWeight:700,color:"#1a2e1a",marginBottom:7}}>Recibe tu Plan Personalizado</h2>
            <p className="int" style={{color:"#7a9a7a",fontSize:13,lineHeight:1.7,marginBottom:24}}>Déjanos tus datos y te enviamos por WhatsApp un plan adaptado a tus objetivos — sin costo.</p>
            <LeadFormInline/>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" style={{background:"#1a2e1a",padding:"44px 40px",textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:4}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(201,168,76,0.28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🌿</div>
          <div className="pf" style={{fontSize:18,color:"#C9A84C",letterSpacing:3,fontWeight:700}}>POWER VITA</div>
        </div>
        <div className="int" style={{color:"rgba(255,255,255,0.32)",fontSize:10,marginBottom:20}}>Distribuidor FuXion Global Autorizado</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
          <a href={waLink} target="_blank" rel="noreferrer" className="int" style={{background:"#25D366",color:"#fff",padding:"9px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>💬 WhatsApp</a>
          <a href="https://instagram.com/powervita_uy" target="_blank" rel="noreferrer" className="int" style={{background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",color:"#fff",padding:"9px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>📸 @powervita_uy</a>
          <a href={FUXION_LINK} target="_blank" rel="noreferrer" className="int" style={{background:"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",padding:"9px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>🌐 FuXion Store</a>
        </div>
        <div className="int" style={{color:"rgba(255,255,255,0.16)",fontSize:9}}>© 2025 Power Vita · @powervita_uy · +598 98 950 206</div>
      </footer>

      {/* MODAL CLIENTE / EMPRENDEDOR */}
      {packModal&&(
        <div onClick={()=>setPackModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(10px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:24,padding:"36px 30px",maxWidth:400,width:"100%",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🌿</div>
            <h3 className="pf" style={{fontSize:20,fontWeight:700,color:"#1a2e1a",marginBottom:6}}>{packModal}</h3>
            <p className="int" style={{fontSize:13,color:"#7a9a7a",lineHeight:1.65,marginBottom:28}}>¿Qué te describe mejor? Elegí tu perfil para continuar en FuXion.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <a href={FUXION_LINK} target="_blank" rel="noreferrer" onClick={()=>setPackModal(null)} style={{display:"block",background:"linear-gradient(135deg,#2d6a4f,#1a2e1a)",color:"#fff",borderRadius:12,padding:"14px 20px",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,textDecoration:"none"}}>
                💚 Quiero los productos
                <div style={{fontSize:10,fontWeight:400,opacity:0.8,marginTop:2}}>Me registro como Cliente Preferente</div>
              </a>
              <a href={FUXION_LINK} target="_blank" rel="noreferrer" onClick={()=>setPackModal(null)} style={{display:"block",background:"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",borderRadius:12,padding:"14px 20px",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,textDecoration:"none"}}>
                💼 Quiero el negocio
                <div style={{fontSize:10,fontWeight:400,opacity:0.85,marginTop:2}}>Me registro como Emprendedor FuXion</div>
              </a>
            </div>
            <button onClick={()=>setPackModal(null)} className="int" style={{background:"none",border:"none",color:"#9ca3af",fontSize:12,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}

      <Chat open={chatOpen} onClose={()=>setChatOpen(false)}/>
      <button onClick={()=>setChatOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:250,width:48,height:48,borderRadius:"50%",border:"none",background:chatOpen?"#0d3d24":"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",fontSize:19,cursor:"pointer",boxShadow:"0 7px 20px rgba(26,46,26,0.38)",transition:"all .3s"}}>
        {chatOpen?"✕":"🌿"}
      </button>
      <Toast/>
    </div>
  );
}

// ── LEAD FORM INLINE ──────────────────────────────────────────────────────────
function LeadFormInline() {
  const [form,setForm]=useState({name:"",email:"",country:"",goal:""});
  const [sent,setSent]=useState(false); const [err,setErr]=useState("");
  const goals = [{v:"salud",l:"💚 Mejorar mi salud"},{v:"energia",l:"⚡ Más energía"},{v:"peso",l:"⚖️ Control de peso"},{v:"negocio",l:"💼 Negocio global"}];
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = () => {
    if (!form.name||!form.country||!form.goal) { setErr("Por favor completá todos los campos."); return; }
    setErr("");
    const gl = goals.find(g=>g.v===form.goal)?.l||form.goal;
    const msg = encodeURIComponent(`¡Hola! Soy ${form.name} de ${form.country} 🌍\nMe interesa: ${gl}\n${form.email?`Email: ${form.email}\n`:""}Quiero mi plan personalizado con Power Vita 🌿`);
    trackEvent("Lead", { content_name:gl, country:form.country });
    window.open(`https://wa.me/${WA}?text=${msg}`,"_blank");
    setSent(true);
  };
  const inp = { width:"100%", background:"rgba(45,106,79,0.04)", border:"1.5px solid rgba(45,106,79,0.16)", borderRadius:10, padding:"10px 12px", fontFamily:"'Inter',sans-serif", fontSize:12, outline:"none", color:"#1a2e1a", boxSizing:"border-box" };
  const lbl = { fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:"#2d6a4f", letterSpacing:.8, display:"block", marginBottom:5 };
  if (sent) return (
    <div style={{padding:"16px 0"}}>
      <div style={{fontSize:44,marginBottom:7}}>🎉</div>
      <h3 className="pf" style={{fontSize:16,fontWeight:700,color:"#1a2e1a",marginBottom:5}}>¡Listo! Te esperamos en WhatsApp</h3>
      <p className="int" style={{color:"#7a9a7a",fontSize:12,marginBottom:14}}>Tu mensaje fue preparado. Completá el envío.</p>
      <button onClick={()=>{setSent(false);setForm({name:"",email:"",country:"",goal:""}); }} className="int" style={{background:"none",border:"1.5px solid rgba(45,106,79,0.25)",color:"#2d6a4f",padding:"7px 18px",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700}}>Enviar otro →</button>
    </div>
  );
  return (
    <div>
      <div style={{marginBottom:10}}><label style={lbl}>NOMBRE *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Tu nombre" style={inp} onFocus={e=>e.target.style.borderColor="#2d6a4f"} onBlur={e=>e.target.style.borderColor="rgba(45,106,79,0.16)"}/></div>
      <div style={{marginBottom:10}}><label style={lbl}>EMAIL <span style={{color:"#aaa",fontWeight:400}}>(opcional)</span></label><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="tu@email.com" type="email" style={inp} onFocus={e=>e.target.style.borderColor="#2d6a4f"} onBlur={e=>e.target.style.borderColor="rgba(45,106,79,0.16)"}/></div>
      <div style={{marginBottom:10}}><label style={lbl}>PAÍS *</label><select value={form.country} onChange={e=>set("country",e.target.value)} style={{...inp,cursor:"pointer",color:form.country?"#1a2e1a":"#9ca3af"}}><option value="">Seleccioná tu país...</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div style={{marginBottom:18}}><label style={lbl}>¿QUÉ BUSCÁS? *</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{goals.map(g=><button key={g.v} onClick={()=>set("goal",g.v)} className="int" style={{padding:"9px 6px",borderRadius:9,fontWeight:700,fontSize:11,cursor:"pointer",border:"1.5px solid",transition:"all .2s",borderColor:form.goal===g.v?"#2d6a4f":"rgba(45,106,79,0.16)",background:form.goal===g.v?"#2d6a4f":"rgba(45,106,79,0.04)",color:form.goal===g.v?"#fff":"#2d6a4f"}}>{g.l}</button>)}</div></div>
      {err&&<p className="int" style={{color:"#e53e3e",fontSize:11,marginBottom:9,fontWeight:600}}>⚠️ {err}</p>}
      <button onClick={submit} className="int" style={{width:"100%",background:"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",border:"none",borderRadius:11,padding:"13px 0",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 7px 20px rgba(45,106,79,0.22)"}}>💬 Quiero mi plan gratis →</button>
      <p className="int" style={{fontSize:9,color:"#9ca3af",textAlign:"center",marginTop:7}}>Sin spam. Solo abrimos WhatsApp con tu info lista.</p>
    </div>
  );
}
