import { useState, useEffect, useRef, createContext, useContext } from "react";

const LangCtx = createContext(null);

const WA = "59898950206";
const FUXION_LINK = "https://ifuxion.com/andresvarela/enrollment/chooseperson";
const META_PIXEL_ID = "2212676212813152";
// Pegá acá el ID del video de YouTube cuando esté listo (ej: "dQw4w9WgXcQ")
const YOUTUBE_VIDEO_ID = "";
// URL del post/reel de Instagram (con barra al final)
const INSTAGRAM_POST_URL = "https://www.instagram.com/p/DSGZtksipld/";

const COUNTRIES = ["Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Ecuador","El Salvador","España","Estados Unidos","Guatemala","Honduras","México","Nicaragua","Panamá","Paraguay","Perú","República Dominicana","Uruguay","Venezuela","Alemania","Australia","Bélgica","Canadá","Francia","Italia","Japón","Portugal","Reino Unido","Suiza","Sudáfrica","Emiratos Árabes","Singapur","Nueva Zelanda","Países Bajos","Austria","Israel"];

const COUNTRY_DATA = {
  "Uruguay":        { flag:"🇺🇾", currency:"UYU", shipping:"Lo recibís en 72 hs hábiles", note:"Todos los productos a $ 2.150 · Pagás con Mercado Pago",              popular:["Vita Xtra T+","Thermo T3","Prunex1"],         available:["Vita Xtra T+","Thermo T3","Nocarb-T","Prunex1","Biopro+ Fit"] },
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
  { id:1,  name:"Rexet",              line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"/prod-rexet.jpg",            emoji:"🌿", tag:"Reinicia tu cuerpo",             desc:"Bebida efervescente que desintoxica y protege el hígado frente al exceso de alcohol o comidas grasosas.", benefits:["Desintoxica el hígado","Elimina toxinas","Reactiva el metabolismo"],                               ing:"Tuna roja · Alcachofa · Hierba luisa · Clorofila · Zinc" },
  { id:2,  name:"Liquid Fiber",       line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"/prod-liquid-fiber.jpg",                                                emoji:"🍋", tag:"Digestión puntual",               desc:"Fibra prebiótica soluble que regula el ritmo digestivo y reduce la absorción de grasas.", benefits:["Regula la digestión","Nutre la flora intestinal","Reduce absorción de grasas"],                              ing:"Inulina · Oligofructuosa · Raíz de achicoria" },
  { id:3,  name:"Flora Liv",          line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"/prod-flora-liv.jpg",                                                emoji:"🫧", tag:"Protege desde adentro",           desc:"Bacterias probióticas vivas para regenerar la microbiota, mantener las defensas y prevenir trastornos digestivos.", benefits:["Regenera la microbiota","Mantiene defensas activas","Previene trastornos digestivos"],           ing:"Cultivos probióticos · Fibra prebiótica · Granadilla · Aguaymanto" },
  { id:4,  name:"Prunex1",            line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"/uy/img/prunex.jpg",                                                emoji:"🫐", tag:"Limpieza natural",                desc:"Té herbal de fibras solubles que libera el tránsito intestinal lento y reduce la hinchazón abdominal.", benefits:["Regula el tránsito intestinal","Reduce la hinchazón","Elimina desechos perjudiciales"],              ing:"Psyllium · Inulina · Mucílago de linaza · Guindón · Anís estrella" },
  { id:5,  name:"Alpha Balance",      line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"/prod-alpha-balance.jpg",                                                emoji:"🥬", tag:"Cuerpo alcalino",                 desc:"Bebida alcalinizante con vegetales verdes ricos en clorofila que equilibra el pH y elimina toxinas del organismo.", benefits:["Alcaliniza el organismo","Equilibra el pH","Elimina residuos tóxicos"],                       ing:"Alfalfa · Espirulina · Chlorella · Pasto de trigo · Espinaca · Jengibre" },
  { id:6,  name:"Berry Balance",      line:"Detox",   color:"#2d6a4f", bg:"#f0f7f3", img:"/prod-berry-balance.jpg",                                                emoji:"🫒", tag:"Protege el tracto urinario",      desc:"Concentrado de antioxidantes de berries que protege el sistema urinario, previene molestias y evita la retención de líquidos.", benefits:["Protege el tracto urinario","Evita retención de líquidos","Equilibra el pH urinario"], ing:"Cranberry · Berries tropicales · Probióticos · Antocianina · Calcio orgánico" },
  { id:7,  name:"Biopro+ Tect",       line:"Protein", color:"#1565C0", bg:"#f0f4fb", img:"/prod-biopro-tect.jpg",                                                emoji:"🛡️", tag:"Activa tus defensas",            desc:"Batido con Bioprotein+ Colostrum® patentado que activa el sistema de defensas y regenera las células.", benefits:["Eleva defensas inmunitarias","Regeneración celular","Fortalece huesos"],                             ing:"Bioprotein+ Colostrum® · Bioferrín® · Aminoácidos · Calcio lácteo · DHA" },
  { id:8,  name:"Protein Active",     line:"Protein", color:"#1565C0", bg:"#f0f4fb", img:"/prod-protein-active.jpg",                                                emoji:"💪", tag:"Nutrición vegetal avanzada",      desc:"Proteína 100% vegetal de quinua germinada y arroz integral que regenera tejidos y reduce el daño oxidativo.", benefits:["100% vegetal y sin lactosa","Regenera tejidos","Reduce daño oxidativo"],                         ing:"Quinua germinada · Arroz integral · Arveja · Algas · DHA · Aceite de coco" },
  { id:9,  name:"Nutraday",           line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"/prod-nutraday.jpg",                                                emoji:"⚡", tag:"Vitalidad familiar",              desc:"Refresco multivitamínico con moringa, camu camu y quinua germinada ideal para toda la familia.", benefits:["12 vitaminas + 5 minerales","Fortalece las defensas","Desarrollo físico y mental"],                    ing:"Moringa · Guayaba · Camu Camu · Açaí · Quinua germinada" },
  { id:10, name:"Vita Xtra T+",       line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"/uy/img/vita.jpg",          emoji:"🌟", tag:"Elimina la fatiga",              desc:"Energizante con guayusa, ginseng y cordyceps que elimina la fatiga física y mental y reduce la oxidación celular.", benefits:["Energía sostenida todo el día","Alto poder antioxidante","Elimina fatiga física y mental"], ing:"Guayusa · Té verde · Açaí · Goji berry · Cordyceps · Maca · Ginseng" },
  { id:11, name:"Vitaenergia",        line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"/prod-vitaenergia.jpg",                                                emoji:"🔥", tag:"Energía y vitalidad",              desc:"Bebida multivitamínica con antocianina de maíz morado y açaí que disipa la fatiga y refuerza el sistema inmune.", benefits:["Disipa la fatiga","Mejora asimilación de proteínas","Refuerza el sistema inmune"],         ing:"Aminoácidos · Vitaminas · Antocianina maíz morado · Açaí · Camu camu · Luteína" },
  { id:12, name:"Xpeed",              line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"/prod-xpeed.jpg",                                                emoji:"🚀", tag:"Energía inmediata",               desc:"Bebida energizante natural gasificada con mix ancestral de maca, guaraná y teína. Sin azúcar, lista para consumir.", benefits:["Energía inmediata","Contrarresta la fatiga","Efecto sparkling natural"],                        ing:"Maca · Guaraná · Teína · Taurina · Vitamina C · Vitamina B5" },
  { id:13, name:"Xpeed Citrus Power", line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"/prod-xpeed-citrus.jpg",                                                emoji:"🍋", tag:"Energía sabor cítrico",           desc:"Versión sin azúcar de Xpeed con sabor a limón y el mismo mix energético ancestral para vivir al máximo.", benefits:["Sin azúcar","Energía natural sostenida","Sabor limón refrescante"],                              ing:"Maca · Guaraná · Teína · Taurina · Vitamina C · Vitamina B5" },
  { id:14, name:"Vera+",              line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-vera-plus.jpg",                                                emoji:"🛡️", tag:"Defensas inteligentes",           desc:"Aloe vera, beta glucanos y extracto de hoja de oliva que fortalecen el sistema inmune y reducen el daño oxidativo.", benefits:["Mantiene defensas activas","Reduce deterioro celular","Fortalece el sistema inmune"],     ing:"Aloe vera · Beta glucanos · N-acetilcisteína · Extracto hoja de oliva · Amalaki" },
  { id:15, name:"Gano+ T",            line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-gano-t.jpg",                                                emoji:"🍵", tag:"Optimiza tu protección",          desc:"Té de Ganoderma Lucidum y té blanco que modula el sistema inmunológico y neutraliza radicales libres.", benefits:["Mantiene defensas activas","Modula el sistema inmune","Neutraliza radicales libres"],             ing:"Ganoderma Lucidum · Extracto de té blanco · Vitamina C y D" },
  { id:16, name:"Gano+ Cappuccino",   line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-gano-cappuccino.jpg",                                                emoji:"☕", tag:"Cappuccino inmunoprotector",      desc:"Café cappuccino con Ganoderma Lucidum, el hongo milenario del secreto de la longevidad asiática.", benefits:["Antioxidante celular","Modula las defensas naturales","Reduce daño oxidativo"],                     ing:"Ganoderma Lucidum · Quillay · Micronutrientes" },
  { id:17, name:"Café Ganomax",       line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-cafe-ganomax.jpg",                                                emoji:"☕", tag:"Café premium inmunológico",       desc:"Café gourmet colombiano con Ganoderma Lucidum y Uña de Gato amazónica para reforzar y regular el sistema inmune.", benefits:["Refuerza el sistema inmune","Reduce daño oxidativo","Mantiene la vitalidad"],          ing:"Café tostado · Ganoderma Lucidum · Uña de gato" },
  { id:18, name:"Thermo T3",          line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/uy/img/thermo.jpg",            emoji:"🔥", tag:"Activa tu metabolismo",          desc:"Mix de tres tés con L-Carnitina y Garcinia Cambogia que transforma la grasa en energía y reduce medidas corporales.", benefits:["Activa la termogénesis","Quema grasa naturalmente","Control de peso efectivo"],          ing:"Té verde · Té negro · Té rojo · Carnitina · Garcinia Cambogia · Café verde" },
  { id:19, name:"Nocarb-T",           line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/uy/img/nocarb.jpg",                                                emoji:"🌾", tag:"Carbohidratos bajo control",      desc:"Fórmula de fibras solubles, cromo y té verde que reduce la elevación de glucosa tras las comidas y controla el peso.", benefits:["Controla los carbohidratos","Mantiene niveles de glucosa","Reduce acumulación de grasa"], ing:"Fibra de yacón · Acacia · Inulina · Pectina de manzana · Canela · Té verde · Cromo" },
  { id:20, name:"Chocolate Fit",      line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/prod-chocolate-fit.jpg",                                                emoji:"🍫", tag:"Mantente en forma deliciosamente", desc:"Bebida vegetal de cacao puro amazónico con CLA que acelera el metabolismo, reduce medidas y calma la ansiedad.", benefits:["Reduce medidas corporales","Calma la ansiedad por comer","Acelera el metabolismo"],           ing:"Cacao puro amazónico · Proteína vegetal · Café verde · CLA · Cromo orgánico" },
  { id:21, name:"Café & Café Fit",    line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/prod-cafe-fit.jpg",                                                emoji:"☕", tag:"Café sin perder la línea",         desc:"Café gourmet enriquecido con extracto de café verde que apoya el control de peso y reduce el apetito.", benefits:["Apoya control de peso","Reduce sensación de apetito","Reduce cansancio y fatiga"],               ing:"Café tostado liofilizado · Extracto de café verde" },
  { id:22, name:"Café Fit Cappuccino",line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/prod-cafe-fit-cappuccino.jpg",                                                emoji:"☕", tag:"Cappuccino sin culpa",            desc:"Cappuccino gourmet bajo en calorías con café verde Svetol® para controlar el peso sin renunciar al placer.", benefits:["Bajo en calorías","Controla peso y medidas","Reduce el apetito"],                              ing:"Café tostado · Café verde Svetol® · Leche descremada · Crema para café" },
  { id:23, name:"Biopro+ Fit",        line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/uy/img/biopro.jpg",                                                emoji:"⚖️", tag:"Nutrición y reduce medidas",      desc:"Batido proteico con Prolibra® clínicamente probado que acelera el metabolismo de la grasa y tonifica el músculo.", benefits:["Acelera metabolismo de grasa","Tonifica la masa muscular","Reduce sensación de apetito"],  ing:"Bioprotein+ Colostrum® · Prolibra® · Aminoácidos · Tamarindo Malabar · DHA" },
  { id:24, name:"Protein Active Fit", line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/prod-protein-active-fit.jpg",           emoji:"💪", tag:"Proteína vegetal fit",           desc:"Proteína 100% vegetal con L-Carnitina y Tamarindo Malabar para controlar el peso, tonificar y reducir medidas.", benefits:["100% vegetal y sin lactosa","Controla peso y medidas","Tonifica los músculos"],              ing:"Quinua germinada · Arveja · Arroz integral · L-Carnitina · Cromo · Zinc orgánico" },
  { id:25, name:"Protein Xoup",       line:"Control", color:"#E65100", bg:"#fdf4ef", img:"/prod-protein-xoup.jpg",                                                emoji:"🍲", tag:"Sopas proteicas fit",              desc:"Sopas instantáneas de proteína vegetal con Slendesta® que aumenta la saciedad y CLA que previene acumulación de grasa.", benefits:["Alta saciedad con Slendesta®","Previene acumulación de grasa","Nutrición muscular activa"], ing:"Bioprotein Active® · Slendesta® · CLA · Hierro · Zinc · Magnesio" },
  { id:26, name:"Probal",             line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-probal.jpg",                                                emoji:"🌸", tag:"Salud femenina integral",         desc:"Té herbal con aguaje y ashwagandha que controla las molestias del período y balancea la menopausia.", benefits:["Refuerza la salud femenina","Controla molestias del período","Balance durante la menopausia"],    ing:"Aguaje · Dong Quai · Orégano · Triptófano · Magnesio · Camu-camu · Luteína" },
  { id:27, name:"Passion",            line:"Energy",  color:"#7B3FA0", bg:"#f5f0f9", img:"/prod-passion.jpg",                                                emoji:"🔆", tag:"Incrementa tu vigor",             desc:"Aminoácidos, jalea real, maca y ginseng que mejoran el vigor, la vitalidad y la energía de manera natural.", benefits:["Mejora la vitalidad","Incrementa la energía","Vigoriza el cuerpo"],                              ing:"Aminoácidos · Jalea real · Maca · Ginseng · Zinc orgánico" },
  { id:28, name:"Youth Elixir",       line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-youth-elixir.jpg",                                                emoji:"✨", tag:"Activa tu juventud",              desc:"Resveratrol de uva y súper frutas que reducen radicales libres, mejoran el sueño y previenen el envejecimiento prematuro.", benefits:["Anti-envejecimiento celular","Mejora el sueño profundo","Mayor elasticidad de piel"],     ing:"Resveratrol · Aminoácidos · Optiberry® · Blueberries · Sauco · Amalaki" },
  { id:29, name:"Golden FLX",         line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-golden-flx.jpg",                                                emoji:"🌿", tag:"Flexibilidad articular",          desc:"Té de cúrcuma orgánica con jengibre y leche de coco que previene molestias articulares y mejora la movilidad.", benefits:["Previene molestias articulares","Mejora flexibilidad y movilidad","Controla procesos oxidativos"], ing:"Cúrcuma · Jengibre · Cardamomo · Leche de coco · Pimienta negra · Canela" },
  { id:30, name:"Beauty-In",          line:"Immunity",color:"#00897B", bg:"#f0faf8", img:"/prod-beauty-in.jpg",                                                emoji:"💆", tag:"Belleza desde adentro",           desc:"Péptidos de colágeno bioactivo 4x más potentes que el colágeno convencional para piel firme, cabello y uñas fuertes.", benefits:["Piel más firme y elástica","Fortalece cabello y uñas","Previene envejecimiento prematuro"], ing:"Péptidos colágeno bioactivo · Coenzima Q10 · Biotina natural · Vitaminas C y E · Zinc" },
  { id:31, name:"On",                 line:"Mental",  color:"#E53935", bg:"#fff0f0", img:"/prod-on.jpg",                                                emoji:"🧠", tag:"Mente activa y alerta",           desc:"GABA, yerba mate y DHA que activan la mente, mejoran la función cognitiva y mantienen el enfoque sin causar somnolencia.", benefits:["Mente activa y alerta","Mejora función cognitiva","Nutre el cerebro"],                     ing:"GABA · Taurina · Yerba mate · Açaí · Camu camu · Vitaminas B · DHA · ARA" },
  { id:32, name:"No Stress",          line:"Mental",  color:"#E53935", bg:"#fff0f0", img:"/prod-no-stress.jpg",                                                emoji:"🧘", tag:"Equilibrio mental",               desc:"Aminoácidos esenciales con ashwagandha que reducen el estrés y mejoran la concentración sin causar somnolencia.", benefits:["Reduce el estrés y ansiedad","Mantiene concentración y enfoque","Mejora la relajación"],     ing:"L-Teanina · Glicina · Triptófano · Ashwagandha · Amalaki · Magnesio · Vitaminas B" },
  { id:33, name:"Pre Sport",          line:"Sport",   color:"#546E7A", bg:"#f0f4f5", img:"/prod-pre-sport.jpg",                                                emoji:"🏃", tag:"Prepara tu cuerpo",               desc:"Electrolitos y aminoácidos que mejoran el rendimiento, aumentan la resistencia y reducen la fatiga pre-entrenamiento.", benefits:["Energía explosiva pre-entreno","Mayor resistencia y vasodilatación","Hidratación con electrolitos"], ing:"Citrulina de sandía · β-Alanina · L-Creatina nitrato · Mix isotónico · Hierba mate" },
  { id:34, name:"Xtra Mile",          line:"Sport",   color:"#546E7A", bg:"#f0f4f5", img:"/prod-xtra-mile.jpg",                                                emoji:"🚴", tag:"Energía sostenida",               desc:"Palatinose® de bajo índice glucémico y agua de coco amazónico para energía balanceada y sostenida durante el ejercicio.", benefits:["Energía sostenida durante ejercicio","Hidratación eficiente","Reduce la fatiga"],        ing:"Palatinose® · Agua de coco amazónico · Sal de Maras · Mix de electrolitos · Zinc · Cromo" },
  { id:35, name:"Post Sport",         line:"Sport",   color:"#546E7A", bg:"#f0f4f5", img:"/prod-post-sport.jpg",                                                emoji:"🏋️", tag:"Recuperación muscular",           desc:"BCAAs, glutamina y agua de coco que reparan y fortalecen las fibras musculares después del entrenamiento intenso.", benefits:["Repara fibras musculares","Repone electrolitos naturalmente","Neutraliza el catabolismo"],  ing:"BCAAs · Glutamina · Acerola · Granada · Agua de coco" },
  { id:36, name:"Biopro+ Sport",      line:"Sport",   color:"#546E7A", bg:"#f0f4f5", img:"/prod-biopro-sport.jpg",                                                emoji:"💪", tag:"Músculos tonificados",            desc:"Batido proteico con Actinos® patentado que incrementa el flujo sanguíneo, genera masa muscular magra y mejora la recuperación.", benefits:["Genera masa muscular magra","Incrementa flujo sanguíneo","Mejora recuperación y oxigenación"], ing:"Bioprotein+ Colostrum® · Actinos® · Aminoácidos · Calcio lácteo · DHA" },
  { id:37, name:"Protein Active Sport",line:"Sport",  color:"#546E7A", bg:"#f0f4f5", img:"/prod-protein-active-sport.jpg",                                                emoji:"🌱", tag:"Proteína vegetal deportiva",      desc:"Proteína 100% vegetal germinada con BCAAs y L-Glutamina para desarrollo muscular saludable y recuperación post-ejercicio.", benefits:["100% vegetal para deportistas","Recuperación muscular acelerada","Genera masa muscular magra"], ing:"Quinua germinada · Arveja · Arroz germinado · Algas · L-Glutamina · BCAAs" },
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

const CERTS = ["Clean Label","GMP Certified","Non-GMO","HACCP","Biotecnología Avanzada","37 Países","Ingredientes Naturales","Sin Conservantes"];
const LINE_COLORS = { Detox:"#2d6a4f", Energy:"#7B3FA0", Protein:"#1565C0", Immunity:"#00897B", Sport:"#546E7A", Control:"#E65100", Mental:"#E53935" };

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
function eventId(name) { return `${name}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function trackEvent(n, p={}) { if (window.fbq) window.fbq("track", n, p, { eventID: eventId(n) }); }
function waHref(phone, text, ref) {
  const full = ref ? `${text}\n\n[ref:${ref}]` : text;
  const msg = encodeURIComponent(full);
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"")
    ? `whatsapp://send?phone=${phone}&text=${msg}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${msg}`;
}

function AnnouncementBar({ country }) {
  const loc = country === "Uruguay" || !country
    ? "🇺🇾 Todos los productos a $ 2.150 con envío incluido · Pagás con Mercado Pago"
    : "🚚 Pedidos online con entrega a domicilio · Consultanos por WhatsApp";
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:"linear-gradient(90deg,#1a2e1a,#2d6a4f,#1a2e1a)",height:40,padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <span className="int" style={{color:"rgba(255,255,255,0.95)",fontSize:11,fontWeight:700,textAlign:"center",lineHeight:1.3}}>{loc}</span>
    </div>
  );
}

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
          <a href={waHref(WA, "¡Hola! Generé mi plan nutricional con Power Vita IA 🌿 Quiero empezar.", "NutriPlan")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"NutriPlan_WA"})} style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>{T.nutriStart}</a>
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
        <a href={waHref(WA, "¡Hola! Analicé mis síntomas con Power Vita IA 🌿", "Symptom")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"Symptom_WA"})} style={{flex:1,background:"#25D366",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>{T.symptomStart}</a>
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
        <a href={waHref(WA, `¡Hola! Calculé mi potencial desde ${form.country} con Power Vita IA 💰 Quiero ser socio.`, "ROI_Socio")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"ROI_Socio_WA"})} style={{flex:1,background:"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>👑 Quiero ser socio</a>
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
  const openWA = () => { if (!plan) return; const msg=encodeURIComponent(`¡Hola! Generé mi Plan Elite 90 días con Power Vita IA 👑\nNombre: ${form.name}\nPaís: ${form.country}\nObjetivo: ${form.goal}\nFase 1: ${plan.fases?.[0]?.nombre}\nFase 2: ${plan.fases?.[1]?.nombre}\nFase 3: ${plan.fases?.[2]?.nombre}\n\n¿Cuál es el precio en ${form.country}?`); window.open(waHref(WA, decodeURIComponent(msg), "Elite_Plan"),"_blank"); };
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
        <button onClick={()=>{trackEvent("InitiateCheckout",{content_name:"Elite Program 90 días",content_type:"product",currency:"USD"});openWA();}} style={{width:"100%",background:"linear-gradient(135deg,#C9A84C,#FFD700)",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>{T.eliteWantPlan} {form.country} →</button>
        <div style={{display:"flex",gap:6}}><button onClick={()=>{setStep(1);setPlan(null);}} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.92)",borderRadius:9,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,cursor:"pointer"}}>{T.eliteNew}</button><button onClick={()=>{const txt=`${plan.titulo}\nFase 1: ${plan.fases?.[0]?.nombre}\nFase 2: ${plan.fases?.[1]?.nombre}\nFase 3: ${plan.fases?.[2]?.nombre}`;navigator.clipboard?.writeText(txt);}} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.92)",borderRadius:9,padding:"7px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:10,cursor:"pointer"}}>{T.eliteCopy}</button></div>
      </div>
    </div>
  );
  return null;
}

// ── CONTADOR TIEMPO REAL ──────────────────────────────────────────────────────
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

// ── TRANSLATIONS ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    nav:["Inicio","Sistema","IA Tools","Cómo comprar","Contacto"],
    navCta:"Empezar →",
    heroBadge:"FuXion Global · 37 Países",
    heroTitle1:"Nutrición que", heroTitleEm:"transforma", heroTitle2:"desde adentro.",
    heroSub:"Biotecnología avanzada en cada producto FuXion. Certificado, natural y con entrega directa en 37 países.",
    heroCta1:"Ver productos", heroCta2:"💬 WhatsApp",
    heroStats:[["$2.150","por producto"],["72 hs","hábiles de entrega"],["MP","pago seguro"]],
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
      {q:"¿Los productos FuXion son seguros?",a:"Sí. FuXion cuenta con certificaciones internacionales: GMP, HACCP y Clean Label. Todos los ingredientes son naturales y sin conservantes artificiales. Son aptos para toda la familia."},
      {q:"¿Cuánto tarda la entrega?",a:"FuXion entrega directamente en tu país. En Uruguay lo recibís dentro de las 72 horas hábiles de acreditado el pago; Argentina y Colombia 2-5 días hábiles, resto de Latinoamérica 3-7 días. Te confirmamos el plazo exacto por WhatsApp."},
      {q:"¿Qué pasa si no me gustan los productos?",a:"FuXion ofrece garantía de satisfacción. Si los productos no cumplen tus expectativas, te asesoramos para encontrar la combinación correcta o gestionamos una solución."},
      {q:"¿Puedo comprar solo como cliente o también hacer el negocio?",a:"Las dos opciones están disponibles. Podés registrarte como Cliente Preferente para precios especiales, o como Emprendedor si querés construir un negocio."},
      {q:"¿Están disponibles todos los productos en mi país?",a:"FuXion opera en 37 países pero el catálogo varía por región. Consultanos por WhatsApp con tu país y te decimos qué productos están disponibles y a qué precio."},
      {q:"¿Las herramientas de IA tienen algún costo?",a:"No, son 100% gratuitas. El Plan Nutricional, Analizador de Síntomas, ROI Predictor y Elite Program son exclusivos de Power Vita sin costo adicional."},
    ],
    statsImpact:"Vidas impactadas en 37 países",
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
    nav:["Home","System","AI Tools","How to buy","Contact"],
    navCta:"Get started →",
    heroBadge:"FuXion Global · 37 Countries",
    heroTitle1:"Nutrition that", heroTitleEm:"transforms", heroTitle2:"from within.",
    heroSub:"Advanced biotechnology in every FuXion product. Certified, natural and delivered in 37 countries.",
    heroCta1:"View products", heroCta2:"💬 WhatsApp",
    heroStats:[["$2.150","per product"],["72 h","dispatch"],["MP","secure payment"]],
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
      {q:"Are FuXion products safe?",a:"Yes. FuXion holds international certifications: GMP, HACCP and Clean Label. All ingredients are natural with no artificial preservatives, suitable for the whole family."},
      {q:"How long does delivery take?",a:"FuXion delivers directly in your country. In Uruguay orders ship from 72 hours after payment; Argentina and Colombia 2-5 business days, rest of Latin America 3-7 days. We confirm exact timing via WhatsApp."},
      {q:"What if I don't like the products?",a:"FuXion offers a satisfaction guarantee. If products don't meet your expectations, we advise you to find the right combination or manage a solution."},
      {q:"Can I buy just as a customer or also do the business?",a:"Both options are available. You can register as a Preferred Customer for special prices, or as an Entrepreneur if you want to build a business."},
      {q:"Are all products available in my country?",a:"FuXion operates in 37 countries but the catalog varies by region. Message us on WhatsApp with your country and we'll tell you exactly what's available and at what price."},
      {q:"Do the AI tools have any cost?",a:"No, they're 100% free. The Nutrition Plan, Symptom Analyzer, ROI Predictor and Elite Program are exclusive to Power Vita at no additional cost."},
    ],
    statsImpact:"Lives impacted in 37 countries",
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
    nav:["Início","Sistema","IA Tools","Como comprar","Contato"],
    navCta:"Começar →",
    heroBadge:"FuXion Global · 37 Países",
    heroTitle1:"Nutrição que", heroTitleEm:"transforma", heroTitle2:"por dentro.",
    heroSub:"Biotecnologia avançada em cada produto FuXion. Certificado, natural e com entrega direta em 37 países.",
    heroCta1:"Ver produtos", heroCta2:"💬 WhatsApp",
    heroStats:[["$2.150","por produto"],["72 h","despacho"],["MP","pagamento seguro"]],
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
      {q:"Os produtos FuXion são seguros?",a:"Sim. FuXion tem certificações internacionais: GMP, HACCP e Clean Label. Todos os ingredientes são naturais, sem conservantes artificiais, adequados para toda a família."},
      {q:"Quanto tempo leva a entrega?",a:"FuXion entrega diretamente no seu país. No Uruguai você recebe em até 72 horas úteis após o pagamento; Argentina e Colômbia 2-5 dias úteis, resto da América Latina 3-7 dias. Confirmamos o prazo exato pelo WhatsApp."},
      {q:"E se eu não gostar dos produtos?",a:"FuXion oferece garantia de satisfação. Se os produtos não atenderem suas expectativas, orientamos você a encontrar a combinação certa ou gerenciamos uma solução."},
      {q:"Posso comprar só como cliente ou também fazer o negócio?",a:"As duas opções estão disponíveis. Você pode se registrar como Cliente Preferencial para preços especiais, ou como Empreendedor se quiser construir um negócio."},
      {q:"Todos os produtos estão disponíveis no meu país?",a:"FuXion opera em 37 países, mas o catálogo varia por região. Nos envie uma mensagem no WhatsApp com seu país e diremos exatamente o que está disponível e a que preço."},
      {q:"As ferramentas de IA têm algum custo?",a:"Não, são 100% gratuitas. O Plano Nutricional, Analisador de Sintomas, Preditor de ROI e Elite Program são exclusivos do Power Vita sem custo adicional."},
    ],
    statsImpact:"Vidas impactadas em 37 países",
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

// ── COMPRA DIRECTA URUGUAY (Mercado Pago) ─────────────────────────────────────
const PRECIO_UY = 2150;
const fmtUY = n => "$ " + n.toLocaleString("es-UY");
// clave = la que espera api/pagar.js · id = PRODUCTS[].id
const PRODUCTOS_UY = [
  { key:"vita",   id:10, para:"Energía y defensas" },
  { key:"thermo", id:18, para:"Quemar grasa" },
  { key:"nocarb", id:19, para:"Controlar carbohidratos" },
  { key:"prunex", id:4,  para:"Digestión e hinchazón" },
  { key:"biopro", id:23, para:"Bajar medidas sin perder músculo" },
].map(p => ({ ...p, ...PRODUCTS.find(x => x.id === p.id) }));
const UY_KEY_BY_ID = Object.fromEntries(PRODUCTOS_UY.map(p => [p.id, p.key]));
const DEPARTAMENTOS = ["Montevideo","Canelones","Maldonado","Colonia","San José","Florida","Durazno","Lavalleja","Rocha","Treinta y Tres","Cerro Largo","Rivera","Tacuarembó","Artigas","Salto","Paysandú","Río Negro","Soriano","Flores"];

function ComprarUY({ cant, setCant }) {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({ nombre:"", telefono:"", direccion:"", departamento:"Montevideo", email:"" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(new URLSearchParams(window.location.search).get("pago")==="error" ? "El pago no se completó. Podés intentarlo de nuevo." : "");
  const ref = useRef(null);

  const items = PRODUCTOS_UY.filter(p => cant[p.key] > 0).map(p => ({ prod:p.key, q:cant[p.key], name:p.name }));
  const unidades = items.reduce((s,i)=>s+i.q,0);
  const total = unidades * PRECIO_UY;
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const mover = (key, d) => setCant(c => ({ ...c, [key]: Math.min(Math.max((c[key]||0)+d, 0), 10) }));

  const continuar = () => {
    if (!unidades) return;
    trackEvent("AddToCart", { value:total, currency:"UYU", num_items:unidades, content_ids:items.map(i=>i.prod), content_type:"product" });
    setPaso(2);
  };

  const pagar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || form.telefono.replace(/\D/g,"").length < 8 || !form.direccion.trim()) {
      setError("Completá nombre, celular y dirección para el envío."); return;
    }
    setError(""); setEnviando(true);
    trackEvent("InitiateCheckout", { value:total, currency:"UYU", num_items:unidades, content_ids:items.map(i=>i.prod), content_type:"product" });
    try {
      const r = await fetch("/api/pagar", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ items: items.map(({prod,q})=>({prod,q})), buyer: form }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "No se pudo iniciar el pago");
      window.location.href = data.url;
    } catch {
      setError("No pudimos abrir Mercado Pago. Probá de nuevo o escribinos por WhatsApp.");
      setEnviando(false);
    }
  };

  const input = { width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid rgba(45,106,79,0.2)", fontFamily:"'Inter',sans-serif", fontSize:14, background:"#fff", color:"#1a2e1a" };

  return (
    <section id="comprar" ref={ref} style={{padding:"56px 16px",background:"#fff",scrollMarginTop:100}}>
      <div style={{maxWidth:760,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <span className="int" style={{display:"inline-block",background:"rgba(45,106,79,0.08)",color:"#2d6a4f",borderRadius:999,padding:"5px 14px",fontSize:10,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🇺🇾 Comprá online · Envío incluido a todo Uruguay</span>
          <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.3rem)",fontWeight:700,lineHeight:1.15,marginBottom:10}}>Cualquier producto a <em style={{color:"#2d6a4f"}}>{fmtUY(PRECIO_UY)}</em></h2>
          <p className="int" style={{color:"#5a7a5a",fontSize:14,lineHeight:1.6}}>Pagás seguro con Mercado Pago: tarjeta de crédito hasta en 10 cuotas sin interés, débito o efectivo en Abitab / Red Pagos.<br/>🚚 Lo recibís dentro de las 72 horas hábiles de acreditado el pago.</p>
        </div>

        {paso === 1 && (<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:20}}>
            {PRODUCTOS_UY.map(p => {
              const n = cant[p.key] || 0;
              return (
                <div key={p.key} style={{border:`2px solid ${n?p.color:"rgba(0,0,0,0.07)"}`,borderRadius:16,padding:"14px 10px",textAlign:"center",background:n?p.bg:"#fff",transition:"all .2s",display:"flex",flexDirection:"column"}}>
                  <img src={p.img} alt={p.name} style={{height:78,objectFit:"contain",margin:"0 auto 8px"}}/>
                  <div className="pf" style={{fontWeight:700,fontSize:14,lineHeight:1.2}}>{p.name}</div>
                  <div className="int" style={{fontSize:10,color:p.color,fontWeight:600,margin:"4px 0 8px",flex:1}}>{p.para}</div>
                  <div className="int" style={{fontWeight:800,fontSize:15,marginBottom:8}}>{fmtUY(PRECIO_UY)}</div>
                  {n === 0
                    ? <button onClick={()=>mover(p.key,1)} className="int" style={{background:p.color,color:"#fff",border:"none",borderRadius:9,padding:"9px 0",fontWeight:700,fontSize:12,cursor:"pointer"}}>Agregar</button>
                    : <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",borderRadius:9,border:`1.5px solid ${p.color}`}}>
                        <button onClick={()=>mover(p.key,-1)} aria-label="Quitar uno" style={{background:"none",border:"none",fontSize:18,fontWeight:700,color:p.color,cursor:"pointer",padding:"5px 12px"}}>−</button>
                        <span className="int" style={{fontWeight:800}}>{n}</span>
                        <button onClick={()=>mover(p.key,1)} aria-label="Agregar uno" style={{background:"none",border:"none",fontSize:18,fontWeight:700,color:p.color,cursor:"pointer",padding:"5px 12px"}}>+</button>
                      </div>}
                </div>
              );
            })}
          </div>
          <button onClick={continuar} disabled={!unidades} className="int" style={{width:"100%",background:unidades?"#009ee3":"#cbd5e1",color:"#fff",border:"none",borderRadius:14,padding:"16px 0",fontWeight:800,fontSize:16,cursor:unidades?"pointer":"default",boxShadow:unidades?"0 8px 24px rgba(0,158,227,0.3)":"none"}}>
            {unidades ? `Comprar ${unidades} producto${unidades>1?"s":""} · ${fmtUY(total)} →` : "Elegí al menos un producto"}
          </button>
        </>)}

        {paso === 2 && (
          <form onSubmit={pagar} style={{maxWidth:460,margin:"0 auto",display:"flex",flexDirection:"column",gap:10}}>
            <div className="int" style={{background:"#f0f7f3",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#2d6a4f"}}>
              {items.map(i=><div key={i.prod}>{i.q} × {i.name}</div>)}
              <div style={{fontWeight:800,marginTop:6,fontSize:15,color:"#1a2e1a"}}>Total: {fmtUY(total)}</div>
            </div>
            <input style={input} placeholder="Nombre y apellido" value={form.nombre} onChange={e=>set("nombre",e.target.value)} autoComplete="name"/>
            <input style={input} placeholder="Celular (ej: 099 123 456)" inputMode="tel" value={form.telefono} onChange={e=>set("telefono",e.target.value)} autoComplete="tel"/>
            <input style={input} placeholder="Dirección de entrega (calle, número, apto)" value={form.direccion} onChange={e=>set("direccion",e.target.value)} autoComplete="street-address"/>
            <select style={input} value={form.departamento} onChange={e=>set("departamento",e.target.value)}>
              {DEPARTAMENTOS.map(d=><option key={d}>{d}</option>)}
            </select>
            <input style={input} placeholder="Email (opcional)" type="email" value={form.email} onChange={e=>set("email",e.target.value)} autoComplete="email"/>
            {error && <div className="int" style={{color:"#c0392b",fontSize:13}}>{error}</div>}
            <button type="submit" disabled={enviando} className="int" style={{background:"#009ee3",color:"#fff",border:"none",borderRadius:14,padding:"16px 0",fontWeight:800,fontSize:16,cursor:"pointer",opacity:enviando?.7:1}}>
              {enviando ? "Abriendo Mercado Pago…" : `💳 Pagar ${fmtUY(total)} con Mercado Pago`}
            </button>
            <div className="int" style={{fontSize:11,color:"#7a9a7a",textAlign:"center"}}>🔒 Pago procesado por Mercado Pago · 🚚 Lo recibís en 72 hs hábiles</div>
            <button type="button" onClick={()=>setPaso(1)} className="int" style={{background:"none",border:"none",color:"#7a9a7a",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>← Cambiar productos</button>
          </form>
        )}
        {paso === 1 && error && <div className="int" style={{color:"#c0392b",fontSize:13,textAlign:"center",marginTop:10}}>{error}</div>}
      </div>
    </section>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [scrollY,setScrollY]=useState(0); const [loaded,setLoaded]=useState(false);
  const [selCountry]=useState(detectCountry); const [prodLine,setProdLine]=useState(0);
  const [hovCard,setHovCard]=useState(null); const [chatOpen,setChatOpen]=useState(false);
  const [selectedCountry,setSelectedCountry]=useState(()=>detectCountry()||"");
  const [modalProduct,setModalProduct]=useState(null); const [catalogOpen,setCatalogOpen]=useState(true);
  const [cantUY,setCantUY]=useState({});
  const [lang,setLang]=useState("es");
  const T=TRANSLATIONS[lang];
  const adVariant = new URLSearchParams(window.location.search).get('v') || '';
  const isHinchazion = adVariant === 'hinchazion';
  const isVideo = adVariant === 'video';

  useEffect(()=>{
    setTimeout(()=>setLoaded(true),150);
    const onScroll=()=>setScrollY(window.scrollY);
    window.addEventListener("scroll",onScroll); return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  const waLinkFor = (ref) => waHref(WA, isVideo
    ? `¡Hola! Vi el video de Power Vita y quiero información 🌿 Soy de ${selCountry||"mi país"}. ¿Cuáles son los precios y cómo hago mi primer pedido?`
    : `¡Hola! Quiero información sobre Power Vita FuXion 🌿 Soy de ${selCountry||"mi país"}. ¿Cuáles son los precios y cómo empiezo?`, ref);
  const waLink = waLinkFor("nav");
  const certDouble = [...CERTS,...CERTS];
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
  const lineKeys   = ["","Detox","Protein","Energy","Immunity","Control","Mental","Sport"];
  const lineLabels = ["Todos","Detox","Proteína","Energía","Inmunidad","Control Peso","Mental","Sport"];
  const cdAvail = selectedCountry && COUNTRY_DATA[selectedCountry]?.available;
  const visibleProds = cdAvail ? PRODUCTS.filter(p=>cdAvail.includes(p.name)) : PRODUCTS;
  const filtProds = prodLine===0 ? visibleProds : visibleProds.filter(p=>p.line===lineKeys[prodLine]);
  const countryData = COUNTRY_DATA[selectedCountry] || (selectedCountry ? {
    flag: "🌍", currency: "USD", shipping: "Entrega express dentro de tu país",
    note: "FuXion entrega directamente en tu país. Te enviamos la cotización exacta por WhatsApp.",
    popular: ["REXET","VITA XTRA T+","NUTRADAY"]
  } : null);

  const navSections = ["inicio","sistema","iatools","comocomprar","contacto"].map((id,i)=>[id,T.nav[i]]);

  return (
    <LangCtx.Provider value={T}>
    <div style={{fontFamily:"Georgia,serif",background:"#FAFAF7",color:"#1a2e1a",overflowX:"hidden"}}>
      <style>{`
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

      <AnnouncementBar country={selectedCountry||detectCountry()||""}/>

      {/* NAV */}
      <nav style={{position:"fixed",top:40,left:0,right:0,zIndex:100,padding:"0 40px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",background:scrollY>40?"rgba(250,250,247,0.95)":"transparent",backdropFilter:scrollY>40?"blur(20px)":"none",borderBottom:scrollY>40?"1px solid rgba(26,46,26,0.08)":"none",transition:"all 0.4s ease"}}>
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
      <section id="inicio" style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"160px 40px 70px",background:"linear-gradient(160deg,#FAFAF7 0%,#F0F4ED 55%,#E8F0E9 100%)",position:"relative",overflow:"hidden",textAlign:"center"}}>
        <div style={{position:"absolute",top:-70,right:-70,width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(45,106,79,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className={loaded?"fade-up":""} style={{position:"relative",zIndex:1,maxWidth:640}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(45,106,79,0.07)",border:"1px solid rgba(45,106,79,0.18)",borderRadius:999,padding:"5px 16px",marginBottom:22}}>
            <span className="int" style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>
              {isVideo ? "🎬 Como viste en el video · 37 Países" : isHinchazion ? "Solución natural certificada · 37 Países" : T.heroBadge}
            </span>
          </div>

          <h1 className="pf" style={{fontSize:"clamp(2.4rem,5vw,4rem)",fontWeight:700,lineHeight:1.06,color:"#1a2e1a",letterSpacing:-2,marginBottom:20}}>
            {isVideo
              ? <>Lo que viste en el video es <em style={{fontStyle:"italic",color:"#2d6a4f"}}>real.</em></>
              : isHinchazion
                ? <>¿Sufrís de <em style={{fontStyle:"italic",color:"#2d6a4f"}}>hinchazón</em> o pesadez después de comer?</>
                : <>{T.heroTitle1}<br/><em style={{fontStyle:"italic",color:"#2d6a4f"}}>{T.heroTitleEm}</em><br/>{T.heroTitle2}</>}
          </h1>
          <p className="int" style={{fontSize:16,lineHeight:1.8,color:"#5a7a5a",maxWidth:460,margin:"0 auto 36px",fontWeight:300}}>
            {isVideo
              ? "Biotecnología natural certificada en 37 países. Escribinos ahora y en menos de 10 minutos te armamos tu plan personalizado."
              : isHinchazion
                ? "No es lo que comés — es lo que tu cuerpo no puede procesar. FuXion tiene la solución natural certificada en 37 países."
                : T.heroSub}
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:52}}>
            <button onClick={()=>{trackEvent("ViewContent",{content_name:"Hero_Comprar"});scrollTo("comprar");}} className="int" style={{background:"#009ee3",color:"#fff",padding:"13px 28px",borderRadius:100,fontWeight:700,fontSize:13,border:"none",cursor:"pointer",boxShadow:"0 8px 22px rgba(0,158,227,0.3)"}}>💳 Comprar ahora · {fmtUY(PRECIO_UY)}</button>
            <button onClick={()=>scrollTo("sistema")} className="int" style={{background:"#1a2e1a",color:"#fff",padding:"13px 28px",borderRadius:100,fontWeight:600,fontSize:13,border:"none",cursor:"pointer"}}>{T.heroCta1}</button>
            <a href={waLinkFor("hero")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"Hero_WA"})} className="int" style={{background:"transparent",color:"#1a2e1a",border:"1.5px solid rgba(26,46,26,0.22)",padding:"13px 28px",borderRadius:100,fontWeight:600,fontSize:13,textDecoration:"none"}}>{T.heroCta2}</a>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:40,flexWrap:"wrap"}}>
            <span className="int" style={{fontSize:11,color:"#9ca3af"}}>⚡ Respondemos en &lt;10 minutos</span>
            <span style={{color:"#e0e0e0"}}>·</span>
            <span className="int" style={{fontSize:11,color:"#9ca3af"}}>🔒 Pago seguro</span>
            <span style={{color:"#e0e0e0"}}>·</span>
            <span className="int" style={{fontSize:11,color:"#9ca3af"}}>✅ GMP Certified</span>
          </div>

          <div style={{display:"flex",gap:40,justifyContent:"center"}}>
            {T.heroStats.map(([n,l])=>(
              <div key={l}><div className="pf" style={{fontSize:26,fontWeight:700,color:"#1a2e1a",lineHeight:1}}>{n}</div><div className="int" style={{fontSize:10,color:"#7a9a7a",marginTop:3,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      <ComprarUY cant={cantUY} setCant={setCantUY}/>

      {/* VIDEO SECTION */}
      {(INSTAGRAM_POST_URL || YOUTUBE_VIDEO_ID) && (
        <section style={{padding:"40px 20px 0",background:"#FAFAF7",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{maxWidth:INSTAGRAM_POST_URL?480:700,width:"100%"}}>
            {INSTAGRAM_POST_URL ? (
              <div style={{display:"flex",justifyContent:"center"}}>
                <iframe
                  src={`${INSTAGRAM_POST_URL}embed/captioned/`}
                  width="400"
                  height="505"
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency="true"
                  style={{borderRadius:14,boxShadow:"0 16px 48px rgba(45,106,79,0.18)",maxWidth:"100%",display:"block"}}
                  title="Power Vita Instagram"
                />
              </div>
            ) : (
              <div style={{position:"relative",paddingBottom:"56.25%",height:0,borderRadius:18,overflow:"hidden",boxShadow:"0 16px 48px rgba(45,106,79,0.18)"}}>
                <iframe
                  style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
                  title="Power Vita Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <div style={{textAlign:"center",marginTop:20,marginBottom:8}}>
              <a href={waLinkFor("video_section")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"Video_WA"})} className="int" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#25D366",color:"#fff",padding:"13px 30px",borderRadius:100,fontWeight:700,fontSize:14,textDecoration:"none",boxShadow:"0 8px 24px rgba(37,211,102,0.35)"}}>
                💬 Quiero más info · Escribir ahora
              </a>
            </div>
          </div>
        </section>
      )}

      {/* SEGMENTATION CARDS */}
      <section style={{padding:"32px 20px",background:"#F0F4ED"}}>
        <div style={{maxWidth:640,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <button onClick={()=>scrollTo("sistema")} style={{background:"#fff",border:"2px solid rgba(45,106,79,0.18)",borderRadius:18,padding:"22px 16px",cursor:"pointer",textAlign:"center",transition:"all .25s",fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#2d6a4f";e.currentTarget.style.boxShadow="0 8px 24px rgba(45,106,79,0.15)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(45,106,79,0.18)";e.currentTarget.style.boxShadow="none";}}>
            <div style={{fontSize:32,marginBottom:8}}>🌿</div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:15,color:"#1a2e1a",marginBottom:4}}>Quiero los productos</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#7a9a7a",lineHeight:1.5}}>Mejorar mi salud y bienestar con FuXion</div>
          </button>
          <a href={waHref(WA,`Hola! Me interesa el negocio FuXion. ¿Podés contarme cómo funciona?`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"Seg_Negocio"})} style={{background:"#1a2e1a",border:"2px solid #1a2e1a",borderRadius:18,padding:"22px 16px",cursor:"pointer",textAlign:"center",textDecoration:"none",transition:"all .25s",display:"block",fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.background="#2d6a4f";e.currentTarget.style.borderColor="#2d6a4f";}} onMouseLeave={e=>{e.currentTarget.style.background="#1a2e1a";e.currentTarget.style.borderColor="#1a2e1a";}}>
            <div style={{fontSize:32,marginBottom:8}}>💼</div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:15,color:"#fff",marginBottom:4}}>Quiero el negocio</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>Ser Emprendedor FuXion y generar ingresos</div>
          </a>
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
                    <a href={waHref(WA, `Hola! Me interesa el Paso ${p.step} (${p.title}) de FuXion 🌿 ¿Cuál es el precio en mi país?`, `Paso_${p.step}`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:`Paso_${p.step}_Precio`})} style={{flex:1,background:p.color,color:"#fff",borderRadius:9,padding:"9px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:11,textAlign:"center",textDecoration:"none"}}>💬 Consultar precio →</a>
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
                  <a href={waHref(WA, `Hola! Me interesa el ${pack.name} de Power Vita FuXion 🌿 ¿Cuál es el precio en mi país?`, pack.name.replace(/\s+/g,"_"))} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:`${pack.name}_Precio`})} style={{flex:1,background:`linear-gradient(135deg,${pack.color}cc,${pack.color})`,color:"#fff",borderRadius:10,padding:"10px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,textAlign:"center",textDecoration:"none"}}>💬 Consultar precio →</a>
                </div>
              </div>
            ))}
          </div>

          {/* SELECTOR DE PAÍS */}
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
                    <a href={waHref(WA, `¡Hola! Estoy en ${selectedCountry} ${countryData.flag} y quiero ver los precios de FuXion 🌿`, "CountryBlock")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"CountryBlock_WA"})} style={{display:"block",width:"100%",background:"linear-gradient(135deg,#1a2e1a,#2d6a4f)",color:"#fff",borderRadius:10,padding:"11px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>{countryData.flag} {T.countryViewPrices} {selectedCountry} →</a>
                  </div>
                )}
                {!selectedCountry&&<div style={{textAlign:"center",padding:"8px 0"}}><div style={{fontSize:24,marginBottom:4}}>🌍</div><p className="int" style={{fontSize:11,color:"#9ca3af"}}>{T.countryEmpty}</p></div>}
              </div>
            </div>
          </div>

          {/* Catálogo — debajo del selector de país */}
          <div style={{marginTop:48,paddingTop:48,borderTop:"1px solid rgba(45,106,79,0.08)"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <button onClick={()=>setCatalogOpen(o=>!o)} className="int" style={{background:"none",border:"1.5px solid rgba(45,106,79,0.2)",borderRadius:999,padding:"10px 24px",fontSize:12,fontWeight:600,color:"#2d6a4f",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(45,106,79,0.05)";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                {catalogOpen?T.catalogHide:T.catalogShow}
              </button>
            </div>
            {catalogOpen&&(
              <div style={{marginTop:24}}>
                <div style={{display:"flex",gap:7,marginBottom:24,flexWrap:"wrap"}}>
                  {lineLabels.map((l,i)=>{const lc=i===0?"#1a2e1a":LINE_COLORS[lineKeys[i]]||"#1a2e1a";return(<button key={i} onClick={()=>setProdLine(i)} className="int" style={{padding:"6px 14px",borderRadius:999,fontWeight:700,fontSize:10,cursor:"pointer",border:"2px solid",borderColor:prodLine===i?lc:"rgba(26,46,26,0.14)",background:prodLine===i?lc:"transparent",color:prodLine===i?"#fff":lc,transition:"all .2s"}}>{l}</button>);})}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>
                  {filtProds.map(p=>{
                    return (
                    <div key={p.id} onMouseEnter={()=>setHovCard(p.id)} onMouseLeave={()=>setHovCard(null)} onClick={()=>{setModalProduct(p);trackEvent("ViewContent",{content_name:p.name,content_type:"product",content_ids:[String(p.id)]});}} style={{background:"#fff",borderRadius:16,overflow:"hidden",border:`1px solid ${hovCard===p.id?p.color+"45":"rgba(0,0,0,0.06)"}`,boxShadow:hovCard===p.id?`0 10px 28px ${p.color}18`:"0 2px 8px rgba(0,0,0,0.04)",transition:"all .3s",transform:hovCard===p.id?"translateY(-3px)":"translateY(0)",display:"flex",flexDirection:"column",position:"relative",cursor:"pointer"}}>
                      <div style={{background:p.bg,height:100,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                        <div style={{position:"absolute",top:7,left:7,background:p.color,color:"#fff",borderRadius:999,padding:"2px 7px",fontFamily:"'Inter',sans-serif",fontSize:7,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{p.line}</div>
                        {p.img?<img src={p.img} alt={p.name} loading="lazy" style={{maxHeight:84,maxWidth:"80%",objectFit:"contain",filter:"drop-shadow(0 3px 8px rgba(0,0,0,0.1))"}} onError={e=>{e.target.style.display="none";if(e.target.nextSibling)e.target.nextSibling.style.display="flex";}}/>:null}
                        <div style={{display:p.img?"none":"flex",fontSize:36,alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>{p.emoji}</div>
                      </div>
                      <div style={{padding:"10px 11px 11px",flex:1,display:"flex",flexDirection:"column",gap:3}}>
                        <div className="pf" style={{fontSize:12,fontWeight:700,color:"#1a2e1a",lineHeight:1.3}}>{p.name}</div>
                        <p className="int" style={{fontSize:9,color:p.color,fontStyle:"italic",lineHeight:1.4}}>{p.tag}</p>
                        <button onClick={e=>{e.stopPropagation();setModalProduct(p);trackEvent("ViewContent",{content_name:p.name,content_type:"product",content_ids:[String(p.id)]});}} style={{marginTop:"auto",width:"100%",background:"transparent",border:`1.5px solid ${p.color}`,borderRadius:7,padding:"6px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:9,color:p.color,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background=p.color;e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=p.color;}}>Ver más →</button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LEAD FORM */}
      <section style={{padding:"60px 40px",background:"#F0F4ED"}}>
        <div style={{maxWidth:500,margin:"0 auto"}}>
          <div style={{background:"#fff",border:"1.5px solid rgba(45,106,79,0.1)",borderRadius:22,padding:"38px 34px",boxShadow:"0 12px 44px rgba(45,106,79,0.07)",textAlign:"center"}}>
            <div style={{fontSize:38,marginBottom:9}}>🎯</div>
            <h2 className="pf" style={{fontSize:"clamp(1.2rem,2.5vw,1.8rem)",fontWeight:700,color:"#1a2e1a",marginBottom:7}}>{T.leadTitle}</h2>
            <p className="int" style={{color:"#7a9a7a",fontSize:13,lineHeight:1.7,marginBottom:24}}>{T.leadSub}</p>
            <LeadFormInline T={T}/>
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
              <span className="int" style={{fontSize:10,fontWeight:800,color:"#FFD700",letterSpacing:3,textTransform:"uppercase"}}>{T.iaBadge}</span>
            </div>
            <h2 className="pf" style={{fontSize:"clamp(1.8rem,4vw,3rem)",fontWeight:700,color:"#fff",marginBottom:14,lineHeight:1.1}}>
              {T.iaTitle1}<br/>
              <span style={{background:"linear-gradient(135deg,#C9A84C,#FFD700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontStyle:"italic"}}>{T.iaTitleEm}</span>
            </h2>
            <p className="int" style={{color:"rgba(255,255,255,0.85)",fontSize:14,maxWidth:480,margin:"0 auto",lineHeight:1.8}}>2 herramientas que <span style={{color:"#FFD700",fontWeight:700}}>ningún otro distribuidor FuXion</span> en el mundo tiene. Gratis.</p>
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
          </div>
          <div style={{textAlign:"center",marginTop:40}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 24px",flexWrap:"wrap",justifyContent:"center"}}>
              {[["🔒","100% Privado"],["⚡","Respuesta inmediata"],["🌿","Solo FuXion"],["🌍","37 países"]].map(([ic,lb],i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:5}}>{i>0&&<div style={{width:1,height:18,background:"rgba(255,255,255,0.08)"}}/>}<span style={{fontSize:13}}>{ic}</span><span className="int" style={{fontSize:10,color:"rgba(255,255,255,0.92)",fontWeight:600}}>{lb}</span></div>))}
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO COMPRAR */}
      <section id="comocomprar" style={{padding:"72px 16px",background:"#FAFAF7"}}>
        <div style={{maxWidth:960,margin:"0 auto",textAlign:"center"}}>
          <span className="int" style={{display:"block",marginBottom:10,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2d6a4f"}}>Así de simple</span>
          <h2 className="pf" style={{fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:700,color:"#1a2e1a",marginBottom:36}}>Cómo <em style={{color:"#2d6a4f",fontStyle:"italic"}}>comprar</em> en Uruguay</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:32}}>
            {[
              ["1","🛒","Elegís tus productos","Cualquiera de los 5 a $ 2.150. ¿No sabés cuál? Escribinos y te asesoramos gratis."],
              ["2","💳","Pagás con Mercado Pago","Tarjeta de crédito, débito o efectivo en Abitab / Red Pagos. Pago 100% procesado por Mercado Pago."],
              ["3","🚚","Te llega a tu casa","Lo recibís dentro de las 72 horas hábiles de acreditado el pago, en cualquier departamento."],
            ].map(([n,ic,t,d])=>(
              <div key={n} style={{background:"#fff",borderRadius:18,padding:"24px 20px",border:"1px solid rgba(45,106,79,0.1)",boxShadow:"0 4px 18px rgba(0,0,0,0.04)",textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div className="int" style={{width:30,height:30,borderRadius:"50%",background:"#2d6a4f",color:"#fff",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{n}</div>
                  <span style={{fontSize:22}}>{ic}</span>
                </div>
                <div className="pf" style={{fontWeight:700,fontSize:16,color:"#1a2e1a",marginBottom:6}}>{t}</div>
                <p className="int" style={{fontSize:13,color:"#5a7a5a",lineHeight:1.6}}>{d}</p>
              </div>
            ))}
          </div>
          <button onClick={()=>document.getElementById("comprar")?.scrollIntoView({behavior:"smooth",block:"start"})} className="int" style={{background:"#009ee3",color:"#fff",border:"none",borderRadius:100,padding:"14px 32px",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 8px 22px rgba(0,158,227,0.3)"}}>💳 Comprar ahora</button>
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
            <a href={waHref(WA, "Hola! Tengo una pregunta sobre FuXion y Power Vita 🌿", "FAQ")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"FAQ_WA"})} className="int" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#25D366",color:"#fff",padding:"12px 24px",borderRadius:12,fontWeight:700,textDecoration:"none",fontSize:13}}>{T.faqMoreQ}</a>
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
          <a href={waLinkFor("footer")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"Footer_WA"})} className="int" style={{background:"#25D366",color:"#fff",padding:"9px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>💬 WhatsApp</a>
          <a href="https://instagram.com/powervita_uy" target="_blank" rel="noreferrer" className="int" style={{background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",color:"#fff",padding:"9px 18px",borderRadius:10,fontWeight:700,textDecoration:"none",fontSize:12}}>📸 @powervita_uy</a>
        </div>
        <div className="int" style={{color:"rgba(255,255,255,0.16)",fontSize:9}}>© 2025 Power Vita · @powervita_uy · +598 98 950 206</div>
      </footer>

      {/* MODAL DETALLE PRODUCTO */}
      {modalProduct&&(
        <div onClick={()=>setModalProduct(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(12px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,maxWidth:420,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.35)",overflow:"hidden",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{height:8,background:modalProduct.color}}/>
            <div style={{background:modalProduct.bg,padding:"22px 22px 16px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
              <button onClick={()=>setModalProduct(null)} style={{position:"absolute",top:12,right:14,background:"rgba(0,0,0,0.07)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#555"}}>✕</button>
              {modalProduct.img
                ? <img src={modalProduct.img} alt={modalProduct.name} style={{height:90,objectFit:"contain",filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.14))",marginBottom:10}}/>
                : <div style={{fontSize:60,marginBottom:10,lineHeight:1}}>{modalProduct.emoji}</div>}
              <div style={{background:modalProduct.color,color:"#fff",borderRadius:999,padding:"2px 10px",fontFamily:"'Inter',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{modalProduct.line}</div>
              <p className="int" style={{fontSize:10,color:modalProduct.color,fontStyle:"italic",marginBottom:4}}>{modalProduct.tag}</p>
              <h3 className="pf" style={{fontSize:20,fontWeight:700,color:"#1a2e1a",textAlign:"center",lineHeight:1.2}}>{modalProduct.name}</h3>
            </div>
            <div style={{padding:"18px 22px 22px"}}>
              <p className="int" style={{fontSize:13,color:"#4a5568",lineHeight:1.6,marginBottom:14}}>{modalProduct.desc}</p>
              <hr style={{border:"none",borderTop:"1px solid rgba(0,0,0,0.07)",marginBottom:14}}/>
              <div style={{marginBottom:12}}>
                <div className="int" style={{fontSize:10,fontWeight:800,color:modalProduct.color,letterSpacing:1.5,marginBottom:8}}>✦ POR QUÉ FUNCIONA</div>
                {modalProduct.benefits.map((b,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:5,alignItems:"flex-start"}}><span style={{color:modalProduct.color,fontWeight:700,fontSize:12,lineHeight:1.4}}>✓</span><span className="int" style={{fontSize:12,color:"#4a5568",lineHeight:1.4}}>{b}</span></div>)}
              </div>
              <div style={{marginBottom:14}}>
                <div className="int" style={{fontSize:10,fontWeight:800,color:"#7a9a7a",letterSpacing:1.5,marginBottom:5}}>🌿 INGREDIENTES CLAVE</div>
                <p className="int" style={{fontSize:11,color:"#9ca3af",fontStyle:"italic",lineHeight:1.5}}>{modalProduct.ing}</p>
              </div>
              <hr style={{border:"none",borderTop:"1px solid rgba(0,0,0,0.07)",marginBottom:14}}/>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {UY_KEY_BY_ID[modalProduct.id] && <button onClick={()=>{const k=UY_KEY_BY_ID[modalProduct.id];setModalProduct(null);setCantUY(c=>({...c,[k]:Math.max(c[k]||0,1)}));setTimeout(()=>scrollTo("comprar"),50);}} className="int" style={{display:"block",width:"100%",background:"#009ee3",color:"#fff",border:"none",borderRadius:11,padding:"13px 0",fontWeight:800,fontSize:13,cursor:"pointer"}}>💳 Comprar en Uruguay · {fmtUY(PRECIO_UY)}</button>}
                <a href={waHref(WA, `Hola! Me interesa ${modalProduct.name} de FuXion 🌿 Soy de [escribí tu país]. ¿Cuál es el precio?`, `Modal_${modalProduct.name.replace(/\s+/g,"_")}_Precio`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:`${modalProduct.name}_Precio`})} style={{display:"block",width:"100%",background:"#25D366",color:"#fff",borderRadius:11,padding:"13px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>💬 Consultar precio en mi país</a>
                <a href={waHref(WA, `Hola! Quiero comprar ${modalProduct.name} de FuXion 🌿 Soy de [escribí tu país]. ¿Cómo lo pido?`, `Modal_${modalProduct.name.replace(/\s+/g,"_")}_Comprar`)} target="_blank" rel="noreferrer" onClick={()=>trackEvent("InitiateCheckout",{content_name:modalProduct.name,content_type:"product",content_ids:[String(modalProduct.id)],currency:"USD"})} style={{display:"block",width:"100%",background:modalProduct.color,color:"#fff",borderRadius:11,padding:"13px 0",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13,textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>🛒 Lo quiero · ¿Cómo lo pido?</a>
              </div>
              <p className="int" style={{fontSize:10,color:"#9ca3af",textAlign:"center",marginTop:9}}>Entrega disponible en +20 países de Latinoamérica 🌍</p>
            </div>
          </div>
        </div>
      )}

      {/* STICKY MOBILE CTA */}
      <style>{`.sticky-wa-bar{display:flex}@media(min-width:640px){.sticky-wa-bar{display:none!important}}@media(max-width:639px){footer{padding-bottom:72px!important}}`}</style>
      <a href={waHref(WA,`¡Hola! Quiero información sobre Power Vita 🌿 Soy de ${selectedCountry||detectCountry()||"mi país"}. ¿Cuáles son los precios y cómo empiezo?`,"StickyBar")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Lead",{content_name:"StickyBar_Mobile"})} className="sticky-wa-bar" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:300,background:"#25D366",color:"#fff",textAlign:"center",padding:"14px 20px",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:14,textDecoration:"none",boxShadow:"0 -4px 20px rgba(0,0,0,0.18)",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontSize:18}}>💬</span>
        <span>Consultar precio · Respondemos al instante</span>
      </a>

      <Chat open={chatOpen} onClose={()=>setChatOpen(false)}/>
      <a href={waHref(WA,`Hola! Quiero hacer mi pedido de Power Vita 🌿 Estoy en ${selectedCountry||detectCountry()||"mi país"}`,"FloatingBtn")} target="_blank" rel="noreferrer" onClick={()=>trackEvent("Contact",{content_name:"FloatingWA_Comprar"})} style={{position:"fixed",bottom:80,right:16,zIndex:249,display:"flex",alignItems:"center",gap:8,background:"#25D366",color:"#fff",padding:"11px 18px",borderRadius:100,textDecoration:"none",boxShadow:"0 8px 24px rgba(37,211,102,0.5)",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:13}}><span style={{fontSize:18}}>💬</span> Hacer pedido</a>
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
    window.open(waHref(WA, decodeURIComponent(msg), "LeadForm"),"_blank");
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
