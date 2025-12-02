
const brasData = [
 {tmin:-12.5, tmax:-7.5,   C:-45, D:-134, E:-223, F:-312, G:-387},
 {tmin:-7.5,  tmax:-2.5,   C:-38, D:-115, E:-191, F:-268, G:-332},
 {tmin:-2.5,  tmax:2.5,    C:-32, D:-96,  E:-159, F:-223, G:-276},
 {tmin:2.5,   tmax:7.5,    C:-26, D:-77,  E:-128, F:-179, G:-221},
 {tmin:7.5,   tmax:12.5,   C:-19, D:-57,  E:-96,  F:-134, G:-166},
 {tmin:12.5,  tmax:17.5,   C:-13, D:-38,  E:-64,  F:-89,  G:-111},
 {tmin:17.5,  tmax:22.5,   C:-6,  D:-19,  E:-32,  F:-45,  G:-55},
 {tmin:22.5,  tmax:27.5,   C:0,   D:0,    E:0,    F:0,    G:0},
 {tmin:27.5,  tmax:32.5,   C:6,   D:19,   E:32,   F:45,   G:55},
 {tmin:32.5,  tmax:37.5,   C:13,  D:38,   E:64,   F:89,   G:111},
 {tmin:37.5,  tmax:42.5,   C:19,  D:57,   E:96,   F:134,  G:166},
 {tmin:42.5,  tmax:47.5,   C:26,  D:77,   E:128,  F:179,  G:221},
 {tmin:47.5,  tmax:52.5,   C:32,  D:96,   E:159,  F:223,  G:276},
 {tmin:52.5,  tmax:57.5,   C:38,  D:115,  E:191,  F:268,  G:332},
 {tmin:57.5,  tmax:62.5,   C:45,  D:134,  E:223,  F:312,  G:387}
];

function atualizarTabelaBras(T){
    const tbody = document.getElementById("bras-body");
    tbody.innerHTML = "";

    if (isNaN(T)) return;

    let row = brasData.find(r => T >= r.tmin && T < r.tmax);
    if(!row) return;

    let tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.C}</td><td>${row.D}</td><td>${row.E}</td><td>${row.F}</td><td>${row.G}</td>`;
    tbody.appendChild(tr);
}

function firstTwoDigitsOfFloor(n) {
  const s = String(Math.floor(Math.abs(n)));
  if (s.length === 0) return 0;
  return parseInt(s.substring(0, Math.min(2, s.length)), 10);
}

function recalcular() {
  const T = parseFloat(document.getElementById("temp").value);
  const rows = document.querySelectorAll("#tbl tbody tr");
  const brasBody = document.getElementById("bras-body");

  if (isNaN(T)) {
    rows.forEach(r => {
      const x = r.querySelector(".X");
      const y = r.querySelector(".Y");
      if (x) x.textContent = "";
      if (y) y.textContent = "";
    });
    brasBody.innerHTML = "";
    return;
  }

  rows.forEach(r => {
    const cell = r.cells[2];
    if (!cell) return;
    const C = parseFloat(String(cell.textContent).replace(",", "."));
    if (isNaN(C)) return;

    const G = 17 * (C * (60 - T));
    const H = firstTwoDigitsOfFloor(G);
    const X = H + 40;
    const Y = 5 * (X - 40);

    const xEl = r.querySelector(".X");
    const yEl = r.querySelector(".Y");
    if (xEl) xEl.textContent = X;
    if (yEl) yEl.textContent = Y;
  });

  atualizarTabelaBras(T);
}

// botão para adicionar linha (fallback in case inline not present)
(function(){
  const addBtn = document.getElementById("btnAddTire");
  if(addBtn && !addBtn._hasHandler){
    addBtn.addEventListener("click", function () {
        let supports = prompt("Quels sont les supports du tire ?");
        if (!supports) return;
        let longueurStr = prompt("Quelle est la longueur du tire ?");
        let longueur = parseFloat(String(longueurStr || "").replace(",", "."));
        if (isNaN(longueur)) { alert("Valeur invalide."); return; }
        let moitie = longueur / 2;
        const tbody = document.querySelector("#tbl tbody");
        const row = tbody.insertRow();
        row.insertCell(0).textContent = supports;
        row.insertCell(1).textContent = longueur;
        row.insertCell(2).textContent = moitie;
        const c5 = row.insertCell(3); c5.className = "X";
        const c6 = row.insertCell(4); c6.className = "Y";
        recalcular();
    });
    addBtn._hasHandler = true;
  }
})();

// Excel upload handler (writes NAMES only in postes table)
(function(){
  if (!window.XLSX) {
    console.warn("XLSX library not found. Excel upload will not work.");
    return;
  }
  const input = document.getElementById("excelInput");
  if (!input) return;
  input.addEventListener("change", function(e){
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt){
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1, blankrows:false});
        const intervals = {
          "0–150m":[0,150],
          "150–300m":[150,300],
          "300–450m":[300,450],
          "450–600m":[450,600],
          "600–700m":[600,700]
        };
        const postes = {}; Object.keys(intervals).forEach(k=>postes[k]=[]);
        rows.forEach(r=>{
          if(!r || r.length<2) return;
          const name = (r[0]||"").toString().trim();
          const val = parseFloat(r[1]);
          if(!name || isNaN(val)) return;
          for(const k in intervals){
            const [mn,mx] = intervals[k];
            if(val>=mn && val<mx) { postes[k].push(name); break; }
          }
        });
        const cols = Object.keys(intervals);
        const maxLen = Math.max(0, ...Object.values(postes).map(a=>a.length));
        const tbody = document.getElementById("postes-body");
        if(!tbody) return;
        tbody.innerHTML = "";
        for(let i=0;i<maxLen;i++){
          const tr = document.createElement("tr");
          cols.forEach(c=>{
            const cell = postes[c][i] || "";
            tr.appendChild(Object.assign(document.createElement("td"), {textContent: cell}));
          });
          tbody.appendChild(tr);
        }
      } catch(err){
        console.error(err);
        alert("Erro ao ler o ficheiro Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  });
})();

// Handle button click to open file dialog
const btnUpload = document.getElementById("btnUploadExcel");
if(btnUpload) btnUpload.onclick = ()=> document.getElementById("excelInput").click();

// Clear postes table
const btnClear = document.getElementById("btnClearPostes");
if(btnClear) btnClear.onclick = ()=>{
    const pb = document.getElementById("postes-body");
    if(pb) pb.innerHTML="";
    const excelInput = document.getElementById("excelInput");
    if(excelInput) excelInput.value="";
};

// Export page to PDF
const btnPdf = document.getElementById("btnExportPDF");
if(btnPdf) btnPdf.onclick = async ()=>{
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const canvas = await html2canvas(document.body);
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.width / canvas.height;
    let imgHeight = pageWidth / ratio;
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    pdf.save("pagina.pdf");
};


// --- Project management: save / load / delete / new + menu toggle ---
// Helper to set temp value into input before saving
function ensureTempValueInHTML(){
    const temp = document.getElementById("temp");
    if(temp) temp.setAttribute("value", temp.value);
}

// Save project
function saveProject(){
    const name = prompt("Qual o nome do ficheiro?");
    if (!name) return;
    ensureTempValueInHTML();
    const data = { html: document.documentElement.outerHTML, timestamp: Date.now() };
    localStorage.setItem("project_" + name, JSON.stringify(data));
    alert("Projecto guardado!");
}

// List saved projects
function loadProjectList(){
    const box = document.getElementById("projectList");
    box.style.display = "block";
    box.innerHTML = "";
    const keys = Object.keys(localStorage).filter(k => k.startsWith("project_")).sort();
    if (!keys.length){
        box.innerHTML = "<em>Nenhum projecto guardado.</em>";
        return;
    }
    keys.forEach(k =>{
        const name = k.replace("project_","");
        const row = document.createElement("div");
        row.style.marginBottom = "6px";
        const btn = document.createElement("button");
        btn.textContent = "Abrir: " + name;
        btn.style.marginRight = "6px";
        btn.onclick = ()=> loadProject(k);
        const del = document.createElement("button");
        del.textContent = "Eliminar";
        del.onclick = ()=> { if(confirm('Apagar o projecto "'+name+'"?')){ localStorage.removeItem(k); loadProjectList(); } };
        row.appendChild(btn); row.appendChild(del);
        box.appendChild(row);
    });
}

// Load one project and rebind handlers after write
function loadProject(key){
    const d = localStorage.getItem(key);
    if(!d){ alert("Erro ao abrir projecto."); return; }
    const obj = JSON.parse(d);
    document.open();
    document.write(obj.html);
    document.close();
    // Rebind after slight delay to let DOM settle
    setTimeout(bindProjectButtons, 200);
}

// Delete all projects
function deleteAllProjects(){
    if(!confirm("Tens a certeza que queres apagar TODOS os projectos?")) return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith("project_"));
    keys.forEach(k => localStorage.removeItem(k));
    alert("Todos os projectos foram apagados.");
    const box = document.getElementById("projectList");
    if(box) box.style.display = "none";
}

// New project: reload original index.html (hard reload)
function newProject(){
    // Reload page from server/original file to clear state
    location.reload(true);
}

// Toggle menu visibility
function toggleMenu(){
    const menu = document.getElementById("menuOptions");
    if(!menu) return;
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

// Bind buttons (safe to call multiple times)
function bindProjectButtons(){
    const menuBtn = document.getElementById("btnMenu");
    if(menuBtn) menuBtn.onclick = toggleMenu;

    // Use direct bindings for menu items (they may be recreated on load)
    const s = document.getElementById("btnSaveProject");
    if(s) s.onclick = saveProject;
    const l = document.getElementById("btnLoadProject");
    if(l) l.onclick = loadProjectList;
    const d = document.getElementById("btnDeleteProjects");
    if(d) d.onclick = deleteAllProjects;
    const n = document.getElementById("btnNewProject");
    if(n) n.onclick = newProject;

    // Close menu when clicking outside
    document.addEventListener('click', function(e){
        const menu = document.getElementById("menuOptions");
        const menuBtn = document.getElementById("btnMenu");
        if(!menu || !menuBtn) return;
        if(menu.style.display !== 'block') return;
        if(e.target === menuBtn) return;
        if(menu.contains(e.target)) return;
        menu.style.display = 'none';
    }, {capture:false});
}

// Auto-run on load
window.addEventListener('load', function(){
    bindProjectButtons();
});



// === New Excel handler override ===
(function(){
  if (!window.XLSX) return;
  const input = document.getElementById("excelInput");
  if (!input) return;
  input.addEventListener("change", function(e){
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt){
      const wb = XLSX.read(new Uint8Array(evt.target.result), {type:"array"});
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, {header:1, blankrows:false});
      let list = [];
      rows.forEach(r=>{
        if(!r || r.length<2) return;
        const poste = String(r[0]||"").trim();
        const dist = parseFloat(r[1]);
        if(poste && !isNaN(dist)) list.push({poste, dist});
      });
      if(list.length===0){ alert("Excel inválido"); return;}
      let zeroIndex = list.findIndex(x=>x.dist===0);
      if(zeroIndex===-1){ alert("Sem distância zero!"); return;}
      list[zeroIndex].abs=0;
      let soma=0;
      for(let i=zeroIndex+1;i<list.length;i++){ soma+=list[i].dist; list[i].abs=soma; }
      soma=0;
      for(let i=zeroIndex-1;i>=0;i--){ soma+=list[i+1].dist; list[i].abs=-soma; }
      list.forEach(x=> x.abs=Math.abs(x.abs));
      const intervals={
        "0–150m":[0,150],
        "150–300m":[150,300],
        "300–450m":[300,450],
        "450–600m":[450,600],
        "600–700m":[600,700]
      };
      const result={};
      Object.keys(intervals).forEach(k=> result[k]=[]);
      list.forEach(x=>{
        for(const k in intervals){
          const [min,max]=intervals[k];
          if(x.abs>=min && x.abs<max){ result[k].push(x.poste); break;}
        }
      });
      const tbody=document.getElementById("postes-body");
      if(!tbody) return;
      tbody.innerHTML="";
      const cols=Object.keys(intervals);
      const maxLen=Math.max(...cols.map(c=>result[c].length));
      for(let r=0;r<maxLen;r++){
        const tr=document.createElement("tr");
        cols.forEach(c=>{
          tr.appendChild(Object.assign(document.createElement("td"),{textContent: result[c][r]||""}));
        });
        tbody.appendChild(tr);
      }
    };
    reader.readAsArrayBuffer(file);
  });
})();


// --- Override: loadProjectList (safe submenu inside menuOptions) ---
function loadProjectList() {
    try {
        const submenu = document.getElementById("submenuLoad");
        if(!submenu) return;
        submenu.style.display = "block";
        submenu.innerHTML = "";

        const keys = Object.keys(localStorage).filter(k => k.startsWith("project_")).sort();
        if (!keys.length) {
            submenu.innerHTML = "<em>Nenhum projecto guardado.</em>";
            return;
        }

        keys.forEach(k => {
            const name = k.replace("project_","");

            const row = document.createElement("div");
            row.style.marginBottom = "6px";
            row.style.display = "flex";
            row.style.gap = "6px";

            const btn = document.createElement("button");
            btn.textContent = "Abrir: " + name;
            btn.style.flex = "1";
            btn.onclick = () => loadProject(k);

            const del = document.createElement("button");
            del.textContent = "Eliminar";
            del.onclick = (e) => { e.stopPropagation(); if(confirm('Apagar o projecto "'+name+'"?')){ localStorage.removeItem(k); loadProjectList(); } };

            row.appendChild(btn);
            row.appendChild(del);
            submenu.appendChild(row);
        });
    } catch(err) {
        console.error('Erro em loadProjectList override:', err);
    }
}
