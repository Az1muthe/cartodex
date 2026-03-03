import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";

const TCGDEX = "https://api.tcgdex.net/v2/fr";

// ─── CONFIG LOGO ─────────────────────────────────────────────────────────────
// Pour utiliser votre propre logo :
//   1. Copiez votre fichier (PNG/SVG/WEBP) dans le dossier  public/  du projet
//   2. Remplacez null par le chemin :  const CUSTOM_LOGO_URL = '/mon-logo.png';
//   Ou utilisez une URL distante :     const CUSTOM_LOGO_URL = 'https://…/logo.svg';
const CUSTOM_LOGO_URL = null;

// ─── RARETÉ ──────────────────────────────────────────────────────────────────
function rarityColor(r) {
  if (!r) return '#6a5870';
  const s = r.toLowerCase();
  if (s.includes('secret') || s.includes('rainbow') || s.includes('hyper')) return '#d040a0';
  if (s.includes('ultra') || s.includes('vmax') || s.includes('vstar') || s.includes('amazing')) return '#e05030';
  if (s.includes('holo') && (s.includes('rare') || s.includes('ex') || s.includes('gx'))) return '#c8a448';
  if (s.includes('holo')) return '#c8a448';
  if (s.includes('rare')) return '#4090d0';
  if (s.includes('uncommon') || s.includes('peu')) return '#50a860';
  return '#607080';
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0e0c10;--bg2:#15121a;--surface:#1e1922;--surface2:#261f2e;
  --border:#3a2a3a;--border2:#4d3040;
  --red:#c82828;--red2:#e03a3a;--orange:#c86030;
  --gold:#c8a448;--green:#3ab870;
  --text:#f0e8e0;--text2:#b8a8b0;--muted:#6a5870;
  --radius:14px;--sb-w:240px;
}
html{background:var(--bg)}
html,body,#root{width:100%;min-height:100%;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 60% 40% at 0% 0%,rgba(200,40,40,.06) 0%,transparent 55%),
    radial-gradient(ellipse 50% 35% at 100% 100%,rgba(200,96,48,.05) 0%,transparent 55%),
    radial-gradient(ellipse 30% 25% at 50% 50%,rgba(200,164,72,.025) 0%,transparent 60%)}
#root{background:var(--bg)}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}

/* ── LOGO ── */
.logo{font-family:'Fredoka',sans-serif;font-weight:700;font-size:1.55rem;letter-spacing:3px;
  text-transform:uppercase;color:#f5ece0;-webkit-text-stroke:1.5px var(--red);
  text-shadow:0 0 24px rgba(200,40,40,.4),2px 2px 0 rgba(60,5,5,.9);
  display:flex;align-items:center;gap:10px;white-space:nowrap}
.logo-placeholder{border:1.5px dashed rgba(255,255,255,.35);border-radius:8px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  background:linear-gradient(135deg,var(--red),var(--orange));
  font-size:.9rem;color:#fff;position:relative;overflow:hidden}
.logo-placeholder-lbl{position:absolute;bottom:1px;right:2px;font-family:'Outfit',sans-serif;
  font-size:.38em;font-weight:700;color:rgba(255,255,255,.6);letter-spacing:.5px}

/* ── SHELL ── */
.app-shell{display:flex;width:100vw;min-height:100vh;background:var(--bg)}
.sidebar{width:var(--sb-w);flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);
  display:flex;flex-direction:column;position:sticky;top:0;height:100vh;
  padding:20px 0;overflow-y:auto;z-index:50}
.sb-top{padding:0 16px 18px;border-bottom:1px solid var(--border);margin-bottom:14px}
.sb-nav{flex:1;padding:0 10px;display:flex;flex-direction:column;gap:3px}
.sb-section-label{font-size:.58rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  color:var(--muted);padding:10px 12px 4px;margin-top:4px}
.sb-link{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;
  font-size:.82rem;font-weight:600;color:var(--text2);cursor:pointer;transition:all .14s;
  border:1px solid transparent;background:transparent;font-family:'Outfit',sans-serif;text-align:left;width:100%}
.sb-link:hover{background:var(--surface);color:var(--text)}
.sb-link.active{background:rgba(200,40,40,.14);color:var(--red2);border-color:rgba(200,40,40,.25)}
.sb-link .icon{font-size:.95rem;width:20px;text-align:center;flex-shrink:0}
.sb-col-actions{padding:6px 10px}
.sb-bottom{padding:12px 14px 0;border-top:1px solid var(--border);margin-top:auto}
.sb-pseudo{font-size:.8rem;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-email{font-size:.68rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:10px}
.main{flex:1;min-width:0;display:flex;flex-direction:column;width:0;background:var(--bg)}
.mob-header{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:52px;
  background:rgba(14,12,16,.95);border-bottom:1px solid var(--border);
  position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);flex-shrink:0}
.mob-menu-btn{background:none;border:none;color:var(--text);font-size:1.3rem;cursor:pointer}
.mob-drawer{display:none;position:fixed;inset:0;z-index:200}
.mob-drawer.open{display:block}
.mob-overlay{position:absolute;inset:0;background:rgba(0,0,0,.65)}
.mob-drawer .sidebar{position:relative;z-index:1}
@media(max-width:768px){.sidebar{display:none}.mob-header{display:flex}}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:999px;
  border:1px solid var(--border2);background:var(--surface2);color:var(--text);
  font-family:'Outfit',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;
  transition:all .15s;white-space:nowrap;flex-shrink:0}
.btn:hover{background:var(--border2);border-color:var(--muted);transform:translateY(-1px)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.btn-red{background:linear-gradient(135deg,var(--red),var(--orange));border-color:var(--red);
  color:#fff;box-shadow:0 2px 12px rgba(200,40,40,.3)}
.btn-red:hover{box-shadow:0 4px 20px rgba(200,40,40,.45);transform:translateY(-1px)}
.btn-red:disabled{box-shadow:none}
.btn-ghost{background:transparent;border-color:transparent}
.btn-ghost:hover{background:var(--surface);border-color:var(--border)}
.btn-danger{color:var(--red2);background:transparent;border-color:transparent}
.btn-danger:hover{background:rgba(200,40,40,.15);border-color:var(--red)}
.btn-green{background:rgba(58,184,112,.12);border-color:var(--green);color:var(--green)}
.btn-green:hover{background:var(--green);color:#fff}
.btn-sm{padding:5px 12px;font-size:.72rem}
.btn-xs{padding:2px 7px;font-size:.68rem;border-radius:6px}
.btn-ok{background:rgba(58,184,112,.12);border-color:var(--green);color:var(--green)}
.btn-ok:hover{background:var(--green);color:#fff}
.chip{padding:5px 13px;border-radius:999px;border:1px solid var(--border);background:transparent;
  font-family:'Outfit',sans-serif;font-size:.72rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all .14s}
.chip:hover{border-color:var(--muted);color:var(--text)}
.chip.on{background:rgba(200,40,40,.14);border-color:var(--red2);color:var(--red2)}

/* ── FORMS ── */
.field{margin-bottom:15px}
.field label{display:block;font-size:.67rem;font-weight:700;letter-spacing:1.5px;
  text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.field input,.field select{width:100%;padding:10px 13px;background:var(--surface);
  border:1px solid var(--border2);border-radius:10px;color:var(--text);
  font-family:'Outfit',sans-serif;font-size:.88rem;outline:none;transition:border-color .15s}
.field input:focus,.field select:focus{border-color:var(--red2)}
.field input::placeholder{color:var(--muted)}
.field-err{font-size:.72rem;color:var(--red2);margin-top:4px}
.field select option{background:var(--bg2)}

/* ── AUTH ── */
.auth-page{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  padding:20px;background:var(--bg)}
.auth-box{width:min(480px,100%);background:var(--surface);border:1px solid var(--border2);
  border-radius:22px;padding:clamp(24px,5vw,44px);box-shadow:0 24px 80px rgba(0,0,0,.7);
  animation:fadeUp .25s ease}
.auth-logo{display:flex;justify-content:center;margin-bottom:28px}
.auth-logo .logo{font-size:clamp(1.3rem,4vw,1.8rem)}
.auth-title{font-family:'Fredoka',sans-serif;font-size:.9rem;letter-spacing:2px;
  text-transform:uppercase;color:var(--text2);margin-bottom:22px;text-align:center}
.auth-error{background:rgba(200,40,40,.12);border:1px solid rgba(200,40,40,.3);
  border-radius:9px;padding:10px 14px;font-size:.78rem;color:var(--red2);margin-bottom:14px}
.auth-success{background:rgba(58,184,112,.12);border:1px solid rgba(58,184,112,.3);
  border-radius:9px;padding:10px 14px;font-size:.78rem;color:var(--green);margin-bottom:14px}
.auth-switch{text-align:center;margin-top:18px;font-size:.78rem;color:var(--muted)}
.auth-switch button{background:none;border:none;color:var(--red2);cursor:pointer;
  font-weight:700;font-size:.78rem;font-family:'Outfit',sans-serif}
.auth-switch button:hover{text-decoration:underline}

/* ── PAGE ── */
.page-wrap{display:flex;flex-direction:column;flex:1;min-width:0;width:100%;background:var(--bg)}
.page-hdr{display:flex;align-items:center;justify-content:space-between;
  padding:20px 28px 12px;flex-wrap:wrap;gap:10px;flex-shrink:0}
.page-title{font-family:'Fredoka',sans-serif;font-size:clamp(1.1rem,2.5vw,1.45rem);
  letter-spacing:2px;text-transform:uppercase;color:var(--text);text-shadow:0 0 20px rgba(200,40,40,.2)}
.page-title span{color:var(--red2)}
.page-hdr-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.prog{display:flex;align-items:center;gap:14px;padding:6px 28px 14px;flex-shrink:0}
.prog-lbl{font-size:.6rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.prog-track{flex:1;height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;min-width:60px}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--green),#6ee8a0);border-radius:99px;transition:width .6s cubic-bezier(.4,0,.2,1)}
.prog-ct{font-size:.78rem;font-weight:700;color:var(--green);white-space:nowrap}
.tbar{display:flex;align-items:center;gap:8px;padding:10px 28px;flex-wrap:wrap;flex-shrink:0;
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:rgba(21,18,26,.6)}
.tbar-lbl{font-size:.6rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
.tbar-sep{width:1px;height:20px;background:var(--border);flex-shrink:0}



/* ── IMPORT PANEL ── */
.imp-panel{margin:0 28px 14px;flex-shrink:0;background:var(--surface);
  border:1px solid var(--border2);border-radius:var(--radius);overflow:hidden}
.imp-head{display:flex;align-items:center;gap:10px;padding:12px 18px;cursor:pointer;
  font-weight:700;font-size:.82rem;background:var(--surface2);transition:background .15s;
  border-bottom:1px solid transparent;user-select:none}
.imp-head:hover{background:var(--border)}
.imp-head.open{border-bottom-color:var(--border2)}
.imp-arrow{margin-left:auto;color:var(--muted);font-size:.7rem;transition:transform .2s}
.imp-head.open .imp-arrow{transform:rotate(180deg)}
.imp-body{padding:16px 18px}
.imp-select{width:100%;padding:9px 13px;background:var(--bg);border:1px solid var(--border2);
  border-radius:10px;color:var(--text);font-family:'Outfit',sans-serif;font-size:.82rem;
  outline:none;margin-bottom:12px;cursor:pointer}
.imp-select:focus{border-color:var(--red2)}
.imp-select option{background:var(--bg)}
.imp-info{font-size:.72rem;color:var(--muted);margin-bottom:12px;line-height:1.6}
.imp-info strong{color:var(--text2)}
.imp-sel-bar{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.imp-sel-ct{font-size:.72rem;color:var(--muted);margin-left:auto}
.imp-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));
  gap:8px;margin-bottom:14px;max-height:340px;overflow-y:auto;padding-right:2px}
.imp-thumb{border-radius:6px;overflow:hidden;border:2px solid var(--border);
  aspect-ratio:2.5/3.5;background:var(--surface2);position:relative;cursor:pointer;
  transition:border-color .15s}
.imp-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:filter .2s}
.imp-thumb:not(.sel) img{filter:brightness(.55) grayscale(.3)}
.imp-thumb.sel{border-color:var(--red2)}
.imp-thumb-chk{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:5px;
  background:rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.5);
  display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;color:#fff;transition:all .15s}
.imp-thumb.sel .imp-thumb-chk{background:var(--red2);border-color:var(--red2)}
.imp-thumb.sel .imp-thumb-chk::after{content:'✓'}
.spinner-wrap{display:flex;align-items:center;gap:10px;padding:20px;
  color:var(--muted);font-size:.8rem;justify-content:center}
.spinner{width:18px;height:18px;border:2px solid var(--border2);border-top-color:var(--red);
  border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── TILT CARD (scanflip-style) ── */
/* fadeUp lives on the OUTER wrapper div (inline style), NOT here,
   to avoid fill-mode conflicting with JS-applied transforms */
@keyframes fadeUp{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.tilt-wrap{
  position:relative;border-radius:11px;
  will-change:transform;cursor:pointer;
  transform-style:preserve-3d;
}
.tilt-wrap.drag-over .card{border-color:var(--red2)!important;box-shadow:0 0 0 2px var(--red2)!important}
.card{
  width:100%;border-radius:11px;overflow:hidden;
  background:var(--surface);border:1px solid var(--border2);
  position:relative;
  transition:border-color .25s,box-shadow .25s;
}
.card.got{border-color:rgba(58,184,112,.35)}
.tilt-wrap:hover .card{border-color:var(--red2);box-shadow:0 28px 70px rgba(0,0,0,.55),0 0 0 1px rgba(200,40,40,.25)}
.tilt-wrap:hover .card.got{border-color:var(--green);box-shadow:0 28px 70px rgba(0,0,0,.5),0 0 0 1px rgba(58,184,112,.3)}
.card-img-box{width:100%;aspect-ratio:2.5/3.5;overflow:hidden;position:relative}
.card-img{width:100%;height:100%;object-fit:cover;display:block;transition:filter .4s}
.card:not(.got) .card-img{filter:grayscale(70%) brightness(.6)}
.card-glare{
  position:absolute;inset:0;pointer-events:none;z-index:10;
  opacity:0;transition:opacity .4s ease;border-radius:inherit;
}
.card-badge{position:absolute;top:6px;right:6px;z-index:4;width:20px;height:20px;border-radius:50%;
  background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;
  font-size:.6rem;font-weight:900;box-shadow:0 2px 7px rgba(0,0,0,.5)}
.card-checkbox{position:absolute;top:6px;left:6px;z-index:5;width:20px;height:20px;border-radius:5px;
  border:2px solid rgba(255,255,255,.4);background:rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  transition:all .15s;opacity:0}
.tilt-wrap:hover .card-checkbox,.card-checkbox.checked,.sel-mode .card-checkbox{opacity:1}
.card-checkbox.checked{background:var(--red2);border-color:var(--red2)}
.card-checkbox.checked::after{content:'✓';color:#fff;font-size:.6rem;font-weight:900}
.card-foot{padding:8px 9px 9px;border-top:1px solid var(--border)}
.card-name{font-size:.74rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-meta{font-size:.61rem;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.5}
.card-rarity{font-weight:700}
.card-acts{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
.glist .tilt-wrap{display:flex;align-items:center;border-radius:11px;overflow:hidden}
.glist .card{display:flex;align-items:center;gap:10px;padding-right:10px;border-radius:0;border:none}
.glist .card-img-box{width:60px;min-width:60px;aspect-ratio:2.5/3.5;flex-shrink:0}
.glist .card-foot{flex:1;border-top:none;padding:8px 0}
.glist .card-name{font-size:.84rem}
.glist .card-glare{display:none}
.glist .card-checkbox{top:50%;transform:translateY(-50%)}

/* ── COL WRAP ── */
.col-wrap{padding:14px 28px 80px;flex:1;min-width:0;background:var(--bg)}
.sec-title{display:flex;align-items:center;gap:10px;margin-bottom:14px;
  font-size:.6rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted)}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}
.grid{display:grid;gap:12px;width:100%}
.g6{grid-template-columns:repeat(6,1fr)}.g4{grid-template-columns:repeat(4,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}.g2{grid-template-columns:repeat(2,1fr)}
.glist{grid-template-columns:1fr;gap:8px}
@media(max-width:1100px){.g6{grid-template-columns:repeat(5,1fr)}}
@media(max-width:900px){.g6{grid-template-columns:repeat(4,1fr)}.g4{grid-template-columns:repeat(3,1fr)}}
@media(max-width:700px){.g6,.g4{grid-template-columns:repeat(3,1fr)}.g3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:500px){.g6,.g4,.g3{grid-template-columns:repeat(2,1fr)}}

/* ── BULK BAR ── */
.bulk-bar{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);
  z-index:400;display:flex;align-items:center;gap:10px;
  background:var(--bg2);border:1px solid var(--border2);border-radius:999px;
  padding:10px 16px;box-shadow:0 8px 40px rgba(0,0,0,.65);
  transition:transform .28s cubic-bezier(.23,1,.32,1),opacity .28s;
  opacity:0;pointer-events:none;white-space:nowrap;flex-wrap:wrap;justify-content:center}
.bulk-bar.show{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:all}
.bulk-count{font-size:.8rem;font-weight:700;color:var(--text2);
  padding-right:8px;border-right:1px solid var(--border2)}

/* ── BROWSE ── */
.browse-scroll{flex:1;overflow-y:auto;padding-bottom:80px}
.serie-section{margin-bottom:28px}
.serie-header{display:flex;align-items:center;gap:12px;padding:0 28px;margin-bottom:12px}
.serie-header-logo{height:28px;max-width:120px;object-fit:contain;
  filter:drop-shadow(0 1px 3px rgba(0,0,0,.5));flex-shrink:0}
.serie-name{font-family:'Fredoka',sans-serif;font-size:.9rem;letter-spacing:2px;
  text-transform:uppercase;color:var(--text2)}
.serie-header::after{content:'';flex:1;height:1px;background:var(--border)}
.browse-sets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));
  gap:10px;padding:0 28px 4px}
.set-card{background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);
  padding:14px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;gap:8px}
.set-card:hover{border-color:var(--red2);transform:translateY(-2px);
  box-shadow:0 6px 20px rgba(200,40,40,.12)}
.set-card-logo{height:36px;display:flex;align-items:center}
.set-card-logo img{max-height:100%;max-width:100%;object-fit:contain;
  filter:drop-shadow(0 1px 4px rgba(0,0,0,.5))}
.set-card-name{font-weight:700;font-size:.84rem;line-height:1.3}
.set-card-meta{font-size:.68rem;color:var(--muted)}
.set-card-badge{font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:99px;
  background:rgba(200,40,40,.12);color:var(--red2);border:1px solid rgba(200,40,40,.22);align-self:flex-start}

/* Browse card grid */
.browse-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;padding:0 28px 20px}
@media(max-width:1100px){.browse-grid{grid-template-columns:repeat(5,1fr)}}
@media(max-width:900px){.browse-grid{grid-template-columns:repeat(4,1fr)}}
@media(max-width:700px){.browse-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:480px){.browse-grid{grid-template-columns:repeat(2,1fr)}}
.browse-card{width:100%;border-radius:11px;overflow:hidden;background:var(--surface);
  border:1px solid var(--border2);position:relative;transition:all .18s;
  animation:fadeUp .2s ease both;cursor:pointer}
.browse-card:hover{border-color:var(--red2);transform:translateY(-2px);
  box-shadow:0 8px 24px rgba(200,40,40,.14)}
.browse-card.sel{border-color:var(--red2);box-shadow:0 0 0 2px var(--red2)}
.browse-card .card-img-box{aspect-ratio:2.5/3.5}
.browse-card .card-img{filter:none}
.browse-in-col{position:absolute;top:6px;right:6px;z-index:4;width:20px;height:20px;
  border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;
  justify-content:center;font-size:.6rem;font-weight:900;box-shadow:0 2px 7px rgba(0,0,0,.5)}
.browse-chk{position:absolute;top:7px;left:7px;z-index:4;width:30px;height:30px;border-radius:8px;
  border:2.5px solid rgba(255,255,255,.6);background:rgba(0,0,0,.55);
  display:flex;align-items:center;justify-content:center;transition:all .15s;
  opacity:0;pointer-events:none;backdrop-filter:blur(2px)}
.browse-card:hover .browse-chk,.browse-card.sel .browse-chk{opacity:1}
.browse-card.sel .browse-chk{background:var(--red2);border-color:var(--red2)}
.browse-card.sel .browse-chk::after{content:'✓';color:#fff;font-size:.8rem;font-weight:900}
.browse-hover-overlay{position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to top,rgba(14,12,16,.92) 0%,transparent 52%);
  opacity:0;transition:opacity .2s;border-radius:inherit}
.browse-card:hover .browse-hover-overlay{opacity:1}
.browse-add-btn{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);
  z-index:3;width:68%;border:none;cursor:pointer;pointer-events:none;
  background:linear-gradient(135deg,var(--red),var(--orange));color:#fff;
  font-family:'Outfit',sans-serif;font-size:.72rem;font-weight:700;
  padding:7px 0;border-radius:99px;box-shadow:0 3px 14px rgba(0,0,0,.6);
  opacity:0;transition:opacity .2s,transform .2s;white-space:nowrap;text-align:center}
.browse-card:hover .browse-add-btn{opacity:1;pointer-events:all;transform:translateX(-50%) translateY(-1px)}
.browse-add-inner{display:flex;gap:5px;align-items:center;justify-content:center}

/* ── ZOOM MODAL ── */
.zoom-overlay{display:none;position:fixed;inset:0;z-index:700;
  background:rgba(0,0,0,.9);backdrop-filter:blur(14px);
  align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
.zoom-overlay.open{display:flex}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.zoom-inner{position:relative;max-height:90vh;display:flex;flex-direction:column;align-items:center;gap:14px}
.zoom-img{max-height:80vh;max-width:min(420px,90vw);border-radius:14px;
  box-shadow:0 40px 120px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.06);
  animation:zoomIn .25s cubic-bezier(.23,1,.32,1)}
@keyframes zoomIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
.zoom-close{position:absolute;top:-14px;right:-14px;width:34px;height:34px;border-radius:50%;
  background:var(--surface2);border:1px solid var(--border2);color:var(--text);
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  font-size:.9rem;transition:all .15s;z-index:1}
.zoom-close:hover{background:var(--red);border-color:var(--red)}
.zoom-info{text-align:center}
.zoom-info-name{font-family:'Fredoka',sans-serif;font-size:1rem;letter-spacing:1px;color:var(--text);margin-bottom:2px}
.zoom-info-meta{font-size:.72rem;color:var(--muted)}

/* ── MODALS ── */
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);
  backdrop-filter:blur(8px);z-index:500;align-items:center;justify-content:center;padding:20px}
.overlay.open{display:flex}
.modal{background:var(--bg2);border:1px solid var(--border2);border-radius:20px;
  padding:26px 28px;width:min(380px,100%);box-shadow:0 24px 72px rgba(0,0,0,.75);
  animation:fadeUp .2s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.modal-title{font-family:'Fredoka',sans-serif;font-size:.82rem;letter-spacing:2px;
  text-transform:uppercase;color:var(--red2);margin-bottom:20px}
.modal-acts{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
.modal-body{font-size:.84rem;color:var(--text2);line-height:1.6;margin-bottom:4px}

/* ── ACCOUNT ── */
.account-wrap{padding:0 28px 60px;max-width:540px;width:100%}
.account-section{background:var(--surface);border:1px solid var(--border2);
  border-radius:var(--radius);padding:22px;margin-bottom:14px}
.account-section-title{font-family:'Fredoka',sans-serif;font-size:.82rem;letter-spacing:1.5px;
  text-transform:uppercase;color:var(--text2);margin-bottom:16px;
  padding-bottom:10px;border-bottom:1px solid var(--border)}

/* ── TOAST ── */
.toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 20px;border-radius:999px;
  background:var(--surface);border:1px solid;font-size:.8rem;font-weight:600;
  transform:translateY(50px);opacity:0;transition:all .25s cubic-bezier(.4,0,.2,1);pointer-events:none}
.toast.show{transform:translateY(0);opacity:1}

/* ── EMPTY ── */
.empty{text-align:center;padding:56px 20px;color:var(--muted)}
.empty-icon{font-size:2.8rem;display:block;margin-bottom:12px;opacity:.3}
.empty h3{font-family:'Fredoka',sans-serif;font-size:.95rem;color:var(--text);margin-bottom:6px;letter-spacing:1px}
.empty p{font-size:.78rem}

@media(max-width:768px){
  .page-hdr,.tbar,.col-wrap,.prog,.browse-sets-grid,.browse-grid,.account-wrap,.serie-header,.browse-scroll>*{padding-left:14px;padding-right:14px}
  .imp-panel{margin-left:14px;margin-right:14px}
  .bulk-bar{width:92%;border-radius:16px;bottom:16px}
}

/* ── BINDER VIEW ── */
.binder-outer{padding:14px 20px 80px;flex:1;background:var(--bg);
  display:flex;flex-direction:column;align-items:center;gap:14px;overflow-y:auto}
.binder-nav{display:flex;align-items:center;gap:14px;width:100%;max-width:940px;
  justify-content:space-between;flex-wrap:wrap}
.binder-page-label{font-size:.72rem;color:var(--muted);font-weight:600;letter-spacing:1px;
  text-align:center;flex:1}

/* Perspective wrapper – animation sits here */
.binder-book-wrap{width:100%;max-width:940px;perspective:1200px;}
.binder-book-wrap.b-out-next{animation:bOutNext .2s ease forwards}
.binder-book-wrap.b-out-prev{animation:bOutPrev .2s ease forwards}
.binder-book-wrap.b-in{animation:bIn .22s ease forwards}
@keyframes bOutNext{0%{opacity:1;transform:none}100%{opacity:0;transform:translateX(-2%) scale(.97) rotateY(4deg)}}
@keyframes bOutPrev{0%{opacity:1;transform:none}100%{opacity:0;transform:translateX(2%) scale(.97) rotateY(-4deg)}}
@keyframes bIn{0%{opacity:0;transform:scale(.97)}100%{opacity:1;transform:none}}

/* Physical binder */
.binder-book{display:flex;border-radius:6px 14px 14px 6px;overflow:hidden;
  box-shadow:-6px 0 0 #060402,0 28px 80px rgba(0,0,0,.85),
    inset 2px 0 16px rgba(0,0,0,.45);}

/* Spine */
.binder-spine{width:34px;flex-shrink:0;
  background:linear-gradient(to right,#0a0703 0%,#1c1108 25%,#261710 50%,#1c1108 75%,#0a0703 100%);
  display:flex;flex-direction:column;align-items:center;
  justify-content:space-evenly;padding:24px 0;
  box-shadow:inset -2px 0 8px rgba(0,0,0,.6);position:relative;z-index:2;}
.binder-ring{width:20px;height:20px;border-radius:50%;flex-shrink:0;
  background:conic-gradient(from 110deg,#b0b0b0 0deg,#f0f0f0 55deg,#909090 110deg,
    #606060 175deg,#b0b0b0 235deg,#d8d8d8 295deg,#b0b0b0 360deg);
  box-shadow:0 0 0 2px #2a2018,0 2px 6px rgba(0,0,0,.75),
    inset 0 1px 2px rgba(255,255,255,.2);position:relative;}
.binder-ring::after{content:'';position:absolute;inset:5px;border-radius:50%;
  background:radial-gradient(circle,#3a3028 40%,#1a1008 100%);
  box-shadow:inset 0 1px 4px rgba(0,0,0,.9);}

/* Pages */
.binder-page{flex:1;padding:12px;
  background:linear-gradient(160deg,#221810 0%,#1a1008 50%,#140e06 100%);
  display:grid;grid-template-columns:repeat(3,1fr);gap:7px;position:relative;}
.binder-page-left{border-right:3px solid rgba(0,0,0,.7);
  box-shadow:inset -6px 0 16px rgba(0,0,0,.5);}
.binder-page-right{box-shadow:inset 4px 0 12px rgba(0,0,0,.25);}
/* Subtle horizontal line texture */
.binder-page::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(
    0deg,transparent,transparent 30px,
    rgba(255,255,255,.014) 30px,rgba(255,255,255,.014) 31px);}

/* Card pocket / slot */
.binder-slot{aspect-ratio:2.5/3.5;border-radius:7px;position:relative;
  background:rgba(0,0,0,.38);
  box-shadow:inset 0 2px 8px rgba(0,0,0,.65),inset 0 0 0 1px rgba(255,255,255,.045);
  will-change:transform;cursor:pointer;overflow:visible;}
.binder-slot-empty{background:rgba(0,0,0,.22);cursor:default;
  box-shadow:inset 0 1px 4px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.03);}
.binder-slot-empty::after{content:'';position:absolute;inset:0;border-radius:7px;
  background:repeating-linear-gradient(45deg,
    rgba(255,255,255,.016) 0,rgba(255,255,255,.016) 1px,transparent 0,transparent 50%);
  background-size:6px 6px;}

/* Card inside pocket */
.bc{position:absolute;inset:0;border-radius:6px;overflow:hidden;display:flex;}
.bc.got{outline:1.5px solid rgba(58,184,112,.45);}
.bc img{width:100%;height:100%;object-fit:cover;display:block;}
.bc-placeholder{width:100%;height:100%;background:var(--surface2);
  display:flex;align-items:center;justify-content:center;opacity:.12;font-size:1rem;}
.bc-not-obtained{position:absolute;inset:0;
  background:rgba(0,0,0,.52);border-radius:6px;}
.bc-badge{position:absolute;bottom:3px;right:3px;width:13px;height:13px;border-radius:50%;
  background:var(--green);color:#fff;font-size:.42rem;font-weight:900;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 4px rgba(0,0,0,.6);z-index:3;}
.bc-glare{position:absolute;inset:0;pointer-events:none;z-index:10;opacity:0;
  transition:opacity .3s;border-radius:inherit;}

/* Hover actions */
.bc-hover{position:absolute;inset:0;border-radius:6px;z-index:15;
  display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
  padding:4px;
  background:linear-gradient(to top,rgba(10,8,14,.94) 0%,transparent 56%);
  opacity:0;transition:opacity .18s;pointer-events:none;}
.binder-slot:hover .bc-hover{opacity:1;pointer-events:all;}
.bc-acts{display:flex;gap:3px;}
.bc-btn{border:none;border-radius:5px;cursor:pointer;font-size:.5rem;font-weight:700;
  padding:3px 6px;font-family:'Outfit',sans-serif;transition:all .12s;line-height:1.4;}
.bc-ok{background:var(--green);color:#fff;}
.bc-mark{background:var(--surface2);color:var(--text2);border:1px solid var(--border2);}
.bc-mark:hover{background:rgba(58,184,112,.2);border-color:var(--green);}
.bc-edit{background:var(--surface2);color:var(--text2);border:1px solid var(--border2);}
.bc-del{background:rgba(200,40,40,.15);color:var(--red2);border:1px solid rgba(200,40,40,.3);}

@media(max-width:768px){
  .binder-outer{padding:10px 6px 80px;}
  .binder-page{padding:7px;gap:4px;}
  .binder-spine{width:22px;}
  .binder-ring{width:14px;height:14px;}
  .binder-ring::after{inset:4px;}
}
`;

// ─── LOGO COMPONENT ───────────────────────────────────────────────────────────
function LogoImg({ size = 30 }) {
  if (CUSTOM_LOGO_URL) {
    return (
      <img src={CUSTOM_LOGO_URL} alt="Logo"
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
    );
  }
  return (
    <div className="logo-placeholder" style={{ width: size, height: size }}>
      <span style={{ fontSize: size * 0.44, lineHeight: 1 }}>◆</span>
      <div className="logo-placeholder-lbl">LOGO</div>
    </div>
  );
}

// ─── TILT CARD ────────────────────────────────────────────────────────────────
function TiltCard({ card, onToggle, onEdit, onDelete, onZoom, listMode,
  selMode, selected, onSelect,
  isDraggable, onDragStart, onDragOver, onDragEnd, onDrop, dragOver }) {

  const wrapRef = useRef(null);
  const glareRef = useRef(null);

  const onMouseMove = useCallback((e) => {
    if (listMode) return;
    const el = wrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0–1
    const y = (e.clientY - r.top) / r.height;    // 0–1
    const rotX = (y - 0.5) * -28;
    const rotY = (x - 0.5) * 28;

    // Apply transform to wrapper (not to .card which has overflow:hidden)
    el.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.07)`;
    el.style.transition = 'transform .08s linear';

    // Dynamic shadow matching tilt direction
    el.style.filter = `drop-shadow(${-rotY * 0.4}px ${rotX * 0.3 + 16}px 24px rgba(0,0,0,.6))`;

    // Scanflip-style glare — bright spot tracking the mouse
    if (glareRef.current) {
      glareRef.current.style.background = `
        radial-gradient(ellipse 65% 55% at ${x * 100}% ${y * 100}%,
          rgba(255,255,255,.38) 0%,
          rgba(255,255,255,.1) 35%,
          transparent 70%
        ),
        linear-gradient(
          ${135 + rotY * 1.5}deg,
          rgba(${200 + rotY * 2},${150 - rotX * 2},${120 + rotX * 2},.08) 0%,
          transparent 60%
        )
      `;
      glareRef.current.style.opacity = '1';
    }
  }, [listMode]);

  const onMouseLeave = useCallback(() => {
    const el = wrapRef.current; if (!el) return;
    el.style.transform = '';
    el.style.transition = 'transform .7s cubic-bezier(.23,1,.32,1)';
    el.style.filter = '';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  }, []);

  const handleClick = (e) => {
    if (e.target.closest('.card-acts') || e.target.closest('.card-checkbox')) return;
    if (selMode) { onSelect(card.id); return; }
    onZoom(card);
  };

  return (
    <div
      ref={wrapRef}
      className={`tilt-wrap${selMode ? ' sel-mode' : ''}${dragOver ? ' drag-over' : ''}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      style={{ cursor: isDraggable ? 'grab' : 'pointer' }}
    >
      <div className={`card-checkbox${selected ? ' checked' : ''}`}
        onClick={e => { e.stopPropagation(); onSelect(card.id); }} />

      <div className={`card${card.obtained ? ' got' : ''}`} onClick={handleClick}>
        <div className="card-img-box">
          {card.src
            ? <img className="card-img" src={card.src} alt={card.name} loading="lazy" />
            : <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: .15, fontSize: '2rem' }}>🃏</div>
          }
          {card.obtained && <div className="card-badge">✓</div>}
          <div ref={glareRef} className="card-glare" />
        </div>
        <div className="card-foot">
          <div className="card-name">{card.name || 'Sans nom'}</div>
          <div className="card-meta">
            {[card.series, card.number].filter(Boolean).join(' · ')}
            {card.rarity && <><br /><span className="card-rarity" style={{ color: rarityColor(card.rarity) }}>{card.rarity}</span></>}
          </div>
          <div className="card-acts">
            <button className={`btn btn-sm${card.obtained ? ' btn-ok' : ''}`}
              onClick={e => { e.stopPropagation(); onToggle(card.id); }}>
              {card.obtained ? '✓ Obtenue' : '+ Marquer'}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={e => { e.stopPropagation(); onEdit(card); }}>✏️</button>
            <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDelete(card.id); }}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ZOOM MODAL ───────────────────────────────────────────────────────────────
function ZoomModal({ card, onClose }) {
  useEffect(() => {
    if (!card) return;
    const h = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [card, onClose]);

  if (!card) return null;
  const src = card.src || (card.image ? `${card.image}/high.webp` : null);

  return (
    <div className="zoom-overlay open" onClick={onClose}>
      <div className="zoom-inner" onClick={e => e.stopPropagation()}>
        <div className="zoom-close" onClick={onClose}>✕</div>
        {src
          ? <img className="zoom-img" src={src} alt={card.name} />
          : <div style={{ width: 280, height: 390, background: 'var(--surface)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: .3 }}>🃏</div>
        }
        {(card.name || card.series || card.rarity) && (
          <div className="zoom-info">
            {card.name && <div className="zoom-info-name">{card.name}</div>}
            <div className="zoom-info-meta">
              {[card.series, card.number].filter(Boolean).join(' · ')}
              {card.rarity && <span style={{ color: rarityColor(card.rarity) }}>{card.series || card.number ? ' · ' : ''}{card.rarity}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PICK COLLECTION MODAL ────────────────────────────────────────────────────
function PickCollectionModal({ open, collections, defaultId, onClose, onConfirm }) {
  const [sel, setSel] = useState(defaultId);
  useEffect(() => setSel(defaultId), [defaultId, open]);
  if (!open) return null;
  return (
    <div className="overlay open" onClick={e => e.target.classList.contains('overlay') && onClose()}>
      <div className="modal">
        <div className="modal-title">🗂 Choisir une collection</div>
        <div className="field"><label>Ajouter dans</label>
          <select value={sel || ''} onChange={e => setSel(e.target.value)}>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="modal-acts">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-red" onClick={() => sel && onConfirm(sel)}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="overlay open" onClick={e => e.target.classList.contains('overlay') && onClose()}>
      <div className="modal">
        <div className="modal-title">{title || '⚠️ Confirmation'}</div>
        {message && <p className="modal-body">{message}</p>}
        <div className="modal-acts">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [pseudo, setPseudo] = useState('');
  const [loading, setL] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const reset = v => { setView(v); setErr(''); setOk(''); setEmail(''); setPw(''); setPseudo(''); };

  const login = async () => {
    if (!email || !pw) return setErr('Email et mot de passe requis.');
    setL(true); setErr('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setL(false); if (error) return setErr(error.message); onLogin(data.user);
  };
  const register = async () => {
    if (!email || !pw || !pseudo) return setErr('Tous les champs sont requis.');
    if (pseudo.length < 3) return setErr('Pseudo : 3 caractères minimum.');
    if (pw.length < 8) return setErr('Mot de passe : 8 caractères minimum.');
    setL(true); setErr('');
    const { data, error } = await supabase.auth.signUp({ email, password: pw });
    if (error) { setL(false); return setErr(error.message); }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, pseudo });
      await supabase.from('collections').insert({ user_id: data.user.id, name: 'Ma collection', cards: [] });
    }
    setL(false); setOk('Compte créé ! Vérifiez votre email.'); reset('login');
  };
  const forgot = async () => {
    if (!email) return setErr('Entrez votre email.');
    setL(true); setErr('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '?reset=1' });
    setL(false); if (error) return setErr(error.message); setOk('Email envoyé ! Vérifiez votre boîte mail.');
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="logo" style={{ fontSize: 'clamp(1.3rem,4vw,1.8rem)' }}>
            <LogoImg size={36} />Cartodex
          </div>
        </div>
        {err && <div className="auth-error">{err}</div>}
        {ok && <div className="auth-success">{ok}</div>}
        {view === 'login' && <>
          <div className="auth-title">Connexion</div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" onKeyDown={e => e.key === 'Enter' && login()} /></div>
          <div className="field"><label>Mot de passe</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && login()} /></div>
          <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={login} disabled={loading}>{loading ? '…' : 'Se connecter'}</button>
          <div className="auth-switch">Mot de passe oublié ? <button onClick={() => reset('forgot')}>Réinitialiser</button></div>
          <div className="auth-switch">Pas de compte ? <button onClick={() => reset('register')}>Créer un compte</button></div>
        </>}
        {view === 'register' && <>
          <div className="auth-title">Créer un compte</div>
          <div className="field"><label>Pseudo</label><input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="DresseurEpique" /></div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" /></div>
          <div className="field"><label>Mot de passe</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="8 caractères minimum" onKeyDown={e => e.key === 'Enter' && register()} /></div>
          <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center' }} onClick={register} disabled={loading}>{loading ? '…' : 'Créer mon compte'}</button>
          <div className="auth-switch">Déjà un compte ? <button onClick={() => reset('login')}>Se connecter</button></div>
        </>}
        {view === 'forgot' && <>
          <div className="auth-title">Mot de passe oublié</div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" onKeyDown={e => e.key === 'Enter' && forgot()} /></div>
          <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center' }} onClick={forgot} disabled={loading}>{loading ? '…' : 'Envoyer le lien'}</button>
          <div className="auth-switch"><button onClick={() => reset('login')}>← Retour à la connexion</button></div>
        </>}
      </div>
    </div>
  );
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
function ResetPasswordPage({ onDone }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [l, setL] = useState(false);
  const handle = async () => {
    if (pw.length < 8) return setErr('Au moins 8 caractères.');
    setL(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password: pw });
    setL(false); if (error) return setErr(error.message);
    setOk('Mot de passe mis à jour !'); setTimeout(onDone, 2000);
  };
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo"><div className="logo"><LogoImg size={32} />Cartodex</div></div>
        {err && <div className="auth-error">{err}</div>}
        {ok && <div className="auth-success">{ok}</div>}
        <div className="auth-title">Nouveau mot de passe</div>
        <div className="field"><label>Nouveau mot de passe</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="8 caractères minimum" onKeyDown={e => e.key === 'Enter' && handle()} /></div>
        <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center' }} onClick={handle} disabled={l}>{l ? '…' : 'Enregistrer'}</button>
      </div>
    </div>
  );
}

// ─── COLLECTION PAGE ──────────────────────────────────────────────────────────
function CollectionPage({ collection, allCollections, onUpdate, onAddToCollection, showToast, isDirty, isSaving, onSave }) {
  const cards = collection?.cards || [];
  const [layout, setLayout] = useState('g6');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [zoomCard, setZoomCard] = useState(null);
  const [impOpen, setImpOpen] = useState(false);
  const [impSets, setImpSets] = useState([]); const [impSetId, setImpSetId] = useState('');
  const [impState, setImpState] = useState('idle'); const [impCards, setImpCards] = useState([]);
  const [impErr, setImpErr] = useState('');
  // Import card selection: null = all selected, Set = specific ids selected
  const [impSel, setImpSel] = useState(null);
  const [pickModal, setPickModal] = useState(null);
  const [selMode, setSelMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const dragIdx = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  useEffect(() => { if (!selMode) setSelected(new Set()); }, [selMode]);
  useEffect(() => { if (impState !== 'preview') setImpSel(null); }, [impState]);

  // Load sets list for import
  useEffect(() => {
    if (!impOpen || impSets.length) return;
    fetch(`${TCGDEX}/sets`)
      .then(r => r.json())
      .then(data => {
        // Sort by releaseDate descending
        const sorted = [...data].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
        setImpSets(sorted);
        if (sorted.length) setImpSetId(sorted[0].id);
      })
      .catch(() => {
        const fb = [{ id: 'ex11', name: 'EX Espèces Delta' }, { id: 'swsh1', name: 'Épée et Bouclier' }, { id: 'sv1', name: 'Écarlate et Violet' }];
        setImpSets(fb); setImpSetId('ex11');
      });
  }, [impOpen]);

  const fetchPreview = async () => {
    if (!impSetId) return; setImpState('loading'); setImpErr('');
    try {
      const res = await fetch(`${TCGDEX}/sets/${impSetId}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (!data.cards?.length) throw new Error('Aucune carte trouvée.');
      setImpCards(data.cards); setImpSel(null); setImpState('preview');
    } catch (e) { setImpErr(e.message); setImpState('error'); }
  };

  // Toggle a card in import selection
  const toggleImpCard = (id) => {
    setImpSel(prev => {
      const base = prev === null ? new Set(impCards.map(c => c.id)) : new Set(prev);
      base.has(id) ? base.delete(id) : base.add(id);
      return base;
    });
  };
  const impSelCount = impSel === null ? impCards.length : impSel.size;
  const getImpCards = () => impSel === null ? impCards : impCards.filter(c => impSel.has(c.id));

  const doImport = (targetColId) => {
    const targetCol = allCollections.find(c => c.id === targetColId); if (!targetCol) return;
    const existing = new Set(targetCol.cards.map(c => c.tcgId).filter(Boolean));
    const source = getImpCards();
    const toAdd = source.filter(c => !existing.has(c.id)).map(c => ({
      id: `tcg-${c.id}-${Math.random()}`, tcgId: c.id,
      src: c.image ? `${c.image}/high.webp` : '',
      name: c.name || c.id,
      series: impSets.find(s => s.id === impSetId)?.name || impSetId,
      number: c.localId || '',
      rarity: c.rarity || '',
      obtained: false,
    }));
    if (!toAdd.length) { showToast('Toutes ces cartes sont déjà dans cette collection', '#c8a448'); setPickModal(null); return; }
    onAddToCollection(targetColId, toAdd);
    showToast(`${toAdd.length} carte${toAdd.length > 1 ? 's' : ''} importée${toAdd.length > 1 ? 's' : ''} ✦`);
    setImpState('idle'); setImpCards([]); setImpSel(null); setPickModal(null);
  };


  const toggleObtained = id => {
    const next = cards.map(c => c.id === id ? { ...c, obtained: !c.obtained } : c);
    onUpdate({ ...collection, cards: next });
    const c = next.find(x => x.id === id);
    showToast(c.obtained ? 'Carte obtenue ✦' : 'Marquée manquante');
  };
  const deleteCard = id => { onUpdate({ ...collection, cards: cards.filter(c => c.id !== id) }); showToast('Carte supprimée', '#c82828'); };
  const openEdit = card => setModal({ id: card.id, name: card.name, series: card.series, number: card.number, rarity: card.rarity || '' });
  const saveEdit = () => { onUpdate({ ...collection, cards: cards.map(c => c.id === modal.id ? { ...c, ...modal } : c) }); setModal(null); showToast('Carte mise à jour ✦'); };

  const toggleSelect = id => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAll = () => setSelected(new Set(visible.map(c => c.id)));
  const clearSel = () => setSelected(new Set());

  const bulkMarkObtained = () => {
    onUpdate({ ...collection, cards: cards.map(c => selected.has(c.id) ? { ...c, obtained: true } : c) });
    showToast(`${selected.size} cartes marquées obtenues ✦`); clearSel();
  };
  const bulkMarkMissing = () => {
    onUpdate({ ...collection, cards: cards.map(c => selected.has(c.id) ? { ...c, obtained: false } : c) });
    showToast(`${selected.size} cartes marquées manquantes`); clearSel();
  };
  const bulkDelete = () => {
    onUpdate({ ...collection, cards: cards.filter(c => !selected.has(c.id)) });
    showToast(`${selected.size} cartes supprimées`, '#c82828'); clearSel();
  };

  // Drag to reorder
  const handleDragStart = idx => { dragIdx.current = idx; };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => { dragIdx.current = null; setDragOverIdx(null); };
  const handleDrop = idx => {
    if (dragIdx.current === null || dragIdx.current === idx) { setDragOverIdx(null); return; }
    const all = [...cards];
    const dragged = visible[dragIdx.current]; const target = visible[idx];
    const fi = all.findIndex(c => c.id === dragged.id); const ti = all.findIndex(c => c.id === target.id);
    const next = [...all]; next.splice(fi, 1); next.splice(ti, 0, dragged);
    onUpdate({ ...collection, cards: next });
    dragIdx.current = null; setDragOverIdx(null);
  };

  const total = cards.length, obtained = cards.filter(c => c.obtained).length;
  const pct = total === 0 ? 0 : Math.round((obtained / total) * 100);
  const visible = filter === 'obtained' ? cards.filter(c => c.obtained) : filter === 'missing' ? cards.filter(c => !c.obtained) : cards;
  const layouts = [{ id: 'g6', icon: '⋮⋮⋮', label:'Grille' }, { id: 'g3', icon: '▦', label:'3×3' }, { id: 'glist', icon: '☰', label:'Liste' }, { id: 'binder', icon: '📖', label:'Classeur' }];
  const filters = [{ id: 'all', label: 'Toutes' }, { id: 'obtained', label: 'Obtenues' }, { id: 'missing', label: 'Manquantes' }];

  if (!collection) return <div className="empty"><span className="empty-icon">📋</span><h3>Aucune collection</h3><p>Créez une collection dans le menu de gauche.</p></div>;

  return (
    <div className="page-wrap">
      <div className="page-hdr">
        <div className="page-title"><span>{collection.name}</span></div>
        <div className="page-hdr-actions">
          {isDirty && (
            <button className="btn btn-red" onClick={onSave} disabled={isSaving} style={{ gap: 6 }}>
              {isSaving ? <><div className="spinner" style={{width:12,height:12,borderWidth:2}} />Sauvegarde…</> : '💾 Sauvegarder'}
            </button>
          )}
          <button className={`btn btn-sm${selMode ? ' btn-red' : ''}`} onClick={() => setSelMode(v => !v)}>
            {selMode ? '✕ Quitter sélection' : '☑ Sélectionner'}
          </button>
          {total > 0 && <button className="btn btn-danger btn-sm" onClick={() => onUpdate({ ...collection, cards: [] })}>Vider</button>}
        </div>
      </div>

      <div className="prog">
        <span className="prog-lbl">Avancement</span>
        <div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
        <span className="prog-ct">{obtained} / {total} · {pct}%</span>
      </div>

      <div className="tbar">
        <span className="tbar-lbl">Vue</span>
        {layouts.map(l => <button key={l.id} className={`chip${layout === l.id ? ' on' : ''}`} onClick={() => setLayout(l.id)}>{l.icon}</button>)}
        <div className="tbar-sep" />
        {filters.map(f => <button key={f.id} className={`chip${filter === f.id ? ' on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>)}
        {selMode && <><div className="tbar-sep" /><button className="btn btn-ghost btn-sm" onClick={selectAll}>Tout</button><button className="btn btn-ghost btn-sm" onClick={clearSel}>Aucun</button></>}
        {!selMode && <><div className="tbar-sep" /><span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>⠿ Glisser-déposer pour réordonner</span></>}
      </div>

      {/* Import TCGdex */}
      <div className="imp-panel">
        <div className={`imp-head${impOpen ? ' open' : ''}`} onClick={() => setImpOpen(v => !v)}>
          <span>🎴</span><span>Importer depuis TCGdex</span><span className="imp-arrow">▼</span>
        </div>
        {impOpen && <div className="imp-body">
          {impSets.length === 0
            ? <div className="spinner-wrap"><div className="spinner" />Chargement des extensions…</div>
            : <>
              <select className="imp-select" value={impSetId} onChange={e => { setImpSetId(e.target.value); setImpState('idle'); setImpCards([]); setImpSel(null); }}>
                {impSets.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
              <p className="imp-info">Images via <strong>api.tcgdex.net</strong> · Les doublons sont ignorés</p>
            </>
          }
          {impState === 'idle' && impSets.length > 0 && <button className="btn btn-red" onClick={fetchPreview}>🔍 Prévisualiser l'extension</button>}
          {impState === 'loading' && <div className="spinner-wrap"><div className="spinner" />Chargement…</div>}
          {impState === 'error' && <div><p style={{ color: 'var(--red2)', fontSize: '.78rem', marginBottom: 10 }}>❌ {impErr}</p><button className="btn" onClick={() => setImpState('idle')}>Réessayer</button></div>}
          {impState === 'preview' && <>
            {/* Selection controls */}
            <div className="imp-sel-bar">
              <button className="btn btn-xs" onClick={() => setImpSel(null)}>Tout sélectionner</button>
              <button className="btn btn-xs" onClick={() => setImpSel(new Set())}>Tout désélectionner</button>
              <span className="imp-sel-ct">{impSelCount} / {impCards.length} sélectionnée{impSelCount > 1 ? 's' : ''}</span>
            </div>
            {/* Preview grid — clickable to toggle selection */}
            <div className="imp-preview">
              {impCards.map(c => {
                const isSel = impSel === null || impSel.has(c.id);
                return (
                  <div key={c.id} className={`imp-thumb${isSel ? ' sel' : ''}`} onClick={() => toggleImpCard(c.id)}>
                    {c.image ? <img src={`${c.image}/high.webp`} alt={c.name} loading="lazy" /> : <div style={{ width: '100%', height: '100%', background: 'var(--surface)' }} />}
                    <div className="imp-thumb-chk" />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-red" disabled={impSelCount === 0}
                onClick={() => allCollections.length > 1 ? setPickModal({ type: 'import' }) : doImport(collection.id)}>
                ⬇ Importer ({impSelCount})
              </button>
              <button className="btn btn-ghost" onClick={() => { setImpState('idle'); setImpCards([]); setImpSel(null); }}>Annuler</button>
            </div>
          </>}
        </div>}
      </div>


      {/* Card grid / binder */}
      {layout === 'binder'
        ? <BinderView cards={visible} onZoom={setZoomCard}
            onToggle={toggleObtained} onEdit={openEdit} onDelete={deleteCard} />
        : <div className="col-wrap">
          <div className="sec-title">{visible.length} carte{visible.length !== 1 ? 's' : ''}</div>
          {visible.length === 0
            ? <div className="empty">
              <span className="empty-icon">{filter === 'missing' && total > 0 ? '🏆' : '◈'}</span>
              <h3>{filter === 'missing' && total > 0 ? 'Collection complète !' : 'Aucune carte'}</h3>
              <p>{filter === 'missing' && total > 0 ? 'Toutes vos cartes sont obtenues.' : 'Importez une extension depuis TCGdex.'}</p>
            </div>
            : <div className={`grid ${layout}`}>
              {visible.map((card, i) => (
                <div key={card.id} style={{
                  animation:'fadeUp .28s ease both',
                  animationDelay:`${Math.min(i * .022, .45)}s`
                }}>
                  <TiltCard card={card} onToggle={toggleObtained} onEdit={openEdit} onDelete={deleteCard} onZoom={setZoomCard}
                    listMode={layout === 'glist'} selMode={selMode} selected={selected.has(card.id)} onSelect={toggleSelect}
                    isDraggable={!selMode && filter === 'all'}
                    onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd} onDrop={() => handleDrop(i)}
                    dragOver={dragOverIdx === i && dragIdx.current !== null && dragIdx.current !== i}
                  />
                </div>
              ))}
            </div>
          }
        </div>
      }

      {/* Bulk bar */}
      <div className={`bulk-bar${selMode && selected.size > 0 ? ' show' : ''}`}>
        <span className="bulk-count">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
        <button className="btn btn-sm btn-green" onClick={bulkMarkObtained}>✓ Obtenues</button>
        <button className="btn btn-sm" style={{ background: 'transparent', borderColor: 'var(--border2)', color: 'var(--text2)' }} onClick={bulkMarkMissing}>○ Manquantes</button>
        <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm(`Supprimer ${selected.size} carte${selected.size > 1 ? 's' : ''} ?`)) bulkDelete(); }}>✕ Supprimer</button>
        <button className="btn btn-sm btn-ghost" onClick={clearSel}>Annuler</button>
      </div>

      {/* Edit modal */}
      <div className={`overlay${modal ? ' open' : ''}`} onClick={e => e.target.classList.contains('overlay') && setModal(null)}>
        {modal && <div className="modal">
          <div className="modal-title">✦ Modifier la carte</div>
          {[['Nom', 'name', 'Dracaufeu Holo EX'], ['Série', 'series', 'EX Espèces Delta'], ['Numéro', 'number', '16/113'], ['Rareté', 'rarity', 'Rare Holo']].map(([lbl, k, ph]) => (
            <div key={k} className="field"><label>{lbl}</label>
              <input value={modal[k] || ''} placeholder={ph} autoFocus={k === 'name'}
                onChange={e => setModal(m => ({ ...m, [k]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveEdit()} />
            </div>
          ))}
          <div className="modal-acts">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
            <button className="btn btn-red" onClick={saveEdit}>Enregistrer</button>
          </div>
        </div>}
      </div>

      <ZoomModal card={zoomCard} onClose={() => setZoomCard(null)} />
      <PickCollectionModal open={!!pickModal} collections={allCollections} defaultId={collection.id}
        onClose={() => setPickModal(null)}
        onConfirm={colId => { if (pickModal?.type === 'import') doImport(colId); }} />
    </div>
  );
}

// ─── BINDER SLOT ─────────────────────────────────────────────────────────────
function BinderSlot({ card, onZoom, onToggle, onEdit, onDelete }) {
  const slotRef = useRef(null);
  const glareRef = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = slotRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rotX = (y - 0.5) * -24;
    const rotY = (x - 0.5) * 24;
    el.style.transform = `perspective(500px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.1) translateZ(6px)`;
    el.style.transition = 'transform .05s linear';
    el.style.zIndex = '20';
    el.style.filter = `drop-shadow(${-rotY * 0.5}px ${rotX * 0.4 + 14}px 18px rgba(0,0,0,.75))`;
    if (glareRef.current) {
      glareRef.current.style.background = `
        radial-gradient(ellipse 60% 50% at ${x*100}% ${y*100}%,
          rgba(255,255,255,.36) 0%, rgba(255,255,255,.08) 38%, transparent 68%)`;
      glareRef.current.style.opacity = '1';
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = slotRef.current; if (!el) return;
    el.style.transform = '';
    el.style.transition = 'transform .65s cubic-bezier(.23,1,.32,1)';
    el.style.zIndex = '';
    el.style.filter = '';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  }, []);

  if (!card) return <div className="binder-slot binder-slot-empty" />;

  return (
    <div ref={slotRef} className="binder-slot"
      onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <div className={`bc${card.obtained ? ' got' : ''}`}>
        {card.src
          ? <img src={card.src} alt={card.name} loading="lazy" onClick={() => onZoom(card)} />
          : <div className="bc-placeholder" onClick={() => onZoom(card)}>🃏</div>
        }
        {!card.obtained && <div className="bc-not-obtained" onClick={() => onZoom(card)} />}
        {card.obtained && <div className="bc-badge">✓</div>}
        <div ref={glareRef} className="bc-glare" />
        <div className="bc-hover">
          <div className="bc-acts">
            <button className={`bc-btn ${card.obtained ? 'bc-ok' : 'bc-mark'}`}
              onClick={e => { e.stopPropagation(); onToggle(card.id); }}>
              {card.obtained ? '✓' : '＋'}
            </button>
            <button className="bc-btn bc-edit"
              onClick={e => { e.stopPropagation(); onEdit(card); }}>✏️</button>
            <button className="bc-btn bc-del"
              onClick={e => { e.stopPropagation(); onDelete(card.id); }}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BINDER VIEW ──────────────────────────────────────────────────────────────
const CARDS_PER_SPREAD = 18; // 9 per page × 2 pages

function BinderView({ cards, onZoom, onToggle, onEdit, onDelete }) {
  const [spread, setSpread] = useState(0);
  const [animClass, setAnimClass] = useState('');

  const totalSpreads = Math.max(1, Math.ceil(cards.length / CARDS_PER_SPREAD));

  // Reset to page 1 when card list changes significantly
  useEffect(() => { setSpread(0); }, [cards.length === 0]);

  const navigate = (dir) => {
    if (animClass) return;
    const next = spread + dir;
    if (next < 0 || next >= totalSpreads) return;
    // Phase 1: out animation
    setAnimClass(dir > 0 ? 'b-out-next' : 'b-out-prev');
    setTimeout(() => {
      // Swap content while invisible
      setSpread(next);
      // Phase 2: in animation
      setAnimClass('b-in');
      setTimeout(() => setAnimClass(''), 220);
    }, 200);
  };

  const base = spread * CARDS_PER_SPREAD;
  const leftCards  = Array.from({ length: 9 }, (_, i) => cards[base + i]     || null);
  const rightCards = Array.from({ length: 9 }, (_, i) => cards[base + 9 + i] || null);
  const leftPageNum  = spread * 2 + 1;
  const rightPageNum = spread * 2 + 2;
  const shownCount = [...leftCards, ...rightCards].filter(Boolean).length;

  return (
    <div className="binder-outer">
      {/* Navigation */}
      <div className="binder-nav">
        <button className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)} disabled={spread === 0 || !!animClass}>
          ◀ Précédent
        </button>
        <span className="binder-page-label">
          Pages {leftPageNum}–{rightPageNum} / {totalSpreads * 2}
          &nbsp;·&nbsp;{shownCount} carte{shownCount !== 1 ? 's' : ''}
          &nbsp;·&nbsp;Spread {spread + 1}/{totalSpreads}
        </span>
        <button className="btn btn-ghost btn-sm"
          onClick={() => navigate(1)} disabled={spread >= totalSpreads - 1 || !!animClass}>
          Suivant ▶
        </button>
      </div>

      {/* Binder book */}
      <div className={`binder-book-wrap${animClass ? ' ' + animClass : ''}`}>
        <div className="binder-book">
          {/* Metal spine with rings */}
          <div className="binder-spine">
            <div className="binder-ring" />
            <div className="binder-ring" />
            <div className="binder-ring" />
          </div>

          {/* Left page */}
          <div className="binder-page binder-page-left">
            {leftCards.map((card, i) => (
              <BinderSlot key={`L-${base}-${i}`}
                card={card} onZoom={onZoom}
                onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>

          {/* Right page */}
          <div className="binder-page binder-page-right">
            {rightCards.map((card, i) => (
              <BinderSlot key={`R-${base}-${i}`}
                card={card} onZoom={onZoom}
                onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BROWSE PAGE ──────────────────────────────────────────────────────────────
function BrowsePage({ allCollections, onAddToCollection, showToast }) {
  const [series, setSeries] = useState([]);    // Grouped: [{id, name, logo, sets:[]}]
  const [selSet, setSelSet] = useState(null);  // Currently viewed set
  const [setCards, setSetCards] = useState([]); // Cards of the selected set
  const [loading, setLoading] = useState(true);
  const [loadingC, setLoadingC] = useState(false);
  const [pickModal, setPickModal] = useState(null);
  const [zoomCard, setZoomCard] = useState(null);
  const [browseSelected, setBrowseSelected] = useState(new Set());

  useEffect(() => {
    // /series returns objects WITHOUT their sets list — so we fetch /sets
    // and group them by serie ourselves.
    fetch(`${TCGDEX}/sets`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) throw new Error('empty');

        // Build a map serieId -> { id, name, logo, sets[] }
        const map = new Map();
        // Sort sets by releaseDate ascending so they appear in order within each serie
        const sorted = [...data].sort((a, b) =>
          (a.releaseDate || '').localeCompare(b.releaseDate || ''));

        sorted.forEach(set => {
          const sid  = set.serie?.id   || 'other';
          const sname = set.serie?.name || 'Autres';
          const slogo = set.serie?.logo || null;
          if (!map.has(sid)) map.set(sid, { id: sid, name: sname, logo: slogo, sets: [] });
          map.get(sid).sets.push(set);
        });

        // Convert to array, newest series first (reverse release order)
        // We take the latest releaseDate of each serie's sets to sort series
        const grouped = [...map.values()].sort((a, b) => {
          const la = a.sets[a.sets.length - 1]?.releaseDate || '';
          const lb = b.sets[b.sets.length - 1]?.releaseDate || '';
          return lb.localeCompare(la);   // newest serie first
        });

        setSeries(grouped);
        setLoading(false);
      })
      .catch(err => {
        console.error('TCGdex /sets error:', err);
        // Fallback: try English endpoint
        fetch('https://api.tcgdex.net/v2/en/sets')
          .then(r => r.json())
          .then(data => {
            if (!Array.isArray(data)) throw new Error('bad');
            const sorted = [...data].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
            const map = new Map();
            sorted.forEach(set => {
              const sid = set.serie?.id || 'other';
              const sname = set.serie?.name || 'Autres';
              const slogo = set.serie?.logo || null;
              if (!map.has(sid)) map.set(sid, { id: sid, name: sname, logo: slogo, sets: [] });
              map.get(sid).sets.push(set);
            });
            const grouped = [...map.values()].sort((a, b) => {
              const la = a.sets[0]?.releaseDate || '';
              const lb = b.sets[0]?.releaseDate || '';
              return lb.localeCompare(la);
            });
            setSeries(grouped.filter(s => s.sets.length > 0));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      });
  }, []);

  useEffect(() => { setBrowseSelected(new Set()); }, [selSet]);

  const loadSet = async s => {
    setSelSet(s); setLoadingC(true); setSetCards([]);
    try {
      const r = await fetch(`${TCGDEX}/sets/${s.id}`);
      const d = await r.json();
      setSetCards(d.cards || []);
    } catch { }
    setLoadingC(false);
  };

  // A card can be added to ANY collection (even if it's already in some)
  // Check per-target-collection only
  const inAny = tcgId => allCollections.some(col => col.cards.some(c => c.tcgId === tcgId));

  const toggleBrowseSel = id => setBrowseSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const handleAdd = (cardsToAdd) => {
    if (allCollections.length === 1) doAdd(allCollections[0].id, cardsToAdd);
    else setPickModal({ cards: cardsToAdd });
  };

  const doAdd = (colId, cardsToAdd) => {
    const targetCol = allCollections.find(c => c.id === colId);
    if (!targetCol) return;
    // Only skip cards already in THIS specific collection
    const existingInTarget = new Set(targetCol.cards.map(c => c.tcgId).filter(Boolean));
    const toAdd = cardsToAdd.filter(c => !existingInTarget.has(c.id));
    const skipped = cardsToAdd.length - toAdd.length;

    if (toAdd.length === 0) {
      showToast('Ces cartes sont déjà dans cette collection', '#c8a448');
      setPickModal(null); return;
    }
    const mapped = toAdd.map(c => ({
      id: `tcg-${c.id}-${Math.random()}`, tcgId: c.id,
      src: c.image ? `${c.image}/high.webp` : '',
      name: c.name || c.id, series: selSet?.name || '',
      number: c.localId || '', rarity: c.rarity || '', obtained: false,
    }));
    onAddToCollection(colId, mapped);
    const msg = skipped > 0
      ? `${toAdd.length} ajoutée${toAdd.length > 1 ? 's' : ''} · ${skipped} doublon${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''} ✦`
      : `${toAdd.length} carte${toAdd.length > 1 ? 's' : ''} ajoutée${toAdd.length > 1 ? 's' : ''} ✦`;
    showToast(msg);
    setBrowseSelected(new Set()); setPickModal(null);
  };

  const selectedCardsData = setCards.filter(c => browseSelected.has(c.id));

  return (
    <div className="page-wrap">
      <div className="page-hdr">
        <div>
          <div className="page-title">Parcourir les <span>Extensions</span></div>
          {selSet && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}
              onClick={() => { setSelSet(null); setSetCards([]); }}>
              ← Toutes les extensions
            </button>
          )}
        </div>
        {selSet && <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{setCards.length} cartes · {selSet.name}</div>}
      </div>

      {!selSet ? (
        loading
          ? <div className="spinner-wrap" style={{ padding: 40 }}><div className="spinner" />Chargement des séries…</div>
          : series.length === 0
          ? <div className="empty"><span className="empty-icon">📦</span><h3>Aucune extension disponible</h3><p>Vérifiez votre connexion internet — données via api.tcgdex.net</p><button className="btn btn-sm btn-red" style={{marginTop:14}} onClick={()=>window.location.reload()}>🔄 Réessayer</button></div>
          : <div className="browse-scroll">
            {series.map(serie => (
              <div key={serie.id} className="serie-section">
                <div className="serie-header">
                  {serie.logo && (
                    <img className="serie-header-logo" src={`${serie.logo}.webp`} alt={serie.name}
                      onError={e => e.target.style.display = 'none'} />
                  )}
                  <span className="serie-name">{serie.name}</span>
                </div>
                <div className="browse-sets-grid">
                  {(serie.sets || []).map(s => (
                    <div key={s.id} className="set-card" onClick={() => loadSet(s)}>
                      {s.logo && (
                        <div className="set-card-logo">
                          <img src={`${s.logo}.webp`} alt={s.name}
                            onError={e => e.target.parentElement.style.display = 'none'} />
                        </div>
                      )}
                      <div className="set-card-name">{s.name}</div>
                      <div className="set-card-meta">{typeof s.cardCount === 'object' ? (s.cardCount?.total ?? s.cardCount?.official ?? '?') : (s.cardCount ?? '?')} cartes · {s.releaseDate?.split('-')[0] ?? '—'}</div>
                      <div className="set-card-badge">{s.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
      ) : loadingC
        ? <div className="spinner-wrap" style={{ padding: 40 }}><div className="spinner" />Chargement des cartes…</div>
        : <div className="browse-grid">
          {setCards.map((c, i) => {
            const inCol = inAny(c.id);
            const isSel = browseSelected.has(c.id);
            return (
              <div key={c.id} className={`browse-card${isSel ? ' sel' : ''}`}
                style={{ animationDelay: `${Math.min(i * .016, .4)}s` }}
                onClick={() => setZoomCard({ ...c, series: selSet?.name })}>
                <div className="card-img-box" style={{ position:'relative' }}>
                  {c.image
                    ? <img className="card-img" src={`${c.image}/high.webp`} alt={c.name} loading="lazy" style={{ filter: 'none' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'var(--surface2)' }} />
                  }
                  {/* overlay gradient - purely visual, no pointer events */}
                  <div className="browse-hover-overlay" />
                  {/* ✓ badge */}
                  {inCol && <div className="browse-in-col" title="Dans une collection">✓</div>}
                  {/* Checkbox multi-sélection */}
                  <div className="browse-chk" style={{ pointerEvents: 'all' }}
                    onClick={e => { e.stopPropagation(); toggleBrowseSel(c.id); }} />
                  {/* Bouton Ajouter - seulement la pill est clickable */}
                  <button className="browse-add-btn" onClick={e => { e.stopPropagation(); handleAdd([c]); }}>
                    <div className="browse-add-inner">＋ Ajouter</div>
                  </button>
                </div>
                <div className="card-foot">
                  <div className="card-name">{c.name || c.id}</div>
                  <div className="card-meta">
                    {c.localId}
                    {c.rarity && <><br /><span className="card-rarity" style={{ color: rarityColor(c.rarity) }}>{c.rarity}</span></>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      }

      {/* Bulk add bar */}
      <div className={`bulk-bar${browseSelected.size > 0 ? ' show' : ''}`}>
        <span className="bulk-count">{browseSelected.size} sélectionnée{browseSelected.size > 1 ? 's' : ''}</span>
        <button className="btn btn-red btn-sm" onClick={() => handleAdd(selectedCardsData)}>＋ Ajouter à la collection</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setBrowseSelected(new Set())}>Annuler</button>
      </div>

      <ZoomModal card={zoomCard} onClose={() => setZoomCard(null)} />
      <PickCollectionModal open={!!pickModal} collections={allCollections} defaultId={allCollections[0]?.id}
        onClose={() => setPickModal(null)} onConfirm={colId => doAdd(colId, pickModal.cards)} />
    </div>
  );
}

// ─── ACCOUNT PAGE ─────────────────────────────────────────────────────────────
function AccountPage({ user, profile, onProfileUpdate, showToast, onLogout }) {
  const [pseudo, setPseudo] = useState(profile?.pseudo || '');
  const [oldPw, setOldPw] = useState(''); const [newPw, setNewPw] = useState('');
  const [l1, setL1] = useState(false); const [l2, setL2] = useState(false);
  const [err1, setErr1] = useState(''); const [err2, setErr2] = useState('');

  const savePseudo = async () => {
    if (pseudo.length < 3) return setErr1('Au moins 3 caractères.');
    setL1(true); setErr1('');
    const { error } = await supabase.from('profiles').update({ pseudo }).eq('id', user.id);
    setL1(false);
    if (error) return setErr1(error.message);
    onProfileUpdate({ ...profile, pseudo }); showToast('Pseudo mis à jour ✦');
  };
  const savePassword = async () => {
    if (newPw.length < 8) return setErr2('Au moins 8 caractères.');
    setL2(true); setErr2('');
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw });
    if (e1) { setL2(false); return setErr2('Mot de passe actuel incorrect.'); }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setL2(false);
    if (error) return setErr2(error.message);
    setOldPw(''); setNewPw(''); showToast('Mot de passe mis à jour ✦');
  };

  return (
    <div className="page-wrap">
      <div className="page-hdr"><div className="page-title">Mon <span>Compte</span></div></div>
      <div className="account-wrap">
        <div className="account-section">
          <div className="account-section-title">Informations</div>
          <div className="field"><label>Email</label><input value={user.email} disabled style={{ opacity: .5 }} /></div>
          <div className="field"><label>Pseudo</label><input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="DresseurEpique" />{err1 && <div className="field-err">{err1}</div>}</div>
          <button className="btn btn-red" onClick={savePseudo} disabled={l1}>{l1 ? '…' : 'Enregistrer'}</button>
        </div>
        <div className="account-section">
          <div className="account-section-title">Changer le mot de passe</div>
          <div className="field"><label>Mot de passe actuel</label><input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="••••••••" /></div>
          <div className="field"><label>Nouveau mot de passe</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="8 caractères minimum" onKeyDown={e => e.key === 'Enter' && savePassword()} />{err2 && <div className="field-err">{err2}</div>}</div>
          <button className="btn btn-red" onClick={savePassword} disabled={l2}>{l2 ? '…' : 'Changer le mot de passe'}</button>
        </div>
        <div className="account-section">
          <div className="account-section-title">Session</div>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 14 }}>Connecté en tant que <strong style={{ color: 'var(--text)' }}>{profile?.pseudo || user.email}</strong></p>
          <button className="btn btn-danger" onClick={onLogout}>Se déconnecter</button>
        </div>
        <div className="account-section">
          <div className="account-section-title">Logo de l'application</div>
          <p style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 14, lineHeight: 1.7 }}>
            Pour personnaliser le logo, ouvrez le fichier <strong style={{ color: 'var(--text)' }}>src/App.jsx</strong> et modifiez la valeur de <strong style={{ color: 'var(--red2)' }}>CUSTOM_LOGO_URL</strong> en haut du fichier.
            <br />Exemple&nbsp;: <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 5, fontSize: '.72rem' }}>const CUSTOM_LOGO_URL = '/mon-logo.png';</code>
            <br />Placez votre fichier dans le dossier <strong style={{ color: 'var(--text)' }}>public/</strong> du projet.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <LogoImg size={40} />
            <div>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)' }}>Aperçu du logo actuel</div>
              <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 2 }}>{CUSTOM_LOGO_URL ? CUSTOM_LOGO_URL : 'Placeholder — aucun logo configuré'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function AppShell({ user, profile, onProfileUpdate, onLogout, showToast }) {
  const [page, setPage] = useState('collection');
  const [collections, setCollections] = useState([]);
  const [activeColId, setActiveColId] = useState(null);
  const [mobOpen, setMob] = useState(false);
  const [newColModal, setNewColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [renameModal, setRenameModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const saveTimers = useRef({});
  const [dirtyIds, setDirtyIds] = useState(new Set()); // collections with unsaved changes
  const [savingIds, setSavingIds] = useState(new Set()); // collections being saved now

  useEffect(() => {
    supabase.from('collections').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { showToast('Erreur chargement: ' + error.message, '#c82828'); return; }
        if (data?.length) { setCollections(data); setActiveColId(data[0].id); }
      });
  }, [user.id]);

  // Save a specific collection to Supabase immediately
  const saveCollection = useCallback(async (col) => {
    setSavingIds(prev => new Set([...prev, col.id]));
    const { error } = await supabase.from('collections')
      .update({ cards: col.cards, updated_at: new Date().toISOString() })
      .eq('id', col.id);
    setSavingIds(prev => { const s = new Set(prev); s.delete(col.id); return s; });
    if (error) { showToast('Erreur sauvegarde: ' + error.message, '#c82828'); return false; }
    setDirtyIds(prev => { const s = new Set(prev); s.delete(col.id); return s; });
    return true;
  }, []);

  // Mark a collection as dirty and schedule an auto-save after 5s of inactivity
  const markDirty = useCallback((col) => {
    setDirtyIds(prev => new Set([...prev, col.id]));
    clearTimeout(saveTimers.current[col.id]);
    saveTimers.current[col.id] = setTimeout(() => saveCollection(col), 5000);
  }, [saveCollection]);

  const updateCollection = useCallback((updated) => {
    setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
    markDirty(updated);
  }, [markDirty]);

  const addToCollection = useCallback((colId, newCards) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== colId) return c;
      const updated = { ...c, cards: [...c.cards, ...newCards] };
      markDirty(updated); return updated;
    }));
  }, [markDirty]);

  const createCollection = async () => {
    const name = newColName.trim() || 'Nouvelle collection';
    const { data, error } = await supabase.from('collections')
      .insert({ user_id: user.id, name, cards: [] })
      .select().single();
    if (error) {
      showToast('Erreur création: ' + error.message, '#c82828');
      setNewColModal(false); setNewColName(''); return;
    }
    if (data) { setCollections(prev => [...prev, data]); setActiveColId(data.id); setPage('collection'); }
    setNewColModal(false); setNewColName('');
  };

  const renameCollection = async () => {
    if (!renameModal?.name?.trim()) return;
    const { error } = await supabase.from('collections').update({ name: renameModal.name }).eq('id', renameModal.id);
    if (error) { showToast('Erreur renommage: ' + error.message, '#c82828'); return; }
    setCollections(prev => prev.map(c => c.id === renameModal.id ? { ...c, name: renameModal.name } : c));
    setRenameModal(null); showToast('Collection renommée ✦');
  };

  const deleteCollection = (colId) => {
    const col = collections.find(c => c.id === colId);
    setConfirmModal({
      title: '🗑 Supprimer la collection',
      message: `Supprimer "${col?.name}" et toutes ses cartes ? Cette action est irréversible.`,
      onConfirm: async () => {
        const { error } = await supabase.from('collections').delete().eq('id', colId);
        if (error) { showToast('Erreur suppression: ' + error.message, '#c82828'); return; }
        const next = collections.filter(c => c.id !== colId);
        setCollections(next);
        if (activeColId === colId) setActiveColId(next[0]?.id || null);
        showToast('Collection supprimée', '#c82828');
      },
    });
  };

  const activeCollection = collections.find(c => c.id === activeColId) || null;

  const sidebar = (
    <div className="sidebar">
      <div className="sb-top">
        <div className="logo"><LogoImg size={28} />Cartodex</div>
      </div>
      <nav className="sb-nav">
        <div className="sb-section-label">Mes collections</div>
        {collections.map(col => (
          <button key={col.id}
            className={`sb-link${page === 'collection' && activeColId === col.id ? ' active' : ''}`}
            onClick={() => { setActiveColId(col.id); setPage('collection'); setMob(false); }}>
            <span className="icon">📋</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{col.name}</span>
            <div style={{ display: 'flex', gap: 2, flexShrink: 0, marginLeft: 4 }}>
              <span className="btn btn-xs btn-ghost" style={{ padding: '2px 5px' }}
                onClick={e => { e.stopPropagation(); setRenameModal({ id: col.id, name: col.name }); }}>✏️</span>
              {collections.length > 1 &&
                <span className="btn btn-xs btn-danger" style={{ padding: '2px 5px' }}
                  onClick={e => { e.stopPropagation(); deleteCollection(col.id); }}>✕</span>
              }
            </div>
          </button>
        ))}
        <div className="sb-col-actions">
          <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setNewColModal(true)}>＋ Nouvelle collection</button>
        </div>
        <div className="sb-section-label" style={{ marginTop: 8 }}>Navigation</div>
        {[{ id: 'browse', icon: '🔍', label: 'Parcourir' }, { id: 'account', icon: '⚙️', label: 'Mon Compte' }].map(n => (
          <button key={n.id} className={`sb-link${page === n.id ? ' active' : ''}`}
            onClick={() => { setPage(n.id); setMob(false); }}>
            <span className="icon">{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div className="sb-bottom">
        <div className="sb-pseudo">{profile?.pseudo || '—'}</div>
        <div className="sb-email">{user.email}</div>
        <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 2 }} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {sidebar}
      <div className="mob-header">
        <button className="mob-menu-btn" onClick={() => setMob(true)}>☰</button>
        <div className="logo" style={{ fontSize: '1rem', letterSpacing: '2px' }}><LogoImg size={24} />Cartodex</div>
        <div style={{ width: 32 }} />
      </div>
      {mobOpen && <div className="mob-drawer open"><div className="mob-overlay" onClick={() => setMob(false)} />{sidebar}</div>}

      <main className="main">
        {page === 'collection' && <CollectionPage collection={activeCollection} allCollections={collections} onUpdate={updateCollection} onAddToCollection={addToCollection} showToast={showToast} isDirty={activeCollection ? dirtyIds.has(activeCollection.id) : false} isSaving={activeCollection ? savingIds.has(activeCollection.id) : false} onSave={() => { const col = collections.find(c => c.id === activeColId); if (col) saveCollection(col).then(ok => ok && showToast('Collection sauvegardée ✦')); }} />}
        {page === 'browse' && <BrowsePage allCollections={collections} onAddToCollection={addToCollection} showToast={showToast} />}
        {page === 'account' && <AccountPage user={user} profile={profile} onProfileUpdate={onProfileUpdate} showToast={showToast} onLogout={onLogout} />}
      </main>

      {/* New collection modal */}
      <div className={`overlay${newColModal ? ' open' : ''}`}
        onClick={e => e.target.classList.contains('overlay') && setNewColModal(false)}>
        <div className="modal">
          <div className="modal-title">＋ Nouvelle collection</div>
          <div className="field"><label>Nom de la collection</label>
            <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
              placeholder="Ex : Espèces Delta — EX Bloc"
              onKeyDown={e => e.key === 'Enter' && createCollection()} />
          </div>
          <div className="modal-acts">
            <button className="btn btn-ghost" onClick={() => { setNewColModal(false); setNewColName(''); }}>Annuler</button>
            <button className="btn btn-red" onClick={createCollection}>Créer</button>
          </div>
        </div>
      </div>

      {/* Rename modal */}
      <div className={`overlay${renameModal ? ' open' : ''}`}
        onClick={e => e.target.classList.contains('overlay') && setRenameModal(null)}>
        {renameModal && <div className="modal">
          <div className="modal-title">✏️ Renommer la collection</div>
          <div className="field"><label>Nouveau nom</label>
            <input autoFocus value={renameModal.name}
              onChange={e => setRenameModal(m => ({ ...m, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && renameCollection()} />
          </div>
          <div className="modal-acts">
            <button className="btn btn-ghost" onClick={() => setRenameModal(null)}>Annuler</button>
            <button className="btn btn-red" onClick={renameCollection}>Renommer</button>
          </div>
        </div>}
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.onConfirm || (() => { })}
        onClose={() => setConfirmModal(null)}
      />
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null); const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); const [isReset, setIsReset] = useState(false);
  const [toast, setToast] = useState({ msg: '', color: '#3ab870', show: false });
  const timer = useRef(null);

  const showToast = useCallback((msg, color = '#3ab870') => {
    clearTimeout(timer.current);
    setToast({ msg, color, show: true });
    timer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2800);
  }, []);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('reset'))
      setIsReset(true);
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const u = data.session.user; setUser(u);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        setProfile(p);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(p); setIsReset(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (event === 'SIGNED_OUT') { setUser(null); setProfile(null); }
      if (event === 'PASSWORD_RECOVERY') setIsReset(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); };

  return (
    <>
      <style>{CSS}</style>
      {loading
        ? <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--bg)' }}>
          <div className="logo"><LogoImg size={32} />Cartodex</div>
          <div className="spinner" />
        </div>
        : isReset ? <ResetPasswordPage onDone={() => setIsReset(false)} />
        : !user ? <AuthPage onLogin={async u => {
          setUser(u);
          const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
          setProfile(p);
        }} />
        : <AppShell user={user} profile={profile} onProfileUpdate={setProfile} onLogout={logout} showToast={showToast} />
      }
      <div className={`toast${toast.show ? ' show' : ''}`} style={{ borderColor: toast.color, color: toast.color }}>
        {toast.msg}
      </div>
    </>
  );
}
