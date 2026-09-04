/* =========================================================
   COTOZUTE — HERO TECH LAYERS  (画像を一切使わない演出レイヤー)
   back  : 女性の「奥」に何階層も / front : 体から下だけ「手前」
   v3 : 流線の描き方を4案から選べるようにした。
        CFG.flowMode = 'ripple' | 'field' | 'mesh' | 'ribbon' | 'off'
   ========================================================= */
(function(){
'use strict';

var CFG = {
  flowMode  : 'field3d',/* 流線：field=平面の流れ場 field3d=立体の流れ場 off=なし */
  space     : 'fall',   /* 奥行き演出：fall=波形の面 off=なし（depth=立体ネットは不採用） */
  stringsOn : false,    /* 弦は不採用 */
  moire     : true,     /* 干渉縞（モアレ） */
  scan      : false,    /* 走査線は不採用 */
  density   : 1.00,
  speed     : 1.00,
  strength  : 1.00,
  parallax  : 1.00,
  frontOn   : true
};

var hero = document.querySelector('.hero');
var cvB  = document.getElementById('czTechBack');
var cvF  = document.getElementById('czTechFront');
if(!hero || !cvB || !cvF || !window.requestAnimationFrame) return;

var ctxB = cvB.getContext('2d');
var ctxF = cvF.getContext('2d');

var GOLD =[174,135, 66], GOLD2=[201,168,104], INK=[ 46, 62, 96], INK2=[ 96,116,152];
function rgba(c,a){ a = (a>=0)? (a>1?1:a) : 0; return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a.toFixed(3)+')'; }

var CORES = navigator.hardwareConcurrency || 4;
var LOW   = CORES <= 4;
var W=0, H=0, DPR=1, SM=false, MINWH=0;

function nz(x){ return (Math.sin(x)+Math.sin(x*2.31+1.7)*0.62+Math.sin(x*4.13+4.2)*0.34)/1.96; }

var S = {};

/* =========================================================
   シーン定義
   ========================================================= */
function build(){
  SM = W < 760;
  MINWH = Math.min(W,H);
  var q = (LOW?0.62:1) * CFG.density;
  var mode = CFG.flowMode;

  /* 円のオブジェクト（円相リング）は不採用。 */
  S.rings = [];

  /* --- 流線（モード別） --- */
  S.ripples = (mode==='ripple') ? buildRipple(q) : null;
  S.guil    = (mode==='guilloche')? buildGuil(q)  : null;
  S.strings = CFG.stringsOn ? buildStrings(q) : [];
  S.f3      = (mode==='field3d') ? buildField3(q) : null;
  S.fall    = (CFG.space==='fall' && !SM) ? buildFall(q) : null;   /* スマホでは出さない */
  S.depth   = (CFG.space==='depth') ? buildDepth(q) : null;
  S.moire   = CFG.moire ? buildMoire(q) : null;
  S.field   = (mode==='field')  ? buildField(q)  : null;
  S.mesh    = (mode==='mesh')   ? buildMesh(q)   : null;
  S.flows   = []; S.flowsF = [];
  if(mode==='ribbon'){
    S.flows = [
      {y:0.205,am:0.038,f:0.85,ph:0.0,sp: 0.030,w:1.6,a:0.20,col:INK2,d:0.14,b:3,g:5},
      {y:0.335,am:0.052,f:0.70,ph:2.4,sp:-0.024,w:1.8,a:0.19,col:GOLD,d:0.18,b:2,g:7},
      {y:0.495,am:0.080,f:0.58,ph:4.1,sp: 0.040,w:2.6,a:0.30,col:GOLD,d:0.48,b:3,g:11,gl:1},
      {y:0.640,am:0.066,f:0.78,ph:1.1,sp:-0.034,w:2.2,a:0.26,col:INK2,d:0.54,b:3,g:9 ,gl:1},
      {y:0.772,am:0.058,f:0.50,ph:3.4,sp: 0.048,w:3.0,a:0.32,col:GOLD,d:0.82,b:2,g:14,gl:1},
      {y:0.888,am:0.042,f:0.66,ph:5.2,sp:-0.040,w:2.4,a:0.26,col:INK2,d:0.88,b:3,g:10}
    ];
    S.flowsF = [
      {y:0.845,am:0.044,f:0.62,ph:0.7,sp: 0.058,w:3.2,a:0.36,col:GOLD, d:1.20,b:2,g:16,gl:1},
      {y:0.940,am:0.030,f:0.90,ph:2.6,sp:-0.050,w:2.2,a:0.28,col:INK2, d:1.38,b:3,g:9}
    ];
  }

  /* 点と線（星座）は不採用。四角形やオリオン座に見えるため。 */
  S.nets = []; S.netF = null;

  /* --- 音声波形 --- */
  S.waves = SM ? [
    {x0:0.06,x1:1.04,y:0.205,h:0.050,sp:0.26,col:GOLD,a:0.34,d:0.40,st:3.4,base:0.06},
    {x0:-0.04,x1:0.78,y:0.688,h:0.046,sp:0.19,col:INK2,a:0.30,d:0.26,st:3.8,base:0.05},
    {x0:0.16,x1:1.04,y:0.800,h:0.036,sp:0.32,col:GOLD,a:0.26,d:0.70,st:4.0,base:0.05}
  ] : [
    {x0:0.30,x1:0.92,y:0.392,h:0.054,sp:0.26,col:GOLD,a:0.34,d:0.40,st:3.2,base:0.06},
    {x0:-0.02,x1:0.58,y:0.690,h:0.032,sp:0.19,col:INK2,a:0.26,d:0.26,st:3.8,base:0.05},
    {x0:0.34,x1:1.02,y:0.965,h:0.030,sp:0.32,col:INK2,a:0.22,d:0.70,st:4.0,base:0.05}
  ];
  S.wavesF = SM ? [
    {x0:-0.02,x1:0.66,y:0.760,h:0.044,sp:0.30,col:GOLD,a:0.42,d:1.30,st:3.4,base:0.10}
  ] : [
    {x0:0.02,x1:0.50,y:0.900,h:0.040,sp:0.30,col:GOLD,a:0.40,d:1.30,st:3.0,base:0.10}
  ];

  S.bars = [
    {x0:SM?0.00:0.30, x1:SM?0.94:0.80, y:SM?0.878:1.0, h:SM?0.105:0.085, n:Math.round((SM?34:46)*q)||18,
     sp:0.30, col:GOLD, a:0.26, d:0.66, w:2.0},
    {x0:SM?0.06:0.12, x1:SM?0.62:0.44, y:SM?0.940:1.0, h:SM?0.062:0.048, n:Math.round((SM?22:26)*q)||12,
     sp:0.22, col:INK2, a:0.18, d:0.36, w:1.6}
  ];

  S.osc = [];   /* 連続波（心電図・蛇に見える線）は不採用 */

}

/* ---------- 砂紋：中心から広がる楕円の波紋（枯山水の砂紋／声の伝播） ---------- */
function buildRipple(q){
  var seg = SM?54:78;
  var n1 = Math.max(6, Math.round((SM?9:14)*q));
  var n2 = Math.max(5, Math.round((SM?7:11)*q));
  function mk(cx,cy,r0,r1,sq,sp,col,a,w,n,d){
    var rings=[],i;
    for(i=0;i<n;i++) rings.push({off:i/n});
    return {cx:cx,cy:cy,r0:r0,r1:r1,sq:sq,sp:sp,col:col,a:a,w:w,seg:seg,rings:rings,d:d};
  }
  return [
    /* 奥：女性の向こう側で広がる大きな波紋 */
    mk(SM?0.72:0.70, SM?0.30:0.40, MINWH*0.03, MINWH*(SM?1.15:1.05), 0.62,
       0.052, GOLD, 0.30, 1.0, n1, 0.22),
    /* 中：左下から広がる小さめの波紋（文字の外側で受ける） */
    mk(SM?0.20:0.26, SM?0.80:0.74, MINWH*0.02, MINWH*(SM?0.72:0.66), 0.50,
       0.075, INK2, 0.26, 0.9, n2, 0.52)
  ];
}
function drawRipple(ctx,set,t,gain,boost,yMin){
  var k,j,th,r,rr,x,y,a,g,grow;
  for(k=0;k<set.rings.length;k++){
    grow = ((t*set.sp*CFG.speed + set.rings[k].off) % 1 + 1) % 1;
    r = set.r0 + (set.r1-set.r0)*Math.pow(grow,0.82);
    a = set.a * Math.pow(Math.sin(Math.PI*grow), 0.9) * gain * (boost||1);
    if(a < 0.012) continue;
    ctx.beginPath();
    for(j=0;j<=set.seg;j++){
      th = j/set.seg*6.2832;
      rr = r * (1 + 0.042*Math.sin(3*th + t*0.22 + set.rings[k].off*6.2)
                  + 0.026*Math.sin(5*th - t*0.15 + set.rings[k].off*3.1));
      x = set.cx*W + Math.cos(th)*rr;
      y = set.cy*H + Math.sin(th)*rr*set.sq;
      j ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(set.col, a);
    ctx.lineWidth = set.w * (0.55 + 0.55*(1-grow));
    ctx.stroke();
  }
}

/* ---------- 流れ場：ベクトル場に沿って引いた本物の流線 ---------- */
function buildField(q){
  var n = Math.max(7, Math.round((SM?12:20)*q)), i, L=[], main;
  for(i=0;i<n;i++){
    main = (i%5===0);                        /* 5本に1本だけ太い主線 */
    L.push({
      y0: 0.02 + (i+0.5)/n*0.96 + (Math.random()-0.5)*0.05,
      x0: -0.10 - Math.random()*0.08,
      w : main ? (2.6 + Math.random()*1.6) : (0.7 + Math.random()*1.1),
      col: (i%3) ? GOLD : INK2,
      a : main ? (0.24 + Math.random()*0.08) : (0.12 + Math.random()*0.09),
      d : 0.12 + (i/n)*0.76,
      ph: Math.random()*6.2832,
      gl: main
    });
  }
  return {lines:L, k1:3.4, k2:5.4, k3:3.6, k4:2.3, m1:0.82, m2:0.54};
}
function fieldAng(F,x,y,t){
  return Math.sin(x*F.k1 + y*F.k2 + t*0.050)*F.m1
       + Math.sin(y*F.k3 - x*F.k4 + t*0.038 + 1.7)*F.m2
       + Math.sin((x+y)*1.4 - t*0.028)*0.22
       - 0.05;
}
function fieldPts(F,L,t,steps,ds){
  var pts=[], x=L.x0, y=L.y0, i, a;
  for(i=0;i<=steps;i++){
    pts.push(x*W, y*H);
    a = fieldAng(F,x,y,t+L.ph*0.35);
    x += Math.cos(a)*ds;
    y += Math.sin(a)*ds*0.78;
    if(x>1.16) break;
  }
  return pts;
}
function polyRibbon(ctx,pts,wmax,col,a,i0,i1,boost){
  var n = pts.length/2 - 1, i, u, w, first=true;
  if(n < 3) return;
  i0 = Math.max(0, Math.round(i0*n)); i1 = Math.min(n, Math.round(i1*n));
  if(i1-i0 < 2) return;
  ctx.beginPath();
  for(i=i0;i<=i1;i++){
    u=i/n; w = wmax*0.5*Math.pow(Math.sin(Math.PI*u),0.5) + 0.10;
    first ? (ctx.moveTo(pts[i*2],pts[i*2+1]-w), first=false) : ctx.lineTo(pts[i*2],pts[i*2+1]-w);
  }
  for(i=i1;i>=i0;i--){
    u=i/n; w = wmax*0.5*Math.pow(Math.sin(Math.PI*u),0.5) + 0.10;
    ctx.lineTo(pts[i*2],pts[i*2+1]+w);
  }
  ctx.closePath();
  var g = ctx.createLinearGradient(pts[i0*2],0,pts[i1*2],0), A=a*(boost||1);
  if(boost){
    g.addColorStop(0,rgba(GOLD2,0)); g.addColorStop(0.5,rgba(GOLD2,A)); g.addColorStop(1,rgba(GOLD2,0));
  } else {
    g.addColorStop(0,rgba(col,0)); g.addColorStop(0.16,rgba(col,A));
    g.addColorStop(0.84,rgba(col,A)); g.addColorStop(1,rgba(col,0));
  }
  ctx.fillStyle=g; ctx.fill();
}
function drawField(ctx,F,L,t,gain){
  var steps = SM?70:108, ds = 0.0135;
  var pts = fieldPts(F,L,t,steps,ds);
  polyRibbon(ctx,pts,L.w,L.col,L.a*gain,0,1,0);
  if(L.gl){
    var p = ((t*0.05 + L.ph*0.16) % 1.6) - 0.2;
    if(p>0 && p<1) polyRibbon(ctx,pts,L.w,L.col,L.a*gain,Math.max(0,p-0.15),Math.min(1,p+0.15),1.8);
  }
}

/* ---------- 面：うねる格子（ワイヤーフレーム） ---------- */
function buildMesh(q){
  return {
    cols: Math.max(10, Math.round((SM?14:28)*q)),
    rows: Math.max(5,  Math.round((SM?8:12)*q)),
    y0: 0.26, y1: 1.16, amp: 0.090, k: 1.75, sp: 0.34
  };
}
function meshY(M,u,v,t){
  return (M.y0 + Math.pow(v,1.12)*(M.y1-M.y0))*H
    + Math.sin(u*6.2832*M.k + v*2.1 + t*M.sp)*M.amp*H*(0.35+0.65*v)
    + Math.sin(u*6.2832*M.k*0.47 - t*M.sp*0.7 + v*3.3)*M.amp*H*0.5*(0.2+0.8*v);
}
function meshX(M,u,v){ return (-0.05 - v*0.20 + u*(1.10 + v*0.40))*W; }
function drawMesh(ctx,M,t,gain,v0,v1,boost){
  var i,j,u,v,g,a;
  for(j=0;j<=M.rows;j++){
    v = j/M.rows;
    if(v < v0 || v > v1) continue;
    a = (0.11 + 0.34*v) * gain * (boost||1);
    ctx.beginPath();
    for(i=0;i<=M.cols;i++){
      u=i/M.cols;
      i ? ctx.lineTo(meshX(M,u,v), meshY(M,u,v,t)) : ctx.moveTo(meshX(M,u,v), meshY(M,u,v,t));
    }
    g = ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,rgba(j%2?GOLD:INK2,0)); g.addColorStop(0.2,rgba(j%2?GOLD:INK2,a));
    g.addColorStop(0.8,rgba(j%2?GOLD:INK2,a)); g.addColorStop(1,rgba(j%2?GOLD:INK2,0));
    ctx.strokeStyle=g; ctx.lineWidth=0.9; ctx.stroke();
  }
  for(i=0;i<=M.cols;i+=3){
    u=i/M.cols;
    ctx.beginPath();
    for(j=0;j<=M.rows;j++){
      v=j/M.rows;
      if(v < v0 || v > v1) continue;
      ctx.lineTo(meshX(M,u,v), meshY(M,u,v,t));
    }
    ctx.strokeStyle = rgba(INK2, 0.16*gain*(boost||1));
    ctx.lineWidth=0.7; ctx.stroke();
  }
}

/* ---------- 扇光：一点から放射する細い光条（後光・末広がり） ---------- */
function buildFan(q){
  function mk(cx,cy,a0,a1,n,r0,r1,col,a,d,drift,sp){
    var rays=[], i, u;
    n = Math.max(6, Math.round(n*q));
    for(i=0;i<n;i++){
      u = (i+0.5)/n;
      rays.push({
        u : u + (Math.random()-0.5)*(0.55/n),
        r0: r0*(0.86+Math.random()*0.30),
        r1: r1*(0.70+Math.random()*0.42),
        w : 0.6 + Math.random()*1.5,
        ph: Math.random()*6.2832,
        sh: 0.5 + Math.random()*0.9
      });
    }
    return {cx:cx,cy:cy,a0:a0,a1:a1,rays:rays,col:col,a:a,d:d,drift:drift,sp:sp};
  }
  var P = Math.PI;
  return [
    /* 女性の頭のうしろから、左下へ大きく開く後光 */
    mk(SM?0.84:0.86, SM?0.16:0.18, P*0.42, P*1.12, SM?18:30, 0.14, 1.15, GOLD, 0.26, 0.24, 0.016, 0.048),
    /* 左下から右上へ開く小さな扇 */
    mk(SM?0.04:0.06, SM?1.02:1.02, -P*0.44, -P*0.06, SM?12:18, 0.10, 0.82, INK2, 0.22, 0.58, 0.022, -0.038)
  ];
}
function drawFan(ctx,G,t,gain,boost){
  var diag = Math.sqrt(W*W+H*H), i, o, th, x0,y0,x1,y1, g, br;
  for(i=0;i<G.rays.length;i++){
    o = G.rays[i];
    th = G.a0 + (G.a1-G.a0)*o.u
       + Math.sin(t*G.sp*6.2832 + o.ph)*G.drift*o.sh;
    x0 = G.cx*W + Math.cos(th)*o.r0*diag*0.5;
    y0 = G.cy*H + Math.sin(th)*o.r0*diag*0.5;
    x1 = G.cx*W + Math.cos(th)*o.r1*diag*0.62;
    y1 = G.cy*H + Math.sin(th)*o.r1*diag*0.62;
    br = 0.55 + 0.45*Math.sin(t*0.45 + o.ph*1.7);
    g = ctx.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0,   rgba(G.col,0));
    g.addColorStop(0.22,rgba(G.col,G.a*gain*br*(boost||1)));
    g.addColorStop(0.72,rgba(G.col,G.a*gain*br*0.7*(boost||1)));
    g.addColorStop(1,   rgba(G.col,0));
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1);
    ctx.strokeStyle=g; ctx.lineWidth=o.w*(boost?1.6:1); ctx.lineCap='round'; ctx.stroke();
  }
}

/* ---------- 等高線：場の高さを線で描く（地形図・水紋の内側） ---------- */
function buildCont(q){
  var cols = Math.max(18, Math.round((SM?26:46)*q));
  var rows = Math.max(12, Math.round((SM?20:28)*q));
  return {cols:cols, rows:rows, v:new Float32Array((cols+1)*(rows+1)),
          levels:[-0.62,-0.50,-0.38,-0.26,-0.14,-0.02,0.10,0.22,0.34,0.46,0.58]};
}
function contField(x,y,t){
  return ( Math.sin(x*1.9 + Math.sin(y*1.5 + t*0.10)*1.5 + t*0.055)
         + Math.sin(y*1.7 - Math.sin(x*1.2 - t*0.075)*1.2)
         + 0.62*Math.sin((x+y*0.7)*1.5 + t*0.042) ) / 2.55;
}
function drawCont(ctx,C,t,gain,boost,yMin){
  var cols=C.cols, rows=C.rows, i, j, k, idx=0, x, y;
  var y0 = yMin || 0;
  for(j=0;j<=rows;j++){
    for(i=0;i<=cols;i++){
      C.v[idx++] = contField(i/cols*7.2, (y0 + j/rows*(1-y0))*5.2, t);
    }
  }
  var W1 = cols+1;
  for(k=0;k<C.levels.length;k++){
    var lv = C.levels[k], col = (k%2) ? GOLD : INK2;
    var a = (0.26 - Math.abs(lv)*0.13) * gain * (boost||1);
    ctx.beginPath();
    for(j=0;j<rows;j++){
      for(i=0;i<cols;i++){
        var v00=C.v[j*W1+i], v10=C.v[j*W1+i+1], v01=C.v[(j+1)*W1+i], v11=C.v[(j+1)*W1+i+1];
        var s = (v00>lv?1:0) | (v10>lv?2:0) | (v11>lv?4:0) | (v01>lv?8:0);
        if(s===0 || s===15) continue;
        var X0=(i/cols)*W*1.06 - W*0.03, X1=((i+1)/cols)*W*1.06 - W*0.03;
        var Y0=(y0 + j/rows*(1-y0))*H,   Y1=(y0 + (j+1)/rows*(1-y0))*H;
        function lerpX(va,vb){ return X0 + (X1-X0)*((lv-va)/(vb-va)); }
        function lerpY(va,vb){ return Y0 + (Y1-Y0)*((lv-va)/(vb-va)); }
        var pT=[lerpX(v00,v10),Y0], pR=[X1,lerpY(v10,v11)],
            pB=[lerpX(v01,v11),Y1], pL=[X0,lerpY(v00,v01)];
        var seg = null;
        switch(s){
          case 1: case 14: seg=[pL,pT]; break;
          case 2: case 13: seg=[pT,pR]; break;
          case 3: case 12: seg=[pL,pR]; break;
          case 4: case 11: seg=[pR,pB]; break;
          case 6: case  9: seg=[pT,pB]; break;
          case 7: case  8: seg=[pL,pB]; break;
          case 5: seg=[pL,pT]; break;
          case 10: seg=[pT,pR]; break;
        }
        if(seg){ ctx.moveTo(seg[0][0],seg[0][1]); ctx.lineTo(seg[1][0],seg[1][1]); }
      }
    }
    ctx.strokeStyle = rgba(col, a);
    ctx.lineWidth = (boost?1.1:0.75); ctx.lineCap='round'; ctx.stroke();
  }
}

/* ---------- 立体の流れ場：3D空間を流れる線を透視投影する ---------- */
function buildField3(q){
  var n = Math.max(7, Math.round((SM?13:18)*q)), i, L=[], main;
  for(i=0;i<n;i++){
    main = (i%5===0);
    L.push({
      x : -2.1 - Math.random()*0.6,
      y : (Math.random()-0.5)*1.45,
      z : 0.75 + Math.random()*4.2,
      ph: Math.random()*6.2832,
      w : main ? (SM?4.0:3.4) : (SM?1.7:1.3),
      col: (i%3) ? GOLD : INK2,
      a : main ? (SM?0.46:0.38) : (SM?0.27:0.20),
      vz: 0.16 + Math.random()*0.24
    });
  }
  return {lines:L, F:0.60, vpx:(SM?0.66:0.70), vpy:(SM?0.46:0.38), near:0.42, far:6.4};
}
function drawField3(ctx,S3,ln,t,gain,dt,boost){
  var steps = SM?34:50, ds = 0.092, i;
  var x=ln.x, y=ln.y, z=ln.z, F=S3.F*W, ay, az, sx, sy, w;
  var top=[], bot=[], first=null, last=null;
  for(i=0;i<=steps;i++){
    if(z > S3.near){
      sx = S3.vpx*W + x*F/z;
      sy = S3.vpy*H + y*F/z;
      w  = Math.min(9, ln.w*(boost?1.5:1)*0.9/z);
      top.push(sx, sy-w); bot.push(sx, sy+w);
      if(first===null) first=[sx,sy]; last=[sx,sy];
    }
    ay = Math.sin(x*1.35 + z*0.8 + t*0.05 + ln.ph)*0.62
       + Math.sin(x*2.7 - t*0.034 + ln.ph*1.6)*0.22;
    az = Math.sin(x*0.9 - z*0.7 + t*0.028 + ln.ph*0.5)*0.42;
    x += ds; y += ay*ds; z += az*ds;
    if(z < 0.5) z = 0.5;
  }
  if(top.length < 8) return;
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  for(i=1;i<top.length/2;i++) ctx.lineTo(top[i*2], top[i*2+1]);
  for(i=bot.length/2-1;i>=0;i--) ctx.lineTo(bot[i*2], bot[i*2+1]);
  ctx.closePath();
  var g = ctx.createLinearGradient(first[0],first[1],last[0],last[1]);
  var A = ln.a*gain*(boost||1);
  g.addColorStop(0,   rgba(ln.col, A));         /* 手前：濃い */
  g.addColorStop(0.55,rgba(ln.col, A*0.55));
  g.addColorStop(1,   rgba(ln.col, 0));         /* 奥：消える */
  ctx.fillStyle = g; ctx.fill();
  /* 手前へ近づいてくる */
  ln.z -= ln.vz*dt;
  if(ln.z < S3.near*1.15){
    ln.z = S3.far;
    ln.x = -2.1 - Math.random()*0.6;
    ln.y = (Math.random()-0.5)*1.45;
  }
}

/* ---------- 波形ウォーターフォール：音声波形が奥へ積み重なる立体 ---------- */
function buildFall(q){
  return {
    rows : Math.max(12, Math.round((SM?16:26)*q)),
    bars : Math.max(40, Math.round((SM?90:190)*q)),
    F    : 0.58,
    vpx  : (SM?0.60:0.52), vpy:(SM?0.26:0.31),
    wide : 1.52,          /* 面の横幅（ワールド） */
    down : 0.58,          /* 面の高さ（カメラ軸より下） */
    dz   : 0.285, z0: 0.95,
    amp  : 0.040,
    sp   : 0.26
  };
}
function drawFall(ctx,C,t,gain,boost,rowFrom,rowTo){
  var F=C.F*W, r, i, z, sc, u, x, yb, e, a, alpha, phase = (t*C.sp) % 1;
  var r0 = rowFrom||0, r1 = (rowTo===undefined? C.rows : rowTo);
  for(r=r1-1; r>=r0; r--){
    z  = C.z0 + (r + phase)*C.dz;
    sc = F/z;
    yb = C.vpy*H + C.down*sc;
    alpha = (0.42 - 0.0145*r) * gain * (boost||1);
    if(alpha < 0.012) continue;
    var wpx = C.wide*sc;
    var nb  = Math.max(20, Math.min(C.bars, Math.round(wpx/4.2)));
    ctx.beginPath();
    for(i=0;i<=nb;i++){
      u = i/nb - 0.5;
      x = C.vpx*W + u*wpx;
      if(x < -20 || x > W+20) continue;
      e = Math.abs(nz(i*(180/nb)*0.36 + r*0.9 - t*0.55))*0.72
        + Math.abs(nz(i*(180/nb)*1.15 - r*0.5 + t*0.28))*0.28;
      a = (e*0.85 + 0.08) * C.amp * sc * Math.pow(Math.sin(Math.PI*(i/nb)),0.55);
      ctx.moveTo(x, yb-a); ctx.lineTo(x, yb+a);
    }
    var gc = (r%2)? GOLD : INK2;
    var gg = ctx.createLinearGradient(C.vpx*W-0.5*wpx,0,C.vpx*W+0.5*wpx,0);
    gg.addColorStop(0,    rgba(gc,0));
    gg.addColorStop(0.26, rgba(gc,alpha));
    gg.addColorStop(0.86, rgba(gc,alpha));
    gg.addColorStop(1,    rgba(gc,0));
    ctx.strokeStyle = gg;
    ctx.lineWidth = Math.max(0.6, Math.min(1.8, 1.7/z));
    ctx.lineCap='butt';
    ctx.stroke();
    /* 面の稜線（奥行きの床線） */
    ctx.beginPath();
    ctx.moveTo(C.vpx*W - 0.5*wpx, yb);
    ctx.lineTo(C.vpx*W + 0.5*wpx, yb);
    ctx.strokeStyle = rgba(INK2, alpha*0.22);
    ctx.lineWidth = 0.6; ctx.stroke();
  }
}

/* ---------- 干渉縞（モアレ）：細い線の族を2つ、わずかに角度をずらして重ねる ----------
   1本1本は見えないほど細く、重なったところにだけ縞が浮かぶ。
   「線を引いた絵」ではなく「重ねた結果」なので、手では描けない模様になる。 */
function buildMoire(q){
  function fam(cx,cy,ang,pitch,n,len,bow,col,a,sp,pp){
    return {cx:cx,cy:cy,ang:ang,pitch:pitch,n:Math.max(24,Math.round(n*q)),
            len:len,bow:bow,col:col,a:a,sp:sp,pp:pp};
  }
  var cx = SM?0.54:0.58, cy = SM?0.50:0.54;
  return [
    fam(cx, cy,  0.062, 6.0, SM?96:150, SM?1.9:1.55, 52, GOLD, SM?0.205:0.180,  0.0075, 0.55),
    fam(cx, cy, -0.034, 6.6, SM?88:138, SM?1.85:1.50,-44, INK2, SM?0.180:0.155, -0.0052, 0.42)
  ];
}
function drawMoire(ctx,F,t,gain,boost){
  var i, n=F.n, half=n/2, ang=F.ang + Math.sin(t*F.sp*6.2832)*0.05;
  var pitch = F.pitch * (1 + Math.sin(t*F.pp*0.35)*0.06);
  var dx=Math.cos(ang), dy=Math.sin(ang), nx=-dy, ny=dx;
  var L=F.len*W*0.5, cx=F.cx*W, cy=F.cy*H, off, px, py, k, a, bow;
  ctx.lineWidth = 0.9;
  for(i=-half;i<=half;i++){
    k = Math.abs(i)/half;
    a = F.a * gain * (boost||1) * Math.pow(Math.cos(k*1.5708), 0.9);   /* 族の端はすっと消す */
    if(a < 0.006) continue;
    off = i*pitch;
    px = cx + nx*off; py = cy + ny*off;
    bow = F.bow * (1 - k*k);
    var g = ctx.createLinearGradient(px-dx*L, py-dy*L, px+dx*L, py+dy*L);
    g.addColorStop(0,   rgba(F.col,0));
    g.addColorStop(0.22,rgba(F.col,a));
    g.addColorStop(0.78,rgba(F.col,a));
    g.addColorStop(1,   rgba(F.col,0));
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(px-dx*L, py-dy*L);
    ctx.quadraticCurveTo(px + nx*bow, py + ny*bow, px+dx*L, py+dy*L);
    ctx.stroke();
  }
}

/* ---------- 走査線：一本の線が横切り、通ったところだけ波形が立ち上がる ----------
   画面全体が「いま読み取られている」ように見える。波形の振幅に直接効く。 */
var SCAN = {x:-9, w:0.16, boost:0};
function updateScan(t){
  var cyc = 11.5, ph = t % cyc;
  if(ph < 4.2){
    SCAN.x = -0.14 + (ph/4.2)*1.30;      /* 4.2秒で左から右へ抜ける */
    SCAN.boost = Math.pow(Math.max(0, Math.sin(Math.PI*(ph/4.2))), 0.35);
  } else {
    SCAN.x = -9; SCAN.boost = 0;
  }
}
function scanGain(u){                     /* u: 0〜1 の画面横位置 */
  if(SCAN.boost <= 0) return 1;
  var d = Math.abs(u - SCAN.x);
  if(d > SCAN.w) return 1;
  return 1 + 1.85 * SCAN.boost * Math.pow(1 - d/SCAN.w, 2.0);
}
function drawScan(ctx,gain,boost){
  if(SCAN.boost <= 0) return;
  var x = SCAN.x*W, a = 0.36*gain*SCAN.boost*(boost||1);
  var bw = SCAN.w*W*0.85;
  var g = ctx.createLinearGradient(x-bw,0,x+bw*0.25,0);
  g.addColorStop(0,   rgba(GOLD,0));
  g.addColorStop(0.70,rgba(GOLD,a*0.22));
  g.addColorStop(1,   rgba(GOLD,a*0.34));
  ctx.fillStyle = g; ctx.fillRect(x-bw, 0, bw*1.25, H);
  var g2 = ctx.createLinearGradient(0,0,0,H);
  g2.addColorStop(0,   rgba(GOLD,0));
  g2.addColorStop(0.18,rgba(GOLD,a));
  g2.addColorStop(0.82,rgba(GOLD,a));
  g2.addColorStop(1,   rgba(GOLD,0));
  ctx.strokeStyle = g2; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
}

/* ---------- 立体ネットワーク：3D空間の点と線を被写界深度つきで描く ----------
   参考は「暗い背景に光る網」。紙の上では光らせられないので、
   ピントの合った点＝細く硬い墨点／外れた点＝ぼけた薄い金・藍の円、として反転させる。 */
var BOKEH = {};
function mkBokeh(col, key){
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var g = c.getContext('2d');
  var rg = g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0.00, rgba(col,0.66));
  rg.addColorStop(0.42, rgba(col,0.42));
  rg.addColorStop(0.74, rgba(col,0.18));
  rg.addColorStop(0.90, rgba(col,0.22));   /* 縁をわずかに残す＝玉ぼけの輪郭 */
  rg.addColorStop(1.00, rgba(col,0));
  g.fillStyle = rg; g.fillRect(0,0,64,64);
  BOKEH[key] = c;
  return c;
}

function buildDepth(q){
  mkBokeh(GOLD,'g'); mkBokeh(INK2,'i'); mkBokeh(GOLD2,'g2');
  var n = Math.max(34, Math.round((SM?54:112)*q)), i, j, k, nodes=[], links=[];
  var F0 = 0.58*W, VX = (SM?0.66:0.60)*W, VY = (SM?0.34:0.44)*H;
  for(i=0;i<n;i++){
    var zz = 0.90 + Math.random()*4.1;
    var ssx = (-0.12 + Math.random()*1.24)*W;
    var ssy = (-0.12 + Math.random()*1.24)*H;
    nodes.push({
      x:(ssx-VX)*zz/F0,
      y:(ssy-VY)*zz/F0,
      z: zz, bx:ssx, by:ssy,
      r:(0.0034 + Math.random()*0.0042) * (Math.random()<0.16 ? 2.3 : 1),
      c: (i%9===0) ? 'g2' : ((i%2===0) ? 'i' : 'g'),
      col:(i%2===0) ? INK : GOLD,
      ph: Math.random()*6.2832,
      dx:(Math.random()-0.5)*0.010,
      dy:(Math.random()-0.5)*0.008
    });
  }
  /* 3次元で近いものだけ結ぶ（画面上ではなく空間で近いこと＝奥行きが読める） */
  /* 結線は「画面上で近い」かつ「奥行きが近すぎず離れすぎない」ものだけ */
  var RD = 0.30*W, RD2 = RD*RD;
  for(i=0;i<n;i++){
    var cand=[];
    for(j=0;j<n;j++){
      if(i===j) continue;
      if(Math.abs(nodes[i].z-nodes[j].z) > 1.35) continue;
      var dx=nodes[i].bx-nodes[j].bx, dy=nodes[i].by-nodes[j].by;
      var d2=dx*dx+dy*dy;
      if(d2 < RD2) cand.push([d2,j]);
    }
    cand.sort(function(a,b){ return a[0]-b[0]; });
    for(k=0;k<2 && k<cand.length;k++){
      var a=Math.min(i,cand[k][1]), b=Math.max(i,cand[k][1]);
      if(!links.some(function(L){ return L.a===a && L.b===b; })) links.push({a:a,b:b});
    }
  }
  return {
    n:nodes, l:links, order:nodes.map(function(_,i){ return i; }),
    F0:F0, VX:VX, VY:VY,
    F:0.58, vpx:(SM?0.66:0.60), vpy:(SM?0.34:0.44),
    near:0.80, far:5.1, zf:1.50, spread:1.90, dolly:0.075
  };
}

function drawDepth(ctx,D,t,gain,dt,boost){
  var i, o, sc, s, rad, al, F=D.F*W, span=D.far-D.near;
  /* カメラがゆっくり前進する＝全体が手前へ流れる（点それぞれは泳がない）。
     手前を抜けた点は、いちばん奥の面のどこかに置き直す＝画面の密度が保たれる。 */
  for(i=0;i<D.n.length;i++){
    o = D.n[i];
    o.z -= D.dolly*dt;
    if(o.z < D.near){
      o.z = D.far;
      o.x = ((-0.14 + Math.random()*1.28)*W - D.VX)*D.far/D.F0;
      o.y = ((-0.14 + Math.random()*1.28)*H - D.VY)*D.far/D.F0;
    }
    o.zc = o.z;
    o.sc = F/o.zc;
    o.sx = D.vpx*W + (o.x + Math.sin(t*0.10 + o.ph)*0.03)*o.sc;
    o.sy = D.vpy*H + (o.y + Math.cos(t*0.08 + o.ph*1.3)*0.025)*o.sc;
    o.s  = 1 - Math.min(1, Math.abs(o.zc - D.zf)/D.spread);   /* ピントの合い具合 */
    o.fade = 0.42 + 0.58*Math.max(0, Math.min(1, (D.far - o.zc)/(D.far-D.near)));
  }
  D.order.sort(function(a,b){ return D.n[b].zc - D.n[a].zc; });   /* 奥から描く */

  /* --- 線 --- */
  for(i=0;i<D.l.length;i++){
    var A=D.n[D.l[i].a], B=D.n[D.l[i].b];
    if(Math.abs(A.zc-B.zc) > span*0.5) continue;                 /* 折り返した対は結ばない */
    s = (A.s+B.s)*0.5;
    if(s < 0.10) continue;
    al = (0.60*Math.pow(s,1.3) + 0.12*s) * gain * (boost||1) * Math.min(A.fade,B.fade);
    if(al < 0.008) continue;
    ctx.beginPath(); ctx.moveTo(A.sx,A.sy); ctx.lineTo(B.sx,B.sy);
    var lg = ctx.createLinearGradient(A.sx,A.sy,B.sx,B.sy);
    lg.addColorStop(0,   rgba(INK2, al*0.15));
    lg.addColorStop(0.35,rgba(INK2, al));
    lg.addColorStop(0.65,rgba(INK2, al));
    lg.addColorStop(1,   rgba(INK2, al*0.15));
    ctx.strokeStyle = lg;
    ctx.lineWidth = Math.max(0.6, Math.min(3.0, (0.6 + 1.8*s) * (A.sc+B.sc)/2 * 0.0019));
    ctx.stroke();
  }

  /* --- 点（奥から手前へ） --- */
  for(i=0;i<D.order.length;i++){
    o = D.n[D.order[i]];
    if(o.sx < -140 || o.sx > W+140 || o.sy < -140 || o.sy > H+140) continue;
    s = o.s;
    rad = o.r * o.sc;
    if(s > 0.62){
      /* ピントが合っている＝小さく硬い点 */
      ctx.beginPath();
      ctx.arc(o.sx, o.sy, Math.max(0.8, rad*0.9), 0, 6.2832);
      ctx.fillStyle = rgba(o.col, (0.45 + 0.50*s) * gain * o.fade * (boost||1));
      ctx.fill();
    } else {
      /* 外れている＝ぼけた円（スプライトを拡大するだけなので軽い） */
      var R = rad * (1 + (1-s)*7.5);
      al = (0.30 + 0.70*(1-s)) * gain * o.fade * (boost||1);
      ctx.globalAlpha = Math.min(1, al);
      ctx.drawImage(BOKEH[o.c], o.sx-R, o.sy-R, R*2, R*2);
      ctx.globalAlpha = 1;
    }
  }
}

/* ---------- 金線紋：ハーモノグラフ（紙幣の彩紋のような曲線） ---------- */
function buildGuil(q){
  function mk(cx,cy,R,f2,amp2,turns,damp,sq,col,a,d,rot){
    var N = Math.round((LOW?1500:2400)*Math.min(1.2,q)), i, th, e, x, y;
    var path = new Path2D(), first=true;
    for(i=0;i<=N;i++){
      th = i/N*turns*6.2832;
      e  = Math.exp(-damp*th);
      x  = (Math.cos(th) + amp2*Math.cos(f2*th))*R*e;
      y  = (Math.sin(th) + amp2*Math.sin(f2*th))*R*e;
      first ? (path.moveTo(x,y), first=false) : path.lineTo(x,y);
    }
    return {cx:cx,cy:cy,p:path,col:col,a:a,d:d,rot:rot,sq:sq};
  }
  var M = MINWH;
  return [
    mk(SM?0.72:0.70, SM?0.28:0.40, M*(SM?0.44:0.42), 5.011, 0.38, 62, 0.0021, 0.76, GOLD, 0.19, 0.22,  0.052),
    mk(SM?0.24:0.22, SM?0.86:0.86, M*(SM?0.24:0.22), 3.017, 0.46, 52, 0.0026, 0.66, INK2, 0.17, 0.55, -0.075)
  ];
}
function drawGuil(ctx,G,t,gain,boost){
  var pulse = 1 + 0.045*Math.sin(t*0.30 + G.rot*40);
  ctx.save();
  ctx.translate(G.cx*W, G.cy*H);
  ctx.rotate(t*G.rot);
  ctx.scale(pulse, G.sq*pulse);
  ctx.strokeStyle = rgba(G.col, G.a*gain*(boost||1));
  ctx.lineWidth = (boost?0.9:0.6);
  ctx.setLineDash([]); ctx.stroke(G.p);
  ctx.strokeStyle = rgba(GOLD2, G.a*gain*1.9*(boost||1));
  ctx.lineWidth = (boost?1.4:1.0);
  ctx.setLineDash([46, 620]);
  ctx.lineDashOffset = -t*230;
  ctx.stroke(G.p);
  ctx.setLineDash([]);
  ctx.restore();
}

/* ---------- 弦：弾かれて減衰する定常波（音そのもの） ---------- */
function buildStrings(q){
  var n = Math.max(5, Math.round((SM?8:13)*q)), i, arr=[], x0, len;
  for(i=0;i<n;i++){
    x0  = -0.06 + Math.random()*0.42;
    len = 0.30 + Math.random()*0.62;
    arr.push({
      x0:x0, x1:Math.min(1.06, x0+len),
      y : 0.05 + Math.random()*0.92,
      k : 1 + Math.floor(Math.random()*3),
      pin: Math.random() < 0.7,
      am: 0.013 + Math.random()*0.026,
      sp: 0.9 + Math.random()*1.6,
      ph: Math.random()*6.2832,
      col: (i%3) ? GOLD : INK2,
      a : 0.17 + Math.random()*0.13,
      d : 0.14 + Math.random()*0.74,
      pk: Math.random()*11
    });
  }
  return arr;
}
function drawString(ctx,o,t,gain,boost){
  var steps = SM?30:44, i, u, x, y, x0=o.x0*W, x1=o.x1*W, amp, env, sh, g;
  var cyc = 6.0, ph = ((t + o.pk) % cyc);
  env = Math.exp(-ph*0.50)*0.85 + 0.42;
  amp = o.am*H*env*(boost?1.5:1);
  g = ctx.createLinearGradient(x0,0,x1,0);
  g.addColorStop(0,   rgba(o.col,0));
  g.addColorStop(0.5, rgba(o.col,o.a*gain*(boost||1)));
  g.addColorStop(1,   rgba(o.col,0));
  /* 振れ幅の輪郭（レンズ状）を薄く */
  for(sh=-1; sh<=1; sh+=2){
    ctx.beginPath();
    for(i=0;i<=steps;i++){
      u=i/steps; x=x0+(x1-x0)*u;
      y = o.y*H + Math.sin(u*Math.PI*o.k)*amp*sh;
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.strokeStyle = rgba(o.col, o.a*gain*0.34*(boost||1));
    ctx.lineWidth = 0.6; ctx.stroke();
  }
  /* 弦そのもの */
  ctx.beginPath();
  for(i=0;i<=steps;i++){
    u=i/steps; x=x0+(x1-x0)*u;
    y = o.y*H + Math.sin(u*Math.PI*o.k)*Math.sin(t*o.sp*6.2832 + o.ph)*amp;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.strokeStyle = g; ctx.lineWidth = boost?1.3:0.9; ctx.stroke();
  if(o.pin){
    ctx.beginPath();
    ctx.moveTo(x0, o.y*H-3.4); ctx.lineTo(x0, o.y*H+3.4);
    ctx.moveTo(x1, o.y*H-3.4); ctx.lineTo(x1, o.y*H+3.4);
    ctx.strokeStyle = rgba(o.col, o.a*gain*0.8*(boost||1));
    ctx.lineWidth = 0.9; ctx.stroke();
  }
}

/* ---------- 点と線 ---------- */
function mkNet(cols, rows, x0, x1, y0, y1, depth, jit){
  var n=[], i, j;
  for(j=0;j<rows;j++){
    for(i=0;i<cols;i++){
      n.push({
        ax: x0 + ((i+0.5)/cols + (Math.random()-0.5)*jit/cols)*(x1-x0),
        ay: y0 + ((j+0.5)/rows + (Math.random()-0.5)*jit/rows)*(y1-y0),
        ph: Math.random()*6.2832,
        big: Math.random() < 0.30,
        x:0, y:0
      });
    }
  }
  var l=[], seen={}, k, m, dx, dy, cand;
  var maxD2 = Math.pow(1.45*(x1-x0)/cols, 2) + Math.pow(0.62*(y1-y0)/rows, 2);
  for(k=0;k<n.length;k++){
    cand=[];
    for(m=0;m<n.length;m++){
      if(m===k) continue;
      dx = n[k].ax-n[m].ax; dy = (n[k].ay-n[m].ay)*0.62;
      cand.push([dx*dx+dy*dy, m]);
    }
    cand.sort(function(p,q){ return p[0]-q[0]; });
    for(m=0; m<2 && m<cand.length; m++){
      if(cand[m][0] > maxD2) break;
      var i1=Math.min(k,cand[m][1]), i2=Math.max(k,cand[m][1]), key=i1+'_'+i2;
      if(seen[key]) continue;
      seen[key]=1;
      l.push({a:i1, b:i2, ph:Math.random()*6.2832});
    }
  }
  return {n:n, l:l, d:depth};
}
function net(ctx,N,t,gain){
  var arr=N.n, i, L, a, b, br, p, s0, s1, g;
  for(i=0;i<arr.length;i++){
    a=arr[i];
    a.x = (a.ax + Math.sin(t*0.20 + a.ph)*0.0035)*W;
    a.y = (a.ay + Math.cos(t*0.16 + a.ph*1.3)*0.0045)*H;
  }
  ctx.lineWidth = 0.7;
  for(i=0;i<N.l.length;i++){
    L=N.l[i]; a=arr[L.a]; b=arr[L.b];
    br = 0.42 + 0.58*(0.5+0.5*Math.sin(t*0.42 + L.ph));
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
    ctx.strokeStyle = rgba(INK2, 0.34*br*gain); ctx.stroke();
    p = (t*0.13 + L.ph*0.21) % 2.2;
    if(p < 1){
      s0 = Math.max(0, p-0.26); s1 = p;
      g = ctx.createLinearGradient(a.x+(b.x-a.x)*s0, a.y+(b.y-a.y)*s0,
                                   a.x+(b.x-a.x)*s1, a.y+(b.y-a.y)*s1);
      g.addColorStop(0, rgba(GOLD,0)); g.addColorStop(1, rgba(GOLD,0.52*gain));
      ctx.beginPath();
      ctx.moveTo(a.x+(b.x-a.x)*s0, a.y+(b.y-a.y)*s0);
      ctx.lineTo(a.x+(b.x-a.x)*s1, a.y+(b.y-a.y)*s1);
      ctx.strokeStyle=g; ctx.lineWidth=1.1; ctx.stroke(); ctx.lineWidth=0.7;
    }
  }
  for(i=0;i<arr.length;i++){
    a=arr[i];
    var tw = 0.6 + 0.4*Math.sin(t*0.8 + a.ph);
    if(a.big){
      ctx.beginPath(); ctx.arc(a.x,a.y,2.7,0,6.2832);
      ctx.strokeStyle=rgba(GOLD,0.58*tw*gain); ctx.lineWidth=0.9; ctx.stroke();
      ctx.beginPath(); ctx.arc(a.x,a.y,1.0,0,6.2832);
      ctx.fillStyle=rgba(GOLD,0.72*gain); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(a.x,a.y,1.2,0,6.2832);
      ctx.fillStyle=rgba(INK,0.55*tw*gain); ctx.fill();
    }
  }
}

/* ---------- 旧リボン流線 ---------- */
function env(u){ return 0.42 + 0.58*Math.pow(Math.sin(Math.PI*u), 0.85); }
function flowY(f,u,t){
  var e = env(u);
  return f.y*H
    + e * ( Math.sin(u*6.2832*f.f + t*f.sp*6.2832 + f.ph) * f.am*H
          + Math.sin(u*6.2832*f.f*2.10 - t*f.sp*3.4 + f.ph*1.6) * f.am*H*0.34 )
    + Math.sin(t*0.16 + f.ph) * H*0.010;
}
function ribbon(ctx, f, t, off, gain, u0, u1, boost){
  var steps = SM?44:72, i, u, x, y, w, first=true;
  var wid = function(u){ return (f.w*0.5) * Math.pow(Math.sin(Math.PI*u), 0.55) + 0.10; };
  var spread = function(u){ return Math.pow(Math.sin(Math.PI*u), 0.7); };
  var i0 = Math.max(0, Math.floor(u0*steps)), i1 = Math.min(steps, Math.ceil(u1*steps));
  if(i1 - i0 < 2) return;
  ctx.beginPath();
  for(i=i0;i<=i1;i++){
    u=i/steps; x=-W*0.06+u*W*1.12; y=flowY(f,u,t)+off*spread(u); w=wid(u);
    first ? (ctx.moveTo(x,y-w), first=false) : ctx.lineTo(x,y-w);
  }
  for(i=i1;i>=i0;i--){
    u=i/steps; x=-W*0.06+u*W*1.12; y=flowY(f,u,t)+off*spread(u); w=wid(u);
    ctx.lineTo(x,y+w);
  }
  ctx.closePath();
  var xa=-W*0.06+(i0/steps)*W*1.12, xb=-W*0.06+(i1/steps)*W*1.12;
  var g=ctx.createLinearGradient(xa,0,xb,0), A=f.a*gain*(boost||1);
  if(boost){
    g.addColorStop(0,rgba(GOLD2,0)); g.addColorStop(0.5,rgba(GOLD2,A)); g.addColorStop(1,rgba(GOLD2,0));
  } else {
    g.addColorStop(0,rgba(f.col,0)); g.addColorStop(0.18,rgba(f.col,A));
    g.addColorStop(0.82,rgba(f.col,A)); g.addColorStop(1,rgba(f.col,0));
  }
  ctx.fillStyle=g; ctx.fill();
}
function flow(ctx,f,t,gain){
  var b, off;
  for(b=0;b<f.b;b++){ off=(b-(f.b-1)/2)*f.g; ribbon(ctx,f,t,off,gain,0,1,0); }
  if(f.gl){
    var p = ((t*0.055 + f.ph*0.17) % 1.5) - 0.18;
    if(p>0 && p<1) ribbon(ctx,f,t,0,gain,Math.max(0,p-0.16),Math.min(1,p+0.16),1.7);
  }
}

/* ---------- 円相・波形・スペクトラム・オシロ ---------- */
function ring(ctx,o,t,gain){
  var a0 = o.a0*6.2832 + t*o.sp*6.2832, a1 = o.a1*6.2832 + t*o.sp*6.2832;
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r, a0, a1);
  ctx.strokeStyle = rgba(o.col, o.a*gain); ctx.lineWidth = o.w; ctx.stroke();
  if(o.tick){
    ctx.beginPath();
    for(var i=0;i<o.tick;i++){
      var a = a0 + (a1-a0)*(i/o.tick), c=Math.cos(a), s=Math.sin(a);
      var L = (i%4===0)? 7 : 3.2;
      ctx.moveTo(o.x+c*o.r, o.y+s*o.r); ctx.lineTo(o.x+c*(o.r+L), o.y+s*(o.r+L));
    }
    ctx.strokeStyle = rgba(o.col, o.a*gain*0.75); ctx.lineWidth = 0.7; ctx.stroke();
  }
}
function bars(ctx,o,t,gain){
  var i,u,x,e,win,h, x0=o.x0*W, x1=o.x1*W, y=o.y*H, step=(x1-x0)/o.n;
  ctx.beginPath();
  for(i=0;i<o.n;i++){
    u = i/(o.n-1);
    win = Math.pow(Math.sin(Math.PI*u), 0.55);
    e = Math.abs(nz(i*0.62 + t*o.sp*2.6))*0.78 + Math.abs(nz(i*1.9 - t*o.sp*1.3))*0.22;
    h = (e*0.9 + 0.10) * win * o.h * H * scanGain(x/W);
    x = x0 + step*i + step*0.5;
    ctx.moveTo(x, y); ctx.lineTo(x, y-h);
  }
  ctx.strokeStyle = rgba(o.col, o.a*gain); ctx.lineWidth = o.w; ctx.lineCap='butt'; ctx.stroke();
}
function wave(ctx,w,t,gain){
  var x0=w.x0*W, x1=w.x1*W, y=w.y*H, x, u, win, e, a;
  ctx.beginPath();
  for(x=x0; x<=x1; x+=w.st){
    u = (x-x0)/(x1-x0);
    win = Math.pow(Math.sin(Math.PI*Math.max(0,Math.min(1,u))), 0.62);
    e = Math.abs(nz(u*9.2 + t*w.sp*5.2))*0.72 + Math.abs(nz(u*26.0 - t*w.sp*2.6))*0.28;
    a = (e*0.86 + w.base) * win * w.h * H * scanGain(x/W);
    ctx.moveTo(x, y-a); ctx.lineTo(x, y+a);
  }
  ctx.strokeStyle = rgba(w.col, w.a*gain); ctx.lineWidth = 1; ctx.lineCap='butt'; ctx.stroke();
  var g = ctx.createLinearGradient(x0,0,x1,0);
  g.addColorStop(0,rgba(w.col,0)); g.addColorStop(0.5,rgba(w.col,w.a*gain*0.7)); g.addColorStop(1,rgba(w.col,0));
  ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y);
  ctx.strokeStyle=g; ctx.lineWidth=0.7; ctx.stroke();
}
/* =========================================================
   サイズ
   ========================================================= */
function resize(){
  var r = hero.getBoundingClientRect();
  W = Math.max(320, Math.round(r.width));
  H = Math.max(360, Math.round(r.height));
  DPR = Math.min(window.devicePixelRatio || 1, LOW ? 1.25 : 1.75);
  [cvB,cvF].forEach(function(c){
    c.width  = Math.round(W*DPR); c.height = Math.round(H*DPR);
    c.style.width = W+'px'; c.style.height = H+'px';
    c.getContext('2d').setTransform(DPR,0,0,DPR,0,0);
  });
  build();
}

/* =========================================================
   ループ
   ========================================================= */
var mx=0,my=0,tmx=0,tmy=0, sc=0, on=true, vis=true, frame=0, lastT=0;
function px(d){ return tmx*(6+26*d)*CFG.parallax; }
function py(d){ return tmy*(4+15*d)*CFG.parallax - sc*H*(0.04+0.22*d); }
function L(ctx,d,fn){ ctx.save(); ctx.translate(px(d),py(d)); fn(); ctx.restore(); }

function draw(now){
  requestAnimationFrame(draw);
  if(!on || !vis) return;
  frame++;
  if(LOW && (frame & 1)) return;
  var t = now/1000 * CFG.speed, gain = CFG.strength, m = CFG.flowMode;
  if(CFG.scan) updateScan(t); else { SCAN.boost = 0; }
  var dt = Math.min(0.08, (now-lastT)/1000) || 0.016; lastT = now;

  tmx += (mx-tmx)*0.06; tmy += (my-tmy)*0.06;

  ctxB.clearRect(0,0,W,H);
  ctxB.lineJoin='round';

  S.rings.forEach(function(o){ L(ctxB,o.d,function(){ ring(ctxB,o,t,gain*0.9); }); });

  if(S.moire) S.moire.forEach(function(F,i){ L(ctxB,0.10+i*0.06,function(){ drawMoire(ctxB,F,t,gain,0); }); });
  if(S.fall) L(ctxB,0.30,function(){ drawFall(ctxB,S.fall,t,gain,0,1); });
  if(S.depth) L(ctxB,0.34,function(){ drawDepth(ctxB,S.depth,t,gain,dt,0); });
  if(m==='field'){
    S.field.lines.forEach(function(ln){ L(ctxB,ln.d,function(){ drawField(ctxB,S.field,ln,t,gain); }); });
  } else if(m==='field3d'){
    S.f3.lines.forEach(function(ln){
      L(ctxB, 0.20 + 0.5/Math.max(0.5,ln.z), function(){ drawField3(ctxB,S.f3,ln,t,gain,dt,0); });
    });
  }
  S.strings.forEach(function(o){ L(ctxB,o.d,function(){ drawString(ctxB,o,t,gain,0); }); });

  S.bars.forEach(function(o){ L(ctxB,o.d,function(){ bars(ctxB,o,t,gain); }); });
  S.waves.forEach(function(w){ L(ctxB,w.d,function(){ wave(ctxB,w,t,gain); }); });
  if(CFG.scan) drawScan(ctxB,gain,0);

  /* ---------- 女性より手前 ---------- */
  ctxF.clearRect(0,0,W,H);
  if(!CFG.frontOn) return;
  ctxF.lineJoin='round';

  if(S.fall) L(ctxF,1.30,function(){ drawFall(ctxF,S.fall,t,gain,1.5,0,1); });
  if(m==='field'){
    S.field.lines.forEach(function(ln,i){
      if(i%4!==1) return;
      L(ctxF,1.25,function(){
        drawField(ctxF,S.field,{y0:ln.y0*0.35+0.62,x0:ln.x0,w:ln.w*1.5,col:ln.col,
                                a:ln.a*1.5,ph:ln.ph,gl:1},t,gain);
      });
    });
  }
  S.strings.forEach(function(o,i){
    if(o.y < 0.62 || i%2) return;
    L(ctxF,1.25,function(){ drawString(ctxF,o,t,gain,1.5); });
  });

  S.wavesF.forEach(function(w){ L(ctxF,w.d,function(){ wave(ctxF,w,t,gain); }); });
}

/* =========================================================
   起動
   ========================================================= */
resize();
requestAnimationFrame(draw);
setTimeout(function(){ cvB.classList.add('on'); cvF.classList.add('on'); }, 60);

var rt=null;
window.addEventListener('resize', function(){ clearTimeout(rt); rt=setTimeout(resize,180); }, {passive:true});
window.addEventListener('scroll', function(){
  sc = Math.max(0, Math.min(1, window.scrollY / Math.max(1,H)));
}, {passive:true});
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  window.addEventListener('mousemove', function(e){
    mx = (e.clientX/window.innerWidth - 0.5)*-1;
    my = (e.clientY/window.innerHeight - 0.5)*-1;
  }, {passive:true});
}
document.addEventListener('visibilitychange', function(){ vis = !document.hidden; });
if('IntersectionObserver' in window){
  new IntersectionObserver(function(es){ es.forEach(function(e){ on = e.isIntersecting; }); },
    {threshold:0}).observe(hero);
}
window.czTech = CFG;
window.czTechRebuild = resize;
})();
