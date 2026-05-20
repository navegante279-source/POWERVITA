import { useState, useEffect, useRef, createContext, useContext } from "react";

const WA = "59898950206";
const FUXION_LINK = "https://ifuxion.com/andresvarela/enrollment/chooseperson";
const META_PIXEL_ID = "2212676212813152";

const COUNTRIES = ["Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Ecuador","El Salvador","España","Estados Unidos","Guatemala","Honduras","México","Nicaragua","Panamá","Paraguay","Perú","República Dominicana","Uruguay","Venezuela","Alemania","Australia","Bélgica","Canadá","Francia","Italia","Japón","Portugal","Reino Unido","Suiza","Sudáfrica","Emiratos Árabes","Singapur","Nueva Zelanda","Países Bajos","Austria","Israel"];

const COUNTRY_DATA = {
  "Uruguay":        { flag:"🇺🇾", currency:"UYU", shipping:"Envío express 24-48hs",       note:"Precios en pesos uruguayos con IVA incluido",              popular:["Prunex","Vita Xtra T+","Thermo T3"],          unavailable:["Pre Sport","Xpeed","Alpha Balance","Reset"] },
  "Argentina":      { flag:"🇦🇷", currency:"ARS", shipping:"Envío en 3-5 días hábiles",   note:"Precios en pesos argentinos. Aceptamos transferencia y MP", popular:["Nutraday","No Stress","Reset"],               unavailable:["Prunex","Xpeed"] },
  "Colombia":       { flag:"🇨🇴", currency:"COP", shipping:"Envío nacional en 2-4 días",  note:"Precios en pesos colombianos con IVA incluido",             popular:["Vita Xtra T+","Protein Active Fit","Flora Liv"],unavailable:["Prunex","Pre Sport"] },
  "México":         { flag:"🇲🇽", currency:"MXN", shipping:"Envío en 3-5 días hábiles",   note:"Precios en pesos mexicanos. Envío gratis sobre $500 MXN",   popular:["Reset","Thermo T3","Nutraday"],               unavailable:["Prunex"] },
  "España":         { flag:"🇪🇸", currency:"EUR", shipping:"Envío en 5-7 días hábiles",   note:"Precios en euros. Envío gratis sobre €50",                  popular:["Vita Xtra T+","No Stress","Youth Elixir"],    unavailable:["Prunex","Pre Sport"] },
  "Brasil":         { flag:"🇧🇷", currency:"BRL", shipping:"Frete em 5-7 dias úteis",     note:"Preços em reais. Frete grátis acima de R$150",              popular:["Nutraday","Biopro+ Tect","Reset"],            unavailable:["Prunex"] },
  "Chile":          { flag:"🇨🇱", currency:"CLP", shipping:"Envío en 2-4 días hábiles",   note:"Precios en pesos chilenos con despacho incluido",           popular:["Thermo T3","Vita Xtra T+","Flora Liv"],       unavailable:["Prunex"] },
  "Perú":           { flag:"🇵🇪", currency:"PEN", shipping:"Envío en 3-5 días hábiles",   note:"Precios en soles. Contra entrega disponible",               popular:["Reset","Nutraday","No Stress"],               unavailable:[] },
  "Estados Unidos": { flag:"🇺🇸", currency:"USD", shipping:"Shipping in 5-7 business days",note:"Prices in USD. Free shipping over $75",                    popular:["Vita Xtra T+","Protein Active Fit","Biopro+ Tect"],unavailable:["Prunex"] },
};

const PRODUCTS = [
  { id:1,  name:"Reset",             line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"https://powervita.vercel.app/rexet.jpg",   emoji:"🌿", tag:"Reinicia tu cuerpo",     desc:"Bebida efervescente que desintoxica y protege el hígado frente al exceso de alcohol o comidas grasosas.", benefits:["Desintoxica el hígado","Elimina toxinas","Reactiva el metabolismo"], ing:"Tuna roja · Alcachofa · Hierba luisa · Clorofila · Zinc" },
  { id:2,  name:"Liquid Fibra",      line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:null, emoji:"🍋", tag:"Digestión puntual",     desc:"Fibra prebiótica soluble que regula el ritmo digestivo y reduce la absorción de grasas.", benefits:["Regula la digestión","Nutre la flora intestinal","Reduce absorción de grasas"], ing:"Inulina · Oligofructuosa · Raíz de achicoria" },
  { id:3,  name:"Flora Liv",         line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:null, emoji:"🫧", tag:"Protege desde adentro",  desc:"Miles de millones de bacterias probióticas vivas para regenerar la microbiota y frenar la acidez.", benefits:["Regenera la microbiota","Optimiza la digestión","Frena la acidez"], ing:"Cultivos probióticos · Fibra prebiótica · Granadilla · Aguaymanto" },
  { id:4,  name:"Alpha Balance",     line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:null, emoji:"🥬", tag:"Cuerpo alcalino",        desc:"Concentrado verde con clorofila, alfalfa y espirulina para alcalinizar la sangre y eliminar metales pesados.", benefits:["Alcaliniza el organismo","Purifica la sangre","Elimina metales pesados"], ing:"Clorofila · Alfalfa · Espirulina · Chlorella · Pasto de trigo" },
  { id:5,  name:"Nutraday",          line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:null, emoji:"⚡", tag:"Vitalidad familiar",     desc:"Bebida multivitamínica con moringa, camu camu y quinua germinada. Ideal para toda la familia.", benefits:["12 vitaminas + 5 minerales","Fortalece las defensas","Desarrollo integral"], ing:"Moringa · Guayaba · Camu Camu · Açaí · Quinua germinada" },
  { id:6,  name:"Vita Xtra T+",     line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"https://powervita.vercel.app/vitaxtra.jpg", emoji:"🌟", tag:"Elimina la fatiga",  desc:"Energizante concentrado con guayusa, ginseng y micelio de cordyceps para eliminar la fatiga física y mental.", benefits:["Energía sostenida todo el día","Alto poder antioxidante","Elimina fatiga física y mental"], ing:"Guayusa · Ginseng · Cordyceps · Açaí · Maca" },
  { id:7,  name:"Xpeed",             line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:null, emoji:"🚀", tag:"Energía inmediata",      desc:"Bebida gasificada energizante lista para consumir, diseñada para elevar el estado de alerta físico inmediato.", benefits:["Energía inmediata","Eleva el estado de alerta","Sin caídas de energía"], ing:"Maca · Guaraná · Taurina vegetal · Vitamina C" },
  { id:8,  name:"Biopro+ Tect",     line:"Protein", color:"#1565C0", bg:"#f0f4fb", img:null, emoji:"🛡️", tag:"Activa tus defensas",    desc:"Proteína animal con bioferrina (patente láctea) formulada para elevar defensas inmunitarias en toda la familia.", benefits:["Eleva defensas inmunitarias","Regeneración celular","Fortalece huesos"], ing:"Bioferrina · Colostrum® · Aminoácidos esenciales · DHA" },
  { id:9,  name:"Protein Active Fit",line:"Protein", color:"#1565C0", bg:"#f0f4fb", img:"https://powervita.vercel.app/protein.jpg", emoji:"💪", tag:"Nutrición vegetal", desc:"Proteína 100% vegetal de quinua germinada y arroz. Sin lactosa ni alérgenos. Controla el apetito y la grasa.", benefits:["100% vegetal y sin lactosa","Acelera pérdida de grasa","Mantiene el músculo firme"], ing:"Quinua germinada · Arroz integral · Algas · DHA" },
  { id:10, name:"No Stress",         line:"Immunity",color:"#1565C0", bg:"#f0f4fb", img:null, emoji:"🧘", tag:"Equilibrio mental",      desc:"Té herbal relajante con ashwagandha y manzanilla que apaga el estrés y relaja la mente sin inducir sueño diurno.", benefits:["Reduce el estrés","Calma la irritabilidad","Claridad mental sin somnolencia"], ing:"Ashwagandha · Manzanilla · Vitaminas B · Minerales" },
  { id:11, name:"Youth Elixir",      line:"Immunity",color:"#1565C0", bg:"#f0f4fb", img:null, emoji:"✨", tag:"Activa tu juventud",     desc:"Fórmula con resveratrol y aminoácidos para retrasar el envejecimiento celular y mejorar el sueño profundo.", benefits:["Anti-envejecimiento celular","Mejora el sueño profundo","Vitalidad juvenil"], ing:"Resveratrol · Aminoácidos · Vitaminas · Extractos premium" },
  { id:12, name:"Pre Sport",         line:"Sport",   color:"#E65100", bg:"#fdf4ef", img:null, emoji:"🏃", tag:"Rendimiento máximo",     desc:"Bebida isotónica con curcumina y creatina que dilata los vasos sanguíneos y da energía explosiva antes del ejercicio.", benefits:["Energía explosiva","Mayor resistencia","Enfoque y concentración"], ing:"Curcumina · Creatina · Aminoácidos · Cafeína natural" },
  { id:13, name:"Thermo T3",         line:"Control", color:"#E65100", bg:"#fdf4ef", img:"https://powervita.vercel.app/thermo.jpg", emoji:"🔥", tag:"Activa tu metabolismo", desc:"Infusión de tres tés y carnitina que acelera la termogénesis para transformar la grasa corporal en energía.", benefits:["Activa la termogénesis","Quema grasa naturalmente","Control de peso efectivo"], ing:"Té verde · Té negro · Té rojo · Carnitina · Jengibre" },
  { id:14, name:"Prunex",            line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:null, emoji:"🫐", tag:"Limpieza natural",       desc:"Concentrado de ciruela y prebióticos para regular el tránsito intestinal y limpiar el colon en forma suave y efectiva.", benefits:["Regula el tránsito intestinal","Limpia el colon naturalmente","Reduce la hinchazón"], ing:"Ciruela pasa · Prebióticos · Enzimas digestivas · Magnesio" },
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
  { name:"María G.", age:34, country:"Uruguay", flag:"🇺🇾", pack:"Transform Kit", days:60, goal:"Bajar de peso", color:"#2d6a4f", before:{Peso:"Con sobrepeso",Energía:"⬇️ Baja",Digestión:"⬇️ Lenta",Sueño:"⬇️ Irregular"}, after:{Peso:"Peso saludable",Energía:"⬆️ Alta",Digestión:"⬆️ Fluida",Sueño:"⬆️ Profundo"}, diff:{Peso:"Notable mejora",Energía:"Muy mejorada",Digestión:"Muy mejorada",Sueño:"Mucho mejor"}, quote:"En 2 meses cambié completamente. Tengo energía para todo.", products:["REXET","THERMO T3","NO STRESS"] },
  { name:"Carlos R.", age:41, country:"Argentina", flag:"🇦🇷", pack:"Elite Program", days:90, goal:"Más energía y músculo", color:"#1565C0", before:{Peso:"Sin tono muscular",Energía:"⬇️ Agotado",Digestión:"⬇️ Pesada",Rendimiento:"⬇️ Bajo"}, after:{Peso:"Masa muscular ganada",Energía:"⬆️ Máxima",Digestión:"⬆️ Perfecta",Rendimiento:"⬆️ Alto"}, diff:{Peso:"Masa muscular↑",Energía:"Muy mejorada",Digestión:"Excelente",Rendimiento:"Alto nivel"}, quote:"El Elite Program fue lo mejor que hice. Gané músculo y energía.", products:["BIOPRO+ TECT","PROTEIN ACTIVE FIT","VITA XTRA T+"] },
  { name:"Ana P.", age:29, country:"España", flag:"🇪🇸", pack:"Starter Pack", days:30, goal:"Detox y digestión", color:"#7B3FA0", before:{Peso:"Hinchazón frecuente",Energía:"⬇️ Cansada",Digestión:"⬇️ Hinchada",Piel:"⬇️ Opaca"}, after:{Peso:"Sin hinchazón",Energía:"⬆️ Activa",Digestión:"⬆️ Plana",Piel:"⬆️ Radiante"}, diff:{Peso:"Visible mejora",Energía:"Mejorada",Digestión:"Muy mejorada",Piel:"Radiante"}, quote:"Solo 30 días y mi digestión cambió completamente.", products:["REXET","FLORA LIV","LIQUID FIBER"] },
];


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
function waHref(phone, text) {
  const msg = encodeURIComponent(text);
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")
    ? `whatsapp://send?phone=${phone}&text=${msg}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${msg}`;
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
  const T = useContext(LangCtx);
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
    if (plan.error) return <div style={{textAlign:"center",padding:20}}><div style={{fontSize:32,marginBottom:8}}>🌿</div><p style={{color:"#e53e3e",fontSize:13,fontWeight:600,marginBottom:4}}>{T.nutriErrTitle}</p><p style={{color:"#7a9a7a",fontSize:12,marginBottom:16}}>{T.nutriErrSub}</p><button onClick={()=>setPlan(null)} style={{background:"#2d6a4f",color:"#fff",border:"none",padding:"10px 20px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13}}>🔄 Reintentar</button></div>;
    return (
      <div style={{padding:"20px"}}>
        <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>🥗</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#1a2e1a",margin:"4px 0 2px"}}>{plan.titulo}</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#7a9a7a",fontStyle:"italic"}}>{plan.perfil}</p></div>
        <div style={{marginBottom:10}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:800,color:"#2d6a4f",letterSpacing:1.5,marginBottom:5}}>✦ PRODUCTOS</div>{plan.productos?.map((p,i)=><div key={i} style={{background:"rgba(45,106,79,0.05)",borderRadius:9,padding:"7px 10px",marginBottom:4,display:"flex",gap:7,alignItems:"flex-start"}}><span>🌿</span><div><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,color:"#1a2e1a",fontSize:11}}>{p.nombre}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#7a9a7a"}}>{p.beneficio}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#C9A84C",fontWeight:600}}>⏰ {p.cuando}</div></div></div>)}</div>
        <div style={{marginBottom:10}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:800,color:"#2d6a4f",letterSpacing:1.5,marginBottom:5}}>📅 7 DÍAS</div><div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:3}}>{plan.dias?.map((d,i)=><div key={i} style={{minWidth:95,background:"#fff",border:"1px solid rgba(45,106,79,0.1)",borderRadius:8,padding:"6px",flexShrink:0}}><div style={{fontFamily:"'Inter',sans-serif",fontWeight:700,color:"#2d6a4f",fontSize:11,textAlign:"center",background:"rgba(45,106,79,0.07)",borderRadius:4,padding:"1px 0",marginBottom:3}}>{d.dia}</div>{[{k:"desayuno",i:"🌅"},{k:"almuerzo",i:"☀️"},{k:"cena",i:"🌙"},{k:"snack",i:"🍎"}].map(({k,i:ic})=><div key={k} style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#4a5568",marginBottom:2}}>{ic} {d[k]}</div>)}</div>)}</div></div>
        {plan.tips && <div style={{marginBottom:12}}>{plan.tips.map((t,i)=><div key={i} style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#2d5a3d",padding:"2px 0",display:"flex",gap:5}}><span style={{color:"#C9A84C"}}>✓</span>{t}</div>)}</div>}
        <div style={{display:"flex",gap:7}}>
          <a href={waHref(WA, "¡Hola! Generé mi plan nutricional con Power Vita IA 🌿 Quiero empezar.")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"NutriPlan_WA"})} style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>{T.nutriStart}</a>
          <button onClick={()=>setPlan(null)} style={{flex:1,background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",color:"#2d6a4f",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>{T.nutriNew}</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>🥗</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#1a2e1a",margin:"4px 0 2px"}}>Plan Nutricional IA</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#7a9a7a"}}>Personalizado · 7 días · FuXion</p></div>
      <div style={{marginBottom:9}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#2d6a4f",letterSpacing:1,marginBottom:5}}>{T.nutriObj}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{goals.map(g=><button key={g} onClick={()=>setSelGoal(g)} style={{padding:"6px 4px",borderRadius:7,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",border:"1.5px solid",borderColor:selGoal===g?"#2d6a4f":"rgba(45,106,79,0.15)",background:selGoal===g?"#2d6a4f":"transparent",color:selGoal===g?"#fff":"#2d6a4f",transition:"all .2s"}}>{g}</button>)}</div></div>
      <div style={{marginBottom:9}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#2d6a4f",letterSpacing:1,marginBottom:5}}>{T.nutriSym}</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{symptoms.map(s=>{const sel=selSymptoms.includes(s);return <button key={s} onClick={()=>setSelSymptoms(p=>sel?p.filter(x=>x!==s):[...p,s])} style={{padding:"3px 7px",borderRadius:999,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",border:"1.5px solid",borderColor:sel?"#C9A84C":"rgba(45,106,79,0.15)",background:sel?"rgba(201,168,76,0.12)":"transparent",color:sel?"#8B6914":"#2d6a4f",transition:"all .2s"}}>{s}</button>;})}</div></div>
      <div style={{marginBottom:9}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#2d6a4f",letterSpacing:1,marginBottom:5}}>{T.nutriDiet}</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{diets.map(d=><button key={d} onClick={()=>setSelDiet(d)} style={{padding:"4px 9px",borderRadius:999,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",border:"1.5px solid",borderColor:selDiet===d?"#2d6a4f":"rgba(45,106,79,0.15)",background:selDiet===d?"#2d6a4f":"transparent",color:selDiet===d?"#fff":"#2d6a4f",transition:"all .2s"}}>{d}</button>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#2d6a4f",marginBottom:3}}>{T.nutriAge}</div><input value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} placeholder="32" style={inp}/></div>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#2d6a4f",marginBottom:3}}>{T.nutriWeight}</div><input value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} placeholder="70" style={inp}/></div>
      </div>
      <button onClick={generate} disabled={!selGoal||!selDiet||loading} style={{width:"100%",background:(!selGoal||!selDiet)?"rgba(45,106,79,0.25)":"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:(!selGoal||!selDiet)?"not-allowed":"pointer"}}>
        {loading?T.nutriLoading:T.nutriGen}
      </button>
    </div>
  );
}

// ── SYMPTOM ANALYZER ─────────────────────────────────────────────────────────
function SymptomAnalyzer() {
  const T = useContext(LangCtx);
  const [text,setText]=useState(""); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const examples = T.symptomExamples;
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
  const urgL = { bajo:T.symptomUrgBajo, medio:T.symptomUrgMedio, alto:T.symptomUrgAlto };
  if (result && !result.error) return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:26}}>🔬</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:"#1a2e1a",margin:"4px 0 5px"}}>Análisis completado</h3><div style={{display:"inline-flex",alignItems:"center",background:`${urgC[result.nivel_urgencia]}15`,border:`1px solid ${urgC[result.nivel_urgencia]}`,borderRadius:999,padding:"2px 10px"}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:urgC[result.nivel_urgencia]}}>{urgL[result.nivel_urgencia]}</span></div></div>
      <div style={{background:"rgba(45,106,79,0.05)",borderRadius:10,padding:"8px 10px",marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#2d6a4f",marginBottom:2}}>🧠 DIAGNÓSTICO</div><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#2d5a3d",lineHeight:1.6}}>{result.diagnostico}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#7a9a7a",marginTop:2,fontStyle:"italic"}}>📍 {result.causa_probable}</p></div>
      <div style={{marginBottom:8}}>{result.productos?.map((p,i)=><div key={i} style={{background:"#fff",border:"1px solid rgba(45,106,79,0.1)",borderRadius:9,padding:"7px 9px",marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,color:"#1a2e1a",fontSize:11}}>{p.nombre}</span><span style={{fontFamily:"'Inter',sans-serif",background:"#2d6a4f",color:"#fff",borderRadius:999,padding:"1px 6px",fontSize:11,fontWeight:700}}>{p.match}%</span></div><div style={{height:3,background:"rgba(45,106,79,0.1)",borderRadius:2,marginBottom:3}}><div style={{height:"100%",width:`${p.match}%`,background:"linear-gradient(90deg,#2d6a4f,#C9A84C)",borderRadius:2}}/></div><p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#7a9a7a"}}>{p.razon}</p></div>)}</div>
      <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:9,padding:"8px 10px",marginBottom:10}}><p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#8B6914",fontStyle:"italic"}}>{result.mensaje_motivador}</p></div>
      <div style={{display:"flex",gap:7}}>
        <a href={waHref(WA, "¡Hola! Analicé mis síntomas con Power Vita IA 🌿")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"Symptom_WA"})} style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>{T.symptomStart}</a>
        <button onClick={()=>{setResult(null);setText("");}} style={{flex:1,background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",color:"#2d6a4f",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>{T.symptomNew}</button>
      </div>
    </div>
  );
  return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>🔬</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#1a2e1a",margin:"4px 0 2px"}}>Analizador de Síntomas IA</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#7a9a7a"}}>Describí cómo te sentís · IA recomienda</p></div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={T.symptomPlaceholder} rows={3} style={{width:"100%",background:"rgba(45,106,79,0.04)",border:"1.5px solid rgba(45,106,79,0.18)",borderRadius:10,padding:"9px 11px",fontFamily:"'Inter',sans-serif",fontSize:11,outline:"none",resize:"none",color:"#1a2e1a",boxSizing:"border-box",marginBottom:7}} onFocus={e=>e.target.style.borderColor="#2d6a4f"} onBlur={e=>e.target.style.borderColor="rgba(45,106,79,0.18)"}/>
      <div style={{marginBottom:10}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#7a9a7a",marginBottom:4,fontWeight:600}}>💡 EJEMPLOS:</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{examples.map((e,i)=><button key={i} onClick={()=>setText(e)} style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#2d6a4f",background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.13)",borderRadius:6,padding:"3px 7px",cursor:"pointer"}}>{e}</button>)}</div></div>
      <button onClick={analyze} disabled={!text.trim()||loading} style={{width:"100%",background:!text.trim()?"rgba(45,106,79,0.25)":"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:!text.trim()?"not-allowed":"pointer"}}>
        {loading?T.symptomLoading:T.symptomAnalyze}
      </button>
    </div>
  );
}

// ── ROI PREDICTOR ─────────────────────────────────────────────────────────────
function ROIPredictor() {
  const T = useContext(LangCtx);
  const [form,setForm]=useState({country:"",hours:"",contacts:"",experience:""}); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const hours = T.roiHours;
  const contacts = T.roiContacts;
  const experience = T.roiExp;
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
  const potL = { bajo:T.roiPotBajo, medio:T.roiPotMedio, alto:T.roiPotAlto, muy_alto:T.roiPotMuyAlto };
  if (result && !result.error) return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:10}}><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,fontWeight:700,color:"#fff",margin:"4px 0 5px"}}>{result.perfil}</h3><div style={{display:"inline-flex",background:"rgba(201,168,76,0.18)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:999,padding:"3px 10px"}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:800,color:"#C9A84C"}}>{potL[result.potencial]}</span></div></div>
      <div style={{marginBottom:9}}>{[...T.roiMonths].map(({k,l})=>{const d=result[k];if(!d)return null;return(<div key={k} style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.9)"}}>{l}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:900,color:"#C9A84C"}}>${d.min?.toLocaleString()} – ${d.max?.toLocaleString()}</span></div><div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2}}><div style={{height:"100%",width:`${Math.min((d.max/12000)*100,100)}%`,background:"linear-gradient(90deg,#C9A84C,#FFD700)",borderRadius:2}}/></div></div>);})}</div>
      <div style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:9,padding:"7px 9px",marginBottom:8}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.95)",lineHeight:1.5}}>{result.ventaja_pais}</p></div>
      <div style={{marginBottom:9}}>{result.estrategia?.map((s,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:4}}><div style={{width:15,height:15,borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#FFD700)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:900,flexShrink:0,color:"#1a1a1a"}}>{i+1}</div><span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.95)",lineHeight:1.5}}>{s}</span></div>)}</div>
      <div style={{display:"flex",gap:7}}>
        <a href={waHref(WA, `¡Hola! Calculé mi potencial desde ${form.country} con Power Vita IA 💰 Quiero ser socio.`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"ROI_Socio_WA"})} style={{flex:1,background:"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>👑 Quiero ser socio</a>
        <button onClick={()=>{setResult(null);setForm({country:"",hours:"",contacts:"",experience:""}); }} style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",color:"rgba(255,255,255,0.95)",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>🔄 Recalcular</button>
      </div>
    </div>
  );
  return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28}}>💰</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#FFD700",margin:"4px 0 2px"}}>ROI Predictor IA</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.88)"}}>Proyección de ingresos con IA real</p></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.9)",marginBottom:4}}>{T.eliteCountry}</div><select value={form.country} onChange={e=>set("country",e.target.value)} style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(201,168,76,0.22)",borderRadius:9,padding:"8px 10px",fontFamily:"'Inter',sans-serif",color:form.country?"#fff":"rgba(255,255,255,0.35)",fontSize:11,outline:"none",cursor:"pointer",boxSizing:"border-box"}}><option value="">Seleccioná tu país...</option>{COUNTRIES.map(c=><option key={c} value={c} style={{color:"#1a1a1a"}}>{c}</option>)}</select></div>
      {[{label:T.roiHoursLabel,opts:hours,key:"hours"},{label:T.roiContactsLabel,opts:contacts,key:"contacts"},{label:T.roiExpLabel,opts:experience,key:"experience"}].map(({label,opts,key})=><div key={key} style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.9)",marginBottom:4}}>{label}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{opts.map(o=><button key={o} onClick={()=>set(key,o)} style={{padding:"6px 4px",borderRadius:7,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",border:"1.5px solid",borderColor:form[key]===o?"#C9A84C":"rgba(255,255,255,0.1)",background:form[key]===o?"rgba(201,168,76,0.18)":"rgba(255,255,255,0.04)",color:form[key]===o?"#C9A84C":"rgba(255,255,255,0.85)",transition:"all .2s"}}>{o}</button>)}</div></div>)}
      <button onClick={predict} disabled={!form.country||!form.hours||!form.contacts||!form.experience||loading} style={{width:"100%",background:(!form.country||!form.hours||!form.contacts||!form.experience)?"rgba(201,168,76,0.25)":"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",marginTop:4}}>
        {loading?T.roiLoading:T.roiCalc}
      </button>
    </div>
  );
}

// ── ELITE PROGRAM ─────────────────────────────────────────────────────────────
function EliteProgram() {
  const T = useContext(LangCtx);
  const [step,setStep]=useState(1); const [form,setForm]=useState({name:"",country:"",goal:"",symptoms:[],age:"",weight:""}); const [plan,setPlan]=useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const goals = T.eliteGoals;
  const symptoms = T.eliteSymList;
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
  const openWA = () => { if (!plan) return; const msg=encodeURIComponent(`¡Hola! Generé mi Plan Elite 90 días con Power Vita IA 👑\nNombre: ${form.name}\nPaís: ${form.country}\nObjetivo: ${form.goal}\nFase 1: ${plan.fases?.[0]?.nombre}\nFase 2: ${plan.fases?.[1]?.nombre}\nFase 3: ${plan.fases?.[2]?.nombre}\n\n¿Cuál es el precio en ${form.country}?`); window.open(waHref(WA, decodeURIComponent(msg)),"_blank"); };
  const inp = { width:"100%", background:"rgba(255,255,255,0.07)", border:"1.5px solid rgba(201,168,76,0.22)", borderRadius:9, padding:"8px 10px", fontSize:11, outline:"none", color:"#fff", boxSizing:"border-box", fontFamily:"'Inter',sans-serif" };
  if (step===1) return (
    <div style={{padding:"20px"}}>
      <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:28}}>👑</div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:"#FFD700",marginBottom:2}}>{T.eliteTitle}</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.85)"}}>{T.eliteSub}</p></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>{T.eliteName}</div><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder={T.eliteNamePh} style={inp} onFocus={e=>e.target.style.borderColor="#C9A84C"} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.22)"}/></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>PAÍS</div><select value={form.country} onChange={e=>set("country",e.target.value)} style={{...inp,cursor:"pointer",color:form.country?"#fff":"rgba(255,255,255,0.35)"}}><option value="">Seleccioná tu país...</option>{COUNTRIES.map(c=><option key={c} value={c} style={{color:"#1a1a1a"}}>{c}</option>)}</select></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:4}}>{T.eliteGoal}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{goals.map(g=><button key={g} onClick={()=>set("goal",g)} style={{padding:"6px 4px",borderRadius:7,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",border:"1.5px solid",borderColor:form.goal===g?"#C9A84C":"rgba(255,255,255,0.1)",background:form.goal===g?"rgba(201,168,76,0.18)":"rgba(255,255,255,0.04)",color:form.goal===g?"#FFD700":"rgba(255,255,255,0.82)",transition:"all .2s"}}>{g}</button>)}</div></div>
      <div style={{marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:4}}>{T.eliteSymptoms}</div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{symptoms.map(s=>{const sel=form.symptoms.includes(s);return <button key={s} onClick={()=>set("symptoms",sel?form.symptoms.filter(x=>x!==s):[...form.symptoms,s])} style={{padding:"2px 6px",borderRadius:999,fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",border:"1.5px solid",borderColor:sel?"#C9A84C":"rgba(255,255,255,0.1)",background:sel?"rgba(201,168,76,0.15)":"transparent",color:sel?"#C9A84C":"rgba(255,255,255,0.78)",transition:"all .2s"}}>{s}</button>;})}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>{T.eliteAge}</div><input value={form.age} onChange={e=>set("age",e.target.value)} placeholder="32" style={inp}/></div>
        <div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.88)",marginBottom:3}}>{T.eliteWeight}</div><input value={form.weight} onChange={e=>set("weight",e.target.value)} placeholder="70" style={inp}/></div>
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
      <div style={{textAlign:"center",marginBottom:10}}><div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(201,168,76,0.14)",border:"1px solid rgba(201,168,76,0.28)",borderRadius:999,padding:"3px 9px",marginBottom:5}}><span style={{width:5,height:5,borderRadius:"50%",background:"#FFD700",display:"inline-block"}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:800,color:"#C9A84C",letterSpacing:1.5}}>PLAN GENERADO CON IA ✓</span></div><h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:"#FFD700",marginBottom:1}}>{plan.titulo}</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.92)",fontStyle:"italic"}}>{plan.tagline}</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginBottom:10}}>{plan.metricas?.map((m,i)=><div key={i} style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.14)",borderRadius:8,padding:"6px 3px",textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:"#FFD700",lineHeight:1}}>{m.valor}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.95)",marginTop:2,lineHeight:1.2}}>{m.label}</div></div>)}</div>
      <div style={{background:"rgba(45,106,79,0.14)",border:"1px solid rgba(45,106,79,0.28)",borderRadius:9,padding:"7px 10px",marginBottom:8}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:700,color:"#52b788",marginBottom:2}}>🎯 RESULTADO EN 90 DÍAS</div><p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,0.95)",lineHeight:1.5}}>{plan.resultado_esperado}</p></div>
      <div style={{marginBottom:10}}>{plan.fases?.map((fase,i)=><div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"8px 10px",marginBottom:4,display:"flex",gap:8}}><div style={{width:30,height:30,borderRadius:8,background:"rgba(201,168,76,0.18)",border:"1px solid rgba(201,168,76,0.28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{fase.emoji}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}><span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,fontWeight:700,color:"#fff"}}>{T.eliteFase} {fase.numero}: {fase.nombre}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#C9A84C",fontWeight:700}}>{fase.semanas}</span></div><p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.85)",marginBottom:3}}>{fase.objetivo}</p><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{fase.productos?.map(p=><span key={p} style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#C9A84C",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.18)",borderRadius:4,padding:"1px 5px"}}>{p}</span>)}</div></div></div>)}</div>
      <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.22)",borderRadius:10,padding:"8px 11px",marginBottom:12}}><p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,color:"#FFD700",fontStyle:"italic",lineHeight:1.6}}>"{plan.mensaje_final}"</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <button onClick={()=>{trackEvent("Purchase",{content_name:"Elite Program 90 días",content_type:"product",currency:"USD"});openWA();}} style={{width:"100%",background:"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>{T.eliteWantPlan} {form.country} →</button>
        <div style={{display:"flex",gap:6}}><button onClick={()=>{setStep(1);setPlan(null);}} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.92)",borderRadius:9,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,cursor:"pointer"}}>{T.eliteNew}</button><button onClick={()=>{const txt=`${plan.titulo}\nFase 1: ${plan.fases?.[0]?.nombre}\nFase 2: ${plan.fases?.[1]?.nombre}\nFase 3: ${plan.fases?.[2]?.nombre}`;navigator.clipboard?.writeText(txt);}} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.92)",borderRadius:9,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,cursor:"pointer"}}>{T.eliteCopy}</button></div>
      </div>
    </div>
  );
  return null;
}

// ── CONTADOR TIEMPO REAL ──────────────────────────────────────────────────────
function ContadorTiempoReal() {
  const T = useContext(LangCtx);
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
        <div><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:"#fff",marginBottom:1}}>Actividad en tiempo real</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.88)"}}>Últimas 24 horas · Global</div></div>
        <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(37,211,102,0.14)",border:"1px solid rgba(37,211,102,0.28)",borderRadius:999,padding:"3px 9px"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#25D366",animation:"pulse 1.5s ease-in-out infinite"}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#25D366"}}>EN VIVO</span></div>
      </div>
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid rgba(45,106,79,0.06)"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:9}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:44,fontWeight:700,color:"#1a2e1a",lineHeight:1}}>{count}</div><div style={{paddingBottom:5,fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#2d6a4f",lineHeight:1.3}}>{T.counterJoined}</div></div>
        <div style={{marginBottom:7}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9ca3af",marginBottom:3,fontWeight:600}}>ACTIVIDAD HOY POR HORA</div><div style={{display:"flex",gap:2,alignItems:"flex-end",height:24}}>{bars.map((v,i)=>{const isNow=i===h,isPast=i<h;return(<div key={i} style={{flex:1,background:isNow?"#2d6a4f":isPast?"rgba(45,106,79,0.32)":"rgba(45,106,79,0.08)",borderRadius:"2px 2px 0 0",height:`${(v/106)*100}%`,position:"relative"}}>{isNow&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#2d6a4f",color:"#fff",borderRadius:3,padding:"1px 3px",fontFamily:"'Inter',sans-serif",fontSize:6,whiteSpace:"nowrap"}}>ahora</div>}</div>);})}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>{["00:00","12:00","23:00"].map(t=><span key={t} style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9ca3af"}}>{t}</span>)}</div></div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#4a7c5e",fontWeight:600}}>{h>=9&&h<21?T.counterHighActivity:T.counterNormalActivity}</div>
      </div>
      <div style={{padding:"9px 14px"}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:1,marginBottom:6}}>ÚLTIMAS INCORPORACIONES</div>{joins.map((j,i)=><div key={j.id} style={{display:"flex",alignItems:"center",gap:9,padding:"4px 0",borderBottom:i<joins.length-1?"1px solid rgba(45,106,79,0.05)":"none"}}><div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#E8F0E9,#2d6a4f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{j.flag}</div><div style={{flex:1}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:"#1a2e1a"}}>{j.name} <span style={{color:"#9ca3af",fontWeight:400}}>{T.counterFrom} {j.country}</span></div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#7a9a7a"}}>{T.counterJoinedWith} <span style={{color:"#2d6a4f",fontWeight:700}}>{j.product}</span></div></div><div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#9ca3af"}}>{j.mins}{T.counterMins}</div></div>)}</div>
    </div>
  );
}

// ── ANTES / DESPUÉS ───────────────────────────────────────────────────────────
function AntesDespues() {
  const T = useContext(LangCtx);
  const [active,setActive]=useState(0); const [showAfter,setShowAfter]=useState(false);
  useEffect(()=>{setShowAfter(false);},[active]);
  const c=BEFORE_AFTER[active]; const metrics=Object.keys(c.before); const color=PACK_COLOR[c.pack]||"#2d6a4f";
  return (
    <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:20,overflow:"hidden",boxShadow:"0 6px 24px rgba(45,106,79,0.07)"}}>
      <div style={{background:"linear-gradient(135deg,#1a2e1a,#2d6a4f)",padding:"13px 16px"}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:"#fff",marginBottom:1}}>Transformaciones reales</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(255,255,255,0.88)"}}>Casos verificados</div></div>
      <div style={{display:"flex",borderBottom:"1px solid rgba(45,106,79,0.06)"}}>
        {BEFORE_AFTER.map((cas,i)=><button key={i} onClick={()=>setActive(i)} style={{flex:1,padding:"9px 6px",background:active===i?"rgba(45,106,79,0.06)":"transparent",border:"none",borderBottom:active===i?`2px solid ${PACK_COLOR[cas.pack]}`:"2px solid transparent",cursor:"pointer",transition:"all .2s",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <Avatar name={cas.name} color={cas.color} size={32}/>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:active===i?PACK_COLOR[cas.pack]:"#9ca3af"}}>{cas.name.split(" ")[0]}</div>
        </button>)}
      </div>
      <div style={{padding:"13px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
          <Avatar name={c.name} color={c.color} size={48}/>
          <div style={{flex:1}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:"#1a2e1a",marginBottom:1}}>{c.name}, {c.age} años</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#9ca3af",marginBottom:3}}>{c.country} {c.flag} · {c.goal}</div><div style={{display:"flex",gap:4}}><div style={{background:`${color}10`,border:`1px solid ${color}25`,borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color}}>{c.pack}</div><div style={{background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.1)",borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,color:"#4a7c5e"}}>⏱ {c.days} días</div></div></div>
        </div>
        <div style={{display:"flex",background:"rgba(45,106,79,0.05)",borderRadius:10,padding:3,marginBottom:10,gap:3}}>
          {[false,true].map(isAfter=><button key={String(isAfter)} onClick={()=>setShowAfter(isAfter)} style={{flex:1,padding:"6px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,transition:"all .25s",background:showAfter===isAfter?(isAfter?color:"#e53e3e"):"transparent",color:showAfter===isAfter?"#fff":"#9ca3af"}}>{isAfter?T.antesAfter:T.antesBefore}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:9}}>
          {metrics.map(key=>{const val=showAfter?c.after[key]:c.before[key];return(<div key={key} style={{background:showAfter?`${color}07`:"rgba(229,57,53,0.04)",border:`1px solid ${showAfter?color+"18":"rgba(229,57,53,0.1)"}`,borderRadius:8,padding:"7px 9px",transition:"all .3s"}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",marginBottom:2}}>{key}</div><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,fontWeight:700,color:showAfter?color:"#e53e3e"}}>{val}</div>{showAfter&&<div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#25D366",marginTop:1}}>{c.diff[key]}</div>}</div>);})}
        </div>
        <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.16)",borderRadius:9,padding:"7px 9px",marginBottom:9}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:"#C9A84C",lineHeight:0.8,marginBottom:3}}>"</div><p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,fontStyle:"italic",color:"#1a2e1a",lineHeight:1.6}}>{c.quote}</p></div>
        <a href={waHref(WA, `¡Hola! Vi el caso de ${c.name} y quiero resultados similares con Power Vita 🌿`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"AntesDespues_WA"})} style={{display:"block",width:"100%",background:`linear-gradient(135deg,#1a2e1a,${color})`,color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>{T.antesWant} {c.name.split(" ")[0]} →</a>
      </div>
    </div>
  );
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
function Chat({ open, onClose }) {
  const T = useContext(LangCtx);
  const [msgs,setMsgs]=useState([]);
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
    } catch { setMsgs(m=>[...m,{role:"assistant",text:T.chatError}]); }
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
        {(msgs.length===0?[{role:"assistant",text:T?.chatGreeting||""}]:msgs).map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",background:m.role==="user"?"#1a2e1a":"rgba(45,106,79,0.08)",color:m.role==="user"?"#fff":"#1a2e1a",borderRadius:10,padding:"6px 9px",fontFamily:"'Inter',sans-serif",fontSize:11,lineHeight:1.5}}>{m.text}</div></div>)}
        {loading&&<div style={{display:"flex"}}><div style={{background:"rgba(45,106,79,0.08)",borderRadius:10,padding:"6px 11px",color:"#2d6a4f",fontSize:15}}>···</div></div>}
        <div ref={botRef}/>
      </div>
      <div style={{padding:"6px 9px 9px",borderTop:"1px solid rgba(45,106,79,0.09)",display:"flex",gap:5}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={T.chatPlaceholder} style={{flex:1,background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.18)",borderRadius:7,padding:"7px 9px",fontFamily:"'Inter',sans-serif",fontSize:10,outline:"none",color:"#1a2e1a"}}/>
        <button onClick={send} disabled={loading} style={{background:"#1a2e1a",border:"none",borderRadius:7,width:30,color:"#fff",fontSize:13,cursor:"pointer"}}>→</button>
      </div>
    </div>
  );
}

// ── FAQ ITEM ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:14,overflow:"hidden",transition:"box-shadow .2s",boxShadow:open?"0 6px 24px rgba(45,106,79,0.08)":"0 2px 8px rgba(0,0,0,0.04)"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",background:"none",border:"none",cursor:"pointer",textAlign:"left",gap:12}}>
        <span className="pf" style={{fontSize:14,fontWeight:700,color:"#1a2e1a",lineHeight:1.4}}>{q}</span>
        <span style={{fontSize:18,color:"#2d6a4f",fontWeight:700,flexShrink:0,transition:"transform .3s",transform:open?"rotate(45deg)":"rotate(0)"}}>+</span>
      </button>
      {open&&<div style={{padding:"0 20px 16px"}}><p className="int" style={{fontSize:13,color:"#7a9a7a",lineHeight:1.7}}>{a}</p></div>}
    </div>
  );
}

// ── LANG CONTEXT ─────────────────────────────────────────────────────────────
const LangCtx = createContext(null);

// ── TRANSLATIONS ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    nav:["Inicio","Sistema","IA Tools","Testimonios","Contacto"],
    navCta:"Empezar →",
    heroBadge:"FuXion Global · 37 Países",
    heroTitle1:"Nutrición que", heroTitleEm:"transforma", heroTitle2:"desde adentro.",
    heroSub:"Biotecnología avanzada en cada producto FuXion. Certificado, natural y con entrega directa en 37 países.",
    heroCta1:"Ver productos", heroCta2:"💬 WhatsApp",
    heroStats:[["37","países"],["15K+","socios"],["100%","natural"]],
    sistemaBadge:"Sistema FuXion",
    sistemaTitle1:"Salud plena en", sistemaTitleEm:"3 pasos",
    sistemaSub:"Un sistema progresivo diseñado por biotecnólogos. Cada paso potencia al siguiente.",
    stepLabel:"PASO", stepProds:"Productos incluidos",
    stepCta1:"💬 Consultar precio", stepCta2:"🛒 Armar mi pack",
    packTitle1:"Armá tu", packTitleEm:"pack",
    packSub:"Combinamos los mejores productos según tu objetivo y tu país",
    packCta1:"💬 Consultar precio", packCta2:"🛒 Armar mi pack",
    catalogShow:"▼ Ver todos los productos", catalogHide:"▲ Ocultar catálogo completo",
    catalogPriceCta:"💬 Precio", catalogBuyCta:"🛒 Comprar",
    unavailLabel:"No disponible en", unavailCta:"Consultar alternativa",
    countryTitle1:"¿Cuánto cuesta en", countryTitleEm:"tu país?",
    countrySub:"Seleccioná y te mostramos la moneda, el envío y cómo contactarnos.",
    countryLabel:"SELECCIONÁ TU PAÍS", countryPlaceholder:"🌍 Seleccioná tu país...",
    countryDetected:"📍 Tu ubicación detectada", countryIn:"Estás en",
    countryCurrency:"💱 MONEDA", countryShipping:"🚚 ENVÍO",
    countryPopular:"🔥 MÁS PEDIDOS EN", countryViewPrices:"Ver precios para",
    countryEmpty:"Seleccioná tu país para ver precios",
    iaBadge:"Herramientas IA · Exclusivo Power Vita",
    iaTitle1:"Tecnología que", iaTitleEm:"potencia tu salud",
    testimoniosBadge:"Comunidad Power Vita",
    testimoniosTitle1:"Lo que dicen", testimoniosTitleEm:"nuestros socios",
    contactBadge:"Contacto directo",
    contactTitle1:"Hablemos", contactTitleEm:"hoy mismo",
    contactSub:"Respondemos en minutos. Asesoramiento personalizado para tu país.",
    contactWa:"💬 Escribir por WhatsApp", contactLink:"🛒 Registrarme ahora",
    faqTitle:"Preguntas frecuentes",
    faqSub:"Todo lo que necesitás saber",
    faqMoreQ:"💬 Tengo otra pregunta",
    faqQA:[
      {q:"¿Los productos FuXion son seguros?",a:"Sí. FuXion cuenta con certificaciones internacionales: GMP, FDA Registered, HACCP y Clean Label. Todos los ingredientes son naturales y sin conservantes artificiales. Son aptos para toda la familia."},
      {q:"¿Cuánto tarda la entrega?",a:"FuXion entrega directamente en tu país. Los tiempos varían: Uruguay 24-48hs, Argentina y Colombia 2-5 días hábiles, resto de Latinoamérica 3-7 días. Te confirmamos el plazo exacto por WhatsApp."},
      {q:"¿Qué pasa si no me gustan los productos?",a:"FuXion ofrece garantía de satisfacción. Si los productos no cumplen tus expectativas, te asesoramos para encontrar la combinación correcta o gestionamos una solución."},
      {q:"¿Puedo comprar solo como cliente o también hacer el negocio?",a:"Las dos opciones están disponibles. Podés registrarte como Cliente Preferente para precios especiales, o como Emprendedor si querés construir un negocio."},
      {q:"¿Están disponibles todos los productos en mi país?",a:"FuXion opera en 37 países pero el catálogo varía por región. Consultanos por WhatsApp con tu país y te decimos qué productos están disponibles y a qué precio."},
      {q:"¿Las herramientas de IA tienen algún costo?",a:"No, son 100% gratuitas. El Plan Nutricional, Analizador de Síntomas, ROI Predictor y Elite Program son exclusivos de Power Vita sin costo adicional."},
    ],
    statsImpact:"Vidas impactadas en 37 países",
    statsItems:[["37","Países"],["15K+","Socios"],["98%","Satisfacción"]],
    leadTitle:"Recibí tu Plan Personalizado",
    leadSub:"Dejanos tus datos y te enviamos por WhatsApp un plan adaptado a tus objetivos — sin costo.",
    leadError:"Por favor completá todos los campos.",
    leadGoals:[{v:"salud",l:"💚 Mejorar mi salud"},{v:"energia",l:"⚡ Más energía"},{v:"peso",l:"⚖️ Control de peso"},{v:"negocio",l:"💼 Negocio global"}],
    modalSub:"¿Qué te describe mejor? Elegí tu perfil para continuar en FuXion.",
    modalOpt1:"💚 Quiero los productos", modalOpt1Sub:"Me registro como Cliente Preferente",
    modalOpt2:"💼 Quiero el negocio", modalOpt2Sub:"Me registro como Emprendedor FuXion",
    modalCancel:"Cancelar",
    footerSub:"Distribuidor FuXion Global Autorizado",
    instaBadge:"Instagram · Power Vita",
    instaTitle:"Seguinos en Instagram",
    instaSub:"Recetas, tips y transformaciones reales. Comunidad activa todos los días.",
    instaBtn:"Ver Instagram →",
    nutriGoals:["💪 Más energía","🌿 Detox y digestión","⚖️ Bajar de peso","🛡️ Reforzar inmunidad","😴 Dormir mejor","✨ Mejorar piel"],
    nutriDiets:["🥩 Omnívoro","🐟 Pescetariano","🥚 Vegetariano","🌱 Vegano","🌾 Sin gluten"],
    nutriSymptoms:["Fatiga crónica","Hinchazón","Insomnio","Estrés","Digestión lenta","Piel opaca","Inmunidad baja","Ansiedad"],
    nutriTitle:"Plan Nutricional IA", nutriSub:"Personalizado · 7 días · FuXion",
    nutriObj:"OBJETIVO", nutriSym:"SÍNTOMAS", nutriDiet:"DIETA", nutriAge:"EDAD", nutriWeight:"PESO kg",
    nutriProds:"✦ PRODUCTOS", nutriDays:"📅 7 DÍAS",
    nutriGen:"✨ Generar mi plan con IA →", nutriLoading:"🧠 Generando con IA...",
    nutriStart:"💬 Empezar", nutriNew:"🔄 Nuevo",
    nutriErrTitle:"No pudimos generar tu plan.", nutriErrSub:"Revisá tu conexión e intentá de nuevo.", nutriRetry:"🔄 Reintentar",
    symptomTitle:"Analizador de Síntomas IA", symptomSub:"Describí cómo te sentís · IA recomienda",
    symptomPlaceholder:"Ej: Me siento cansado, tengo el estómago hinchado...",
    symptomExamples:["Me siento cansado todo el día","Tengo el estómago hinchado","Mucho estrés y no puedo dormir","Quiero bajar de peso"],
    symptomExLabel:"💡 EJEMPLOS:", symptomAnalyze:"🔬 Analizar con IA →", symptomLoading:"🧠 Analizando...",
    symptomDone:"Análisis completado", symptomDiag:"🧠 DIAGNÓSTICO",
    symptomUrgBajo:"✅ Nivel Bajo", symptomUrgMedio:"⚠️ Nivel Medio", symptomUrgAlto:"🔴 Nivel Alto",
    symptomStart:"💬 Empezar", symptomNew:"🔄 Nuevo",
    roiTitle:"ROI Predictor IA", roiSub:"Proyección de ingresos con IA real",
    roiCountry:"PAÍS", roiHoursLabel:"HORAS / SEMANA", roiContactsLabel:"RED DE CONTACTOS", roiExpLabel:"EXPERIENCIA",
    roiHours:["⏰ 5-10 hrs/sem","⏰ 10-20 hrs/sem","⏰ 20-30 hrs/sem","⏰ +30 hrs/sem"],
    roiContacts:["👥 0-50","👥 50-200","👥 200-500","👥 +500"],
    roiExp:["🌱 Sin experiencia","📊 Algo de exp.","💼 Con experiencia","🏆 Muy exp."],
    roiCalc:"💰 Calcular mi potencial →", roiLoading:"🧠 Calculando...",
    roiPlaceholder:"Seleccioná tu país...",
    roiMonths:[{k:"mes1",l:"1 mes"},{k:"mes3",l:"3 meses"},{k:"mes6",l:"6 meses"},{k:"mes12",l:"12 meses"}],
    roiPotBajo:"🌱 Potencial Bueno", roiPotMedio:"🚀 Potencial Alto", roiPotAlto:"💎 Potencial Muy Alto", roiPotMuyAlto:"👑 Potencial Excepcional",
    roiPartner:"👑 Quiero ser socio", roiRecalc:"🔄 Recalcular",
    eliteTitle:"Elite Program", eliteSub:"IA genera tu protocolo de 90 días",
    eliteName:"NOMBRE", eliteCountry:"PAÍS", eliteGoal:"OBJETIVO", eliteSymptoms:"SÍNTOMAS", eliteAge:"EDAD", eliteWeight:"PESO kg",
    eliteNamePh:"¿Cómo te llamás?", eliteCountryPh:"Seleccioná tu país...",
    eliteGoals:["💪 Ganar masa muscular","🌿 Detox profundo","⚖️ Bajar de peso","🛡️ Reforzar inmunidad","⚡ Más energía","✨ Anti-envejecimiento"],
    eliteSymList:["Fatiga","Sobrepeso","Digestión lenta","Estrés","Insomnio","Piel opaca","Inmunidad baja","Dolores musculares"],
    eliteGen:"👑 Generar mi Plan Elite 90 días →",
    eliteLoading:"Diseñando tu protocolo...", eliteLoadingSub:"Claude AI analiza tu perfil y construye tu plan único de 90 días",
    eliteGenerated:"PLAN GENERADO CON IA ✓", eliteResult:"🎯 RESULTADO EN 90 DÍAS",
    eliteFase:"Fase", eliteWantPlan:"👑 Quiero este plan · Ver precio en",
    eliteNew:"🔄 Nuevo", eliteCopy:"📋 Copiar",
    counterTitle:"Actividad en tiempo real", counterSub:"Últimas 24 horas · Global", counterLive:"LIVE",
    counterJoined:"personas se unieron en las últimas 24hs",
    counterActivity:"ACTIVIDAD HOY POR HORA", counterNow:"ahora",
    counterRecent:"ÚLTIMAS INCORPORACIONES", counterFrom:"de", counterJoinedWith:"Se unió con", counterMins:"min",
    counterHighActivity:"🟢 Alta actividad ahora", counterNormalActivity:"🔵 Actividad normal",
    antesTitle:"Transformaciones reales", antesSub:"Casos verificados",
    antesAfter:"✨ Después", antesBefore:"📸 Antes",
    antesWant:"💬 Quiero resultados como",
    chatGreeting:"¡Hola! Soy tu Vita Advisor 🌿 ¿En qué puedo ayudarte?",
    chatTitle:"Vita Advisor IA", chatOnline:"● En línea",
    chatPlaceholder:"Pregúntame sobre salud o negocio...",
    chatError:"Error. Contáctanos por WhatsApp 💬",
    leadFormName:"NOMBRE *", leadFormEmail:"EMAIL", leadFormEmailOpt:"(opcional)",
    leadFormCountry:"PAÍS *", leadFormCountryPh:"Seleccioná tu país...",
    leadFormGoalLabel:"¿QUÉ BUSCÁS? *",
    leadFormSubmit:"💬 Quiero mi plan gratis →", leadFormPrivacy:"Sin spam. Solo abrimos WhatsApp con tu info lista.",
    leadFormDoneTitle:"¡Listo! Te esperamos en WhatsApp", leadFormDoneSub:"Tu mensaje fue preparado. Completá el envío.",
    leadFormAnother:"Enviar otro →",
  },
  en: {
    nav:["Home","System","AI Tools","Testimonials","Contact"],
    navCta:"Get started →",
    heroBadge:"FuXion Global · 37 Countries",
    heroTitle1:"Nutrition that", heroTitleEm:"transforms", heroTitle2:"from within.",
    heroSub:"Advanced biotechnology in every FuXion product. Certified, natural and delivered in 37 countries.",
    heroCta1:"View products", heroCta2:"💬 WhatsApp",
    heroStats:[["37","countries"],["15K+","partners"],["100%","natural"]],
    sistemaBadge:"FuXion System",
    sistemaTitle1:"Full health in", sistemaTitleEm:"3 steps",
    sistemaSub:"A progressive system designed by biotechnologists. Each step enhances the next.",
    stepLabel:"STEP", stepProds:"Included products",
    stepCta1:"💬 Ask for price", stepCta2:"🛒 Build my pack",
    packTitle1:"Build your", packTitleEm:"pack",
    packSub:"We combine the best products for your goal and country",
    packCta1:"💬 Ask for price", packCta2:"🛒 Build my pack",
    catalogShow:"▼ View full catalog", catalogHide:"▲ Hide catalog",
    catalogPriceCta:"💬 Price", catalogBuyCta:"🛒 Buy",
    unavailLabel:"Not available in", unavailCta:"Ask for alternative",
    countryTitle1:"How much does it cost in", countryTitleEm:"your country?",
    countrySub:"Select your country to see currency, shipping and how to reach us.",
    countryLabel:"SELECT YOUR COUNTRY", countryPlaceholder:"🌍 Select your country...",
    countryDetected:"📍 Your detected location", countryIn:"You are in",
    countryCurrency:"💱 CURRENCY", countryShipping:"🚚 SHIPPING",
    countryPopular:"🔥 MOST ORDERED IN", countryViewPrices:"View prices for",
    countryEmpty:"Select your country to see prices",
    iaBadge:"AI Tools · Exclusive Power Vita",
    iaTitle1:"Technology that", iaTitleEm:"boosts your health",
    testimoniosBadge:"Power Vita Community",
    testimoniosTitle1:"What our", testimoniosTitleEm:"partners say",
    contactBadge:"Direct contact",
    contactTitle1:"Let's talk", contactTitleEm:"today",
    contactSub:"We respond in minutes. Personalized advice for your country.",
    contactWa:"💬 Write on WhatsApp", contactLink:"🛒 Register now",
    faqTitle:"Frequently asked questions",
    faqSub:"Everything you need to know",
    faqMoreQ:"💬 I have another question",
    faqQA:[
      {q:"Are FuXion products safe?",a:"Yes. FuXion holds international certifications: GMP, FDA Registered, HACCP and Clean Label. All ingredients are natural with no artificial preservatives, suitable for the whole family."},
      {q:"How long does delivery take?",a:"FuXion delivers directly in your country. Times vary: Uruguay 24-48h, Argentina and Colombia 2-5 business days, rest of Latin America 3-7 days. We confirm exact timing via WhatsApp."},
      {q:"What if I don't like the products?",a:"FuXion offers a satisfaction guarantee. If products don't meet your expectations, we advise you to find the right combination or manage a solution."},
      {q:"Can I buy just as a customer or also do the business?",a:"Both options are available. You can register as a Preferred Customer for special prices, or as an Entrepreneur if you want to build a business."},
      {q:"Are all products available in my country?",a:"FuXion operates in 37 countries but the catalog varies by region. Message us on WhatsApp with your country and we'll tell you exactly what's available and at what price."},
      {q:"Do the AI tools have any cost?",a:"No, they're 100% free. The Nutrition Plan, Symptom Analyzer, ROI Predictor and Elite Program are exclusive to Power Vita at no additional cost."},
    ],
    statsImpact:"Lives impacted in 37 countries",
    statsItems:[["37","Countries"],["15K+","Partners"],["98%","Satisfaction"]],
    leadTitle:"Get your Personalized Plan",
    leadSub:"Leave your info and we'll send you a custom plan on WhatsApp — free of charge.",
    leadError:"Please fill in all required fields.",
    leadGoals:[{v:"salud",l:"💚 Improve my health"},{v:"energia",l:"⚡ More energy"},{v:"peso",l:"⚖️ Weight control"},{v:"negocio",l:"💼 Global business"}],
    modalSub:"What describes you best? Choose your profile to continue with FuXion.",
    modalOpt1:"💚 I want the products", modalOpt1Sub:"Register as Preferred Customer",
    modalOpt2:"💼 I want the business", modalOpt2Sub:"Register as FuXion Entrepreneur",
    modalCancel:"Cancel",
    footerSub:"Authorized FuXion Global Distributor",
    instaBadge:"Instagram · Power Vita",
    instaTitle:"Follow us on Instagram",
    instaSub:"Recipes, tips and real transformations. Active community every day.",
    instaBtn:"View Instagram →",
    nutriGoals:["💪 More energy","🌿 Detox & digestion","⚖️ Lose weight","🛡️ Boost immunity","😴 Sleep better","✨ Better skin"],
    nutriDiets:["🥩 Omnivore","🐟 Pescatarian","🥚 Vegetarian","🌱 Vegan","🌾 Gluten-free"],
    nutriSymptoms:["Chronic fatigue","Bloating","Insomnia","Stress","Slow digestion","Dull skin","Low immunity","Anxiety"],
    nutriTitle:"AI Nutrition Plan", nutriSub:"Personalized · 7 days · FuXion",
    nutriObj:"GOAL", nutriSym:"SYMPTOMS", nutriDiet:"DIET", nutriAge:"AGE", nutriWeight:"WEIGHT kg",
    nutriProds:"✦ PRODUCTS", nutriDays:"📅 7 DAYS",
    nutriGen:"✨ Generate my AI plan →", nutriLoading:"🧠 Generating with AI...",
    nutriStart:"💬 Start", nutriNew:"🔄 New plan",
    nutriErrTitle:"We couldn't generate your plan.", nutriErrSub:"Check your connection and try again.", nutriRetry:"🔄 Retry",
    symptomTitle:"AI Symptom Analyzer", symptomSub:"Describe how you feel · AI recommends",
    symptomPlaceholder:"E.g: I feel tired, my stomach is bloated...",
    symptomExamples:["I feel tired all day","My stomach is bloated","Too much stress, can't sleep","I want to lose weight"],
    symptomExLabel:"💡 EXAMPLES:", symptomAnalyze:"🔬 Analyze with AI →", symptomLoading:"🧠 Analyzing...",
    symptomDone:"Analysis complete", symptomDiag:"🧠 DIAGNOSIS",
    symptomUrgBajo:"✅ Low Level", symptomUrgMedio:"⚠️ Medium Level", symptomUrgAlto:"🔴 High Level",
    symptomStart:"💬 Start", symptomNew:"🔄 New",
    roiTitle:"AI ROI Predictor", roiSub:"Income projection with real AI",
    roiCountry:"COUNTRY", roiHoursLabel:"HOURS / WEEK", roiContactsLabel:"CONTACT NETWORK", roiExpLabel:"EXPERIENCE",
    roiHours:["⏰ 5-10 hrs/wk","⏰ 10-20 hrs/wk","⏰ 20-30 hrs/wk","⏰ +30 hrs/wk"],
    roiContacts:["👥 0-50","👥 50-200","👥 200-500","👥 +500"],
    roiExp:["🌱 No experience","📊 Some exp.","💼 With experience","🏆 Very exp."],
    roiCalc:"💰 Calculate my potential →", roiLoading:"🧠 Calculating...",
    roiPlaceholder:"Select your country...",
    roiMonths:[{k:"mes1",l:"1 month"},{k:"mes3",l:"3 months"},{k:"mes6",l:"6 months"},{k:"mes12",l:"12 months"}],
    roiPotBajo:"🌱 Good Potential", roiPotMedio:"🚀 High Potential", roiPotAlto:"💎 Very High Potential", roiPotMuyAlto:"👑 Exceptional Potential",
    roiPartner:"👑 I want to be a partner", roiRecalc:"🔄 Recalculate",
    eliteTitle:"Elite Program", eliteSub:"AI generates your 90-day protocol",
    eliteName:"NAME", eliteCountry:"COUNTRY", eliteGoal:"GOAL", eliteSymptoms:"SYMPTOMS", eliteAge:"AGE", eliteWeight:"WEIGHT kg",
    eliteNamePh:"What's your name?", eliteCountryPh:"Select your country...",
    eliteGoals:["💪 Gain muscle mass","🌿 Deep detox","⚖️ Lose weight","🛡️ Boost immunity","⚡ More energy","✨ Anti-aging"],
    eliteSymList:["Fatigue","Overweight","Slow digestion","Stress","Insomnia","Dull skin","Low immunity","Muscle pain"],
    eliteGen:"👑 Generate my Elite 90-day Plan →",
    eliteLoading:"Designing your protocol...", eliteLoadingSub:"Claude AI analyzes your profile and builds your unique 90-day plan",
    eliteGenerated:"PLAN GENERATED WITH AI ✓", eliteResult:"🎯 RESULT IN 90 DAYS",
    eliteFase:"Phase", eliteWantPlan:"👑 I want this plan · See price in",
    eliteNew:"🔄 New", eliteCopy:"📋 Copy",
    counterTitle:"Real-time activity", counterSub:"Last 24 hours · Global", counterLive:"LIVE",
    counterJoined:"people joined in the last 24h",
    counterActivity:"TODAY'S ACTIVITY BY HOUR", counterNow:"now",
    counterRecent:"LATEST JOINS", counterFrom:"from", counterJoinedWith:"Joined with", counterMins:"min",
    counterHighActivity:"🟢 High activity now", counterNormalActivity:"🔵 Normal activity",
    antesTitle:"Real transformations", antesSub:"Verified cases",
    antesAfter:"✨ After", antesBefore:"📸 Before",
    antesWant:"💬 I want results like",
    chatGreeting:"Hello! I'm your Vita Advisor 🌿 How can I help you?",
    chatTitle:"Vita Advisor AI", chatOnline:"● Online",
    chatPlaceholder:"Ask me about health or business...",
    chatError:"Error. Contact us on WhatsApp 💬",
    leadFormName:"NAME *", leadFormEmail:"EMAIL", leadFormEmailOpt:"(optional)",
    leadFormCountry:"COUNTRY *", leadFormCountryPh:"Select your country...",
    leadFormGoalLabel:"WHAT ARE YOU LOOKING FOR? *",
    leadFormSubmit:"💬 I want my free plan →", leadFormPrivacy:"No spam. We just open WhatsApp with your info ready.",
    leadFormDoneTitle:"Done! We'll see you on WhatsApp", leadFormDoneSub:"Your message is ready. Complete the send.",
    leadFormAnother:"Send another →",
  },
  pt: {
    nav:["Início","Sistema","IA Tools","Depoimentos","Contato"],
    navCta:"Começar →",
    heroBadge:"FuXion Global · 37 Países",
    heroTitle1:"Nutrição que", heroTitleEm:"transforma", heroTitle2:"por dentro.",
    heroSub:"Biotecnologia avançada em cada produto FuXion. Certificado, natural e com entrega direta em 37 países.",
    heroCta1:"Ver produtos", heroCta2:"💬 WhatsApp",
    heroStats:[["37","países"],["15K+","parceiros"],["100%","natural"]],
    sistemaBadge:"Sistema FuXion",
    sistemaTitle1:"Saúde plena em", sistemaTitleEm:"3 passos",
    sistemaSub:"Um sistema progressivo criado por biotecnólogos. Cada passo potencializa o seguinte.",
    stepLabel:"PASSO", stepProds:"Produtos incluídos",
    stepCta1:"💬 Consultar preço", stepCta2:"🛒 Montar meu pack",
    packTitle1:"Monte seu", packTitleEm:"pack",
    packSub:"Combinamos os melhores produtos para seu objetivo e país",
    packCta1:"💬 Consultar preço", packCta2:"🛒 Montar meu pack",
    catalogShow:"▼ Ver catálogo completo", catalogHide:"▲ Ocultar catálogo",
    catalogPriceCta:"💬 Preço", catalogBuyCta:"🛒 Comprar",
    unavailLabel:"Não disponível em", unavailCta:"Consultar alternativa",
    countryTitle1:"Quanto custa no", countryTitleEm:"seu país?",
    countrySub:"Selecione e mostramos a moeda, o envio e como falar conosco.",
    countryLabel:"SELECIONE SEU PAÍS", countryPlaceholder:"🌍 Selecione seu país...",
    countryDetected:"📍 Sua localização detectada", countryIn:"Você está em",
    countryCurrency:"💱 MOEDA", countryShipping:"🚚 ENVIO",
    countryPopular:"🔥 MAIS PEDIDOS EM", countryViewPrices:"Ver preços para",
    countryEmpty:"Selecione seu país para ver os preços",
    iaBadge:"Ferramentas IA · Exclusivo Power Vita",
    iaTitle1:"Tecnologia que", iaTitleEm:"potencializa sua saúde",
    testimoniosBadge:"Comunidade Power Vita",
    testimoniosTitle1:"O que dizem", testimoniosTitleEm:"nossos parceiros",
    contactBadge:"Contato direto",
    contactTitle1:"Vamos conversar", contactTitleEm:"hoje",
    contactSub:"Respondemos em minutos. Consultoria personalizada para seu país.",
    contactWa:"💬 Escrever no WhatsApp", contactLink:"🛒 Registrar agora",
    faqTitle:"Perguntas frequentes",
    faqSub:"Tudo que você precisa saber",
    faqMoreQ:"💬 Tenho outra dúvida",
    faqQA:[
      {q:"Os produtos FuXion são seguros?",a:"Sim. FuXion tem certificações internacionais: GMP, FDA Registered, HACCP e Clean Label. Todos os ingredientes são naturais, sem conservantes artificiais, adequados para toda a família."},
      {q:"Quanto tempo leva a entrega?",a:"FuXion entrega diretamente no seu país. Os prazos variam: Uruguai 24-48h, Argentina e Colômbia 2-5 dias úteis, resto da América Latina 3-7 dias. Confirmamos o prazo exato pelo WhatsApp."},
      {q:"E se eu não gostar dos produtos?",a:"FuXion oferece garantia de satisfação. Se os produtos não atenderem suas expectativas, orientamos você a encontrar a combinação certa ou gerenciamos uma solução."},
      {q:"Posso comprar só como cliente ou também fazer o negócio?",a:"As duas opções estão disponíveis. Você pode se registrar como Cliente Preferencial para preços especiais, ou como Empreendedor se quiser construir um negócio."},
      {q:"Todos os produtos estão disponíveis no meu país?",a:"FuXion opera em 37 países, mas o catálogo varia por região. Nos envie uma mensagem no WhatsApp com seu país e diremos exatamente o que está disponível e a que preço."},
      {q:"As ferramentas de IA têm algum custo?",a:"Não, são 100% gratuitas. O Plano Nutricional, Analisador de Sintomas, Preditor de ROI e Elite Program são exclusivos do Power Vita sem custo adicional."},
    ],
    statsImpact:"Vidas impactadas em 37 países",
    statsItems:[["37","Países"],["15K+","Parceiros"],["98%","Satisfação"]],
    leadTitle:"Receba seu Plano Personalizado",
    leadSub:"Deixe seus dados e enviamos pelo WhatsApp um plano adaptado aos seus objetivos — sem custo.",
    leadError:"Por favor preencha todos os campos.",
    leadGoals:[{v:"salud",l:"💚 Melhorar minha saúde"},{v:"energia",l:"⚡ Mais energia"},{v:"peso",l:"⚖️ Controle de peso"},{v:"negocio",l:"💼 Negócio global"}],
    modalSub:"O que melhor te descreve? Escolha seu perfil para continuar no FuXion.",
    modalOpt1:"💚 Quero os produtos", modalOpt1Sub:"Me registro como Cliente Preferencial",
    modalOpt2:"💼 Quero o negócio", modalOpt2Sub:"Me registro como Empreendedor FuXion",
    modalCancel:"Cancelar",
    footerSub:"Distribuidor FuXion Global Autorizado",
    instaBadge:"Instagram · Power Vita",
    instaTitle:"Siga no Instagram",
    instaSub:"Receitas, dicas e transformações reais. Comunidade ativa todos os dias.",
    instaBtn:"Ver Instagram →",
    nutriGoals:["💪 Mais energia","🌿 Detox e digestão","⚖️ Perder peso","🛡️ Reforçar imunidade","😴 Dormir melhor","✨ Melhorar a pele"],
    nutriDiets:["🥩 Onívoro","🐟 Pescetariano","🥚 Vegetariano","🌱 Vegano","🌾 Sem glúten"],
    nutriSymptoms:["Fadiga crônica","Inchaço","Insônia","Estresse","Digestão lenta","Pele opaca","Imunidade baixa","Ansiedade"],
    nutriTitle:"Plano Nutricional IA", nutriSub:"Personalizado · 7 dias · FuXion",
    nutriObj:"OBJETIVO", nutriSym:"SINTOMAS", nutriDiet:"DIETA", nutriAge:"IDADE", nutriWeight:"PESO kg",
    nutriProds:"✦ PRODUTOS", nutriDays:"📅 7 DIAS",
    nutriGen:"✨ Gerar meu plano com IA →", nutriLoading:"🧠 Gerando com IA...",
    nutriStart:"💬 Começar", nutriNew:"🔄 Novo",
    nutriErrTitle:"Não conseguimos gerar seu plano.", nutriErrSub:"Verifique sua conexão e tente novamente.", nutriRetry:"🔄 Tentar novamente",
    symptomTitle:"Analisador de Sintomas IA", symptomSub:"Descreva como você se sente · IA recomenda",
    symptomPlaceholder:"Ex: Sinto cansaço, meu estômago está inchado...",
    symptomExamples:["Sinto cansaço o dia todo","Meu estômago está inchado","Muito estresse, não consigo dormir","Quero perder peso"],
    symptomExLabel:"💡 EXEMPLOS:", symptomAnalyze:"🔬 Analisar com IA →", symptomLoading:"🧠 Analisando...",
    symptomDone:"Análise concluída", symptomDiag:"🧠 DIAGNÓSTICO",
    symptomUrgBajo:"✅ Nível Baixo", symptomUrgMedio:"⚠️ Nível Médio", symptomUrgAlto:"🔴 Nível Alto",
    symptomStart:"💬 Começar", symptomNew:"🔄 Novo",
    roiTitle:"Preditor de ROI IA", roiSub:"Projeção de renda com IA real",
    roiCountry:"PAÍS", roiHoursLabel:"HORAS / SEMANA", roiContactsLabel:"REDE DE CONTATOS", roiExpLabel:"EXPERIÊNCIA",
    roiHours:["⏰ 5-10 hrs/sem","⏰ 10-20 hrs/sem","⏰ 20-30 hrs/sem","⏰ +30 hrs/sem"],
    roiContacts:["👥 0-50","👥 50-200","👥 200-500","👥 +500"],
    roiExp:["🌱 Sem experiência","📊 Um pouco de exp.","💼 Com experiência","🏆 Muito exp."],
    roiCalc:"💰 Calcular meu potencial →", roiLoading:"🧠 Calculando...",
    roiPlaceholder:"Selecione seu país...",
    roiMonths:[{k:"mes1",l:"1 mês"},{k:"mes3",l:"3 meses"},{k:"mes6",l:"6 meses"},{k:"mes12",l:"12 meses"}],
    roiPotBajo:"🌱 Bom Potencial", roiPotMedio:"🚀 Alto Potencial", roiPotAlto:"💎 Potencial Muito Alto", roiPotMuyAlto:"👑 Potencial Excepcional",
    roiPartner:"👑 Quero ser parceiro", roiRecalc:"🔄 Recalcular",
    eliteTitle:"Elite Program", eliteSub:"IA gera seu protocolo de 90 dias",
    eliteName:"NOME", eliteCountry:"PAÍS", eliteGoal:"OBJETIVO", eliteSymptoms:"SINTOMAS", eliteAge:"IDADE", eliteWeight:"PESO kg",
    eliteNamePh:"Qual é seu nome?", eliteCountryPh:"Selecione seu país...",
    eliteGoals:["💪 Ganhar massa muscular","🌿 Detox profundo","⚖️ Perder peso","🛡️ Reforçar imunidade","⚡ Mais energia","✨ Anti-envelhecimento"],
    eliteSymList:["Fadiga","Sobrepeso","Digestão lenta","Estresse","Insônia","Pele opaca","Imunidade baixa","Dores musculares"],
    eliteGen:"👑 Gerar meu Plano Elite 90 dias →",
    eliteLoading:"Desenhando seu protocolo...", eliteLoadingSub:"Claude AI analisa seu perfil e cria seu plano único de 90 dias",
    eliteGenerated:"PLANO GERADO COM IA ✓", eliteResult:"🎯 RESULTADO EM 90 DIAS",
    eliteFase:"Fase", eliteWantPlan:"👑 Quero este plano · Ver preço em",
    eliteNew:"🔄 Novo", eliteCopy:"📋 Copiar",
    counterTitle:"Atividade em tempo real", counterSub:"Últimas 24 horas · Global", counterLive:"AO VIVO",
    counterJoined:"pessoas se juntaram nas últimas 24h",
    counterActivity:"ATIVIDADE HOJE POR HORA", counterNow:"agora",
    counterRecent:"ÚLTIMAS ADESÕES", counterFrom:"de", counterJoinedWith:"Entrou com", counterMins:"min",
    counterHighActivity:"🟢 Alta atividade agora", counterNormalActivity:"🔵 Atividade normal",
    antesTitle:"Transformações reais", antesSub:"Casos verificados",
    antesAfter:"✨ Depois", antesBefore:"📸 Antes",
    antesWant:"💬 Quero resultados como",
    chatGreeting:"Olá! Sou seu Vita Advisor 🌿 Como posso te ajudar?",
    chatTitle:"Vita Advisor IA", chatOnline:"● Online",
    chatPlaceholder:"Pergunte-me sobre saúde ou negócio...",
    chatError:"Erro. Entre em contato pelo WhatsApp 💬",
    leadFormName:"NOME *", leadFormEmail:"EMAIL", leadFormEmailOpt:"(opcional)",
    leadFormCountry:"PAÍS *", leadFormCountryPh:"Selecione seu país...",
    leadFormGoalLabel:"O QUE VOCÊ BUSCA? *",
    leadFormSubmit:"💬 Quero meu plano grátis →", leadFormPrivacy:"Sem spam. Só abrimos o WhatsApp com suas info.",
    leadFormDoneTitle:"Pronto! Te esperamos no WhatsApp", leadFormDoneSub:"Sua mensagem está pronta. Complete o envio.",
    leadFormAnother:"Enviar outro →",
  },
};

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [scrollY,setScrollY]=useState(0); const [loaded,setLoaded]=useState(false);
  const [selCountry]=useState(detectCountry); const [recipeFilter,setRecipeFilter]=useState(0);
  const [activeRecipe,setActiveRecipe]=useState(null); const [prodLine,setProdLine]=useState(0);
  const [hovCard,setHovCard]=useState(null); const [chatOpen,setChatOpen]=useState(false);
  const [selectedCountry,setSelectedCountry]=useState(()=>detectCountry()||"");
  const [packModal,setPackModal]=useState(null); const [catalogOpen,setCatalogOpen]=useState(false);
  const [lang,setLang]=useState("es");
  const T=TRANSLATIONS[lang];

  useEffect(()=>{
    setTimeout(()=>setLoaded(true),150);
    const onScroll=()=>setScrollY(window.scrollY);
    window.addEventListener("scroll",onScroll); return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  const waLink = waHref(WA, `Hola! Te contacto desde ${selCountry||"mi país"} para más info sobre Power Vita 🌿`);
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
    flag: "🌍", currency: "USD", shipping: "Entrega express dentro de tu país",
    note: "FuXion entrega directamente en tu país. Te enviamos la cotización exacta por WhatsApp.",
    popular: ["REXET","VITA XTRA T+","NUTRADAY"]
  } : null);

  const navSections = ["inicio","sistema","iatools","testimonios","contacto"].map((id,i)=>[id,T.nav[i]]);

  return (
    <LangCtx.Provider value={T}>
    <div style={{fontFamily:"Georgia,serif",background:"#FAFAF7",color:"#1a2e1a",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        .pf{font-family:'Playfair Display',Georgia,serif}
        .int{font-family:'Inter',sans-serif}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
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
          <button onClick={()=>setLang(l=>l==="es"?"en":l==="en"?"pt":"es")} className="int" style={{background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",color:"#2d6a4f",padding:"6px 12px",borderRadius:999,fontSize:11,fontWeight:700,cursor:"pointer"}}>
            {lang==="es"?"🌐 ES":lang==="en"?"🌐 EN":"🌐 PT"}
          </button>
          <a href={waLink} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"Nav_CTA"})} className="int" style={{background:"#1a2e1a",color:"#fff",padding:"8px 18px",borderRadius:100,fontSize:12,fontWeight:600,textDecoration:"none",marginLeft:4}}>{T.navCta}</a>
        </div>
      </nav>

      {/* HERO */}
      <section id="inicio" style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"100px 40px 70px",background:"linear-gradient(160deg,#FAFAF7 0%,#F0F4ED 55%,#E8F0E9 100%)",position:"relative",overflow:"hidden",textAlign:"center"}}>
        <div style={{position:"absolute",top:-70,right:-70,width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(45,106,79,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className={loaded?"fade-up":""} style={{position:"relative",zIndex:1,maxWidth:640}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",borderRadius:999,padding:"5px 16px",marginBottom:22}}>
            <span className="int" style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>{T.heroBadge}</span>
          </div>
          <h1 className="pf" style={{fontSize:"clamp(2.4rem,5vw,4rem)",fontWeight:700,lineHeight:1.06,color:"#1a2e1a",letterSpacing:-2,marginBottom:20}}>
            {T.heroTitle1}<br/><em style={{fontStyle:"italic",color:"#2d6a4f"}}>{T.heroTitleEm}</em><br/>{T.heroTitle2}
          </h1>
          <p className="int" style={{fontSize:16,lineHeight:1.8,color:"#5a7a5a",maxWidth:460,margin:"0 auto 36px",fontWeight:300}}>
            {T.heroSub}
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:52}}>
            <button onClick={()=>scrollTo("sistema")} className="int" style={{background:"#1a2e1a",color:"#fff",padding:"13px 28px",borderRadius:100,fontWeight:600,fontSize:13,border:"none",cursor:"pointer"}}>{T.heroCta1}</button>
            <a href={waLink} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"Hero_WA"})} className="int" style={{background:"transparent",color:"#1a2e1a",border:"1.5px solid rgba(26,46,26,0.22)",padding:"13px 28px",borderRadius:100,fontWeight:600,fontSize:13,textDecoration:"none"}}>{T.heroCta2}</a>
          </div>
          <div style={{display:"flex",gap:40,justifyContent:"center"}}>
            {T.heroStats.map(([n,l])=>(
              <div key={l}><div className="pf" style={{fontSize:26,fontWeight:700,color:"#1a2e1a",lineHeight:1}}>{n}</div><div className="int" style={{fontSize:10,color:"#7a9a7a",marginTop:3,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTS */}
      <div style={{background:"#1a2e1a",padding:"12px 0",overflow:"hidden"}}>
        <div style={{display:"flex",gap:48,animation:"marquee 28s linear infinite",width:"max-content"}}>
          {certDouble.map((c,i)=><span key={i} className="int" style={{color:"rgba(255,255,255,0.92)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap"}}>✦ {c}</span>)}
        </div>
      </div>

      {/* SISTEMA FUXION + PACKS */}
      <section id="sistema" style={{padding:"80px 40px",background:"#FAFAF7"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>{T.sistemaBadge}</span>
            <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a",lineHeight:1.1,marginBottom:12}}>{T.sistemaTitle1} <em style={{color:"#2d6a4f",fontStyle:"italic"}}>{T.sistemaTitleEm}</em></h2>
            <p className="int" style={{color:"#7a9a7a",fontSize:13,maxWidth:480,margin:"0 auto",lineHeight:1.7}}>{T.sistemaSub}</p>
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
                    <div><div className="int" style={{fontSize:9,fontWeight:800,color:p.color,letterSpacing:2,textTransform:"uppercase"}}>{T.stepLabel} {p.step}</div><div className="pf" style={{fontSize:15,fontWeight:700,color:"#1a2e1a"}}>{p.title}</div></div>
                  </div>
                  <div className="int" style={{fontSize:10,fontWeight:700,color:p.color,marginBottom:4}}>{p.sub}</div>
                  <p className="int" style={{fontSize:12,color:"#7a9a7a",lineHeight:1.6}}>{p.desc}</p>
                </div>
                <div style={{padding:"14px 22px 18px",flex:1,display:"flex",flexDirection:"column"}}>
                  <div className="int" style={{fontSize:9,fontWeight:800,color:"#9ca3af",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>{T.stepProds}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
                    {p.prods.map(pr=><span key={pr} style={{background:p.color+"10",border:`1px solid ${p.color}22`,borderRadius:999,padding:"3px 9px",fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:600,color:p.color}}>{pr}</span>)}
                    <span style={{background:"rgba(0,0,0,0.04)",borderRadius:999,padding:"3px 9px",fontFamily:"'Inter',sans-serif",fontSize:10,color:"#9ca3af"}}>+más</span>
                  </div>
                  <div style={{display:"flex",gap:7,marginTop:"auto"}}>
                    <a href={waHref(WA, `Hola! Me interesa el Paso ${p.step} (${p.title}) de FuXion 🌿 ¿Cuál es el precio en mi país?`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:`Paso_${p.step}_Precio`})} style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>{T.stepCta1}</a>
                    <button onClick={()=>{trackEvent("Purchase",{content_name:p.title,content_type:"product",currency:"USD"});setPackModal(p.title);}} style={{flex:1,background:p.color,color:"#fff",border:"none",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>{T.stepCta2}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Packs */}
          <div style={{textAlign:"center",marginBottom:28}}>
            <h3 className="pf" style={{fontSize:"clamp(1.3rem,2.5vw,1.9rem)",fontWeight:700,color:"#1a2e1a",marginBottom:8}}>{T.packTitle1} <em style={{color:"#2d6a4f",fontStyle:"italic"}}>{T.packTitleEm}</em></h3>
            <p className="int" style={{color:"#7a9a7a",fontSize:12}}>{T.packSub}</p>
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
                  <a href={waHref(WA, `Hola! Me interesa el ${pack.name} de Power Vita FuXion 🌿 ¿Cuál es el precio en mi país?`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:`${pack.name}_Precio`})} style={{flex:1,background:"#25D366",color:"#fff",borderRadius:10,padding:"10px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>{T.packCta1}</a>
                  <button onClick={()=>{trackEvent("Purchase",{content_name:pack.name,content_type:"product",currency:"USD"});setPackModal(pack.name);}} style={{flex:1,background:`linear-gradient(135deg,${pack.color}cc,${pack.color})`,color:"#fff",border:"none",borderRadius:10,padding:"10px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>{T.packCta2}</button>
                </div>
              </div>
            ))}
          </div>

          {/* Catálogo colapsado */}
          <div style={{textAlign:"center"}}>
            <button onClick={()=>setCatalogOpen(o=>!o)} className="int" style={{background:"none",border:"1.5px solid rgba(45,106,79,0.2)",borderRadius:999,padding:"10px 24px",fontSize:12,fontWeight:600,color:"#2d6a4f",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(45,106,79,0.05)";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
              {catalogOpen?T.catalogHide:T.catalogShow}
            </button>
          </div>
          {catalogOpen&&(
            <div style={{marginTop:32}}>
              <div style={{display:"flex",gap:7,marginBottom:24,flexWrap:"wrap"}}>
                {lineLabels.map((l,i)=>{const lc=i===0?"#1a2e1a":LINE_COLORS[lineKeys[i]]||"#1a2e1a";return(<button key={i} onClick={()=>setProdLine(i)} className="int" style={{padding:"6px 14px",borderRadius:999,fontWeight:700,fontSize:10,cursor:"pointer",border:"2px solid",borderColor:prodLine===i?lc:"rgba(26,46,26,0.14)",background:prodLine===i?lc:"transparent",color:prodLine===i?"#fff":lc,transition:"all .2s"}}>{l}</button>);})}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
                {filtProds.map(p=>{
                  const unavail = selectedCountry && countryData?.unavailable?.includes(p.name);
                  return (
                  <div key={p.id} onMouseEnter={()=>setHovCard(p.id)} onMouseLeave={()=>setHovCard(null)} style={{background:"#fff",borderRadius:18,overflow:"hidden",border:`1px solid ${unavail?"rgba(0,0,0,0.06)":hovCard===p.id?p.color+"45":"rgba(0,0,0,0.06)"}`,boxShadow:hovCard===p.id&&!unavail?`0 14px 36px ${p.color}18`:"0 2px 10px rgba(0,0,0,0.04)",transition:"all .3s",transform:hovCard===p.id&&!unavail?"translateY(-4px)":"translateY(0)",display:"flex",flexDirection:"column",opacity:unavail?0.52:1,position:"relative"}}>
                    {unavail&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.72)",borderRadius:18}}><div style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:"#9ca3af",textAlign:"center",padding:"0 12px"}}>{T.unavailLabel} {selectedCountry}</div><a href={waHref(WA, `Hola! ¿Hay alguna alternativa a ${p.name} disponible en ${selectedCountry}? 🌿`)} target="_blank" rel="noreferrer" style={{marginTop:6,background:"#25D366",color:"#fff",borderRadius:8,padding:"5px 12px",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,textDecoration:"none"}}>{T.unavailCta}</a></div>}
                    <div style={{background:hovCard===p.id&&!unavail?p.color:p.bg,height:120,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"background .3s"}}>
                      <div style={{position:"absolute",top:8,left:8,background:hovCard===p.id&&!unavail?"rgba(255,255,255,0.22)":p.color,color:"#fff",borderRadius:999,padding:"2px 8px",fontFamily:"'Inter',sans-serif",fontSize:7,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{p.line}</div>
                      {p.img?<img src={p.img} alt={p.name} style={{maxHeight:100,maxWidth:"85%",objectFit:"contain",filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.1))"}} onError={e=>{e.target.style.display="none";if(e.target.nextSibling)e.target.nextSibling.style.display="flex";}}/>:null}
                      <div style={{display:p.img?"none":"flex",fontSize:40,alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>{p.emoji}</div>
                    </div>
                    <div style={{padding:"13px 14px",flex:1,display:"flex",flexDirection:"column",gap:4}}>
                      <div className="pf" style={{fontSize:12,fontWeight:700,color:"#1a2e1a"}}>{p.name}</div>
                      <p className="int" style={{fontSize:10,color:"#7a9a7a",lineHeight:1.5,flex:1}}>{p.desc}</p>
                      <div style={{display:"flex",gap:5,marginTop:6}}>
                        <a href={waHref(WA, `Hola! Me interesa ${p.name} de FuXion. ¿Precio en mi país? 🌿`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:`${p.name}_Precio`})} style={{flex:1,background:"#25D366",color:"#fff",borderRadius:8,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,textAlign:"center",textDecoration:"none"}}>{T.catalogPriceCta}</a>
                        <button onClick={()=>{trackEvent("Purchase",{content_name:p.name,content_type:"product",currency:"USD"});setPackModal(p.name);}} style={{flex:1,background:p.color,color:"#fff",border:"none",borderRadius:8,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:9,cursor:"pointer"}}>{T.catalogBuyCta}</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SELECTOR DE PAÍS — fusionado */}
          <div style={{marginTop:52,paddingTop:52,borderTop:"1px solid rgba(45,106,79,0.1)"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <h3 className="pf" style={{fontSize:"clamp(1.2rem,2.5vw,1.7rem)",fontWeight:700,color:"#1a2e1a",marginBottom:6}}>{T.countryTitle1} <em style={{color:"#2d6a4f",fontStyle:"italic"}}>{T.countryTitleEm}</em></h3>
              <p className="int" style={{color:"#7a9a7a",fontSize:13}}>{T.countrySub}</p>
            </div>
            <div style={{maxWidth:460,margin:"0 auto"}}>
              <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:20,padding:"22px 24px",boxShadow:"0 6px 24px rgba(45,106,79,0.06)"}}>
                {detectCountry()&&COUNTRY_DATA[detectCountry()]&&<div style={{display:"flex",alignItems:"center",gap:9,background:"rgba(45,106,79,0.05)",border:"1px solid rgba(45,106,79,0.1)",borderRadius:10,padding:"8px 11px",marginBottom:11}}><span style={{fontSize:16}}>{COUNTRY_DATA[detectCountry()]?.flag}</span><div style={{flex:1}}><div className="int" style={{fontSize:10,fontWeight:700,color:"#2d6a4f"}}>{T.countryDetected}</div><div className="int" style={{fontSize:9,color:"#7a9a7a"}}>{T.countryIn} <strong>{detectCountry()}</strong></div></div><div style={{width:6,height:6,borderRadius:"50%",background:"#25D366",animation:"pulse 2s ease-in-out infinite"}}/></div>}
                <label className="int" style={{fontSize:10,fontWeight:700,color:"#2d6a4f",letterSpacing:1,display:"block",marginBottom:5}}>{T.countryLabel}</label>
                <select value={selectedCountry} onChange={e=>setSelectedCountry(e.target.value)} style={{width:"100%",background:"rgba(45,106,79,0.04)",border:"1.5px solid rgba(45,106,79,0.16)",borderRadius:10,padding:"9px 12px",fontFamily:"'Inter',sans-serif",fontSize:12,outline:"none",cursor:"pointer",color:selectedCountry?"#1a2e1a":"#9ca3af",boxSizing:"border-box",marginBottom:12}}>
                  <option value="">{T.countryPlaceholder}</option>
                  {COUNTRIES.map(c=><option key={c} value={c}>{COUNTRY_DATA[c]?.flag||"🌐"} {c}</option>)}
                </select>
                {selectedCountry&&countryData&&(
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:9}}>
                      <div style={{background:"rgba(45,106,79,0.05)",borderRadius:9,padding:"9px 11px"}}><div className="int" style={{fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:2}}>{T.countryCurrency}</div><div className="int" style={{fontSize:14,fontWeight:800,color:"#1a2e1a"}}>{countryData.currency}</div></div>
                      <div style={{background:"rgba(45,106,79,0.05)",borderRadius:9,padding:"9px 11px"}}><div className="int" style={{fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:2}}>{T.countryShipping}</div><div className="int" style={{fontSize:10,fontWeight:700,color:"#1a2e1a",lineHeight:1.3}}>{countryData.shipping}</div></div>
                    </div>
                    <div style={{background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.16)",borderRadius:9,padding:"7px 10px",marginBottom:9}}><p className="int" style={{fontSize:10,color:"#8B6914",lineHeight:1.5}}>ℹ️ {countryData.note}</p></div>
                    <div style={{marginBottom:11}}><div className="int" style={{fontSize:9,fontWeight:700,color:"#2d6a4f",marginBottom:4}}>{T.countryPopular} {selectedCountry.toUpperCase()}</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{countryData.popular.map(p=><div key={p} style={{background:"#fff",border:"1px solid rgba(45,106,79,0.13)",borderRadius:7,padding:"2px 8px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"#2d6a4f"}}>{p}</div>)}</div></div>
                    <a href={waHref(WA, `¡Hola! Estoy en ${selectedCountry} ${countryData.flag} y quiero ver los precios de FuXion 🌿`)} target="_blank" rel="noreferrer" style={{display:"block",width:"100%",background:"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",borderRadius:10,padding:"11px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>{countryData.flag} {T.countryViewPrices} {selectedCountry} →</a>
                  </div>
                )}
                {!selectedCountry&&<div style={{textAlign:"center",padding:"8px 0"}}><div style={{fontSize:24,marginBottom:4}}>🌍</div><p className="int" style={{fontSize:11,color:"#9ca3af"}}>{T.countryEmpty}</p></div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECETARIO OCULTO */}
      {false && <section id="recetario" style={{padding:"80px 40px",background:"#F0F4ED"}}>
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
      </section>}

      {/* IA TOOLS */}
      <section id="iatools" style={{padding:"80px 40px",background:"linear-gradient(160deg,#020b18,#041a0e 50%,#020b18)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(45,106,79,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(45,106,79,0.06) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"10%",left:"15%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(45,106,79,0.15) 0%,transparent 70%)",pointerEvents:"none",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",bottom:"10%",right:"10%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.1) 0%,transparent 70%)",pointerEvents:"none",filter:"blur(40px)"}}/>
        <div style={{maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1}}>
          <div style={{textAlign:"center",marginBottom:60}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.36)",borderRadius:999,padding:"7px 20px",marginBottom:18}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#FFD700",display:"inline-block",animation:"pulse 2s ease-in-out infinite"}}/>
              <span className="int" style={{fontSize:10,fontWeight:800,color:"#FFD700",letterSpacing:3,textTransform:"uppercase"}}>{T.iaBadge}</span>
            </div>
            <h2 className="pf" style={{fontSize:"clamp(1.8rem,4vw,3rem)",fontWeight:700,color:"#fff",marginBottom:14,lineHeight:1.1}}>
              {T.iaTitle1}<br/>
              <span style={{background:"linear-gradient(135deg,#C9A84C,#FFD700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontStyle:"italic"}}>{T.iaTitleEm}</span>
            </h2>
            <p className="int" style={{color:"rgba(255,255,255,0.85)",fontSize:14,maxWidth:480,margin:"0 auto",lineHeight:1.8}}>4 herramientas que <span style={{color:"#FFD700",fontWeight:700}}>ningún otro distribuidor FuXion</span> en el mundo tiene. Gratis.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:22}}>
            {/* NutriPlan */}
            <div style={{background:"rgba(10,28,18,0.8)",backdropFilter:"blur(20px)",border:"1px solid rgba(45,106,79,0.3)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.45)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.55),0 0 100px rgba(45,106,79,0.18)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.45)";}}>
              <div style={{height:2,background:"linear-gradient(90deg,transparent,#2d6a4f,#52b788,#2d6a4f,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(45,106,79,0.14)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(45,106,79,0.28)",border:"1px solid rgba(45,106,79,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🥗</div><div style={{flex:1}}><div className="pf" style={{color:"#fff",fontWeight:700,fontSize:12,marginBottom:1}}>Plan Nutricional IA</div><div className="int" style={{color:"rgba(255,255,255,0.95)",fontSize:9}}>7 días · Personalizado · FuXion</div></div><div style={{background:"rgba(82,183,136,0.18)",border:"1px solid rgba(82,183,136,0.45)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#52b788"}}>AI ✦</div></div>
              <NutriPlan/>
            </div>
            {/* SymptomAnalyzer */}
            <div style={{background:"rgba(8,18,42,0.82)",backdropFilter:"blur(20px)",border:"1px solid rgba(21,101,192,0.3)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.45)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.55),0 0 100px rgba(21,101,192,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.45)";}}>
              <div style={{height:2,background:"linear-gradient(90deg,transparent,#1565C0,#42a5f5,#1565C0,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(21,101,192,0.14)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(21,101,192,0.28)",border:"1px solid rgba(66,165,245,0.36)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🔬</div><div style={{flex:1}}><div className="pf" style={{color:"#fff",fontWeight:700,fontSize:12,marginBottom:1}}>Analizador de Síntomas</div><div className="int" style={{color:"rgba(255,255,255,0.95)",fontSize:9}}>Diagnóstico · Productos ideales</div></div><div style={{background:"rgba(66,165,245,0.18)",border:"1px solid rgba(66,165,245,0.45)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#42a5f5"}}>AI ✦</div></div>
              <SymptomAnalyzer/>
            </div>
            {/* ROI Predictor */}
            <div style={{background:"rgba(18,12,3,0.88)",backdropFilter:"blur(20px)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.45)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.55),0 0 100px rgba(201,168,76,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.45)";}}>
              <div style={{height:2,background:"linear-gradient(90deg,transparent,#C9A84C,#FFD700,#C9A84C,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,168,76,0.14)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(201,168,76,0.28)",border:"1px solid rgba(255,215,0,0.36)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>💰</div><div style={{flex:1}}><div className="pf" style={{color:"#FFD700",fontWeight:700,fontSize:12,marginBottom:1}}>ROI Predictor IA</div><div className="int" style={{color:"rgba(255,255,255,0.95)",fontSize:9}}>Proyección · Ingresos reales</div></div><div style={{background:"rgba(255,215,0,0.13)",border:"1px solid rgba(255,215,0,0.45)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#FFD700"}}>AI ✦</div></div>
              <ROIPredictor/>
            </div>
            {/* Elite Program */}
            <div style={{background:"rgba(10,5,1,0.9)",backdropFilter:"blur(20px)",border:"1px solid rgba(201,168,76,0.45)",borderRadius:24,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.5),0 0 70px rgba(201,168,76,0.07)",transition:"transform .3s,box-shadow .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 36px 72px rgba(0,0,0,0.6),0 0 120px rgba(201,168,76,0.18)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 52px rgba(0,0,0,0.5),0 0 70px rgba(201,168,76,0.07)";}}>
              <div style={{height:3,background:"linear-gradient(90deg,transparent,#C9A84C,#FFD700,#FFD700,#C9A84C,transparent)"}}/>
              <div style={{padding:"15px 17px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,168,76,0.18)"}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(201,168,76,0.36)",border:"1px solid rgba(255,215,0,0.48)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👑</div><div style={{flex:1}}><div className="pf" style={{color:"#FFD700",fontWeight:700,fontSize:12,marginBottom:1}}>Elite Program 90 días</div><div className="int" style={{color:"rgba(255,255,255,0.95)",fontSize:9}}>Plan completo · IA genera tu protocolo</div></div><div style={{background:"rgba(255,215,0,0.13)",border:"1px solid rgba(255,215,0,0.55)",borderRadius:7,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"#FFD700"}}>AI ✦</div></div>
              <EliteProgram/>
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:40}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 24px",flexWrap:"wrap",justifyContent:"center"}}>
              {[["🔒","100% Privado"],["⚡","Respuesta inmediata"],["🌿","Solo FuXion"],["🌍","37 países"]].map(([ic,lb],i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:5}}>{i>0&&<div style={{width:1,height:18,background:"rgba(255,255,255,0.08)"}}/>}<span style={{fontSize:13}}>{ic}</span><span className="int" style={{fontSize:10,color:"rgba(255,255,255,0.92)",fontWeight:600}}>{lb}</span></div>))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS + CONTADOR + ANTES/DESPUÉS */}
      <section id="testimonios" style={{padding:"80px 0",background:"#FAFAF7"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 40px"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>{T.testimoniosBadge}</span>
            <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a"}}>{T.testimoniosTitle1} <em style={{color:"#2d6a4f",fontStyle:"italic"}}>{T.testimoniosTitleEm}</em></h2>
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
            <div className="int" style={{fontSize:13,color:"#7a9a7a",fontWeight:600,marginBottom:18}}>{T.statsImpact}</div>
            <div style={{display:"flex",justifyContent:"center",gap:32,flexWrap:"wrap"}}>
              {T.statsItems.map(([v,l])=>(<div key={l}><div className="pf" style={{fontSize:20,fontWeight:700,color:"#C9A84C"}}>{v}</div><div className="int" style={{fontSize:9,color:"#7a9a7a",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>))}
            </div>
          </div>
        </div>
      </section>

      {/* LEAD FORM */}
      <section style={{padding:"80px 40px",background:"#F0F4ED"}}>
        <div style={{maxWidth:500,margin:"0 auto"}}>
          <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:22,padding:"38px 34px",boxShadow:"0 12px 44px rgba(45,106,79,0.07)",textAlign:"center"}}>
            <div style={{fontSize:38,marginBottom:9}}>🎯</div>
            <h2 className="pf" style={{fontSize:"clamp(1.2rem,2.5vw,1.8rem)",fontWeight:700,color:"#1a2e1a",marginBottom:7}}>{T.leadTitle}</h2>
            <p className="int" style={{color:"#7a9a7a",fontSize:13,lineHeight:1.7,marginBottom:24}}>{T.leadSub}</p>
            <LeadFormInline T={T}/>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:"80px 40px",background:"#F0F4ED"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>{T.faqTitle}</span>
            <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a"}}>{T.faqSub.split(" ").slice(0,-1).join(" ")} <em style={{color:"#2d6a4f",fontStyle:"italic"}}>{T.faqSub.split(" ").slice(-1)}</em></h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {T.faqQA.map((f,i)=><FaqItem key={i} q={f.q} a={f.a}/>)}
          </div>
          <div style={{textAlign:"center",marginTop:36}}>
            <a href={waHref(WA, "Hola! Tengo una pregunta sobre FuXion y Power Vita 🌿")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"FAQ_WA"})} className="int" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#25D366",color:"#fff",padding:"12px 24px",borderRadius:12,fontWeight:700,textDecoration:"none",fontSize:13}}>{T.faqMoreQ}</a>
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section style={{padding:"60px 40px",background:"#fff"}}>
        <div style={{maxWidth:600,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>📸</div>
          <h2 className="pf" style={{fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:700,color:"#1a2e1a",marginBottom:8}}>{T.instaTitle}</h2>
          <p className="int" style={{color:"#7a9a7a",fontSize:13,lineHeight:1.7,marginBottom:28}}>{T.instaSub}</p>
          <a href="https://instagram.com/powervita_uy" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",color:"#fff",padding:"14px 28px",borderRadius:14,fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:14,textDecoration:"none",boxShadow:"0 8px 28px rgba(131,58,180,0.3)"}}>
            📸 @powervita_uy → {T.instaBtn}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" style={{background:"#1a2e1a",padding:"44px 40px",textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:4}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(201,168,76,0.28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🌿</div>
          <div className="pf" style={{fontSize:18,color:"#C9A84C",letterSpacing:3,fontWeight:700}}>POWER VITA</div>
        </div>
        <div className="int" style={{color:"rgba(255,255,255,0.32)",fontSize:10,marginBottom:20}}>{T.footerSub}</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
          <a href={waLink} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"Footer_WA"})} className="int" style={{background:"#25D366",color:"#fff",padding:"9px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>💬 WhatsApp</a>
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
            <p className="int" style={{fontSize:13,color:"#7a9a7a",lineHeight:1.65,marginBottom:28}}>{T.modalSub}</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <a href={FUXION_LINK} target="_blank" rel="noreferrer" onClick={()=>{trackEvent("InitiateCheckout",{content_name:"Modal_Cliente"});setPackModal(null);}} style={{display:"block",background:"linear-gradient(135deg,#2d6a4f,#1a2e1a)",color:"#fff",borderRadius:12,padding:"14px 20px",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,textDecoration:"none"}}>
                {T.modalOpt1}
                <div style={{fontSize:10,fontWeight:400,opacity:0.8,marginTop:2}}>{T.modalOpt1Sub}</div>
              </a>
              <a href={FUXION_LINK} target="_blank" rel="noreferrer" onClick={()=>{trackEvent("InitiateCheckout",{content_name:"Modal_Emprendedor"});setPackModal(null);}} style={{display:"block",background:"linear-gradient(135deg,#C9A84C,#E8C86A)",color:"#fff",borderRadius:12,padding:"14px 20px",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,textDecoration:"none"}}>
                {T.modalOpt2}
                <div style={{fontSize:10,fontWeight:400,opacity:0.85,marginTop:2}}>{T.modalOpt2Sub}</div>
              </a>
            </div>
            <button onClick={()=>setPackModal(null)} className="int" style={{background:"none",border:"none",color:"#9ca3af",fontSize:12,cursor:"pointer"}}>{T.modalCancel}</button>
          </div>
        </div>
      )}

      <Chat open={chatOpen} onClose={()=>setChatOpen(false)}/>
      <a href={waLink} target="_blank" rel="noreferrer" title="WhatsApp" onClick={()=>trackEvent("Contact",{content_name:"FloatingWA_Bubble"})} style={{position:"fixed",bottom:80,right:20,zIndex:249,width:48,height:48,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 7px 20px rgba(37,211,102,0.42)",textDecoration:"none"}}>💬</a>
      <button onClick={()=>{if(!chatOpen)trackEvent("Contact",{content_name:"Chat_Open"});setChatOpen(o=>!o);}} style={{position:"fixed",bottom:20,right:20,zIndex:250,width:48,height:48,borderRadius:"50%",border:"none",background:chatOpen?"#0d3d24":"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",fontSize:19,cursor:"pointer",boxShadow:"0 7px 20px rgba(26,46,26,0.38)",transition:"all .3s"}}>
        {chatOpen?"✕":"🌿"}
      </button>
    </div>
    </LangCtx.Provider>
  );
}

// ── LEAD FORM INLINE ──────────────────────────────────────────────────────────
function LeadFormInline({ T }) {
  const [form,setForm]=useState({name:"",email:"",country:"",goal:""});
  const [sent,setSent]=useState(false); const [err,setErr]=useState("");
  const goals = T.leadGoals;
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = () => {
    if (!form.name||!form.country||!form.goal) { setErr(T.leadError); return; }
    setErr("");
    const gl = goals.find(g=>g.v===form.goal)?.l||form.goal;
    const msg = encodeURIComponent(`¡Hola! Soy ${form.name} de ${form.country} 🌍\nMe interesa: ${gl}\n${form.email?`Email: ${form.email}\n`:""}Quiero mi plan personalizado con Power Vita 🌿`);
    trackEvent("Lead", { content_name:gl, country:form.country });
    window.open(waHref(WA, decodeURIComponent(msg)),"_blank");
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
