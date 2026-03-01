import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";

const TCGDEX = "https://api.tcgdex.net/v2/fr";

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
  background:radial-gradient(ellipse 60% 40% at 0% 0%,rgba(200,40,40,.06) 0%,transparent 55%),
  radial-gradient(ellipse 50% 35% at 100% 100%,rgba(200,96,48,.05) 0%,transparent 55%),
  radial-gradient(ellipse 30% 25% at 50% 50%,rgba(200,164,72,.025) 0%,transparent 60%)}
#root{background:var(--bg)}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}

/* LOGO */
.logo{font-family:'Fredoka',sans-serif;font-weight:700;font-size:1.55rem;letter-spacing:3px;text-transform:uppercase;
  color:#f5ece0;-webkit-text-stroke:1.5px var(--red);text-shadow:0 0 24px rgba(200,40,40,.4),2px 2px 0 rgba(60,5,5,.9);
  display:flex;align-items:center;gap:10px;white-space:nowrap}
.logo-icon{width:30px;height:30px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--red),var(--orange));
  display:flex;align-items:center;justify-content:center;font-size:.85rem;color:#fff;-webkit-text-stroke:0;text-shadow:none;
  box-shadow:0 0 14px rgba(200,40,40,.55),inset 0 1px 0 rgba(255,255,255,.15)}

/* SHELL */
.app-shell{display:flex;width:100vw;min-height:100vh;background:var(--bg)}
.sidebar{width:var(--sb-w);flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);
  display:flex;flex-direction:column;position:sticky;top:0;height:100vh;padding:20px 0;overflow-y:auto;z-index:50}
.sb-top{padding:0 16px 18px;border-bottom:1px solid var(--border);margin-bottom:14px}
.sb-nav{flex:1;padding:0 10px;display:flex;flex-direction:column;gap:3px}
.sb-section-label{font-size:.58rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:10px 12px 4px;margin-top:4px}
.sb-link{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;font-size:.82rem;font-weight:600;
  color:var(--text2);cursor:pointer;transition:all .14s;border:1px solid transparent;background:transparent;
  font-family:'Outfit',sans-serif;text-align:left;width:100%}
.sb-link:hover{background:var(--surface);color:var(--text)}
.sb-link.active{background:rgba(200,40,40,.14);color:var(--red2);border-color:rgba(200,40,40,.25)}
.sb-link .icon{font-size:.95rem;width:20px;text-align:center;flex-shrink:0}
.sb-col-actions{padding:6px 10px}
.sb-bottom{padding:12px 14px 0;border-top:1px solid var(--border);margin-top:auto}
.sb-pseudo{font-size:.8rem;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-email{font-size:.68rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:10px}
.main{flex:1;min-width:0;display:flex;flex-direction:column;width:0;background:var(--bg)}
.mob-header{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:52px;
  background:rgba(14,12,16,.95);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);flex-shrink:0}
.mob-menu-btn{background:none;border:none;color:var(--text);font-size:1.3rem;cursor:pointer}
.mob-drawer{display:none;position:fixed;inset:0;z-index:200}
.mob-drawer.open{display:block}
.mob-overlay{position:absolute;inset:0;background:rgba(0,0,0,.65)}
.mob-drawer .sidebar{position:relative;z-index:1}
@media(max-width:768px){.sidebar{display:none}.mob-header{display:flex}}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:999px;
  border:1px solid var(--border2);background:var(--surface2);color:var(--text);
  font-family:'Outfit',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0}
.btn:hover{background:var(--border2);border-color:var(--muted);transform:translateY(-1px)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.btn-red{background:linear-gradient(135deg,var(--red),var(--orange));border-color:var(--red);color:#fff;box-shadow:0 2px 12px rgba(200,40,40,.3)}
.btn-red:hover{box-shadow:0 4px 20px rgba(200,40,40,.45);transform:translateY(-1px)}
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

/* FORMS */
.field{margin-bottom:15px}
.field label{display:block;font-size:.67rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.field input,.field select{width:100%;padding:10px 13px;background:var(--surface);border:1px solid var(--border2);
  border-radius:10px;color:var(--text);font-family:'Outfit',sans-serif;font-size:.88rem;outline:none;transition:border-color .15s}
.field input:focus,.field select:focus{border-color:var(--red2)}
.field input::placeholder{color:var(--muted)}
.field-err{font-size:.72rem;color:var(--red2);margin-top:4px}
.field select option{background:var(--bg2)}

/* AUTH */
.auth-page{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg)}
.auth-box{width:min(480px,100%);background:var(--surface);border:1px solid var(--border2);border-radius:22px;
  padding:clamp(24px,5vw,44px);box-shadow:0 24px 80px rgba(0,0,0,.7);animation:fadeUp .25s ease}
.auth-logo{display:flex;justify-content:center;margin-bottom:28px}
.auth-logo .logo{font-size:clamp(1.3rem,4vw,1.8rem)}
.auth-title{font-family:'Fredoka',sans-serif;font-size:.9rem;letter-spacing:2px;text-transform:uppercase;color:var(--text2);margin-bottom:22px;text-align:center}
.auth-error{background:rgba(200,40,40,.12);border:1px solid rgba(200,40,40,.3);border-radius:9px;padding:10px 14px;font-size:.78rem;color:var(--red2);margin-bottom:14px}
.auth-success{background:rgba(58,184,112,.12);border:1px solid rgba(58,184,112,.3);border-radius:9px;padding:10px 14px;font-size:.78rem;color:var(--green);margin-bottom:14px}
.auth-switch{text-align:center;margin-top:18px;font-size:.78rem;color:var(--muted)}
.auth-switch button{background:none;border:none;color:var(--red2);cursor:pointer;font-weight:700;font-size:.78rem;font-family:'Outfit',sans-serif}

/* PAGE */
.page-wrap{display:flex;flex-direction:column;flex:1;min-width:0;width:100%;background:var(--bg)}
.page-hdr{display:flex;align-items:center;justify-content:space-between;padding:20px 28px 12px;flex-wrap:wrap;gap:10px;flex-shrink:0}
.page-title{font-family:'Fredoka',sans-serif;font-size:clamp(1.1rem,2.5vw,1.45rem);letter-spacing:2px;text-transform:uppercase;
  color:var(--text);text-shadow:0 0 20px rgba(200,40,40,.2)}
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

/* UPLOAD */
.upsec{padding:14px 28px;flex-shrink:0}
.upzone{display:block;width:100%;border:2px dashed var(--border2);border-radius:var(--radius);padding:22px 20px;cursor:pointer;transition:all .2s;background:var(--surface)}
.upzone:hover,.upzone.drag{border-color:var(--red);background:rgba(200,40,40,.04)}
.upzone input{display:none}
.up-inner{display:flex;align-items:center;gap:16px;justify-content:center}
.up-orb{width:42px;height:42px;border-radius:50%;background:var(--surface2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
.up-t1{font-weight:700;font-size:.88rem}
.up-t2{font-size:.7rem;color:var(--muted);margin-top:2px}
.up-t2 span{color:var(--red2);font-weight:600}

/* IMPORT */
.imp-panel{margin:0 28px 14px;flex-shrink:0;background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);overflow:hidden}
.imp-head{display:flex;align-items:center;gap:10px;padding:12px 18px;cursor:pointer;font-weight:700;font-size:.82rem;background:var(--surface2);transition:background .15s;border-bottom:1px solid transparent;user-select:none}
.imp-head:hover{background:var(--border)}
.imp-head.open{border-bottom-color:var(--border2)}
.imp-arrow{margin-left:auto;color:var(--muted);font-size:.7rem;transition:transform .2s}
.imp-head.open .imp-arrow{transform:rotate(180deg)}
.imp-body{padding:16px 18px}
.imp-select{width:100%;padding:9px 13px;background:var(--bg);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-family:'Outfit',sans-serif;font-size:.82rem;outline:none;margin-bottom:12px;cursor:pointer}
.imp-select:focus{border-color:var(--red2)}
.imp-select option{background:var(--bg)}
.imp-info{font-size:.72rem;color:var(--muted);margin-bottom:12px;line-height:1.6}
.imp-info strong{color:var(--text2)}
.imp-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:6px;margin-bottom:14px;max-height:240px;overflow-y:auto}
.imp-thumb{border-radius:6px;overflow:hidden;border:1px solid var(--border);aspect-ratio:2.5/3.5;background:var(--surface2);position:relative;cursor:pointer}
.imp-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.imp-thumb.sel{border-color:var(--red2);box-shadow:0 0 0 2px var(--red2)}
.imp-thumb.sel::after{content:'✓';position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:var(--red2);color:#fff;font-size:.55rem;font-weight:900;display:flex;align-items:center;justify-content:center}
.spinner-wrap{display:flex;align-items:center;gap:10px;padding:20px;color:var(--muted);font-size:.8rem;justify-content:center}
.spinner{width:18px;height:18px;border:2px solid var(--border2);border-top-color:var(--red);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}

/* COLLECTION GRID */
.col-wrap{padding:14px 28px 80px;flex:1;min-width:0;background:var(--bg)}
.sec-title{display:flex;align-items:center;gap:10px;margin-bottom:14px;font-size:.6rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted)}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}
.grid{display:grid;gap:12px;width:100%}
.g6{grid-template-columns:repeat(6,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g2{grid-template-columns:repeat(2,1fr)}
.glist{grid-template-columns:1fr;gap:8px}
@media(max-width:1100px){.g6{grid-template-columns:repeat(5,1fr)}}
@media(max-width:900px){.g6{grid-template-columns:repeat(4,1fr)}.g4{grid-template-columns:repeat(3,1fr)}}
@media(max-width:700px){.g6,.g4{grid-template-columns:repeat(3,1fr)}.g3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:500px){.g6,.g4,.g3{grid-template-columns:repeat(2,1fr)}}

/* CARD */
.card-wrap{position:relative;cursor:pointer}
.card-wrap.dragging{opacity:.35;transform:scale(.97)}
.card-wrap.drag-over .card{border-color:var(--red2)!important;box-shadow:0 0 0 2px var(--red2)!important}
.card{width:100%;border-radius:11px;overflow:hidden;background:var(--surface);border:1px solid var(--border2);
  position:relative;transform-style:preserve-3d;
  transition:border-color .3s,box-shadow .3s,transform .5s cubic-bezier(.23,1,.32,1);
  animation:fadeUp .28s ease both;will-change:transform}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.card:hover{border-color:var(--red2);box-shadow:0 20px 60px rgba(200,40,40,.35),0 0 0 1px rgba(200,40,40,.2)}
.card.got{border-color:rgba(58,184,112,.3)}
.card.got:hover{border-color:var(--green);box-shadow:0 20px 60px rgba(58,184,112,.2)}
.card-img-box{width:100%;aspect-ratio:2.5/3.5;overflow:hidden;position:relative}
.card-img{width:100%;height:100%;object-fit:cover;display:block;transition:filter .4s}
.card:not(.got) .card-img{filter:grayscale(72%) brightness(.62) sepia(.05)}

/* HOLO EFFECT — more dramatic */
.card-holo{position:absolute;inset:0;border-radius:11px 11px 0 0;pointer-events:none;z-index:3;overflow:hidden;opacity:0;transition:opacity .25s}
.card:hover .card-holo{opacity:1}
.card-holo::after{content:'';position:absolute;inset:-100%;
  background:conic-gradient(from var(--ha,0deg) at var(--mx,50%) var(--my,50%),
    rgba(255,80,60,.12) 0deg,rgba(255,180,60,.18) 60deg,rgba(60,180,255,.12) 120deg,
    rgba(180,60,255,.1) 180deg,rgba(80,255,160,.1) 240deg,rgba(255,80,60,.12) 360deg);
  mix-blend-mode:screen;transition:background .08s}
.card-holo::before{content:'';position:absolute;inset:0;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.18) 0%,rgba(255,255,255,.04) 40%,transparent 70%);
  mix-blend-mode:screen}

.card-badge{position:absolute;top:6px;right:6px;z-index:4;width:20px;height:20px;border-radius:50%;
  background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;
  font-size:.6rem;font-weight:900;box-shadow:0 2px 7px rgba(0,0,0,.5)}

/* CHECKBOX on card */
.card-checkbox{position:absolute;top:6px;left:6px;z-index:5;width:20px;height:20px;border-radius:5px;
  border:2px solid rgba(255,255,255,.4);background:rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;opacity:0}
.card-wrap:hover .card-checkbox,.card-checkbox.checked,.sel-mode .card-checkbox{opacity:1}
.card-checkbox.checked{background:var(--red2);border-color:var(--red2)}
.card-checkbox.checked::after{content:'✓';color:#fff;font-size:.6rem;font-weight:900}

.card-foot{padding:7px 8px 8px;border-top:1px solid var(--border)}
.card-name{font-size:.74rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-meta{font-size:.61rem;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-acts{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}

/* LIST MODE */
.glist .card-wrap{width:100%}
.glist .card{display:flex;align-items:center;gap:10px;padding-right:10px;overflow:hidden;border-radius:11px}
.glist .card-img-box{width:60px;min-width:60px;aspect-ratio:2.5/3.5;flex-shrink:0}
.glist .card-foot{flex:1;border-top:none;padding:8px 0}
.glist .card-holo{display:none}
.glist .card-name{font-size:.84rem}
.glist .card-checkbox{top:50%;transform:translateY(-50%)}

/* BULK ACTION BAR */
.bulk-bar{
  position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);
  z-index:400;display:flex;align-items:center;gap:10px;
  background:var(--bg2);border:1px solid var(--border2);border-radius:999px;
  padding:10px 16px;box-shadow:0 8px 40px rgba(0,0,0,.6);
  transition:transform .28s cubic-bezier(.23,1,.32,1),opacity .28s;opacity:0;pointer-events:none;
  white-space:nowrap;flex-wrap:wrap;justify-content:center;
}
.bulk-bar.show{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:all}
.bulk-count{font-size:.8rem;font-weight:700;color:var(--text2);padding-right:8px;border-right:1px solid var(--border2)}

/* BROWSE */
.browse-sets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:0 28px 20px}
.set-card{background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;gap:8px}
.set-card:hover{border-color:var(--red2);transform:translateY(-2px);box-shadow:0 6px 20px rgba(200,40,40,.12)}
.set-card-logo{height:40px;display:flex;align-items:center}
.set-card-logo img{max-height:100%;max-width:100%;object-fit:contain;filter:drop-shadow(0 1px 4px rgba(0,0,0,.5))}
.set-card-name{font-weight:700;font-size:.86rem;line-height:1.3}
.set-card-meta{font-size:.7rem;color:var(--muted)}
.set-card-badge{display:inline-block;font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(200,40,40,.12);color:var(--red2);border:1px solid rgba(200,40,40,.22);align-self:flex-start}

.browse-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;padding:0 28px 80px}
@media(max-width:1100px){.browse-grid{grid-template-columns:repeat(5,1fr)}}
@media(max-width:900px){.browse-grid{grid-template-columns:repeat(4,1fr)}}
@media(max-width:700px){.browse-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:480px){.browse-grid{grid-template-columns:repeat(2,1fr)}}
.browse-card{width:100%;border-radius:11px;overflow:hidden;background:var(--surface);border:1px solid var(--border2);
  position:relative;transition:all .18s;animation:fadeUp .2s ease both;cursor:pointer}
.browse-card:hover{border-color:var(--red2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(200,40,40,.14)}
.browse-card.sel{border-color:var(--red2);box-shadow:0 0 0 2px var(--red2)}
.browse-card .card-img-box{aspect-ratio:2.5/3.5}
.browse-card .card-img{filter:none}
.browse-in-col{position:absolute;top:6px;right:6px;z-index:4;width:20px;height:20px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:900;box-shadow:0 2px 7px rgba(0,0,0,.5)}
.browse-chk{position:absolute;top:6px;left:6px;z-index:4;width:20px;height:20px;border-radius:5px;
  border:2px solid rgba(255,255,255,.5);background:rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;transition:all .15s;opacity:0}
.browse-card:hover .browse-chk,.browse-card.sel .browse-chk{opacity:1}
.browse-card.sel .browse-chk{background:var(--red2);border-color:var(--red2)}
.browse-card.sel .browse-chk::after{content:'✓';color:#fff;font-size:.6rem;font-weight:900}
.browse-add-hover{position:absolute;inset:0;z-index:3;display:flex;align-items:flex-end;justify-content:center;
  padding-bottom:10px;background:linear-gradient(to top,rgba(14,12,16,.88) 0%,transparent 55%);
  opacity:0;transition:opacity .2s;border:none;cursor:pointer}
.browse-card:hover .browse-add-hover:not(.hidden){opacity:1}
.browse-add-inner{display:flex;gap:5px;align-items:center;background:linear-gradient(135deg,var(--red),var(--orange));color:#fff;font-family:'Outfit',sans-serif;font-size:.7rem;font-weight:700;padding:5px 12px;border-radius:99px;box-shadow:0 2px 10px rgba(0,0,0,.5)}

/* CARD ZOOM OVERLAY */
.zoom-overlay{display:none;position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
.zoom-overlay.open{display:flex}
.zoom-img-wrap{position:relative;max-height:90vh;max-width:min(420px,90vw)}
.zoom-img{width:100%;height:100%;object-fit:contain;border-radius:14px;box-shadow:0 30px 100px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.05)}
.zoom-close{position:absolute;top:-14px;right:-14px;width:32px;height:32px;border-radius:50%;background:var(--surface2);border:1px solid var(--border2);color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.9rem;transition:all .15s;z-index:1}
.zoom-close:hover{background:var(--red);border-color:var(--red)}

/* ACCOUNT */
.account-wrap{padding:0 28px 60px;max-width:540px;width:100%}
.account-section{background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);padding:22px;margin-bottom:14px}
.account-section-title{font-family:'Fredoka',sans-serif;font-size:.82rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--text2);margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border)}

/* MODAL */
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);z-index:500;align-items:center;justify-content:center;padding:20px}
.overlay.open{display:flex}
.modal{background:var(--bg2);border:1px solid var(--border2);border-radius:20px;padding:26px 28px;width:min(380px,100%);box-shadow:0 24px 72px rgba(0,0,0,.75);animation:fadeUp .2s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.modal-title{font-family:'Fredoka',sans-serif;font-size:.82rem;letter-spacing:2px;text-transform:uppercase;color:var(--red2);margin-bottom:20px}
.modal-acts{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}

/* TOAST */
.toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 20px;border-radius:999px;
  background:var(--surface);border:1px solid;font-size:.8rem;font-weight:600;
  transform:translateY(50px);opacity:0;transition:all .25s cubic-bezier(.4,0,.2,1);pointer-events:none}
.toast.show{transform:translateY(0);opacity:1}

/* EMPTY */
.empty{text-align:center;padding:56px 20px;color:var(--muted)}
.empty-icon{font-size:2.8rem;display:block;margin-bottom:12px;opacity:.3}
.empty h3{font-family:'Fredoka',sans-serif;font-size:.95rem;color:var(--text);margin-bottom:6px;letter-spacing:1px}
.empty p{font-size:.78rem}

@media(max-width:768px){
  .page-hdr,.tbar,.upsec,.col-wrap,.prog,.browse-sets-grid,.browse-grid,.account-wrap{padding-left:14px;padding-right:14px}
  .imp-panel{margin-left:14px;margin-right:14px}
  .bulk-bar{width:90%;border-radius:16px;bottom:16px}
}
`;

// ─── TILT CARD ────────────────────────────────────────────────────────────────
function TiltCard({ card, onToggle, onEdit, onDelete, onZoom, listMode, selMode, selected, onSelect,
                    draggable: isDraggable, onDragStart, onDragOver, onDragEnd, onDrop, dragOver }) {
  const ref = useRef(null);
  const holoRef = useRef(null);
  const haRef = useRef(0);
  const raf = useRef(null);

  const onMove = useCallback((e) => {
    if (listMode) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    // More dramatic tilt — 24 degrees
    const rx = (y - .5) * -24;
    const ry = (x - .5) * 24;
    el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.06,1.06,1.06)`;
    el.style.transition = 'border-color .3s,box-shadow .3s,transform .05s';
    if (holoRef.current) {
      holoRef.current.style.setProperty('--mx', `${x * 100}%`);
      holoRef.current.style.setProperty('--my', `${y * 100}%`);
    }
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      haRef.current = (haRef.current + 2) % 360;
      if (holoRef.current) holoRef.current.style.setProperty('--ha', `${haRef.current}deg`);
    });
  }, [listMode]);

  const onLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = '';
    ref.current.style.transition = 'border-color .3s,box-shadow .3s,transform .6s cubic-bezier(.23,1,.32,1)';
  }, []);

  const handleClick = (e) => {
    if (e.target.closest('.card-acts') || e.target.closest('.card-checkbox')) return;
    if (selMode) { onSelect(card.id); return; }
    onZoom(card);
  };

  return (
    <div
      className={`card-wrap${selMode ? ' sel-mode' : ''}${isDraggable ? ' draggable-wrap' : ''}${dragOver ? ' drag-over' : ''}`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      style={isDraggable ? { cursor: 'grab' } : {}}
    >
      {/* Checkbox */}
      <div
        className={`card-checkbox${selected ? ' checked' : ''}`}
        onClick={e => { e.stopPropagation(); onSelect(card.id); }}
      />
      <div
        ref={ref}
        className={`card${card.obtained ? ' got' : ''}`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={handleClick}
      >
        <div className="card-img-box">
          {card.src
            ? <img className="card-img" src={card.src} alt={card.name} loading="lazy" />
            : <div style={{ width: '100%', height: '100%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: .15, fontSize: '2rem' }}>🃏</div>
          }
          {card.obtained && <div className="card-badge">✓</div>}
        </div>
        {!listMode && <div className="card-holo" ref={holoRef} />}
        <div className="card-foot">
          <div className="card-name">{card.name || 'Sans nom'}</div>
          {(card.series || card.number) && <div className="card-meta">{[card.series?.replace(/^EX /i, ''), card.number].filter(Boolean).join(' · ')}</div>}
          <div className="card-acts">
            <button className={`btn btn-sm${card.obtained ? ' btn-ok' : ''}`} onClick={e => { e.stopPropagation(); onToggle(card.id); }}>
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
    const h = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  if (!card) return null;
  return (
    <div className={`zoom-overlay${card ? ' open' : ''}`} onClick={onClose}>
      <div className="zoom-img-wrap" onClick={e => e.stopPropagation()}>
        <div className="zoom-close" onClick={onClose}>✕</div>
        {card.src
          ? <img className="zoom-img" src={card.src} alt={card.name} />
          : <div style={{ width: 300, height: 420, background: 'var(--surface)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', opacity: .3 }}>🃏</div>
        }
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
          <select value={sel} onChange={e => setSel(e.target.value)}>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="modal-acts">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-red" onClick={() => onConfirm(sel)}>Confirmer</button>
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
    setL(false); if (error) return setErr(error.message); setOk('Email de réinitialisation envoyé !');
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo"><div className="logo"><div className="logo-icon">◆</div>Cartodex</div></div>
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
    setL(false); if (error) return setErr(error.message); setOk('Mot de passe mis à jour !'); setTimeout(onDone, 2000);
  };
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo"><div className="logo"><div className="logo-icon">◆</div>Cartodex</div></div>
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
function CollectionPage({ collection, allCollections, onUpdate, onAddToCollection, showToast }) {
  const cards = collection?.cards || [];
  const [layout, setLayout] = useState('g6');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [zoomCard, setZoomCard] = useState(null);
  const [impOpen, setImpOpen] = useState(false);
  const [impSets, setImpSets] = useState([]); const [impSetId, setImpSetId] = useState('');
  const [impState, setImpState] = useState('idle'); const [impCards, setImpCards] = useState([]); const [impErr, setImpErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [pickModal, setPickModal] = useState(null);
  // Multi-select
  const [selMode, setSelMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  // Drag-to-reorder
  const dragIdx = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const fileRef = useRef(null);

  // Reset selection when leaving sel mode
  useEffect(() => { if (!selMode) setSelected(new Set()); }, [selMode]);

  useEffect(() => {
    if (!impOpen || impSets.length) return;
    fetch(`${TCGDEX}/sets`).then(r => r.json()).then(data => {
      const ex = data.filter(s => s.serie?.id === 'ex' || s.id?.startsWith('ex'));
      const list = ex.length > 0 ? ex : data; setImpSets(list); if (list.length) setImpSetId(list[0].id);
    }).catch(() => {
      const fb = [{ id: 'ex11', name: 'EX Espèces Delta' }, { id: 'ex13', name: 'EX Fantômes Holon' }, { id: 'ex15', name: "EX Île des Dragons" }, { id: 'ex14', name: 'EX Gardiens de Cristal' }, { id: 'ex12', name: 'EX Legend Maker' }, { id: 'ex10', name: 'EX Forces Invisibles' }, { id: 'ex8', name: 'EX Deoxys' }, { id: 'ex16', name: 'EX Power Keepers' }];
      setImpSets(fb); setImpSetId('ex11');
    });
  }, [impOpen]);

  const fetchPreview = async () => {
    if (!impSetId) return; setImpState('loading'); setImpErr('');
    try {
      const res = await fetch(`${TCGDEX}/sets/${impSetId}`); if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json(); if (!data.cards?.length) throw new Error('Aucune carte trouvée.');
      setImpCards(data.cards); setImpState('preview');
    } catch (e) { setImpErr(e.message); setImpState('error'); }
  };

  const doImport = (targetColId) => {
    const targetCol = allCollections.find(c => c.id === targetColId); if (!targetCol) return;
    const existing = new Set(targetCol.cards.map(c => c.tcgId).filter(Boolean));
    const toAdd = impCards.filter(c => !existing.has(c.id)).map(c => ({ id: `tcg-${c.id}-${Math.random()}`, tcgId: c.id, src: c.image ? `${c.image}/high.webp` : '', name: c.name || c.id, series: impSets.find(s => s.id === impSetId)?.name || impSetId, number: c.localId || '', obtained: false }));
    if (!toAdd.length) { showToast('Toutes ces cartes sont déjà dans cette collection', '#c8a448'); return; }
    onAddToCollection(targetColId, toAdd); showToast(`${toAdd.length} cartes importées ✦`);
    setImpState('idle'); setImpCards([]); setPickModal(null);
  };

  const doUpload = (targetColId, newCards) => { onAddToCollection(targetColId, newCards); showToast(`${newCards.length} carte${newCards.length > 1 ? 's' : ''} ajoutée${newCards.length > 1 ? 's' : ''} ✦`); setPickModal(null); };

  const handleFiles = (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/')); if (!imgs.length) return;
    let done = 0; const news = [];
    imgs.forEach(file => { const r = new FileReader(); r.onload = ev => { news.push({ id: `local-${Date.now()}-${Math.random()}`, src: ev.target.result, name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), series: '', number: '', obtained: false }); if (++done === imgs.length) { if (allCollections.length > 1) setPickModal({ type: 'upload', data: news }); else doUpload(collection.id, news); } }; r.readAsDataURL(file); });
  };

  // Card actions
  const toggleObtained = id => { const next = cards.map(c => c.id === id ? { ...c, obtained: !c.obtained } : c); onUpdate({ ...collection, cards: next }); const c = next.find(x => x.id === id); showToast(c.obtained ? 'Carte obtenue ✦' : 'Marquée manquante'); };
  const deleteCard = id => { onUpdate({ ...collection, cards: cards.filter(c => c.id !== id) }); showToast('Carte supprimée', '#c82828'); };
  const openEdit = card => setModal({ id: card.id, name: card.name, series: card.series, number: card.number });
  const saveEdit = () => { onUpdate({ ...collection, cards: cards.map(c => c.id === modal.id ? { ...c, ...modal } : c) }); setModal(null); showToast('Carte mise à jour ✦'); };

  // Selection
  const toggleSelect = id => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAll = () => setSelected(new Set(visible.map(c => c.id)));
  const clearSel = () => setSelected(new Set());

  // Bulk actions
  const bulkMarkObtained = () => {
    const next = cards.map(c => selected.has(c.id) ? { ...c, obtained: true } : c);
    onUpdate({ ...collection, cards: next }); showToast(`${selected.size} cartes marquées obtenues ✦`); clearSel();
  };
  const bulkMarkMissing = () => {
    const next = cards.map(c => selected.has(c.id) ? { ...c, obtained: false } : c);
    onUpdate({ ...collection, cards: next }); showToast(`${selected.size} cartes marquées manquantes`); clearSel();
  };
  const bulkDelete = () => {
    if (!confirm(`Supprimer ${selected.size} carte${selected.size > 1 ? 's' : ''} ?`)) return;
    onUpdate({ ...collection, cards: cards.filter(c => !selected.has(c.id)) });
    showToast(`${selected.size} cartes supprimées`, '#c82828'); clearSel();
  };

  // Drag reorder
  const handleDragStart = (idx) => { dragIdx.current = idx; };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => { dragIdx.current = null; setDragOverIdx(null); };
  const handleDrop = (idx) => {
    if (dragIdx.current === null || dragIdx.current === idx) { setDragOverIdx(null); return; }
    const allCards = [...cards];
    // Map visible indices back to allCards indices
    const dragged = visible[dragIdx.current];
    const target = visible[idx];
    const fromIdx = allCards.findIndex(c => c.id === dragged.id);
    const toIdx = allCards.findIndex(c => c.id === target.id);
    const newCards = [...allCards];
    newCards.splice(fromIdx, 1);
    newCards.splice(toIdx, 0, dragged);
    onUpdate({ ...collection, cards: newCards });
    dragIdx.current = null; setDragOverIdx(null);
  };

  const total = cards.length, obtained = cards.filter(c => c.obtained).length, pct = total === 0 ? 0 : Math.round((obtained / total) * 100);
  const visible = filter === 'obtained' ? cards.filter(c => c.obtained) : filter === 'missing' ? cards.filter(c => !c.obtained) : cards;
  const layouts = [{ id: 'g6', icon: '⋮⋮⋮' }, { id: 'g4', icon: '⊞' }, { id: 'g3', icon: '▦' }, { id: 'g2', icon: '◫' }, { id: 'glist', icon: '☰' }];
  const filters = [{ id: 'all', label: 'Toutes' }, { id: 'obtained', label: 'Obtenues' }, { id: 'missing', label: 'Manquantes' }];

  if (!collection) return <div className="empty"><span className="empty-icon">📋</span><h3>Aucune collection</h3><p>Créez une collection dans le menu de gauche.</p></div>;

  return (
    <div className="page-wrap">
      <div className="page-hdr">
        <div className="page-title"><span>{collection.name}</span></div>
        <div className="page-hdr-actions">
          <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
          <button className="btn" onClick={() => fileRef.current?.click()}>＋ Ajouter</button>
          <button className={`btn btn-sm${selMode ? ' btn-red' : ''}`} onClick={() => setSelMode(v => !v)}>
            {selMode ? '✕ Quitter sélection' : '☑ Sélectionner'}
          </button>
          {total > 0 && <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Vider cette collection ?')) onUpdate({ ...collection, cards: [] }) }}>Vider</button>}
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
        {!selMode && <><div className="tbar-sep" /><span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>⠿ Glisser-déposer pour réordonner</span></>}
      </div>

      {/* Import TCGdex */}
      <div className="imp-panel">
        <div className={`imp-head${impOpen ? ' open' : ''}`} onClick={() => setImpOpen(v => !v)}>
          <span>🎴</span><span>Importer une extension depuis TCGdex</span><span className="imp-arrow">▼</span>
        </div>
        {impOpen && <div className="imp-body">
          {impSets.length === 0 ? <div className="spinner-wrap"><div className="spinner" />Chargement…</div> : <>
            <select className="imp-select" value={impSetId} onChange={e => { setImpSetId(e.target.value); setImpState('idle'); setImpCards([]); }}>
              {impSets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p className="imp-info">Images via <strong>api.tcgdex.net</strong> — open source, français. Les doublons sont ignorés.</p>
          </>}
          {impState === 'idle' && impSets.length > 0 && <button className="btn btn-red" onClick={fetchPreview}>🔍 Prévisualiser</button>}
          {impState === 'loading' && <div className="spinner-wrap"><div className="spinner" />Chargement…</div>}
          {impState === 'error' && <div><p style={{ color: 'var(--red2)', fontSize: '.78rem', marginBottom: 10 }}>Erreur : {impErr}</p><button className="btn" onClick={() => setImpState('idle')}>Réessayer</button></div>}
          {impState === 'preview' && <div>
            <p className="imp-info"><strong style={{ color: 'var(--red2)' }}>{impCards.length} cartes</strong> trouvées :</p>
            <div className="imp-preview">
              {impCards.map(c => <div key={c.id} className="imp-thumb">{c.image ? <img src={`${c.image}/high.webp`} alt={c.name} loading="lazy" /> : <div style={{ background: 'var(--surface2)', width: '100%', height: '100%' }} />}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-red" onClick={() => allCollections.length > 1 ? setPickModal({ type: 'import' }) : doImport(collection.id)}>⬇ Importer ({impCards.length} cartes)</button>
              <button className="btn btn-ghost" onClick={() => { setImpState('idle'); setImpCards([]); }}>Annuler</button>
            </div>
          </div>}
        </div>}
      </div>

      {/* Upload */}
      <div className="upsec">
        <label className={`upzone${drag ? ' drag' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}>
          <input type="file" multiple accept="image/*" onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
          <div className="up-inner"><div className="up-orb">🃏</div><div><div className="up-t1">Déposer vos photos de cartes ici</div><div className="up-t2"><span>Cliquer pour sélectionner</span> ou glisser-déposer · PNG, JPG, WEBP</div></div></div>
        </label>
      </div>

      {/* Cards */}
      <div className="col-wrap">
        <div className="sec-title">{visible.length} carte{visible.length !== 1 ? 's' : ''}</div>
        {visible.length === 0
          ? <div className="empty"><span className="empty-icon">{filter === 'missing' && total > 0 ? '🏆' : '◈'}</span><h3>{filter === 'missing' && total > 0 ? 'Collection complète !' : 'Aucune carte'}</h3><p>{filter === 'missing' && total > 0 ? 'Toutes vos cartes sont obtenues.' : 'Importez une extension ou ajoutez vos photos.'}</p></div>
          : <div className={`grid ${layout}`}>
            {visible.map((card, i) => (
              <div key={card.id} style={{ animationDelay: `${Math.min(i * .025, .5)}s` }}>
                <TiltCard
                  card={card} onToggle={toggleObtained} onEdit={openEdit} onDelete={deleteCard} onZoom={setZoomCard}
                  listMode={layout === 'glist'} selMode={selMode} selected={selected.has(card.id)} onSelect={toggleSelect}
                  draggable={!selMode && filter === 'all'}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  onDrop={() => handleDrop(i)}
                  dragOver={dragOverIdx === i && dragIdx.current !== null && dragIdx.current !== i}
                />
              </div>
            ))}
          </div>
        }
      </div>

      {/* Bulk action bar */}
      <div className={`bulk-bar${selMode && selected.size > 0 ? ' show' : ''}`}>
        <span className="bulk-count">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
        <button className="btn btn-sm btn-green" onClick={bulkMarkObtained}>✓ Obtenues</button>
        <button className="btn btn-sm" style={{ background: 'transparent', borderColor: 'var(--border2)', color: 'var(--text2)' }} onClick={bulkMarkMissing}>○ Manquantes</button>
        <button className="btn btn-sm btn-danger" onClick={bulkDelete}>✕ Supprimer</button>
        <button className="btn btn-sm btn-ghost" onClick={clearSel}>Annuler</button>
      </div>

      {/* Edit modal */}
      <div className={`overlay${modal ? ' open' : ''}`} onClick={e => e.target.classList.contains('overlay') && setModal(null)}>
        {modal && <div className="modal">
          <div className="modal-title">✦ Modifier la carte</div>
          {[['Nom', 'name', 'Dracaufeu Holo EX'], ['Série', 'series', 'EX Espèces Delta'], ['Numéro', 'number', '16/113']].map(([lbl, k, ph]) => (
            <div key={k} className="field"><label>{lbl}</label><input value={modal[k]} placeholder={ph} autoFocus={k === 'name'} onChange={e => setModal(m => ({ ...m, [k]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && saveEdit()} /></div>
          ))}
          <div className="modal-acts"><button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button><button className="btn btn-red" onClick={saveEdit}>Enregistrer</button></div>
        </div>}
      </div>

      <ZoomModal card={zoomCard} onClose={() => setZoomCard(null)} />
      <PickCollectionModal open={!!pickModal} collections={allCollections} defaultId={collection.id} onClose={() => setPickModal(null)}
        onConfirm={colId => { if (pickModal?.type === 'import') doImport(colId); else if (pickModal?.type === 'upload') doUpload(colId, pickModal.data); }} />
    </div>
  );
}

// ─── BROWSE PAGE ──────────────────────────────────────────────────────────────
function BrowsePage({ allCollections, onAddToCollection, showToast }) {
  const [sets, setSets] = useState([]);
  const [selSet, setSelSet] = useState(null);
  const [setCards, setSetCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingC, setLoadingC] = useState(false);
  const [pickModal, setPickModal] = useState(null);
  // Multi-select
  const [browseSelected, setBrowseSelected] = useState(new Set());

  useEffect(() => {
    fetch(`${TCGDEX}/sets`).then(r => r.json()).then(d => { setSets(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Reset selection on set change
  useEffect(() => { setBrowseSelected(new Set()); }, [selSet]);

  const loadSet = async s => {
    setSelSet(s); setLoadingC(true); setSetCards([]);
    try { const r = await fetch(`${TCGDEX}/sets/${s.id}`); const d = await r.json(); setSetCards(d.cards || []); } catch { }
    setLoadingC(false);
  };

  const inAny = tcgId => allCollections.some(col => col.cards.some(c => c.tcgId === tcgId));
  const toggleBrowseSel = (id) => setBrowseSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleAdd = (cardsToAdd) => {
    if (allCollections.length > 1) setPickModal({ cards: cardsToAdd });
    else if (allCollections.length === 1) doAdd(allCollections[0].id, cardsToAdd);
  };

  const doAdd = (colId, cardsToAdd) => {
    const targetCol = allCollections.find(c => c.id === colId);
    const existing = new Set(targetCol?.cards.map(c => c.tcgId).filter(Boolean));
    const toAdd = cardsToAdd.filter(c => !existing.has(c.id)).map(c => ({
      id: `tcg-${c.id}-${Math.random()}`, tcgId: c.id, src: c.image ? `${c.image}/high.webp` : '',
      name: c.name || c.id, series: selSet?.name || '', number: c.localId || '', obtained: false,
    }));
    if (!toAdd.length) { showToast('Ces cartes sont déjà dans la collection', '#c8a448'); setPickModal(null); return; }
    onAddToCollection(colId, toAdd);
    showToast(`${toAdd.length} carte${toAdd.length > 1 ? 's' : ''} ajoutée${toAdd.length > 1 ? 's' : ''} ✦`);
    setBrowseSelected(new Set()); setPickModal(null);
  };

  const exSets = sets.filter(s => s.serie?.id === 'ex' || s.id?.startsWith('ex'));
  const displaySets = exSets.length > 0 ? exSets : sets;
  const selectedCardsData = setCards.filter(c => browseSelected.has(c.id));

  return (
    <div className="page-wrap">
      <div className="page-hdr">
        <div>
          <div className="page-title">Parcourir les <span>Extensions</span></div>
          {selSet && <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => { setSelSet(null); setSetCards([]); }}>← Toutes les extensions</button>}
        </div>
        {selSet && <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{setCards.length} cartes</div>}
      </div>

      {!selSet ? (
        loading ? <div className="spinner-wrap" style={{ padding: 40 }}><div className="spinner" />Chargement…</div>
          : <div className="browse-sets-grid">
            {displaySets.map(s => (
              <div key={s.id} className="set-card" onClick={() => loadSet(s)}>
                {s.logo && (
                  <div className="set-card-logo">
                    <img src={`${s.logo}.webp`} alt={s.name} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
                <div className="set-card-name">{s.name}</div>
                <div className="set-card-meta">{s.cardCount?.total ?? '?'} cartes · {s.releaseDate?.split('-')[0] ?? '—'}</div>
                <div className="set-card-badge">{s.id}</div>
              </div>
            ))}
          </div>
      ) : loadingC ? <div className="spinner-wrap" style={{ padding: 40 }}><div className="spinner" />Chargement des cartes…</div>
        : <div className="browse-grid">
          {setCards.map((c, i) => {
            const already = inAny(c.id);
            const isSel = browseSelected.has(c.id);
            return (
              <div key={c.id} className={`browse-card${isSel ? ' sel' : ''}`}
                style={{ animationDelay: `${Math.min(i * .018, .4)}s` }}
                onClick={() => !already && toggleBrowseSel(c.id)}>
                <div className="card-img-box">
                  {c.image ? <img className="card-img" src={`${c.image}/high.webp`} alt={c.name} loading="lazy" style={{ filter: 'none' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--surface2)' }} />}
                  {already ? <div className="browse-in-col">✓</div> : <div className={`browse-chk${isSel ? '' : ''}`} />}
                  {!already && (
                    <button className={`browse-add-hover${isSel ? ' hidden' : ''}`} onClick={e => { e.stopPropagation(); handleAdd([c]); }}>
                      <div className="browse-add-inner">＋ Ajouter</div>
                    </button>
                  )}
                </div>
                <div className="card-foot">
                  <div className="card-name">{c.name || c.id}</div>
                  <div className="card-meta">{c.localId}</div>
                </div>
              </div>
            );
          })}
        </div>
      }

      {/* Bulk add bar for browse */}
      <div className={`bulk-bar${browseSelected.size > 0 ? ' show' : ''}`}>
        <span className="bulk-count">{browseSelected.size} sélectionnée{browseSelected.size > 1 ? 's' : ''}</span>
        <button className="btn btn-red btn-sm" onClick={() => handleAdd(selectedCardsData)}>＋ Ajouter à la collection</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setBrowseSelected(new Set())}>Annuler</button>
      </div>

      <PickCollectionModal open={!!pickModal} collections={allCollections} defaultId={allCollections[0]?.id} onClose={() => setPickModal(null)}
        onConfirm={colId => doAdd(colId, pickModal.cards)} />
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
    if (pseudo.length < 3) return setErr1('Au moins 3 caractères.'); setL1(true); setErr1('');
    const { error } = await supabase.from('profiles').update({ pseudo }).eq('id', user.id); setL1(false);
    if (error) return setErr1(error.message); onProfileUpdate({ ...profile, pseudo }); showToast('Pseudo mis à jour ✦');
  };
  const savePassword = async () => {
    if (newPw.length < 8) return setErr2('Au moins 8 caractères.'); setL2(true); setErr2('');
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw });
    if (e1) { setL2(false); return setErr2('Mot de passe actuel incorrect.'); }
    const { error } = await supabase.auth.updateUser({ password: newPw }); setL2(false);
    if (error) return setErr2(error.message); setOldPw(''); setNewPw(''); showToast('Mot de passe mis à jour ✦');
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
  const [newColModal, setNewColModal] = useState(false); const [newColName, setNewColName] = useState('');
  const [renameModal, setRenameModal] = useState(null);
  const saveTimers = useRef({});

  useEffect(() => {
    supabase.from('collections').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
      .then(({ data }) => { if (data?.length) { setCollections(data); setActiveColId(data[0].id); } });
  }, [user.id]);

  const persist = useCallback((col) => {
    clearTimeout(saveTimers.current[col.id]);
    saveTimers.current[col.id] = setTimeout(async () => {
      await supabase.from('collections').update({ cards: col.cards, updated_at: new Date().toISOString() }).eq('id', col.id);
    }, 1200);
  }, []);

  const updateCollection = useCallback((updated) => {
    setCollections(prev => prev.map(c => c.id === updated.id ? updated : c)); persist(updated);
  }, [persist]);

  const addToCollection = useCallback((colId, newCards) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== colId) return c;
      const u = { ...c, cards: [...c.cards, ...newCards] }; persist(u); return u;
    }));
  }, [persist]);

  const createCollection = async () => {
    const name = (newColName.trim() || 'Nouvelle collection');
    const { data, error } = await supabase.from('collections').insert({ user_id: user.id, name, cards: [] }).select().single();
    if (!error && data) { setCollections(prev => [...prev, data]); setActiveColId(data.id); setPage('collection'); }
    setNewColModal(false); setNewColName('');
  };

  const renameCollection = async () => {
    if (!renameModal?.name?.trim()) return;
    await supabase.from('collections').update({ name: renameModal.name }).eq('id', renameModal.id);
    setCollections(prev => prev.map(c => c.id === renameModal.id ? { ...c, name: renameModal.name } : c));
    setRenameModal(null); showToast('Collection renommée ✦');
  };

  const deleteCollection = async (colId) => {
    if (!confirm('Supprimer cette collection ?')) return;
    await supabase.from('collections').delete().eq('id', colId);
    const next = collections.filter(c => c.id !== colId); setCollections(next);
    if (activeColId === colId) setActiveColId(next[0]?.id || null); showToast('Collection supprimée', '#c82828');
  };

  const activeCollection = collections.find(c => c.id === activeColId) || null;

  const sidebar = (
    <div className="sidebar">
      <div className="sb-top"><div className="logo"><div className="logo-icon">◆</div>Cartodex</div></div>
      <nav className="sb-nav">
        <div className="sb-section-label">Mes collections</div>
        {collections.map(col => (
          <button key={col.id} className={`sb-link${page === 'collection' && activeColId === col.id ? ' active' : ''}`}
            onClick={() => { setActiveColId(col.id); setPage('collection'); setMob(false); }}>
            <span className="icon">📋</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{col.name}</span>
            <div style={{ display: 'flex', gap: 2, flexShrink: 0, marginLeft: 4 }}>
              <span className="btn btn-xs btn-ghost" style={{ padding: '2px 5px' }} onClick={e => { e.stopPropagation(); setRenameModal({ id: col.id, name: col.name }); }}>✏️</span>
              {collections.length > 1 && <span className="btn btn-xs btn-danger" style={{ padding: '2px 5px' }} onClick={e => { e.stopPropagation(); deleteCollection(col.id); }}>✕</span>}
            </div>
          </button>
        ))}
        <div className="sb-col-actions">
          <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setNewColModal(true)}>＋ Nouvelle collection</button>
        </div>
        <div className="sb-section-label" style={{ marginTop: 8 }}>Navigation</div>
        {[{ id: 'browse', icon: '🔍', label: 'Parcourir' }, { id: 'account', icon: '⚙️', label: 'Mon Compte' }].map(n => (
          <button key={n.id} className={`sb-link${page === n.id ? ' active' : ''}`} onClick={() => { setPage(n.id); setMob(false); }}>
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
        <div className="logo" style={{ fontSize: '1rem', letterSpacing: '2px' }}><div className="logo-icon">◆</div>Cartodex</div>
        <div style={{ width: 32 }} />
      </div>
      {mobOpen && <div className="mob-drawer open"><div className="mob-overlay" onClick={() => setMob(false)} />{sidebar}</div>}
      <main className="main">
        {page === 'collection' && <CollectionPage collection={activeCollection} allCollections={collections} onUpdate={updateCollection} onAddToCollection={addToCollection} showToast={showToast} />}
        {page === 'browse' && <BrowsePage allCollections={collections} onAddToCollection={addToCollection} showToast={showToast} />}
        {page === 'account' && <AccountPage user={user} profile={profile} onProfileUpdate={onProfileUpdate} showToast={showToast} onLogout={onLogout} />}
      </main>

      {/* New collection modal */}
      <div className={`overlay${newColModal ? ' open' : ''}`} onClick={e => e.target.classList.contains('overlay') && setNewColModal(false)}>
        <div className="modal">
          <div className="modal-title">＋ Nouvelle collection</div>
          <div className="field"><label>Nom</label><input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Ex : Espèces Delta complète" onKeyDown={e => e.key === 'Enter' && createCollection()} /></div>
          <div className="modal-acts"><button className="btn btn-ghost" onClick={() => { setNewColModal(false); setNewColName(''); }}>Annuler</button><button className="btn btn-red" onClick={createCollection}>Créer</button></div>
        </div>
      </div>

      {/* Rename modal */}
      <div className={`overlay${renameModal ? ' open' : ''}`} onClick={e => e.target.classList.contains('overlay') && setRenameModal(null)}>
        {renameModal && <div className="modal">
          <div className="modal-title">✏️ Renommer</div>
          <div className="field"><label>Nouveau nom</label><input autoFocus value={renameModal.name} onChange={e => setRenameModal(m => ({ ...m, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && renameCollection()} /></div>
          <div className="modal-acts"><button className="btn btn-ghost" onClick={() => setRenameModal(null)}>Annuler</button><button className="btn btn-red" onClick={renameCollection}>Renommer</button></div>
        </div>}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null); const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); const [isReset, setIsReset] = useState(false);
  const [toast, setToast] = useState({ msg: '', color: '#3ab870', show: false });
  const timer = useRef(null);
  const showToast = useCallback((msg, color = '#3ab870') => { clearTimeout(timer.current); setToast({ msg, color, show: true }); timer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2600); }, []);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('reset')) setIsReset(true);
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) { const u = data.session.user; setUser(u); const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single(); setProfile(p); }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user); const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(p); setIsReset(false); window.history.replaceState({}, '', window.location.pathname);
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
          <div className="logo"><div className="logo-icon">◆</div>Cartodex</div>
          <div className="spinner" />
        </div>
        : isReset ? <ResetPasswordPage onDone={() => setIsReset(false)} />
        : !user ? <AuthPage onLogin={async u => { setUser(u); const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single(); setProfile(p); }} />
        : <AppShell user={user} profile={profile} onProfileUpdate={setProfile} onLogout={logout} showToast={showToast} />
      }
      <div className={`toast${toast.show ? ' show' : ''}`} style={{ borderColor: toast.color, color: toast.color }}>{toast.msg}</div>
    </>
  );
}
