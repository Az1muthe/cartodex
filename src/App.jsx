import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";

// ─── TCGdex ──────────────────────────────────────────────────────────────────
const TCGDEX = "https://api.tcgdex.net/v2/fr";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Palette Tyranocif : gris acier sombre + cramoisi + orange brûlé */
  --bg:        #0e0c10;
  --bg2:       #15121a;
  --surface:   #1e1922;
  --surface2:  #261f2e;
  --border:    #3a2a3a;
  --border2:   #4d3040;
  --red:       #c82828;
  --red2:      #e03a3a;
  --orange:    #c86030;
  --orange2:   #e07840;
  --gold:      #c8a448;
  --gold2:     #e8c060;
  --steel:     #8090a0;
  --text:      #f0e8e0;
  --text2:     #b8a8b0;
  --muted:     #6a5870;
  --green:     #3ab870;
  --radius:    14px;
  --cw:        168px;
  --ch:        235px;
}

body {
  font-family: 'Outfit', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 60% 40% at 0% 0%, rgba(200,40,40,.06) 0%, transparent 55%),
    radial-gradient(ellipse 50% 35% at 100% 100%, rgba(200,96,48,.05) 0%, transparent 55%),
    radial-gradient(ellipse 30% 25% at 50% 50%, rgba(200,164,72,.025) 0%, transparent 60%);
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

/* ── LOGO ─────────────────────────────────────────────────────────────── */
.logo {
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 1.6rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #f5ece0;
  -webkit-text-stroke: 1.5px var(--red);
  text-shadow:
    0 0 24px rgba(200,40,40,.35),
    2px 2px 0 rgba(80,10,10,.8);
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}
.logo-icon {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--red), var(--orange));
  display: flex; align-items: center; justify-content: center;
  font-size: .9rem; flex-shrink: 0;
  box-shadow: 0 0 16px rgba(200,40,40,.5), inset 0 1px 0 rgba(255,255,255,.15);
  -webkit-text-stroke: 0; text-shadow: none; color: #fff;
}

/* ── LAYOUT ───────────────────────────────────────────────────────────── */
.app-shell {
  display: flex; min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 220px; flex-shrink: 0;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh;
  padding: 22px 0;
  z-index: 50;
}
.sb-logo {
  padding: 0 20px 22px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}
.sb-logo .logo { font-size: 1.25rem; }

.sb-nav { flex: 1; padding: 0 10px; display: flex; flex-direction: column; gap: 4px; }

.sb-link {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  font-size: .83rem; font-weight: 600;
  color: var(--text2); cursor: pointer;
  transition: all .15s; border: none; background: transparent;
  font-family: 'Outfit', sans-serif; text-align: left; width: 100%;
}
.sb-link:hover { background: var(--surface); color: var(--text); }
.sb-link.active { background: rgba(200,40,40,.15); color: var(--red2); border: 1px solid rgba(200,40,40,.25); }
.sb-link .icon { font-size: 1rem; width: 22px; text-align: center; flex-shrink: 0; }

.sb-user {
  padding: 14px 14px 0;
  border-top: 1px solid var(--border);
  margin-top: auto;
}
.sb-pseudo {
  font-size: .78rem; font-weight: 700; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 2px;
}
.sb-email { font-size: .68rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 10px; }

/* Main */
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

/* mobile header */
.mob-header {
  display: none;
  align-items: center; justify-content: space-between;
  padding: 0 16px; height: 54px;
  background: rgba(14,12,16,.95); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
  backdrop-filter: blur(12px);
}
.mob-menu-btn { background: none; border: none; color: var(--text); font-size: 1.3rem; cursor: pointer; padding: 4px; }

/* mobile drawer */
.mob-drawer {
  display: none; position: fixed; inset: 0; z-index: 200;
}
.mob-drawer.open { display: block; }
.mob-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.6); }
.mob-drawer .sidebar { position: relative; z-index: 1; }

@media (max-width: 700px) {
  .sidebar { display: none; }
  .mob-header { display: flex; }
  :root { --cw: 144px; --ch: 202px; }
}

/* ── BUTTONS ──────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 999px;
  border: 1px solid var(--border2);
  background: var(--surface2); color: var(--text);
  font-family: 'Outfit', sans-serif; font-size: .8rem; font-weight: 600;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.btn:hover { background: var(--border2); border-color: var(--muted); transform: translateY(-1px); }
.btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

.btn-red {
  background: linear-gradient(135deg, var(--red), var(--orange));
  border-color: var(--red); color: #fff;
  box-shadow: 0 2px 12px rgba(200,40,40,.3);
}
.btn-red:hover { box-shadow: 0 4px 20px rgba(200,40,40,.45); transform: translateY(-1px); }

.btn-ghost { background: transparent; border-color: transparent; }
.btn-ghost:hover { background: var(--surface); border-color: var(--border); }

.btn-danger { color: var(--red2); background: transparent; border-color: transparent; }
.btn-danger:hover { background: rgba(200,40,40,.15); border-color: var(--red); }

.btn-sm { padding: 5px 13px; font-size: .72rem; }
.btn-ok { background: rgba(58,184,112,.12); border-color: var(--green); color: var(--green); }
.btn-ok:hover { background: var(--green); color: #fff; }

.chip {
  padding: 5px 13px; border-radius: 999px;
  border: 1px solid var(--border); background: transparent;
  font-family: 'Outfit', sans-serif; font-size: .72rem; font-weight: 600;
  color: var(--muted); cursor: pointer; transition: all .15s;
}
.chip:hover { border-color: var(--muted); color: var(--text); }
.chip.on { background: rgba(200,40,40,.15); border-color: var(--red2); color: var(--red2); }

/* ── FORMS ────────────────────────────────────────────────────────────── */
.field { margin-bottom: 16px; }
.field label {
  display: block; font-size: .68rem; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--muted); margin-bottom: 6px;
}
.field input {
  width: 100%; padding: 10px 14px;
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 10px; color: var(--text);
  font-family: 'Outfit', sans-serif; font-size: .88rem;
  outline: none; transition: border-color .15s;
}
.field input:focus { border-color: var(--red2); }
.field input::placeholder { color: var(--muted); }
.field-err { font-size: .72rem; color: var(--red2); margin-top: 4px; }

/* ── AUTH PAGE ────────────────────────────────────────────────────────── */
.auth-wrap {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.auth-box {
  width: 400px; max-width: 100%;
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 20px; padding: 36px;
  box-shadow: 0 24px 72px rgba(0,0,0,.6);
  animation: fadeUp .25s ease;
}
.auth-logo { text-align: center; margin-bottom: 28px; display: flex; justify-content: center; }
.auth-title {
  font-family: 'Fredoka', sans-serif;
  font-size: .95rem; letter-spacing: 2px; text-transform: uppercase;
  color: var(--text2); margin-bottom: 24px; text-align: center;
}
.auth-switch {
  text-align: center; margin-top: 20px;
  font-size: .78rem; color: var(--muted);
}
.auth-switch button {
  background: none; border: none; color: var(--red2);
  cursor: pointer; font-weight: 700; font-size: .78rem;
  font-family: 'Outfit', sans-serif; padding: 0; margin-left: 4px;
}
.auth-switch button:hover { text-decoration: underline; }
.auth-error {
  background: rgba(200,40,40,.12); border: 1px solid rgba(200,40,40,.3);
  border-radius: 8px; padding: 10px 14px;
  font-size: .78rem; color: var(--red2); margin-bottom: 16px;
}
.auth-success {
  background: rgba(58,184,112,.12); border: 1px solid rgba(58,184,112,.3);
  border-radius: 8px; padding: 10px 14px;
  font-size: .78rem; color: var(--green); margin-bottom: 16px;
}

/* ── PAGE HEADER ──────────────────────────────────────────────────────── */
.page-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 28px 14px; flex-wrap: wrap; gap: 12px;
}
.page-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.4rem; letter-spacing: 2px; text-transform: uppercase;
  color: var(--text);
  text-shadow: 0 0 20px rgba(200,40,40,.2);
}
.page-title span { color: var(--red2); }

/* ── PROGRESS ─────────────────────────────────────────────────────────── */
.prog {
  display: flex; align-items: center; gap: 14px;
  padding: 8px 28px 16px;
}
.prog-lbl { font-size: .62rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
.prog-track { flex: 1; height: 5px; background: var(--surface2); border-radius: 99px; overflow: hidden; }
.prog-fill { height: 100%; background: linear-gradient(90deg, var(--green), #6ee8a0); border-radius: 99px; transition: width .6s cubic-bezier(.4,0,.2,1); }
.prog-ct { font-size: .78rem; font-weight: 700; color: var(--green); white-space: nowrap; }

/* ── TOOLBAR ──────────────────────────────────────────────────────────── */
.tbar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 28px; flex-wrap: wrap;
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  background: rgba(21,18,26,.6);
}
.tbar-lbl { font-size: .62rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
.tbar-sep { width: 1px; height: 20px; background: var(--border); }
.spacer { flex: 1; }

/* ── UPLOAD ───────────────────────────────────────────────────────────── */
.upsec { padding: 16px 28px; }
.upzone {
  border: 2px dashed var(--border2); border-radius: var(--radius);
  padding: 20px 24px; cursor: pointer; transition: all .2s;
  background: var(--surface);
}
.upzone:hover, .upzone.drag { border-color: var(--red); background: rgba(200,40,40,.04); }
.upzone input { display: none; }
.up-inner { display: flex; align-items: center; gap: 16px; justify-content: center; }
.up-orb { width: 42px; height: 42px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.up-t1 { font-weight: 700; font-size: .88rem; }
.up-t2 { font-size: .7rem; color: var(--muted); margin-top: 2px; }
.up-t2 span { color: var(--red2); font-weight: 600; }

/* ── COLLECTION GRID ──────────────────────────────────────────────────── */
.col-wrap { padding: 16px 28px 60px; }
.sec-title {
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  font-size: .6rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--muted);
}
.sec-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.grid { display: grid; gap: 14px; }
.g2 { grid-template-columns: repeat(2, var(--cw)); justify-content: start; }
.g3 { grid-template-columns: repeat(3, var(--cw)); justify-content: start; }
.glist { grid-template-columns: 1fr; gap: 8px; }

@media (max-width: 700px) {
  .g3 { grid-template-columns: repeat(2, var(--cw)); }
  .page-hdr, .tbar, .upsec, .col-wrap, .prog { padding-left: 14px; padding-right: 14px; }
}

/* ── TILT CARD ────────────────────────────────────────────────────────── */
.card-scene {
  perspective: 800px;
  width: var(--cw);
}
.glist .card-scene { width: 100%; }

.card {
  width: var(--cw);
  border-radius: 12px; overflow: visible;
  background: var(--surface);
  border: 1px solid var(--border2);
  position: relative;
  transform-style: preserve-3d;
  transition: border-color .3s, box-shadow .3s;
  animation: fadeUp .28s ease both;
  cursor: pointer;
  will-change: transform;
}
@keyframes fadeUp { from { opacity:0; transform: translateY(8px) scale(.97); } to { opacity:1; transform:none; } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

.card.got { border-color: rgba(58,184,112,.35); }
.card:hover { border-color: var(--red2); box-shadow: 0 12px 40px rgba(200,40,40,.2), 0 0 0 1px rgba(200,40,40,.15); }
.card.got:hover { border-color: var(--green); box-shadow: 0 12px 40px rgba(58,184,112,.15); }

/* Holographic shimmer overlay */
.card-holo {
  position: absolute; inset: 0; border-radius: 11px;
  pointer-events: none; z-index: 3; overflow: hidden;
  opacity: 0; transition: opacity .3s;
}
.card:hover .card-holo { opacity: 1; }
.card-holo::after {
  content: '';
  position: absolute; inset: -50%;
  background: conic-gradient(
    from 0deg at var(--mx, 50%) var(--my, 50%),
    rgba(255,120,100,.08) 0deg,
    rgba(255,200,100,.12) 60deg,
    rgba(100,200,255,.08) 120deg,
    rgba(200,100,255,.07) 180deg,
    rgba(255,120,100,.08) 360deg
  );
  mix-blend-mode: screen;
  transition: background .1s;
}
.card-holo::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(
    circle at var(--mx, 50%) var(--my, 50%),
    rgba(255,255,255,.12) 0%,
    transparent 60%
  );
  mix-blend-mode: screen;
}

.card-img-box {
  width: var(--cw); height: var(--ch);
  overflow: hidden; position: relative; flex-shrink: 0;
  border-radius: 11px 11px 0 0;
}
.card-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: filter .4s;
}
.card:not(.got) .card-img {
  filter: grayscale(72%) brightness(.6) sepia(.05);
}
.card-badge {
  position: absolute; top: 7px; right: 7px; z-index: 4;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--green); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 900;
  box-shadow: 0 2px 8px rgba(0,0,0,.5);
}
.card-foot {
  padding: 8px 9px 9px;
  border-top: 1px solid var(--border);
}
.card-name { font-size: .76rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-meta { font-size: .63rem; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-acts { display: flex; gap: 4px; margin-top: 7px; }

/* list mode */
.glist .card-scene { perspective: none; }
.glist .card { width: 100%; display: flex; align-items: center; gap: 12px; padding-right: 12px; border-radius: 12px; overflow: hidden; }
.glist .card-img-box { width: 66px; height: 92px; flex-shrink: 0; border-radius: 11px 0 0 11px; }
.glist .card-foot { flex: 1; border-top: none; padding: 10px 0; }
.glist .card-holo { display: none; }
.glist .card-name { font-size: .85rem; }
.glist .card-acts { flex-wrap: wrap; }

/* ── EMPTY STATE ──────────────────────────────────────────────────────── */
.empty { text-align: center; padding: 60px 20px; color: var(--muted); }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 12px; opacity: .3; }
.empty h3 { font-family: 'Fredoka', sans-serif; font-size: 1rem; color: var(--text); margin-bottom: 6px; letter-spacing: 1px; }
.empty p { font-size: .78rem; }

/* ── IMPORT PANEL ─────────────────────────────────────────────────────── */
.imp-panel {
  margin: 0 28px 16px;
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: var(--radius); overflow: hidden;
}
.imp-head {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 18px; cursor: pointer;
  font-weight: 700; font-size: .82rem;
  background: var(--surface2); border-bottom: 1px solid transparent;
  transition: background .15s;
}
.imp-head:hover { background: var(--border); }
.imp-head.open { border-bottom-color: var(--border2); }
.imp-arrow { margin-left: auto; color: var(--muted); font-size: .7rem; transition: transform .2s; }
.imp-head.open .imp-arrow { transform: rotate(180deg); }
.imp-body { padding: 16px 18px; }

.imp-select {
  width: 100%; padding: 9px 13px;
  background: var(--bg); border: 1px solid var(--border2);
  border-radius: 10px; color: var(--text);
  font-family: 'Outfit', sans-serif; font-size: .82rem;
  outline: none; margin-bottom: 12px; cursor: pointer;
}
.imp-select:focus { border-color: var(--red2); }
.imp-select option { background: var(--bg); }

.imp-info { font-size: .72rem; color: var(--muted); margin-bottom: 12px; line-height: 1.6; }
.imp-info strong { color: var(--text2); }

.imp-preview {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
  gap: 7px; margin-bottom: 14px; max-height: 250px; overflow-y: auto;
}
.imp-thumb {
  border-radius: 6px; overflow: hidden; border: 1px solid var(--border);
  aspect-ratio: 2.5/3.5; background: var(--surface2);
}
.imp-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.spinner-wrap { display: flex; align-items: center; gap: 10px; padding: 20px; color: var(--muted); font-size: .8rem; justify-content: center; }
.spinner { width: 18px; height: 18px; border: 2px solid var(--border2); border-top-color: var(--red); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── BROWSE PAGE ──────────────────────────────────────────────────────── */
.browse-sets-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px; padding: 0 28px 20px;
}
.set-card {
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: var(--radius); padding: 16px;
  cursor: pointer; transition: all .15s;
}
.set-card:hover { border-color: var(--red2); background: var(--surface2); transform: translateY(-2px); }
.set-card-name { font-weight: 700; font-size: .88rem; margin-bottom: 4px; }
.set-card-meta { font-size: .72rem; color: var(--muted); }
.set-card-badge { display: inline-block; font-size: .65rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: rgba(200,40,40,.15); color: var(--red2); border: 1px solid rgba(200,40,40,.25); margin-top: 8px; }

.browse-cards-grid {
  display: grid; grid-template-columns: repeat(auto-fill, var(--cw));
  gap: 14px; padding: 0 28px 60px; justify-content: start;
}

.browse-card {
  width: var(--cw); border-radius: 12px; overflow: hidden;
  background: var(--surface); border: 1px solid var(--border2);
  animation: fadeIn .2s ease; position: relative;
}
.browse-card:hover { border-color: var(--red2); }
.browse-card .card-img-box { height: var(--ch); }
.browse-card .card-img { filter: none; }
.browse-in-col {
  position: absolute; top: 7px; right: 7px; z-index: 4;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--green); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 900;
  box-shadow: 0 2px 8px rgba(0,0,0,.5);
}
.browse-add-btn {
  position: absolute; top: 7px; left: 7px; z-index: 4;
  padding: 4px 10px; border-radius: 99px;
  background: rgba(200,40,40,.85); color: #fff;
  font-size: .65rem; font-weight: 700;
  cursor: pointer; border: none; font-family: 'Outfit', sans-serif;
  opacity: 0; transition: opacity .2s;
}
.browse-card:hover .browse-add-btn { opacity: 1; }

/* ── ACCOUNT PAGE ─────────────────────────────────────────────────────── */
.account-wrap { padding: 0 28px 60px; max-width: 500px; }
.account-section {
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: var(--radius); padding: 22px; margin-bottom: 16px;
}
.account-section-title {
  font-family: 'Fredoka', sans-serif; font-size: .85rem;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--text2); margin-bottom: 18px;
  padding-bottom: 10px; border-bottom: 1px solid var(--border);
}

/* ── MODAL ────────────────────────────────────────────────────────────── */
.overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,.78); backdrop-filter: blur(8px);
  z-index: 300; align-items: center; justify-content: center;
}
.overlay.open { display: flex; }
.modal {
  background: var(--bg2); border: 1px solid var(--border2);
  border-radius: 20px; padding: 26px 30px;
  width: 370px; max-width: 94vw;
  box-shadow: 0 24px 72px rgba(0,0,0,.7);
  animation: fadeUp .2s ease;
}
@keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
.modal-title {
  font-family: 'Fredoka', sans-serif; font-size: .85rem;
  letter-spacing: 2px; text-transform: uppercase; color: var(--red2); margin-bottom: 20px;
}
.modal-acts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 22px; }

/* ── TOAST ────────────────────────────────────────────────────────────── */
.toast {
  position: fixed; bottom: 26px; right: 26px; z-index: 999;
  padding: 10px 22px; border-radius: 999px;
  background: var(--surface); border: 1px solid;
  font-size: .8rem; font-weight: 600;
  transform: translateY(50px); opacity: 0;
  transition: all .25s cubic-bezier(.4,0,.2,1);
  pointer-events: none;
}
.toast.show { transform: translateY(0); opacity: 1; }

/* ── MISC ─────────────────────────────────────────────────────────────── */
.divider { height: 1px; background: var(--border); margin: 20px 0; }
.text-muted { color: var(--muted); font-size: .78rem; }
.text-red { color: var(--red2); }
.tag-delta { display: inline-flex; align-items: center; gap: 4px; font-size: .65rem; font-weight: 700; padding: 2px 7px; border-radius: 5px; background: rgba(200,96,48,.15); color: var(--orange2); border: 1px solid rgba(200,96,48,.3); }
`;

// ─── TILT CARD ────────────────────────────────────────────────────────────────
function TiltCard({ card, onToggle, onEdit, onDelete, listMode }) {
  const ref = useRef(null);
  const holoRef = useRef(null);

  const onMouseMove = useCallback((e) => {
    if (listMode) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (y - 0.5) * -16;
    const ry = (x - 0.5) * 16;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.04,1.04,1.04)`;
    el.style.transition = 'transform .05s, border-color .3s, box-shadow .3s';
    if (holoRef.current) {
      holoRef.current.style.setProperty('--mx', `${x * 100}%`);
      holoRef.current.style.setProperty('--my', `${y * 100}%`);
    }
  }, [listMode]);

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = '';
    ref.current.style.transition = 'transform .4s cubic-bezier(.23,1,.32,1), border-color .3s, box-shadow .3s';
  }, []);

  return (
    <div className={listMode ? "card-scene" : "card-scene"} style={listMode ? { width: '100%' } : {}}>
      <div
        ref={ref}
        className={`card ${card.obtained ? 'got' : ''}`}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div className="card-img-box">
          {card.src
            ? <img className="card-img" src={card.src} alt={card.name} loading="lazy" />
            : <div style={{ width:'100%', height:'100%', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', opacity:.2, fontSize:'2rem' }}>🃏</div>
          }
          {card.obtained && <div className="card-badge">✓</div>}
        </div>
        {!listMode && <div className="card-holo" ref={holoRef} />}
        <div className="card-foot">
          <div className="card-name">{card.name || 'Sans nom'}</div>
          {(card.series || card.number) && (
            <div className="card-meta">
              {[card.series?.replace(/EX\s/i,''), card.number].filter(Boolean).join(' · ')}
            </div>
          )}
          <div className="card-acts">
            <button className={`btn btn-sm ${card.obtained ? 'btn-ok' : ''}`} onClick={() => onToggle(card.id)}>
              {card.obtained ? '✓ Obtenue' : '+ Marquer'}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => onEdit(card)}>✏️</button>
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(card.id)}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [view, setView]       = useState('login'); // login | register | forgot
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [ok, setOk]           = useState('');

  const reset = (v) => { setView(v); setErr(''); setOk(''); setEmail(''); setPassword(''); setPseudo(''); };

  const handleLogin = async () => {
    if (!email || !password) return setErr('Email et mot de passe requis.');
    setLoading(true); setErr('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    onLogin(data.user);
  };

  const handleRegister = async () => {
    if (!email || !password || !pseudo) return setErr('Tous les champs sont requis.');
    if (pseudo.length < 3) return setErr('Le pseudo doit faire au moins 3 caractères.');
    setLoading(true); setErr('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setLoading(false); return setErr(error.message); }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, pseudo });
      await supabase.from('collections').insert({ user_id: data.user.id, cards: [] });
    }
    setLoading(false);
    setOk('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
    setView('login');
  };

  const handleForgot = async () => {
    if (!email) return setErr('Entrez votre adresse email.');
    setLoading(true); setErr('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '?reset=1'
    });
    setLoading(false);
    if (error) return setErr(error.message);
    setOk('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="logo">
            <div className="logo-icon">◆</div>
            Cartodex
          </div>
        </div>
        {err && <div className="auth-error">{err}</div>}
        {ok  && <div className="auth-success">{ok}</div>}

        {view === 'login' && <>
          <div className="auth-title">Connexion</div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" onKeyDown={e=>e.key==='Enter'&&handleLogin()} /></div>
          <div className="field"><label>Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleLogin()} /></div>
          <button className="btn btn-red" style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={handleLogin} disabled={loading}>{loading ? '...' : 'Se connecter'}</button>
          <div className="auth-switch">Mot de passe oublié ? <button onClick={()=>reset('forgot')}>Réinitialiser</button></div>
          <div className="auth-switch">Pas de compte ? <button onClick={()=>reset('register')}>Créer un compte</button></div>
        </>}

        {view === 'register' && <>
          <div className="auth-title">Créer un compte</div>
          <div className="field"><label>Pseudo</label><input type="text" value={pseudo} onChange={e=>setPseudo(e.target.value)} placeholder="DresseurEpique" /></div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" /></div>
          <div className="field"><label>Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 caractères minimum" onKeyDown={e=>e.key==='Enter'&&handleRegister()} /></div>
          <button className="btn btn-red" style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={handleRegister} disabled={loading}>{loading ? '...' : 'Créer mon compte'}</button>
          <div className="auth-switch">Déjà un compte ? <button onClick={()=>reset('login')}>Se connecter</button></div>
        </>}

        {view === 'forgot' && <>
          <div className="auth-title">Mot de passe oublié</div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" onKeyDown={e=>e.key==='Enter'&&handleForgot()} /></div>
          <button className="btn btn-red" style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={handleForgot} disabled={loading}>{loading ? '...' : 'Envoyer le lien'}</button>
          <div className="auth-switch"><button onClick={()=>reset('login')}>← Retour à la connexion</button></div>
        </>}
      </div>
    </div>
  );
}

// ─── RESET PASSWORD PAGE ──────────────────────────────────────────────────────
function ResetPasswordPage({ onDone }) {
  const [pw, setPw]     = useState('');
  const [err, setErr]   = useState('');
  const [ok, setOk]     = useState('');
  const [loading, setL] = useState(false);

  const handle = async () => {
    if (!pw || pw.length < 8) return setErr('Le mot de passe doit faire au moins 8 caractères.');
    setL(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password: pw });
    setL(false);
    if (error) return setErr(error.message);
    setOk('Mot de passe mis à jour ! Vous pouvez vous connecter.');
    setTimeout(onDone, 2000);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo"><div className="logo"><div className="logo-icon">◆</div>Cartodex</div></div>
        {err && <div className="auth-error">{err}</div>}
        {ok  && <div className="auth-success">{ok}</div>}
        <div className="auth-title">Nouveau mot de passe</div>
        <div className="field"><label>Nouveau mot de passe</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="8 caractères minimum" onKeyDown={e=>e.key==='Enter'&&handle()} /></div>
        <button className="btn btn-red" style={{width:'100%',justifyContent:'center'}} onClick={handle} disabled={loading}>{loading?'...':'Enregistrer'}</button>
      </div>
    </div>
  );
}

// ─── COLLECTION PAGE ──────────────────────────────────────────────────────────
function CollectionPage({ cards, onUpdate, showToast }) {
  const [layout, setLayout]  = useState('g2');
  const [filter, setFilter]  = useState('all');
  const [modal, setModal]    = useState(null);
  const [impOpen, setImpOpen] = useState(false);
  const [impSets, setImpSets] = useState([]);
  const [impSetId, setImpSetId] = useState('');
  const [impState, setImpState] = useState('idle');
  const [impCards, setImpCards] = useState([]);
  const [impErr, setImpErr]   = useState('');
  const [drag, setDrag]      = useState(false);
  const fileRef              = useRef(null);

  // Load TCGdex sets list
  useEffect(() => {
    if (!impOpen || impSets.length) return;
    fetch(`${TCGDEX}/sets`)
      .then(r => r.json())
      .then(data => {
        // Filter EX-era sets (roughly 2003-2007)
        const ex = data.filter(s => s.serie?.id === 'ex' || s.serie?.name?.toLowerCase().includes('ex') || s.id?.startsWith('ex'));
        const list = ex.length > 0 ? ex : data.slice(0, 30);
        setImpSets(list);
        if (list.length) setImpSetId(list[0].id);
      })
      .catch(() => {
        // Fallback to known IDs
        const fallback = [
          { id:'ex11', name:'EX Espèces Delta' },
          { id:'ex13', name:'EX Fantômes Holon' },
          { id:'ex15', name:'EX Île des Dragons' },
          { id:'ex14', name:'EX Gardiens de Cristal' },
          { id:'ex12', name:'EX Legend Maker' },
          { id:'ex10', name:'EX Forces Invisibles' },
          { id:'ex8',  name:'EX Deoxys' },
          { id:'ex16', name:'EX Power Keepers' },
        ];
        setImpSets(fallback);
        setImpSetId('ex11');
      });
  }, [impOpen]);

  const fetchPreview = async () => {
    if (!impSetId) return;
    setImpState('loading'); setImpErr('');
    try {
      const res = await fetch(`${TCGDEX}/sets/${impSetId}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (!data.cards?.length) throw new Error('Aucune carte trouvée pour ce set.');
      setImpCards(data.cards);
      setImpState('preview');
    } catch(e) {
      setImpErr(e.message); setImpState('error');
    }
  };

  const importSet = () => {
    const existing = new Set(cards.map(c => c.tcgId).filter(Boolean));
    const toAdd = impCards.filter(c => !existing.has(c.id)).map(c => ({
      id: `tcg-${c.id}-${Math.random()}`,
      tcgId: c.id,
      src: c.image ? `${c.image}/high.webp` : '',
      name: c.name || c.id,
      series: impSets.find(s=>s.id===impSetId)?.name || impSetId,
      number: c.localId || '',
      obtained: false,
    }));
    if (!toAdd.length) { showToast('Toutes ces cartes sont déjà dans votre collection', '#c8a448'); return; }
    onUpdate([...cards, ...toAdd]);
    showToast(`${toAdd.length} cartes importées ✦`);
    setImpState('idle'); setImpCards([]);
  };

  const handleFiles = (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    let done = 0; const news = [];
    imgs.forEach(file => {
      const r = new FileReader();
      r.onload = ev => {
        news.push({ id: `local-${Date.now()}-${Math.random()}`, src: ev.target.result, name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), series: '', number: '', obtained: false });
        if (++done === imgs.length) { onUpdate([...cards, ...news]); showToast(`${done} carte${done>1?'s':''} ajoutée${done>1?'s':''} ✦`); }
      };
      r.readAsDataURL(file);
    });
  };

  const toggleObtained = (id) => {
    const next = cards.map(c => c.id===id ? {...c, obtained:!c.obtained} : c);
    onUpdate(next);
    const c = next.find(x => x.id===id);
    showToast(c.obtained ? 'Carte obtenue ✦' : 'Marquée manquante');
  };
  const deleteCard = (id) => { onUpdate(cards.filter(c=>c.id!==id)); showToast('Carte supprimée', '#c82828'); };
  const openEdit = (card) => setModal({id:card.id, name:card.name, series:card.series, number:card.number});
  const saveEdit = () => {
    onUpdate(cards.map(c => c.id===modal.id ? {...c,...modal} : c));
    setModal(null); showToast('Carte mise à jour ✦');
  };

  const total = cards.length;
  const obtained = cards.filter(c=>c.obtained).length;
  const pct = total===0 ? 0 : Math.round((obtained/total)*100);
  const visible = filter==='obtained' ? cards.filter(c=>c.obtained) : filter==='missing' ? cards.filter(c=>!c.obtained) : cards;
  const layouts = [{id:'g2',icon:'⊞'},{id:'g3',icon:'⋮⋮⋮'},{id:'glist',icon:'☰'}];
  const filters = [{id:'all',label:'Toutes'},{id:'obtained',label:'Obtenues'},{id:'missing',label:'Manquantes'}];

  return (
    <div style={{flex:1,minWidth:0}}>
      <div className="page-hdr">
        <div className="page-title">Ma <span>Collection</span></div>
        <div style={{display:'flex',gap:8}}>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{display:'none'}} onChange={e=>{handleFiles(e.target.files);e.target.value='';}} />
          <button className="btn" onClick={()=>fileRef.current?.click()}>＋ Ajouter</button>
          {total>0 && <button className="btn btn-danger btn-sm" onClick={()=>{if(confirm('Vider la collection ?'))onUpdate([])}}>Vider</button>}
        </div>
      </div>

      <div className="prog">
        <span className="prog-lbl">Avancement</span>
        <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`}} /></div>
        <span className="prog-ct">{obtained} / {total} · {pct}%</span>
      </div>

      <div className="tbar">
        <span className="tbar-lbl">Vue</span>
        {layouts.map(l => (
          <button key={l.id} className={`btn btn-ghost ${layout===l.id?'chip on':''}`} style={{borderRadius:'99px',padding:'5px 10px'}} onClick={()=>setLayout(l.id)}>{l.icon}</button>
        ))}
        <div className="tbar-sep" />
        {filters.map(f => (
          <button key={f.id} className={`chip ${filter===f.id?'on':''}`} onClick={()=>setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {/* Import TCGdex */}
      <div className="imp-panel">
        <div className={`imp-head ${impOpen?'open':''}`} onClick={()=>setImpOpen(v=>!v)}>
          <span>🎴</span><span>Importer une extension TCGdex</span>
          <span className="imp-arrow">▼</span>
        </div>
        {impOpen && (
          <div className="imp-body">
            {impSets.length===0 ? (
              <div className="spinner-wrap"><div className="spinner"/>Chargement des extensions…</div>
            ) : (
              <>
                <select className="imp-select" value={impSetId} onChange={e=>{setImpSetId(e.target.value);setImpState('idle');setImpCards([]);}}>
                  {impSets.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="imp-info">Images fournies par <strong>api.tcgdex.net</strong> — open source, français. Les cartes déjà dans votre collection ne seront pas dupliquées.</p>
              </>
            )}
            {impState==='idle' && impSets.length>0 && (
              <button className="btn btn-red" onClick={fetchPreview}>🔍 Prévisualiser</button>
            )}
            {impState==='loading' && <div className="spinner-wrap"><div className="spinner"/>Chargement…</div>}
            {impState==='error' && (
              <div>
                <p style={{color:'var(--red2)',fontSize:'.78rem',marginBottom:10}}>Erreur : {impErr}</p>
                <button className="btn" onClick={()=>setImpState('idle')}>Réessayer</button>
              </div>
            )}
            {impState==='preview' && (
              <div>
                <p className="imp-info"><strong style={{color:'var(--red2)'}}>{impCards.length} cartes</strong> trouvées :</p>
                <div className="imp-preview">
                  {impCards.map(c=>(
                    <div key={c.id} className="imp-thumb">
                      {c.image ? <img src={`${c.image}/high.webp`} alt={c.name} loading="lazy"/> : <div style={{background:'var(--surface2)',width:'100%',height:'100%'}}/>}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button className="btn btn-red" onClick={importSet}>⬇ Importer ({impCards.length} cartes)</button>
                  <button className="btn btn-ghost" onClick={()=>{setImpState('idle');setImpCards([])}}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload zone */}
      <div className="upsec">
        <label className={`upzone${drag?' drag':''}`}
          onDragOver={e=>{e.preventDefault();setDrag(true)}}
          onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files)}}>
          <input type="file" multiple accept="image/*" onChange={e=>{handleFiles(e.target.files);e.target.value=''}} />
          <div className="up-inner">
            <div className="up-orb">🃏</div>
            <div>
              <div className="up-t1">Déposer vos photos de cartes</div>
              <div className="up-t2"><span>Cliquer pour sélectionner</span> ou glisser-déposer · PNG, JPG, WEBP</div>
            </div>
          </div>
        </label>
      </div>

      {/* Cards */}
      <div className="col-wrap">
        <div className="sec-title">Collection · {visible.length} carte{visible.length!==1?'s':''}</div>
        {visible.length===0 ? (
          <div className="empty">
            <span className="empty-icon">{filter==='missing'&&total>0?'🏆':'◈'}</span>
            <h3>{filter==='missing'&&total>0?'Collection complète !':'Aucune carte'}</h3>
            <p>{filter==='missing'&&total>0?'Toutes vos cartes sont obtenues.':'Importez une extension ou ajoutez vos cartes ci-dessus.'}</p>
          </div>
        ) : (
          <div className={`grid ${layout}`}>
            {visible.map((card,i)=>(
              <div key={card.id} style={{animationDelay:`${Math.min(i*.03,.36)}s`, width: layout==='glist'?'100%':'auto'}}>
                <TiltCard card={card} onToggle={toggleObtained} onEdit={openEdit} onDelete={deleteCard} listMode={layout==='glist'} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <div className={`overlay${modal?' open':''}`} onClick={e=>e.target.classList.contains('overlay')&&setModal(null)}>
        {modal && (
          <div className="modal">
            <div className="modal-title">✦ Modifier la carte</div>
            {[['Nom','name','Dracaufeu Holo EX'],['Série','series','EX Espèces Delta'],['Numéro','number','16/113']].map(([lbl,k,ph])=>(
              <div key={k} className="field">
                <label>{lbl}</label>
                <input value={modal[k]} placeholder={ph} autoFocus={k==='name'}
                  onChange={e=>setModal(m=>({...m,[k]:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&saveEdit()} />
              </div>
            ))}
            <div className="modal-acts">
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button>
              <button className="btn btn-red" onClick={saveEdit}>Enregistrer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BROWSE PAGE ──────────────────────────────────────────────────────────────
function BrowsePage({ cards, onAddCard, showToast }) {
  const [sets, setSets]       = useState([]);
  const [selSet, setSelSet]   = useState(null);
  const [setCards, setSetCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    fetch(`${TCGDEX}/sets`)
      .then(r=>r.json())
      .then(data => { setSets(data); setLoading(false); })
      .catch(()=>setLoading(false));
  }, []);

  const loadSet = async (set) => {
    setSelSet(set); setLoadingCards(true); setSetCards([]);
    try {
      const res = await fetch(`${TCGDEX}/sets/${set.id}`);
      const data = await res.json();
      setSetCards(data.cards || []);
    } catch {}
    setLoadingCards(false);
  };

  const addToCollection = (c, setName) => {
    const exists = cards.some(x => x.tcgId===c.id);
    if (exists) { showToast('Déjà dans votre collection', '#c8a448'); return; }
    const newCard = {
      id: `tcg-${c.id}-${Math.random()}`,
      tcgId: c.id,
      src: c.image ? `${c.image}/high.webp` : '',
      name: c.name||c.id, series: setName, number: c.localId||'', obtained: false,
    };
    onAddCard(newCard);
    showToast(`${c.name} ajouté à la collection ✦`);
  };

  const inCollection = (tcgId) => cards.some(c=>c.tcgId===tcgId);

  const exSets = sets.filter(s => s.serie?.id==='ex' || s.id?.startsWith('ex'));
  const displaySets = exSets.length > 0 ? exSets : sets;

  return (
    <div style={{flex:1,minWidth:0}}>
      <div className="page-hdr">
        <div>
          <div className="page-title">Parcourir les <span>Extensions</span></div>
          {selSet && (
            <button className="btn btn-ghost btn-sm" style={{marginTop:6}} onClick={()=>{setSelSet(null);setSetCards([])}}>
              ← Retour aux extensions
            </button>
          )}
        </div>
        {selSet && <div className="tag-delta">δ {selSet.name}</div>}
      </div>

      {!selSet ? (
        <>
          {loading ? (
            <div className="spinner-wrap" style={{padding:40}}><div className="spinner"/>Chargement des extensions…</div>
          ) : (
            <div className="browse-sets-grid">
              {displaySets.map(s=>(
                <div key={s.id} className="set-card" onClick={()=>loadSet(s)}>
                  <div className="set-card-name">{s.name}</div>
                  <div className="set-card-meta">{s.cardCount?.total ?? '?'} cartes · {s.releaseDate?.split('-')[0]??'—'}</div>
                  <div className="set-card-badge">{s.id}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          {loadingCards ? (
            <div className="spinner-wrap" style={{padding:40}}><div className="spinner"/>Chargement des cartes…</div>
          ) : (
            <div className="browse-cards-grid">
              {setCards.map(c=>(
                <div key={c.id} className="browse-card">
                  <div className="card-img-box" style={{height:'var(--ch)'}}>
                    {c.image
                      ? <img className="card-img" src={`${c.image}/high.webp`} alt={c.name} loading="lazy" style={{filter:'none'}} />
                      : <div style={{width:'100%',height:'100%',background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',opacity:.2}}>🃏</div>
                    }
                    {inCollection(c.id)
                      ? <div className="browse-in-col">✓</div>
                      : <button className="browse-add-btn" onClick={()=>addToCollection(c, selSet.name)}>＋ Ajouter</button>
                    }
                  </div>
                  <div className="card-foot">
                    <div className="card-name">{c.name||c.id}</div>
                    <div className="card-meta">{c.localId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ACCOUNT PAGE ─────────────────────────────────────────────────────────────
function AccountPage({ user, profile, onProfileUpdate, showToast, onLogout }) {
  const [pseudo, setPseudo]     = useState(profile?.pseudo || '');
  const [oldPw, setOldPw]       = useState('');
  const [newPw, setNewPw]       = useState('');
  const [loading1, setL1]       = useState(false);
  const [loading2, setL2]       = useState(false);
  const [err1, setErr1]         = useState('');
  const [err2, setErr2]         = useState('');

  const savePseudo = async () => {
    if (!pseudo || pseudo.length<3) return setErr1('Le pseudo doit faire au moins 3 caractères.');
    setL1(true); setErr1('');
    const { error } = await supabase.from('profiles').update({ pseudo }).eq('id', user.id);
    setL1(false);
    if (error) return setErr1(error.message);
    onProfileUpdate({ ...profile, pseudo });
    showToast('Pseudo mis à jour ✦');
  };

  const savePassword = async () => {
    if (!newPw || newPw.length<8) return setErr2('Le mot de passe doit faire au moins 8 caractères.');
    setL2(true); setErr2('');
    // Re-authenticate first
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw });
    if (e1) { setL2(false); return setErr2('Mot de passe actuel incorrect.'); }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setL2(false);
    if (error) return setErr2(error.message);
    setOldPw(''); setNewPw('');
    showToast('Mot de passe mis à jour ✦');
  };

  return (
    <div style={{flex:1,minWidth:0}}>
      <div className="page-hdr">
        <div className="page-title">Mon <span>Compte</span></div>
      </div>
      <div className="account-wrap">
        <div className="account-section">
          <div className="account-section-title">Informations</div>
          <div className="field"><label>Email</label><input type="email" value={user.email} disabled style={{opacity:.5}} /></div>
          <div className="field">
            <label>Pseudo</label>
            <input type="text" value={pseudo} onChange={e=>setPseudo(e.target.value)} placeholder="DresseurEpique" />
            {err1 && <div className="field-err">{err1}</div>}
          </div>
          <button className="btn btn-red" onClick={savePseudo} disabled={loading1}>{loading1?'...':'Enregistrer le pseudo'}</button>
        </div>

        <div className="account-section">
          <div className="account-section-title">Changer le mot de passe</div>
          <div className="field"><label>Mot de passe actuel</label><input type="password" value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="••••••••" /></div>
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="8 caractères minimum" onKeyDown={e=>e.key==='Enter'&&savePassword()} />
            {err2 && <div className="field-err">{err2}</div>}
          </div>
          <button className="btn btn-red" onClick={savePassword} disabled={loading2}>{loading2?'...':'Changer le mot de passe'}</button>
        </div>

        <div className="account-section">
          <div className="account-section-title">Session</div>
          <p className="text-muted" style={{marginBottom:14}}>Connecté en tant que <strong style={{color:'var(--text)'}}>{profile?.pseudo||user.email}</strong></p>
          <button className="btn btn-danger" onClick={onLogout}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function AppShell({ user, profile, onProfileUpdate, onLogout, showToast }) {
  const [page, setPage]   = useState('collection');
  const [cards, setCards] = useState([]);
  const [mobOpen, setMob] = useState(false);
  const saveRef = useRef(null);

  // Load collection from Supabase
  useEffect(() => {
    supabase.from('collections').select('cards').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.cards) setCards(data.cards); });
  }, [user.id]);

  // Debounced save to Supabase
  const saveCards = useCallback((next) => {
    setCards(next);
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      await supabase.from('collections')
        .upsert({ user_id: user.id, cards: next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }, 1200);
  }, [user.id]);

  const addCard = useCallback((card) => {
    setCards(prev => {
      const next = [...prev, card];
      clearTimeout(saveRef.current);
      saveRef.current = setTimeout(async () => {
        await supabase.from('collections').upsert({ user_id: user.id, cards: next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      }, 1200);
      return next;
    });
  }, [user.id]);

  const nav = [
    { id:'collection', icon:'📋', label:'Ma Collection' },
    { id:'browse',     icon:'🔍', label:'Parcourir' },
    { id:'account',    icon:'⚙️', label:'Mon Compte' },
  ];

  const sidebar = (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="logo"><div className="logo-icon">◆</div>Cartodex</div>
      </div>
      <nav className="sb-nav">
        {nav.map(n => (
          <button key={n.id} className={`sb-link ${page===n.id?'active':''}`}
            onClick={()=>{ setPage(n.id); setMob(false); }}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
      <div className="sb-user">
        <div className="sb-pseudo">{profile?.pseudo || '—'}</div>
        <div className="sb-email">{user.email}</div>
        <button className="btn btn-danger btn-sm" style={{width:'100%',justifyContent:'center'}} onClick={onLogout}>Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      {sidebar}

      {/* Mobile header */}
      <div className="mob-header">
        <button className="mob-menu-btn" onClick={()=>setMob(true)}>☰</button>
        <div className="logo" style={{fontSize:'1rem',letterSpacing:'2px'}}><div className="logo-icon">◆</div>Cartodex</div>
        <div style={{width:32}} />
      </div>

      {/* Mobile drawer */}
      {mobOpen && (
        <div className="mob-drawer open">
          <div className="mob-overlay" onClick={()=>setMob(false)} />
          {sidebar}
        </div>
      )}

      {/* Main content */}
      <main className="main">
        {page==='collection' && <CollectionPage cards={cards} onUpdate={saveCards} showToast={showToast} />}
        {page==='browse'     && <BrowsePage cards={cards} onAddCard={addCard} showToast={showToast} />}
        {page==='account'    && <AccountPage user={user} profile={profile} onProfileUpdate={onProfileUpdate} showToast={showToast} onLogout={onLogout} />}
      </main>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [toast, setToast]     = useState({ msg:'', color:'#3ab870', show:false });
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, color='#3ab870') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, color, show:true });
    toastTimer.current = setTimeout(()=>setToast(t=>({...t,show:false})), 2600);
  }, []);

  useEffect(() => {
    // Check if this is a password-reset redirect
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('reset')) {
      setIsReset(true);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUser(u);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(p);
        setIsReset(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (event === 'SIGNED_OUT') { setUser(null); setProfile(null); }
      if (event === 'PASSWORD_RECOVERY') { setIsReset(true); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  };

  return (
    <>
      <style>{CSS}</style>

      {loading ? (
        <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
            <div className="logo"><div className="logo-icon">◆</div>Cartodex</div>
            <div className="spinner" />
          </div>
        </div>
      ) : isReset ? (
        <ResetPasswordPage onDone={()=>setIsReset(false)} />
      ) : !user ? (
        <AuthPage onLogin={async (u) => {
          setUser(u);
          const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
          setProfile(p);
        }} />
      ) : (
        <AppShell user={user} profile={profile} onProfileUpdate={setProfile} onLogout={logout} showToast={showToast} />
      )}

      <div className={`toast${toast.show?' show':''}`} style={{borderColor:toast.color,color:toast.color}}>{toast.msg}</div>
    </>
  );
}
