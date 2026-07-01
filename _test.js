const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => errors.push("jsdomError: " + (e.detail || e.message || e)));
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc, url: "http://localhost/" });
const win = dom.window, doc = win.document;
win.addEventListener("error", e => errors.push("window.error: " + e.message));
function pd(el, x, y){ const ev = new win.Event("pointerdown",{bubbles:true,cancelable:true}); ev.clientX=x||100; ev.clientY=y||100; el.dispatchEvent(ev); }
const wait = ms => new Promise(r => setTimeout(r, ms));

async function playToReveal(){
  doc.getElementById("btnYes").click();
  const stage = doc.getElementById("stage"), mall = doc.getElementById("mall");
  for (let i=0;i<80;i++){ pd(stage,120,120); pd(mall,130,130); await wait(2); }
  await wait(2750); // endChase(350)+drumroll(2200)
}

(async () => {
  try {
    await playToReveal();
    if (!doc.getElementById("scene-end").classList.contains("active")) errors.push("end scene not active");
    if (!doc.getElementById("road"))  errors.push("road missing after reveal");
    if (!doc.getElementById("taxi"))  errors.push("taxi missing after reveal");
    if (!doc.getElementById("pkg"))   errors.push("package missing after reveal");
    const h1 = doc.querySelector("#endCard h1");
    if (!h1 || !/Shmolik/.test(h1.textContent)) errors.push("reveal H1 not renamed to Shmolik");
    if (doc.getElementById("endTesta")) errors.push("options appeared BEFORE taxi finished");

    await wait(3300); // taxi drives in, loads, leaves -> options appear
    if (!doc.getElementById("endTesta") || !doc.getElementById("endEilat")) errors.push("options missing after taxi");

    // Eilat ending + restart
    doc.getElementById("endEilat").click();
    if (!doc.getElementById("again")) errors.push("Eilat ending missing Play again");
    doc.getElementById("again").click();
    if (!doc.getElementById("scene-call").classList.contains("active")) errors.push("restart failed");

    // No-flee + Doron
    doc.getElementById("btnNo").click();
    if (!/Doron/.test(doc.getElementById("doron").textContent)) errors.push("Doron line missing");

    // Second run -> Testaphone ending
    await playToReveal();
    await wait(3300);
    const t = doc.getElementById("endTesta");
    if (t){ t.click(); if(!doc.getElementById("again")) errors.push("Testaphone ending missing Play again"); }
    else errors.push("run2: endTesta missing");

    if (/Shlomi/.test(doc.body.innerHTML)) errors.push("stray 'Shlomi' still rendered");
  } catch(e){ errors.push("THROWN: " + (e && e.stack ? e.stack : e)); }
  win.close();
  if (errors.length){ console.log("FAILURES:\n"+errors.join("\n")); process.exit(1); }
  console.log("ALL RUNTIME CHECKS PASSED");
})();
