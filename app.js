const STORAGE_KEY = "anger-law-tracker-v2";
const META_KEY = "anger-law-meta-v2";
const CLINIC_WHATSAPP = "966144564421";
const imgW = 2048;
const imgH = 1448;

// إحداثيات المربعات فوق الصورة الأصلية: 7 أيام × 5 سلوكيات
const xs = [79, 241, 403, 565, 727, 889, 1051];
const ys = [400, 593, 786, 980, 1173];
const w = 135;
const h = 86;
const totalCells = xs.length * ys.length;

let states = loadStates();
let meta = loadMeta();

const cellsRoot = document.getElementById("cells");
const startModal = document.getElementById("startModal");
const startForm = document.getElementById("startForm");
const childNameInput = document.getElementById("childNameInput");
const weekStartInput = document.getElementById("weekStartInput");
const childNameView = document.getElementById("childNameView");
const weekStartView = document.getElementById("weekStartView");
const checkCount = document.getElementById("checkCount");
const xCount = document.getElementById("xCount");
const percentView = document.getElementById("percentView");

function loadStates(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(Array.isArray(saved) && saved.length === totalCells) return saved;
  }catch(e){}
  return Array(totalCells).fill(0); // 0 فارغ، 1 صح، 2 خطأ
}
function loadMeta(){
  try{
    const saved = JSON.parse(localStorage.getItem(META_KEY));
    if(saved && typeof saved === "object") return saved;
  }catch(e){}
  return { childName:"", weekStart:"" };
}
function saveStates(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(states)); }
function saveMeta(){ localStorage.setItem(META_KEY, JSON.stringify(meta)); }
function pctX(x){ return `${(x/imgW)*100}%`; }
function pctY(y){ return `${(y/imgH)*100}%`; }
function pctW(v){ return `${(v/imgW)*100}%`; }
function pctH(v){ return `${(v/imgH)*100}%`; }
function symbol(state){ return state === 1 ? "✓" : state === 2 ? "✕" : ""; }
function stateName(state){ return state === 1 ? "check" : state === 2 ? "x" : "empty"; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function formatDate(value){
  if(!value) return "—";
  try{ return new Intl.DateTimeFormat("ar-SA", { dateStyle:"medium" }).format(new Date(value + "T00:00:00")); }
  catch(e){ return value; }
}
function updateSummary(){
  const checks = states.filter(s => s === 1).length;
  const xsCount = states.filter(s => s === 2).length;
  const answered = checks + xsCount;
  const percent = answered ? Math.round((checks / answered) * 100) : 0;
  childNameView.textContent = meta.childName || "—";
  weekStartView.textContent = formatDate(meta.weekStart);
  checkCount.textContent = checks;
  xCount.textContent = xsCount;
  percentView.textContent = `${percent}%`;
}
function render(){
  cellsRoot.innerHTML = "";
  let idx = 0;
  ys.forEach((y, row) => {
    xs.forEach((x, col) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.style.left = pctX(x);
      cell.style.top = pctY(y);
      cell.style.width = pctW(w);
      cell.style.height = pctH(h);
      cell.dataset.index = idx;
      cell.dataset.state = stateName(states[idx]);
      cell.textContent = symbol(states[idx]);
      cell.setAttribute("aria-label", `السلوك ${row+1}، اليوم ${col+1}`);
      cell.addEventListener("click", () => cycleCell(Number(cell.dataset.index)));
      cellsRoot.appendChild(cell);
      idx++;
    });
  });
  updateSummary();
}
function cycleCell(index){
  states[index] = (states[index] + 1) % 3;
  saveStates();
  render();
}
function openMetaForm(){
  childNameInput.value = meta.childName || "";
  weekStartInput.value = meta.weekStart || todayISO();
  startModal.hidden = false;
  setTimeout(() => childNameInput.focus(), 50);
}
function closeMetaForm(){ startModal.hidden = true; }

startForm.addEventListener("submit", (e) => {
  e.preventDefault();
  meta = { childName: childNameInput.value.trim(), weekStart: weekStartInput.value };
  saveMeta();
  updateSummary();
  closeMetaForm();
});

document.getElementById("editInfoBtn").addEventListener("click", openMetaForm);

function whatsappText(){
  const checks = states.filter(s => s === 1).length;
  const xsCount = states.filter(s => s === 2).length;
  const answered = checks + xsCount;
  const percent = answered ? Math.round((checks / answered) * 100) : 0;
  return `السلام عليكم، مرفق تقرير قانون الغضب للطفل: ${meta.childName || "—"}، بداية الأسبوع: ${formatDate(meta.weekStart)}، النسبة: ${percent}%، الصح: ${checks}، الخطأ: ${xsCount}.`;
}

function openClinicWhatsApp(){
  const url = `https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(whatsappText())}`;
  window.open(url, "_blank", "noopener");
}

function sendReportToClinic(){
  const ok = confirm("بيطلع لك خيار حفظ/طباعة التقرير. اختاري حفظ كـ PDF، وبعدها بتفتح محادثة واتساب العيادة وأرفقي ملف الـ PDF فيها.");
  if(!ok) return;
  let opened = false;
  const openOnce = () => {
    if(opened) return;
    opened = true;
    openClinicWhatsApp();
    window.removeEventListener("afterprint", openOnce);
  };
  window.addEventListener("afterprint", openOnce);
  window.print();
  setTimeout(openOnce, 4000);
}

document.getElementById("pdfBtn").addEventListener("click", sendReportToClinic);

document.getElementById("resetBtn").addEventListener("click", () => {
  if(confirm("تبين تمسحين علامات الأسبوع وتبدين من جديد؟")){
    states = Array(totalCells).fill(0);
    meta = { childName:"", weekStart: todayISO() };
    saveStates();
    saveMeta();
    render();
    openMetaForm();
  }
});

if("serviceWorker" in navigator && location.protocol !== "file:"){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

render();
openMetaForm();
