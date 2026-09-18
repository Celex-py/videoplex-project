import { useState, useEffect, useRef, useCallback } from "react";

const S = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=DM+Mono&display=swap');
@keyframes pp{0%,100%{opacity:1}50%{opacity:.6}}
@keyframes sp{to{transform:rotate(360deg)}}
@keyframes mi{from{opacity:0;transform:scale(.93) translateY(8px)}}
.R{font-family:'DM Sans',sans-serif;background:#0a0a0b;color:#f0eff4;height:640px;display:flex;flex-direction:column;border-radius:12px;overflow:hidden;position:relative;}
.R *{box-sizing:border-box;margin:0;padding:0;}
.nav{height:52px;background:rgba(10,10,11,.97);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:12px;padding:0 16px;flex-shrink:0;}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;cursor:pointer;letter-spacing:-.5px;color:#f0eff4;}
.logo em{font-style:normal;color:#e05c2f;}
.srchwrap{flex:1;max-width:300px;position:relative;}
.srchwrap input{width:100%;padding:6px 11px 6px 30px;background:#18181c;border:1px solid rgba(255,255,255,.09);border-radius:18px;color:#f0eff4;font-family:'DM Sans',sans-serif;font-size:12px;outline:none;}
.srchwrap input::placeholder{color:#5c5a6e;}
.sich{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#5c5a6e;font-size:12px;pointer-events:none;}
.sp{flex:1;}
.na{display:flex;gap:6px;align-items:center;}
.btn{padding:5px 12px;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;cursor:pointer;border:none;transition:all .14s;}
.bg{background:transparent;border:1px solid rgba(255,255,255,.12);color:#9896a6;}
.bg:hover{background:#18181c;color:#f0eff4;}
.ba{background:#e05c2f;color:#fff;}
.ba:hover{background:#ff7a50;}
.bs{background:#18181c;border:1px solid rgba(255,255,255,.09);color:#f0eff4;}
.bs:hover{background:#1f1f25;}
.bd{background:rgba(217,64,64,.1);color:#d94040;border:1px solid rgba(217,64,64,.22);}
.bd:hover{background:rgba(217,64,64,.18);}
.btn:disabled{opacity:.45;cursor:not-allowed;}
.av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#e05c2f,#e8a732);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;cursor:pointer;flex-shrink:0;}
.gear{width:28px;height:28px;border-radius:50%;background:#18181c;border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer;color:#9896a6;flex-shrink:0;}
.gear:hover{color:#f0eff4;background:#1f1f25;}
.dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.body{display:flex;flex:1;overflow:hidden;}
.sb{width:168px;flex-shrink:0;background:#0a0a0b;border-right:1px solid rgba(255,255,255,.06);padding:12px 0;overflow-y:auto;}
.sbs{padding:0 8px;margin-bottom:16px;}
.sbl{font-size:9px;font-weight:500;letter-spacing:1.5px;color:#5c5a6e;text-transform:uppercase;padding:0 6px;margin-bottom:4px;}
.sbi{display:flex;align-items:center;gap:7px;padding:6px 7px;border-radius:7px;cursor:pointer;color:#9896a6;font-size:11px;transition:all .12s;user-select:none;}
.sbi:hover{background:#18181c;color:#f0eff4;}
.sbi.on{background:#18181c;color:#f0eff4;}
.sbi-up{background:rgba(224,92,47,.1);border:1px solid rgba(224,92,47,.2);color:#ff7a50;}
.sbi-up:hover{background:rgba(224,92,47,.18);}
.mn{flex:1;overflow-y:auto;overflow-x:hidden;}
.pg{padding:18px 16px;}
.hero{border-radius:12px;background:#111114;border:1px solid rgba(255,255,255,.06);padding:20px 24px;margin-bottom:18px;position:relative;overflow:hidden;}
.htag{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:20px;background:rgba(224,92,47,.1);border:1px solid rgba(224,92,47,.2);font-size:10px;font-weight:500;color:#ff7a50;letter-spacing:.4px;margin-bottom:9px;}
.hero h1{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;line-height:1.15;letter-spacing:-.8px;margin-bottom:7px;}
.hero p{font-size:11px;color:#9896a6;max-width:340px;line-height:1.7;margin-bottom:12px;}
.shdr{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;}
.stitle{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:-.2px;}
.slink{font-size:10px;color:#5c5a6e;cursor:pointer;}
.vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:11px;margin-bottom:22px;}
.vc{background:#111114;border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .17s,border-color .17s;}
.vc:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.14);}
.vc:hover .vth-ov{opacity:1;}
.vth{position:relative;overflow:hidden;aspect-ratio:16/9;background:linear-gradient(135deg,#151520,#1c1c2e);}
.vth-ov{position:absolute;inset:0;background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .17s;}
.vth-play{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:14px;padding-left:2px;}
.vi{padding:9px 10px 10px;display:flex;gap:7px;}
.vm{flex:1;min-width:0;}
.vt{font-size:11px;font-weight:500;line-height:1.35;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.vch{font-size:10px;color:#9896a6;margin-bottom:1px;}
.vst{font-size:9px;color:#5c5a6e;}
.chavat{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#5a9ef5,#1a3d6e);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;color:#fff;}
.dur{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.82);color:#fff;font-size:9px;font-weight:500;padding:2px 5px;border-radius:3px;font-family:monospace;}
.procov{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.75);gap:4px;flex-direction:column;}
.spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;}
.failov{position:absolute;inset:0;background:rgba(90,20,20,.4);display:flex;align-items:center;justify-content:center;font-size:10px;color:#f7c1c1;}
.state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 20px;color:#5c5a6e;text-align:center;gap:10px;}
.state-icon{font-size:26px;}
.state-title{font-size:13px;color:#9896a6;font-weight:500;}
.state-sub{font-size:11px;max-width:280px;line-height:1.6;}
.errbanner{background:rgba(217,64,64,.08);border:1px solid rgba(217,64,64,.25);border-radius:9px;padding:10px 13px;font-size:11px;color:#f0a0a0;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.warnbanner{background:rgba(232,167,50,.08);border:1px solid rgba(232,167,50,.25);border-radius:9px;padding:11px 14px;font-size:11px;color:#f5cf8c;margin-bottom:16px;}
.dh{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
.dav{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#e05c2f,#e8a732);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#fff;}
.dn{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;letter-spacing:-.3px;}
.ds{font-size:11px;color:#9896a6;margin-top:1px;}
.sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:16px;}
.sc{background:#111114;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:11px 13px;}
.sl{font-size:9px;color:#5c5a6e;margin-bottom:4px;letter-spacing:.5px;text-transform:uppercase;}
.sv{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;letter-spacing:-.8px;}
.tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:13px;}
.tab{padding:7px 13px;background:transparent;border:none;border-bottom:2px solid transparent;font-size:11px;font-weight:500;color:#5c5a6e;cursor:pointer;transition:all .12s;margin-bottom:-1px;}
.tab.on{color:#f0eff4;border-bottom-color:#e05c2f;}
.vtbl{background:#111114;border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden;}
.vtr{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.05);}
.vtr:last-child{border-bottom:none;}
.vtr:hover{background:#18181c;}
.vtth{width:64px;aspect-ratio:16/9;border-radius:5px;flex-shrink:0;background:linear-gradient(135deg,#151520,#1c1c2e);position:relative;overflow:hidden;}
.vtn{font-size:11px;font-weight:500;margin-bottom:2px;}
.vtm{font-size:9px;color:#5c5a6e;}
.bdg{font-size:8px;font-weight:600;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;}
.br{background:rgba(45,184,125,.1);color:#2db87d;}
.bp{background:rgba(232,167,50,.1);color:#e8a732;}
.bf{background:rgba(217,64,64,.1);color:#d94040;}
.bpu{background:rgba(59,125,216,.1);color:#5a9ef5;}
.bun{background:rgba(255,255,255,.05);color:#5c5a6e;}
.bpr{background:rgba(217,64,64,.08);color:#d94040;}
.stc{background:#111114;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:13px 15px;display:flex;align-items:center;gap:12px;margin-bottom:9px;}
.stn{font-size:12px;font-weight:500;margin-bottom:3px;display:flex;align-items:center;gap:7px;}
.stk{display:inline-flex;align-items:center;gap:4px;font-family:'DM Mono',monospace;font-size:9px;background:#18181c;color:#5c5a6e;padding:2px 7px;border-radius:3px;}
.upw{max-width:520px;margin:0 auto;}
.upt{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;letter-spacing:-.4px;margin-bottom:3px;}
.upsub{font-size:11px;color:#9896a6;margin-bottom:18px;}
.dz{border:2px dashed rgba(255,255,255,.09);border-radius:12px;padding:32px 24px;text-align:center;cursor:pointer;transition:all .2s;background:#111114;margin-bottom:16px;}
.dz:hover{border-color:#e05c2f;background:rgba(224,92,47,.03);}
.dz.hf{border-color:#2db87d;background:rgba(45,184,125,.03);cursor:default;}
.dzi{width:48px;height:48px;border-radius:50%;background:#18181c;border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:19px;margin:0 auto 10px;}
.dzt{font-size:12px;font-weight:500;margin-bottom:3px;}
.dzs{font-size:10px;color:#5c5a6e;}
.dzf{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-top:10px;}
.fpl{padding:2px 7px;border-radius:18px;background:#18181c;border:1px solid rgba(255,255,255,.07);font-size:9px;color:#5c5a6e;font-family:'DM Mono',monospace;}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.ff{grid-column:1/-1;}
.fl{display:block;font-size:9px;font-weight:500;color:#5c5a6e;margin-bottom:5px;letter-spacing:.8px;text-transform:uppercase;}
.fi{width:100%;padding:8px 10px;background:#111114;border:1px solid rgba(255,255,255,.09);border-radius:7px;color:#f0eff4;font-size:12px;outline:none;transition:border-color .17s;}
.fi:focus{border-color:#e05c2f;}
.fi::placeholder{color:#5c5a6e;}
.fsel{width:100%;padding:8px 10px;background:#111114;border:1px solid rgba(255,255,255,.09);border-radius:7px;color:#f0eff4;font-size:12px;outline:none;cursor:pointer;}
.fsel option{background:#18181c;}
.sbar{display:flex;align-items:center;justify-content:space-between;padding:12px 0 0;border-top:1px solid rgba(255,255,255,.06);margin-top:5px;}
.shi{font-size:10px;color:#5c5a6e;}
.bsub{padding:9px 22px;background:#e05c2f;color:#fff;border:none;border-radius:7px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .14s;}
.bsub:hover{background:#ff7a50;}
.bsub:disabled{background:#18181c;color:#5c5a6e;cursor:not-allowed;}
.prwrap{text-align:center;padding:36px 0;}
.pricon{width:58px;height:58px;border-radius:50%;background:rgba(224,92,47,.1);border:1px solid rgba(224,92,47,.22);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 13px;animation:ppu 1.4s ease-in-out infinite;}
@keyframes ppu{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.prtitle{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:4px;}
.prfile{font-size:10px;color:#5c5a6e;margin-bottom:20px;word-break:break-all;padding:0 20px;}
.prbarw{max-width:300px;margin:0 auto 6px;}
.prbar{height:4px;background:#18181c;border-radius:2px;overflow:hidden;}
.prfill{height:100%;background:linear-gradient(90deg,#e05c2f,#ff7a50);border-radius:2px;transition:width .2s ease;}
.prpct{font-size:10px;color:#9896a6;margin-top:4px;}
.doneicon{width:58px;height:58px;border-radius:50%;background:rgba(45,184,125,.1);border:1px solid rgba(45,184,125,.22);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px;}
.moverlay{position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px;}
.mdlg{background:#111114;border:1px solid rgba(255,255,255,.13);border-radius:14px;padding:24px 26px;width:340px;max-width:100%;position:relative;animation:mi .2s cubic-bezier(.22,.68,0,1.2);max-height:90%;overflow-y:auto;}
.mclose{position:absolute;top:12px;right:13px;background:none;border:none;color:#5c5a6e;font-size:16px;cursor:pointer;line-height:1;}
.mclose:hover{color:#f0eff4;}
.mtitle{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:6px;letter-spacing:-.3px;}
.msubtitle{font-size:11px;color:#9896a6;margin-bottom:15px;line-height:1.6;}
.mg{margin-bottom:9px;}
.mi-inp{width:100%;padding:8px 10px;background:#18181c;border:1px solid rgba(255,255,255,.09);border-radius:7px;color:#f0eff4;font-size:12px;outline:none;transition:border-color .17s;}
.mi-inp:focus{border-color:#e05c2f;}
.mi-inp::placeholder{color:#5c5a6e;}
.msub{width:100%;padding:9px;background:#e05c2f;color:#fff;border:none;border-radius:7px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .14s;margin-top:3px;}
.msub:hover{background:#ff7a50;}
.msub:disabled{background:#18181c;color:#5c5a6e;cursor:not-allowed;}
.mswitch{text-align:center;font-size:10px;color:#5c5a6e;margin-top:10px;}
.mswitch a{color:#ff7a50;cursor:pointer;}
.merr{background:rgba(217,64,64,.1);border:1px solid rgba(217,64,64,.25);border-radius:6px;padding:7px 10px;font-size:10px;color:#f7c1c1;margin-bottom:11px;}
.toast{position:absolute;bottom:14px;right:14px;z-index:99;padding:8px 13px;background:#18181c;border:1px solid rgba(255,255,255,.1);border-radius:7px;font-size:11px;color:#f0eff4;display:flex;align-items:center;gap:6px;box-shadow:0 6px 20px rgba(0,0,0,.5);transform:translateY(50px);opacity:0;transition:all .24s cubic-bezier(.22,.68,0,1.2);max-width:300px;}
.toast.show{transform:translateY(0);opacity:1;}
.tdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.upcta{background:#111114;border:1.5px dashed rgba(255,255,255,.08);border-radius:10px;padding:16px 13px;display:flex;align-items:center;gap:12px;cursor:pointer;margin-bottom:10px;transition:all .16s;}
.upcta:hover{border-color:rgba(224,92,47,.35);background:rgba(224,92,47,.03);}
.upctai{width:38px;height:38px;border-radius:50%;background:rgba(224,92,47,.1);border:1px solid rgba(224,92,47,.22);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.upctap{margin-left:auto;padding:4px 11px;background:#e05c2f;color:#fff;border-radius:5px;font-size:10px;font-weight:500;}
.pv{border-radius:20px;overflow:hidden;position:relative;background:#050608;aspect-ratio:16/9;isolation:isolate;box-shadow:0 22px 65px rgba(0,0,0,.38)}
.vp-dribbble{position:absolute;inset:0;background:#050608;overflow:hidden;border-radius:20px;color:#fff}
.vp-dribbble video{width:100%;height:100%;display:block;background:#050608;object-fit:contain;cursor:pointer}
.vp-dribbble-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(4,6,9,.72),transparent 30%,transparent 55%,rgba(4,6,9,.92) 100%),radial-gradient(circle at center,transparent 35%,rgba(0,0,0,.2) 100%)}
.vp-dribbble-ui{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;justify-content:space-between;padding:24px 28px 20px;transition:opacity .3s ease}
.vp-dribbble-ui.vp-hidden{opacity:0;pointer-events:none}
.vp-dribbble-top{display:flex;justify-content:space-between;align-items:flex-start}
.vp-title{display:flex;align-items:center;gap:12px}.vp-title b{display:block;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;letter-spacing:.2px}.vp-title small{display:block;margin-top:3px;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.3px;color:rgba(255,255,255,.5)}
.vp-playmark{width:31px;height:31px;border-radius:50%;background:rgba(255,255,255,.93);color:#080a0d;display:flex;align-items:center;justify-content:center;font-size:10px;padding-left:2px}
.vp-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:rgba(10,12,16,.25);backdrop-filter:blur(10px);color:#fff;font-size:20px;line-height:1;cursor:pointer}
.vp-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.vp-main-play{width:82px;height:82px;border:1px solid rgba(255,255,255,.55);border-radius:50%;background:rgba(255,255,255,.94);color:#080a0d;display:flex;align-items:center;justify-content:center;font-size:25px;padding-left:5px;box-shadow:0 15px 45px rgba(0,0,0,.35);cursor:pointer;transition:transform .2s ease}.vp-main-play:hover{transform:scale(1.06)} 
.vp-bottom{width:100%}.vp-timeline{display:flex;align-items:center;gap:12px;font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.68);margin-bottom:12px}.vp-track{position:relative;flex:1;height:12px;display:flex;align-items:center}.vp-track>div{position:absolute;left:0;height:3px;border-radius:5px;background:#fff;z-index:1}.vp-track:before{content:"";position:absolute;left:0;right:0;height:3px;border-radius:5px;background:rgba(255,255,255,.28)}.vp-track input{position:absolute;inset:0;width:100%;height:12px;margin:0;opacity:0;cursor:pointer;z-index:2}
.vp-controls{height:35px;display:flex;align-items:center;justify-content:space-between}.vp-control-left,.vp-control-right{display:flex;align-items:center;gap:4px}.vp-controls button{height:30px;min-width:30px;padding:0 7px;border:0;border-radius:7px;background:transparent;color:rgba(255,255,255,.86);font-size:10px;cursor:pointer}.vp-controls button:hover{background:rgba(255,255,255,.1);color:#fff}.vp-volume{width:55px}.vp-volume input{width:100%;height:3px;accent-color:#fff}
.vp-control-center{display:flex;align-items:center;gap:8px;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:2px;color:rgba(255,255,255,.48)}.vp-control-center i{width:4px;height:4px;border-radius:50%;background:#ef3340;box-shadow:0 0 0 4px rgba(239,51,64,.1)}
.vp-dribbble:fullscreen{border-radius:0}.vp-full{border-radius:0}
@media(max-width:700px){.vp-dribbble-ui{padding:16px 15px 13px}.vp-main-play{width:62px;height:62px;font-size:19px}.vp-title b{font-size:11px}.vp-control-center{display:none}.vp-volume{display:none}.vp-timeline{gap:8px}.vp-close{width:30px;height:30px}}
.pv-fallback{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:#9896a6;font-size:11px;text-align:center;padding:20px}
@media(max-width:700px){.premium-player-ui{padding:12px}.premium-pill{font-size:11px;padding:5px 10px}.premium-play{width:54px;height:54px;font-size:20px}.premium-control{font-size:10px;padding:5px 8px}.premium-time{font-size:10px}}
.ptitle{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;letter-spacing:-.3px;margin:11px 0 6px;}
.pmeta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:9px;}
.pch{display:flex;align-items:center;gap:7px;flex:1;}
.pst{font-size:11px;color:#9896a6;}
.pdesc{background:#111114;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px 12px;font-size:11px;color:#9896a6;line-height:1.7;}
.setuprow{display:flex;gap:7px;margin-bottom:8px;}
.spin-big{width:22px;height:22px;border:3px solid rgba(255,255,255,.15);border-top-color:#e05c2f;border-radius:50%;animation:sp .7s linear infinite;margin:0 auto;}
.copybox{display:flex;align-items:center;gap:6px;background:#18181c;border:1px solid rgba(255,255,255,.09);border-radius:6px;padding:6px 9px;font-family:'DM Mono',monospace;font-size:10px;color:#9896a6;word-break:break-all;margin-top:4px;}
`;

function defaultApiGuess() {
  if (typeof window !== "undefined" && window.location && window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }
  return "";
}

function PremiumVideoPlayer({ src, title }) {
  const videoRef=useRef(null), idleRef=useRef(null), playerRef=useRef(null);
  const [playing,setPlaying]=useState(false),[current,setCurrent]=useState(0),[duration,setDuration]=useState(0),[visible,setVisible]=useState(true);
  const [muted,setMuted]=useState(false),[volume,setVolume]=useState(.8),[fullscreen,setFullscreen]=useState(false);
  const show=useCallback(()=>{setVisible(true);clearTimeout(idleRef.current);idleRef.current=setTimeout(()=>setVisible(false),3200)},[]);
  useEffect(()=>{show();return()=>clearTimeout(idleRef.current)},[show,src]);
  useEffect(()=>{const v=videoRef.current;if(!v)return;const t=()=>setCurrent(v.currentTime||0),d=()=>setDuration(Number.isFinite(v.duration)?v.duration:0),p=()=>setPlaying(true),q=()=>setPlaying(false);v.addEventListener("timeupdate",t);v.addEventListener("loadedmetadata",d);v.addEventListener("durationchange",d);v.addEventListener("play",p);v.addEventListener("pause",q);return()=>{v.removeEventListener("timeupdate",t);v.removeEventListener("loadedmetadata",d);v.removeEventListener("durationchange",d);v.removeEventListener("play",p);v.removeEventListener("pause",q)}},[src]);
  const toggle=()=>{const v=videoRef.current;if(!v)return;v.paused?v.play().catch(()=>{}):v.pause();show()};
  const seek=e=>{const v=videoRef.current;if(!v)return;v.currentTime=Number(e.target.value);setCurrent(v.currentTime);show()};
  const mute=()=>{const v=videoRef.current;if(!v)return;v.muted=!v.muted;setMuted(v.muted);show()};
  const changeVolume=e=>{const n=Number(e.target.value),v=videoRef.current;if(!v)return;v.volume=n;v.muted=n===0;setVolume(n);setMuted(n===0);show()};
  const full=async()=>{try{if(!document.fullscreenElement){await playerRef.current.requestFullscreen();setFullscreen(true)}else{await document.exitFullscreen();setFullscreen(false)}}catch{}show()};
  const fmt=n=>{n=Math.max(0,Math.floor(Number(n)||0));return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")};
  const progress=duration?(current/duration)*100:0;
  return <div ref={playerRef} className={`vp-dribbble${fullscreen?" vp-full":""}`} onMouseMove={show} onMouseEnter={show}>
    <video ref={videoRef} src={src} playsInline preload="metadata" aria-label={title||"Videoplex video"} onClick={toggle}/>
    <div className="vp-dribbble-shade"/>
    <div className={`vp-dribbble-ui${visible?"":" vp-hidden"}`}>
      <div className="vp-dribbble-top">
        <div className="vp-title"><span className="vp-playmark">▶</span><div><b>{title||"Videoplex"}</b><small>NOW PLAYING</small></div></div>
        <button type="button" className="vp-close" aria-label="Close player">×</button>
      </div>
      <div className="vp-center">
        <button type="button" className="vp-main-play" onClick={toggle} aria-label={playing?"Pause":"Play"}>{playing?"Ⅱ":"▶"}</button>
      </div>
      <div className="vp-bottom">
        <div className="vp-timeline">
          <span>{fmt(current)}</span>
          <div className="vp-track"><div style={{width:progress+"%"}}/><input type="range" min="0" max={duration||0} step=".1" value={Math.min(current,duration||0)} onChange={seek} aria-label="Video progress"/></div>
          <span>-{fmt(Math.max(0,duration-current))}</span>
        </div>
        <div className="vp-controls">
          <div className="vp-control-left">
            <button onClick={toggle} aria-label={playing?"Pause":"Play"}>{playing?"Ⅱ":"▶"}</button>
            <button onClick={mute} aria-label={muted?"Unmute":"Mute"}>{muted?"⌁":"◖"}</button>
            <div className="vp-volume"><input type="range" min="0" max="1" step=".05" value={muted?0:volume} onChange={changeVolume} aria-label="Volume"/></div>
          </div>
          <div className="vp-control-center"><span>VIDEOPLEX</span><i/></div>
          <div className="vp-control-right">
            <button>CC</button><button>HD</button><button onClick={full} aria-label="Fullscreen">{fullscreen?"×":"⛶"}</button>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
export default function App() {
  // ── Connection & auth state ──────────────────────────────────────────
  const [apiUrl, setApiUrl] = useState("");
  const [apiUrlDraft, setApiUrlDraft] = useState(defaultApiGuess());
  const [connState, setConnState] = useState("checking"); // checking | unset | connecting | ok | error
  const [connError, setConnError] = useState("");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [storageReady, setStorageReady] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────
  const [page, setPage] = useState("home");
  const [modal, setModal] = useState(null); // 'auth' | 'settings' | 'createChannel'
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [chanForm, setChanForm] = useState({ name: "", description: "" });
  const [chanErr, setChanErr] = useState("");
  const [chanBusy, setChanBusy] = useState(false);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState(null);
  const tref = useRef(null);

  // ── Data state ────────────────────────────────────────────────────────
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosErr, setVideosErr] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [dashTab, setDashTab] = useState("videos");
  const [liveStreams, setLiveStreams] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveErr, setLiveErr] = useState("");
  const [liveForm, setLiveForm] = useState({ title: "" });

  // ── Upload state ──────────────────────────────────────────────────────
  const [ups, setUps] = useState("idle"); // idle | form | uploading | done | error
  const [file, setFile] = useState(null);
  const [upf, setUpf] = useState({ title: "", desc: "", vis: "PUBLIC" });
  const [pct, setPct] = useState(0);
  const [upErr, setUpErr] = useState("");

  const notify = useCallback((msg, err = false) => {
    clearTimeout(tref.current);
    setToast({ msg, err });
    tref.current = setTimeout(() => setToast(null), 3800);
  }, []);

  // ── Persistent storage load ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const savedUrl = await window.storage.get("videoplex:apiUrl", false);
        if (savedUrl?.value) {
          setApiUrl(savedUrl.value);
          setApiUrlDraft(savedUrl.value);
        } else {
          setConnState("unset");
        }
      } catch {
        setConnState("unset");
      }
      try {
        const savedToken = await window.storage.get("videoplex:token", false);
        if (savedToken?.value) setToken(savedToken.value);
      } catch {}
      setStorageReady(true);
    })();
  }, []);

  // ── Fetch wrapper ────────────────────────────────────────────────────
  const req = useCallback(async (method, path, body) => {
    if (!apiUrl) throw new Error("No backend connected");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";
    let res;
    try {
      res = await fetch(`${apiUrl}${path}`, {
        method, headers, body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error("Network error — is the backend running and reachable from this browser?");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }, [apiUrl, token]);

  // ── Test connection ──────────────────────────────────────────────────
  const testConnection = useCallback(async (url) => {
    setConnState("connecting");
    setConnError("");
    try {
      const res = await fetch(`${url}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== "ok") throw new Error("Unexpected response from /api/health");
      setApiUrl(url);
      localStorage.setItem("videoplex:apiUrl", url);
      setConnState("ok");
      notify("Connected to backend");
    } catch (e) {
      setConnState("error");
      setConnError(e.message === "Failed to fetch"
        ? "Couldn't reach that URL. Check it's running, publicly accessible, and CORS allows this origin."
        : e.message);
    }
  }, [notify]);

  // ── Load current user once connected + token present ─────────────────
  useEffect(() => {
    if (!storageReady || connState !== "ok" || !token) return;
    (async () => {
      try {
        const { user: u } = await req("GET", "/api/auth/me");
        setUser(u);
        setChannel(u.channel || null);
      } catch (e) {
        setToken(null);
        window.storage.delete("videoplex:token", false).catch(() => {});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, connState, token]);

  // Re-check connection once apiUrl is loaded from storage
  useEffect(() => {
    if (storageReady && apiUrl && connState === "unset") {
      testConnection(apiUrl);
    } else if (storageReady && !apiUrl) {
      setConnState("unset");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady]);

  // ── Load public video feed ────────────────────────────────────────────
  const loadVideos = useCallback(async () => {
    if (connState !== "ok") return;
    setVideosLoading(true);
    setVideosErr("");
    try {
      const data = await req("GET", `/api/videos?limit=24${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      setVideos(data.videos || []);
    } catch (e) {
      setVideosErr(e.message);
    } finally {
      setVideosLoading(false);
    }
  }, [connState, q, req]);

  useEffect(() => { if (page === "home") loadVideos(); }, [page, connState]); // eslint-disable-line
  useEffect(() => {
    if (page !== "home") return;
    const t = setTimeout(loadVideos, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // ── Load own live streams ─────────────────────────────────────────────
  const loadLive = useCallback(async () => {
    if (connState !== "ok" || !token) return;
    setLiveLoading(true); setLiveErr("");
    try {
      const data = await req("GET", "/api/live");
      setLiveStreams(data || []);
    } catch (e) {
      setLiveErr(e.message);
    } finally {
      setLiveLoading(false);
    }
  }, [connState, token, req]);

  useEffect(() => { if (page === "dashboard" && dashTab === "live") loadLive(); }, [page, dashTab]); // eslint-disable-line

  // ── Auth actions ──────────────────────────────────────────────────────
  const doAuth = async () => {
    setAuthErr("");
    if (!authForm.email || !authForm.password) { setAuthErr("Email and password are required"); return; }
    setAuthBusy(true);
    try {
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password, name: authForm.name };
      const data = await req("POST", path, body);
      setToken(data.token);
      setUser(data.user);
      setChannel(data.user.channel || null);
      await window.storage.set("videoplex:token", data.token, false).catch(() => {});
      setModal(null);
      setAuthForm({ email: "", password: "", name: "" });
      notify(authMode === "login" ? `Welcome back, ${data.user.name || data.user.email}!` : "Account created!");
    } catch (e) {
      setAuthErr(e.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const doLogout = async () => {
    setToken(null); setUser(null); setChannel(null);
    await window.storage.delete("videoplex:token", false).catch(() => {});
    go("home");
    notify("Signed out");
  };

  const createChannel = async () => {
    setChanErr("");
    if (!chanForm.name) { setChanErr("Channel name is required"); return; }
    setChanBusy(true);
    try {
      const c = await req("POST", "/api/channels", chanForm);
      setChannel(c);
      setModal(null);
      setChanForm({ name: "", description: "" });
      notify("Channel created!");
    } catch (e) {
      setChanErr(e.message);
    } finally {
      setChanBusy(false);
    }
  };

  // ── Navigation guards ────────────────────────────────────────────────
  const go = (p) => { setPage(p); setActiveVideo(null); };
  const requireAuth = (p) => {
    if (connState !== "ok") { setModal("settings"); return; }
    if (!token) { setAuthMode("login"); setModal("auth"); return; }
    go(p);
  };
  const requireChannel = (p) => {
    if (!channel) { setModal("createChannel"); return; }
    go(p);
  };

  const openPlayer = async (v) => {
    setActiveVideo(v);
    setPage("player");
    try {
      const full = await req("GET", `/api/videos/${v.id}`);
      setActiveVideo(full);
    } catch {}
  };

  // ── Upload flow (real Mux XHR upload) ────────────────────────────────
  const startUpload = async () => {
    if (!upf.title || !file) return;
    setUps("uploading"); setPct(0); setUpErr("");
    try {
      const { url, uploadId } = await req("GET", "/api/videos/upload-url");
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Mux upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error while uploading to Mux"));
        xhr.send(file);
      });
      await req("POST", "/api/videos/confirm", { uploadId, title: upf.title, description: upf.desc, visibility: upf.vis });
      setUps("done");
    } catch (e) {
      setUpErr(e.message);
      setUps("error");
    }
  };

  const resetUpload = () => {
    setUps("idle"); setFile(null); setPct(0); setUpErr("");
    setUpf({ title: "", desc: "", vis: "PUBLIC" });
  };

  const createLiveStream = async () => {
    if (!liveForm.title) return;
    try {
      await req("POST", "/api/live", { title: liveForm.title });
      setLiveForm({ title: "" });
      notify("Live stream created — grab your stream key below");
      loadLive();
    } catch (e) {
      notify(e.message, true);
    }
  };

  const endLiveStream = async (id) => {
    try {
      await req("POST", `/api/live/${id}/end`);
      notify("Stream ended");
      loadLive();
    } catch (e) {
      notify(e.message, true);
    }
  };

  const initials = (name) => (name || "?")[0]?.toUpperCase();
  const chAvatarGrad = (seed) => {
    const grads = ["#5a9ef5,#1a3d6e", "#2db87d,#0f3325", "#ff7a50,#3a1a0a", "#e8a732,#5c3a08"];
    const i = (seed || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % grads.length;
    return grads[i];
  };

  const devVids = videos.filter(v => channel && v.channelId === channel.id);
  const canPlayHls = typeof document !== "undefined" &&
    document.createElement("video").canPlayType("application/vnd.apple.mpegurl") !== "";

  // ═══════════════════════════════════════════════════════════════════
  // SETUP SCREEN — no backend connected yet
  // ═══════════════════════════════════════════════════════════════════
  if (connState === "unset" || connState === "connecting" || connState === "error" || !storageReady) {
    return (
      <div className="R">
        <style>{S}</style>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 380, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div className="logo" style={{ fontSize: 20, justifyContent: "center", display: "flex", marginBottom: 8 }}>▶ <em>video</em>plex</div>
              <div style={{ fontSize: 12, color: "#9896a6", lineHeight: 1.6 }}>
                Connect this app to your live Videoplex backend to browse real videos, upload to Mux, and manage your channel.
              </div>
            </div>
            {connError && <div className="errbanner">⚠ {connError}</div>}
            <label className="fl">Backend API URL</label>
            <div className="setuprow">
              <input className="fi" placeholder="https://your-api.example.com" value={apiUrlDraft}
                onChange={e => setApiUrlDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && apiUrlDraft) testConnection(apiUrlDraft.replace(/\/$/, "")); }} />
            </div>
            <button className="bsub" style={{ width: "100%", justifyContent: "center" }}
              disabled={!apiUrlDraft || connState === "connecting"}
              onClick={() => testConnection(apiUrlDraft.replace(/\/$/, ""))}>
              {connState === "connecting" ? "Connecting…" : "Connect"}
            </button>
            <div style={{ marginTop: 18, fontSize: 10, color: "#5c5a6e", lineHeight: 1.7, background: "#111114", border: "1px solid rgba(255,255,255,.06)", borderRadius: 9, padding: "12px 14px" }}>
              <strong style={{ color: "#9896a6" }}>Before connecting:</strong><br />
              1. Deploy or expose your Express API (e.g. Render, Fly.io, or ngrok for local dev).<br />
              2. Set <code style={{ color: "#ff7a50" }}>FRONTEND_URL</code> in its .env to this page's origin so CORS allows it.<br />
              3. Enter the public URL above — it's saved for next time.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAIN APP
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="R">
      <style>{S}</style>

      <nav className="nav">
        <div className="logo" onClick={() => go("home")}>▶ <em>video</em>plex</div>
        <div className="srchwrap">
          <span className="sich">⌕</span>
          <input value={q} onChange={e => { setQ(e.target.value); go("home"); }} placeholder="Search videos…" />
        </div>
        <div className="sp" />
        <div className="na">
          <div className="dot" style={{ background: "#2db87d" }} title="Connected" />
          <button className="btn bs" onClick={() => requireAuth("upload")} style={{ display: "flex", alignItems: "center", gap: 4 }}>⬆ Upload</button>
          {token ? (
            <>
              <button className="btn bg" onClick={() => go("dashboard")}>Dashboard</button>
              <div className="av" onClick={() => setModal("account")}>{initials(user?.name || user?.email)}</div>
            </>
          ) : (
            <>
              <button className="btn bg" onClick={() => { setAuthMode("login"); setModal("auth"); }}>Sign in</button>
              <button className="btn ba" onClick={() => { setAuthMode("register"); setModal("auth"); }}>Get started</button>
            </>
          )}
          <div className="gear" onClick={() => { setApiUrlDraft(apiUrl); setModal("settings"); }} title="Settings">⚙</div>
        </div>
      </nav>

      <div className="body">
        <aside className="sb">
          <div className="sbs">
            <div className={`sbi${page==="home"?" on":""}`} onClick={() => go("home")}><span>⌂</span> Home</div>
          </div>
          <div className="sbs">
            <div className="sbl">Your stuff</div>
            <div className={`sbi${page==="dashboard"?" on":""}`} onClick={() => requireAuth("dashboard")}><span>▦</span> Dashboard</div>
            <div className={`sbi sbi-up${page==="upload"?" on":""}`} onClick={() => { if (!token) { setAuthMode("login"); setModal("auth"); return; } requireChannel("upload"); }}><span>⬆</span> Upload video</div>
          </div>
        </aside>

        <main className="mn">

          {/* HOME */}
          {page === "home" && (
            <div className="pg">
              {!q && (
                <div className="hero">
                  <div className="htag">● Live on {apiUrl.replace(/^https?:\/\//, "")}</div>
                  <h1>Your content. Your audience.</h1>
                  <p>Upload, stream live, and organize your videos — all powered by Mux.</p>
                  <div style={{ display: "flex", gap: 7 }}>
                    <button className="btn ba" onClick={() => { if (!token) { setAuthMode("login"); setModal("auth"); return; } requireChannel("upload"); }}>⬆ Upload video</button>
                    {!token && <button className="btn bg" style={{ fontSize: 10 }} onClick={() => { setAuthMode("register"); setModal("auth"); }}>Create account</button>}
                  </div>
                </div>
              )}

              <div className="shdr">
                <div className="stitle">{q ? `Results for "${q}"` : "All videos"}</div>
                {!videosLoading && <a className="slink" onClick={loadVideos}>Refresh</a>}
              </div>

              {videosLoading && (
                <div className="state"><div className="spin-big" /><div className="state-title">Loading videos…</div></div>
              )}
              {!videosLoading && videosErr && (
                <div className="state">
                  <div className="state-icon">⚠</div>
                  <div className="state-title">Couldn't load videos</div>
                  <div className="state-sub">{videosErr}</div>
                  <button className="btn bg" onClick={loadVideos}>Try again</button>
                </div>
              )}
              {!videosLoading && !videosErr && videos.length === 0 && (
                <div className="state">
                  <div className="state-icon">🎬</div>
                  <div className="state-title">No public videos yet</div>
                  <div className="state-sub">Once a video finishes processing on Mux, it'll show up here.</div>
                </div>
              )}
              {!videosLoading && !videosErr && videos.length > 0 && (
                <div className="vgrid">
                  {videos.map(v => (
                    <div key={v.id} className="vc" onClick={() => openPlayer(v)}>
                      <div className="vth">
                        {v.status === "PROCESSING" && <div className="procov"><div className="spinner" />Processing…</div>}
                        {v.status === "FAILED" && <div className="failov">⚠ Failed</div>}
                        {v.status === "READY" && <div className="vth-ov"><div className="vth-play">▶</div></div>}
                        {v.duration ? <div className="dur">{Math.floor(v.duration/60)}:{String(v.duration%60).padStart(2,"0")}</div> : null}
                      </div>
                      <div className="vi">
                        <div className="chavat" style={{ background: `linear-gradient(135deg, ${chAvatarGrad(v.channel?.name)})` }}>
                          {initials(v.channel?.name)}
                        </div>
                        <div className="vm">
                          <div className="vt">{v.title}</div>
                          <div className="vch">{v.channel?.name || "Unknown channel"}</div>
                          <div className="vst">{v.views} views</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PLAYER */}
          {page === "player" && activeVideo && (
            <div className="pg">
              <div className="pv">
                {activeVideo.status === "READY" && (activeVideo.streamUrl || activeVideo.muxPlaybackId) ? (
                  activeVideo.streamUrl ? (
  <PremiumVideoPlayer src={activeVideo.streamUrl} title={activeVideo.title} />
) : canPlayHls ? (
  <PremiumVideoPlayer src={`https://stream.mux.com/${activeVideo.muxPlaybackId}.m3u8`} title={activeVideo.title} />
) : (
                    <div className="pv-fallback">
                      <div style={{ fontSize: 24 }}>▶</div>
                      <div>This browser can't play HLS inline.</div>
                      <a href={`https://stream.mux.com/${activeVideo.muxPlaybackId}.m3u8`} target="_blank" rel="noreferrer"
                        style={{ color: "#ff7a50", fontSize: 11 }}>Open stream in new tab ↗</a>
                    </div>
                  )
                ) : (
                  <div className="pv-fallback">
                    {activeVideo.status === "FAILED"
                      ? <><div style={{ fontSize:24 }}>⚠</div><div>This video failed to process on Mux.</div></>
                      : <><div className="spinner" style={{ width:20, height:20 }} /><div>Still processing on Mux — check back shortly.</div>
                          <button className="btn bg" onClick={() => openPlayer(activeVideo)}>Refresh status</button></>}
                  </div>
                )}
              </div>
              <div className="ptitle">{activeVideo.title}</div>
              <div className="pmeta">
                <div className="pch">
                  <div className="chavat" style={{ background: `linear-gradient(135deg, ${chAvatarGrad(activeVideo.channel?.name)})` }}>
                    {initials(activeVideo.channel?.name)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{activeVideo.channel?.name}</div>
                </div>
                <div className="pst">{activeVideo.views} views</div>
              </div>
              {activeVideo.description && <div className="pdesc">{activeVideo.description}</div>}
            </div>
          )}

          {/* DASHBOARD */}
          {page === "dashboard" && (
            <div className="pg">
              {!channel ? (
                <div className="state">
                  <div className="state-icon">◎</div>
                  <div className="state-title">You don't have a channel yet</div>
                  <div className="state-sub">Create one to start uploading videos and going live.</div>
                  <button className="btn ba" onClick={() => setModal("createChannel")}>Create channel</button>
                </div>
              ) : (
                <>
                  <div className="dh">
                    <div className="dav">{initials(channel.name)}</div>
                    <div><div className="dn">{channel.name}</div><div className="ds">{channel.description || "No description"}</div></div>
                    <div style={{ flex: 1 }} />
                    <button className="btn ba" onClick={() => go("upload")}>+ Upload Video</button>
                  </div>
                  <div className="sgrid">
                    <div className="sc"><div className="sl">Your videos</div><div className="sv">{devVids.length}</div></div>
                    <div className="sc"><div className="sl">Total views</div><div className="sv">{devVids.reduce((a,v)=>a+(v.views||0),0)}</div></div>
                    <div className="sc"><div className="sl">Live streams</div><div className="sv">{liveStreams.length}</div></div>
                  </div>
                  <div className="tabs">
                    {["videos","live"].map(t => (
                      <button key={t} className={`tab${dashTab===t?" on":""}`} onClick={() => setDashTab(t)} style={{ textTransform:"capitalize" }}>{t}</button>
                    ))}
                  </div>

                  {dashTab === "videos" && (
                    <>
                      <div className="upcta" onClick={() => go("upload")}>
                        <div className="upctai">⬆</div>
                        <div>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, marginBottom:2 }}>Upload a new video</div>
                          <div style={{ fontSize:10, color:"#5c5a6e" }}>MP4, MOV, AVI · up to 4 GB · powered by Mux</div>
                        </div>
                        <div className="upctap">Upload ↗</div>
                      </div>
                      {videosLoading && <div className="state"><div className="spin-big" /></div>}
                      {!videosLoading && devVids.length === 0 && (
                        <div className="state"><div className="state-icon">🎬</div><div className="state-title">No videos yet</div></div>
                      )}
                      {!videosLoading && devVids.length > 0 && (
                        <div className="vtbl">
                          {devVids.map(v => (
                            <div key={v.id} className="vtr" onClick={() => openPlayer(v)} style={{ cursor:"pointer" }}>
                              <div className="vtth">
                                {v.status === "PROCESSING" && <div className="procov"><div className="spinner" style={{width:10,height:10}} /></div>}
                              </div>
                              <div style={{ flex:1 }}>
                                <div className="vtn">{v.title}</div>
                                <div className="vtm">{v.views} views</div>
                              </div>
                              <span className={`bdg ${v.status==="READY"?"br":v.status==="PROCESSING"?"bp":"bf"}`}>{v.status}</span>
                              <span className={`bdg ${v.visibility==="PUBLIC"?"bpu":v.visibility==="UNLISTED"?"bun":"bpr"}`}>{v.visibility}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {dashTab === "live" && (
                    <>
                      <div className="fg" style={{ marginBottom: 12 }}>
                        <input className="fi" placeholder="Stream title" value={liveForm.title}
                          onChange={e => setLiveForm({ title: e.target.value })} style={{ gridColumn: "1/3" }} />
                      </div>
                      <button className="btn ba" style={{ marginBottom: 14 }} disabled={!liveForm.title} onClick={createLiveStream}>+ Create live stream</button>

                      {liveLoading && <div className="state"><div className="spin-big" /></div>}
                      {!liveLoading && liveErr && <div className="errbanner">⚠ {liveErr}</div>}
                      {!liveLoading && !liveErr && liveStreams.length === 0 && (
                        <div className="state"><div className="state-icon">◉</div><div className="state-title">No live streams yet</div></div>
                      )}
                      {!liveLoading && liveStreams.map(s => (
                        <div key={s.id} className="stc">
                          <div style={{ flex:1 }}>
                            <div className="stn">
                              {s.title}
                              <span className="bdg" style={{ background: s.status==="LIVE" ? "rgba(217,64,64,.1)" : "rgba(255,255,255,.05)", color: s.status==="LIVE" ? "#d94040" : "#5c5a6e" }}>{s.status}</span>
                            </div>
                            <div className="stk">⚿ {s.streamKey}</div>
                            <div style={{ fontSize: 9, color: "#5c5a6e", marginTop: 4 }}>Ingest: rtmps://global-live.mux.com:443/app</div>
                          </div>
                          {s.status === "LIVE" && <button className="btn bd" onClick={() => endLiveStream(s.id)}>End stream</button>}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* UPLOAD */}
          {page === "upload" && (
            <div className="pg">
              <div className="upw">
                <div className="upt">Upload a video</div>
                <div className="upsub">Uploads go directly to Mux via a signed URL from your backend.</div>

                {ups === "idle" && (
                  <label className="dz" style={{ display: "block" }}>
                    <input type="file" accept="video/*" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setUps("form"); } }} />
                    <div className="dzi">⬆</div>
                    <div className="dzt">Click to choose a video file</div>
                    <div className="dzs">or drag and drop</div>
                    <div className="dzf">{["MP4","MOV","AVI","MKV","WebM"].map(f => <span key={f} className="fpl">{f}</span>)}</div>
                  </label>
                )}

                {ups === "form" && file && (
                  <>
                    <div className="dz hf">
                      <div className="dzi" style={{ fontSize:18 }}>🎬</div>
                      <div className="dzt">{file.name}</div>
                      <div className="dzs">{(file.size/1024/1024).toFixed(1)} MB · ready to upload</div>
                    </div>
                    <div className="fg">
                      <div className="ff">
                        <label className="fl">Video title *</label>
                        <input className="fi" type="text" placeholder="e.g. Building a REST API"
                          value={upf.title} onChange={e => setUpf(f => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div className="ff">
                        <label className="fl">Description</label>
                        <textarea className="fi" rows={2} placeholder="What's this video about?"
                          value={upf.desc} onChange={e => setUpf(f => ({ ...f, desc: e.target.value }))} style={{ resize:"vertical" }} />
                      </div>
                      <div className="ff">
                        <label className="fl">Visibility</label>
                        <select className="fsel" value={upf.vis} onChange={e => setUpf(f => ({ ...f, vis: e.target.value }))}>
                          <option value="PUBLIC">🌍 Public</option>
                          <option value="UNLISTED">🔗 Unlisted</option>
                          <option value="PRIVATE">🔒 Private</option>
                        </select>
                      </div>
                    </div>
                    <div className="sbar">
                      <div className="shi">{file.name}</div>
                      <button className="bsub" disabled={!upf.title} onClick={startUpload}>⬆ Upload to Mux</button>
                    </div>
                  </>
                )}

                {ups === "uploading" && (
                  <div className="prwrap">
                    <div className="pricon">⬆</div>
                    <div className="prtitle">Uploading to Mux…</div>
                    <div className="prfile">{file?.name}</div>
                    <div className="prbarw">
                      <div className="prbar"><div className="prfill" style={{ width:`${pct}%` }} /></div>
                      <div className="prpct">{pct}%</div>
                    </div>
                  </div>
                )}

                {ups === "error" && (
                  <div className="prwrap">
                    <div className="state-icon">⚠</div>
                    <div className="prtitle">Upload failed</div>
                    <div className="prfile">{upErr}</div>
                    <button className="btn ba" onClick={() => setUps("form")}>Try again</button>
                  </div>
                )}

                {ups === "done" && (
                  <div style={{ textAlign:"center", padding:"36px 0" }}>
                    <div className="doneicon">✓</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, marginBottom:5 }}>Upload complete!</div>
                    <div style={{ fontSize:11, color:"#9896a6", marginBottom:18 }}>Mux is processing your video now. It'll appear as READY on your dashboard shortly.</div>
                    <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                      <button className="btn ba" onClick={resetUpload}>Upload another</button>
                      <button className="btn bg" onClick={() => { go("dashboard"); loadVideos(); }}>Go to dashboard</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SETTINGS MODAL */}
      {modal === "settings" && (
        <div className="moverlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="mdlg">
            <button className="mclose" onClick={() => setModal(null)}>×</button>
            <div className="mtitle">Backend connection</div>
            <div className="msubtitle">Point this app at your deployed Videoplex API.</div>
            {connError && <div className="merr">⚠ {connError}</div>}
            <div className="mg">
              <label className="fl">API URL</label>
              <input className="mi-inp" placeholder="https://your-api.example.com" value={apiUrlDraft} onChange={e => setApiUrlDraft(e.target.value)} />
            </div>
            <button className="msub" disabled={!apiUrlDraft || connState === "connecting"}
              onClick={() => testConnection(apiUrlDraft.replace(/\/$/, ""))}>
              {connState === "connecting" ? "Connecting…" : "Reconnect"}
            </button>
            {token && (
              <button className="btn bd" style={{ width: "100%", marginTop: 10, justifyContent: "center", display:"flex" }} onClick={() => { doLogout(); setModal(null); }}>Sign out</button>
            )}
          </div>
        </div>
      )}

      {/* ACCOUNT MODAL */}
      {modal === "account" && user && (
        <div className="moverlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="mdlg">
            <button className="mclose" onClick={() => setModal(null)}>×</button>
            <div className="mtitle">{user.name || user.email}</div>
            <div className="msubtitle">{user.email} · {user.role}</div>
            {channel && <div style={{ fontSize: 11, color: "#9896a6", marginBottom: 14 }}>Channel: <strong style={{ color:"#f0eff4" }}>{channel.name}</strong></div>}
            <button className="btn bd" style={{ width: "100%", justifyContent: "center", display:"flex" }} onClick={() => { doLogout(); setModal(null); }}>Sign out</button>
          </div>
        </div>
      )}

      {/* CREATE CHANNEL MODAL */}
      {modal === "createChannel" && (
        <div className="moverlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="mdlg">
            <button className="mclose" onClick={() => setModal(null)}>×</button>
            <div className="mtitle">Create your channel</div>
            <div className="msubtitle">You need a channel before you can upload videos or go live.</div>
            {chanErr && <div className="merr">⚠ {chanErr}</div>}
            <div className="mg">
              <label className="fl">Channel name</label>
              <input className="mi-inp" placeholder="e.g. DevChannel" value={chanForm.name} onChange={e => setChanForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="mg">
              <label className="fl">Description</label>
              <input className="mi-inp" placeholder="What's your channel about?" value={chanForm.description} onChange={e => setChanForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button className="msub" disabled={chanBusy || !chanForm.name} onClick={createChannel}>{chanBusy ? "Creating…" : "Create channel"}</button>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {modal === "auth" && (
        <div className="moverlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="mdlg">
            <button className="mclose" onClick={() => setModal(null)}>×</button>
            <div className="mtitle">{authMode === "login" ? "Welcome back" : "Create account"}</div>
            {authErr && <div className="merr">⚠ {authErr}</div>}
            {authMode === "register" && (
              <div className="mg">
                <label className="fl">Name</label>
                <input className="mi-inp" type="text" placeholder="Your name" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            )}
            <div className="mg">
              <label className="fl">Email</label>
              <input className="mi-inp" type="email" placeholder="you@example.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="mg">
              <label className="fl">Password</label>
              <input className="mi-inp" type="password" placeholder="••••••••" value={authForm.password}
                onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") doAuth(); }} />
            </div>
            <button className="msub" disabled={authBusy} onClick={doAuth}>{authBusy ? "…" : (authMode === "login" ? "Sign in" : "Create account")}</button>
            <div className="mswitch">
              {authMode === "login" ? "No account? " : "Already have one? "}
              <a onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthErr(""); }}>
                {authMode === "login" ? "Create one" : "Sign in"}
              </a>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast show">
          <div className="tdot" style={{ background: toast.err ? "#d94040" : "#2db87d" }} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
