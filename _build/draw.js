let _id = 0; const uid = p => p + (++_id);
const F = 'font-family="Fraunces, serif"';
const S = 'font-family="DM Sans, sans-serif"';

function snow(x,y,r,c="#9fb7c9"){
  let s=''; for(const a of [0,60,120]){const t=a*Math.PI/180,dx=Math.cos(t)*r,dy=Math.sin(t)*r;
    s+=`<line x1="${x-dx}" y1="${y-dy}" x2="${x+dx}" y2="${y+dy}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;}
  return s;
}
function paw(x,y,s,c,rot=0){
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${c}">
    <ellipse cx="0" cy="6" rx="9" ry="7.5"/><ellipse cx="-10" cy="-5" rx="3.6" ry="4.6"/><ellipse cx="-3.6" cy="-11" rx="3.6" ry="4.6"/>
    <ellipse cx="3.6" cy="-11" rx="3.6" ry="4.6"/><ellipse cx="10" cy="-5" rx="3.6" ry="4.6"/></g>`;
}
function catHead(x,y,s,c,eye="#fff"){
  return `<g transform="translate(${x} ${y}) scale(${s})"><polygon points="-14,-6 -12,-22 -2,-12" fill="${c}"/><polygon points="14,-6 12,-22 2,-12" fill="${c}"/>
    <ellipse cx="0" cy="0" rx="16" ry="14" fill="${c}"/><circle cx="-6" cy="-1" r="2.2" fill="${eye}"/><circle cx="6" cy="-1" r="2.2" fill="${eye}"/></g>`;
}

function mug(design, body="#fbf8f2"){
  const c=uid('mc'), g=uid('mg');
  return `<svg viewBox="0 0 240 210" xmlns="http://www.w3.org/2000/svg" role="img">
  <defs><clipPath id="${c}"><rect x="40" y="30" width="140" height="150" rx="12"/></clipPath>
  <linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".22" stop-color="#fff" stop-opacity=".35"/>
  <stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset=".82" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient></defs>
  <ellipse cx="118" cy="190" rx="92" ry="9" fill="#000" opacity=".13"/>
  <path d="M176 62 C224 56 228 146 176 142" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="20" stroke-linecap="round"/>
  <path d="M176 62 C224 56 228 146 176 142" fill="none" stroke="${body}" stroke-width="15" stroke-linecap="round"/>
  <rect x="40" y="30" width="140" height="150" rx="12" fill="${body}"/>
  <g clip-path="url(#${c})">${design}</g>
  <rect x="40" y="30" width="140" height="150" rx="12" fill="url(#${g})"/>
  <ellipse cx="110" cy="32" rx="70" ry="5" fill="#000" opacity=".1"/>
  </svg>`;
}

function phone(design){
  const c=uid('pc'), g=uid('pg');
  return `<svg viewBox="0 0 170 290" xmlns="http://www.w3.org/2000/svg" role="img">
  <defs><clipPath id="${c}"><rect x="25" y="12" width="120" height="262" rx="24"/></clipPath>
  <linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>
  <rect x="31" y="20" width="120" height="262" rx="24" fill="#000" opacity=".14"/>
  <g clip-path="url(#${c})">${design}</g>
  <rect x="25" y="12" width="120" height="262" rx="24" fill="url(#${g})"/>
  <rect x="25" y="12" width="120" height="262" rx="24" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>
  <rect x="34" y="21" width="54" height="54" rx="15" fill="#1d1d1f" opacity=".94"/>
  <circle cx="49" cy="36" r="9" fill="#2a2a2e" stroke="#58585e" stroke-width="2"/>
  <circle cx="49" cy="60" r="9" fill="#2a2a2e" stroke="#58585e" stroke-width="2"/>
  <circle cx="73" cy="48" r="9" fill="#2a2a2e" stroke="#58585e" stroke-width="2"/>
  <circle cx="76" cy="30" r="3" fill="#e9e3d6"/>
  </svg>`;
}

/* ---------- designs ---------- */
const D = {
  sleigh: () => `
    ${snow(68,58,7)}${snow(152,64,6)}${snow(82,160,5)}${snow(146,152,7)}${snow(110,50,4)}
    <text x="110" y="110" text-anchor="middle" ${F} font-weight="700" font-size="38" fill="#b3262e">Sleigh</text>
    <text x="110" y="137" text-anchor="middle" ${F} font-style="italic" font-size="21" fill="#1f4d36">all day</text>`,
  tree: () => `
    <polygon points="110,54 90,84 130,84" fill="#2f6b4a"/><polygon points="110,70 84,106 136,106" fill="#24573c"/>
    <polygon points="110,88 78,128 142,128" fill="#1f4d36"/><rect x="104" y="128" width="12" height="10" fill="#7a5230"/>
    <polygon points="110,42 113,50 121,50 115,55 117,63 110,58 103,63 105,55 99,50 107,50" fill="#d9a441"/>
    <circle cx="100" cy="82" r="3.5" fill="#b3262e"/><circle cx="121" cy="100" r="3.5" fill="#d9a441"/><circle cx="96" cy="118" r="3.5" fill="#d9a441"/><circle cx="126" cy="120" r="3.5" fill="#b3262e"/>
    <text x="110" y="162" text-anchor="middle" ${F} font-style="italic" font-size="16" fill="#1f4d36">Merry &amp; Bright</text>`,
  cocoa: () => `
    <circle cx="110" cy="104" r="50" fill="#fbf6ec"/><circle cx="110" cy="104" r="44" fill="none" stroke="#b3262e" stroke-width="1.5" stroke-dasharray="3 4"/>
    <text x="110" y="86" text-anchor="middle" ${S} font-weight="700" font-size="9" letter-spacing="1.2" fill="#1f4d36">HOT COCOA</text>
    <text x="110" y="114" text-anchor="middle" ${F} font-style="italic" font-weight="500" font-size="28" fill="#b3262e">Club</text>
    <text x="110" y="132" text-anchor="middle" ${S} font-size="8.5" letter-spacing="2" fill="#1f4d36">EST. 2026</text>
    ${snow(62,52,5,"#fbf6ec")}${snow(160,160,6,"#fbf6ec")}${snow(160,54,4,"#fbf6ec")}${snow(60,160,4,"#fbf6ec")}`,
  ginger: () => `
    <g fill="#b06a33"><circle cx="110" cy="64" r="16"/><rect x="93" y="78" width="34" height="42" rx="15"/></g>
    <g stroke="#b06a33" stroke-width="12" stroke-linecap="round"><line x1="96" y1="90" x2="78" y2="104"/><line x1="124" y1="90" x2="142" y2="104"/>
    <line x1="102" y1="114" x2="94" y2="138"/><line x1="118" y1="114" x2="126" y2="138"/></g>
    <circle cx="104" cy="61" r="2.2" fill="#3b2414"/><circle cx="116" cy="61" r="2.2" fill="#3b2414"/>
    <path d="M103 69 Q110 75 117 69" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="110" cy="90" r="2.6" fill="#fff"/><circle cx="110" cy="101" r="2.6" fill="#b3262e"/><circle cx="110" cy="112" r="2.6" fill="#fff"/>
    <text x="110" y="166" text-anchor="middle" ${F} font-weight="700" font-size="20" fill="#b3262e">Oh Snap!</text>`,
  dogmom: () => `
    <ellipse cx="85" cy="80" rx="10" ry="22" fill="#7a5230" transform="rotate(22 85 80)"/>
    <ellipse cx="135" cy="80" rx="10" ry="22" fill="#7a5230" transform="rotate(-22 135 80)"/>
    <circle cx="110" cy="84" r="27" fill="#c99a6b"/><ellipse cx="110" cy="98" rx="14" ry="10" fill="#f3e3cf"/>
    <ellipse cx="110" cy="92" rx="5.5" ry="4" fill="#2b1d12"/><circle cx="100" cy="79" r="3" fill="#2b1d12"/><circle cx="120" cy="79" r="3" fill="#2b1d12"/>
    <path d="M110 96 v5 M104 103 Q110 108 116 103" stroke="#2b1d12" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <text x="110" y="146" text-anchor="middle" ${F} font-weight="700" font-size="25" fill="#1c2420">Dog Mom</text>
    <text x="110" y="164" text-anchor="middle" ${S} font-size="7.5" letter-spacing=".6" fill="#5d6862">FUELLED BY COFFEE &amp; FUR</text>`,
  cat: () => `
    <polygon points="88,78 90,52 104,66" fill="#f3ead8"/><polygon points="132,78 130,52 116,66" fill="#f3ead8"/>
    <ellipse cx="110" cy="84" rx="26" ry="23" fill="#f3ead8"/>
    <path d="M98 82 q4 -4 8 0 M114 82 q4 -4 8 0" stroke="#2b2b2b" stroke-width="2" fill="none" stroke-linecap="round"/>
    <polygon points="106,90 114,90 110,95" fill="#e58f8f"/>
    <g stroke="#2b2b2b" stroke-width="1.2"><line x1="92" y1="92" x2="76" y2="89"/><line x1="92" y1="96" x2="76" y2="98"/><line x1="128" y1="92" x2="144" y2="89"/><line x1="128" y1="96" x2="144" y2="98"/></g>
    <text x="110" y="140" text-anchor="middle" ${F} font-weight="700" font-size="22" fill="#f3ead8">Purrsonal</text>
    <text x="110" y="163" text-anchor="middle" ${F} font-style="italic" font-size="20" fill="#e9b8a8">Space</text>`,
  paws: () => `
    ${paw(70,60,.8,"#e07a5f",-20)}${paw(98,82,.7,"#e07a5f",10)}${paw(132,58,.75,"#e07a5f",25)}${paw(152,92,.6,"#e07a5f",-10)}${paw(70,110,.6,"#e07a5f",15)}
    <text x="110" y="146" text-anchor="middle" ${F} font-weight="700" font-size="22" fill="#1f4d36">Paws</text>
    <text x="110" y="168" text-anchor="middle" ${F} font-style="italic" font-size="17" fill="#1f4d36">&amp; Coffee</text>`,
  custom: () => `
    <rect x="70" y="46" width="80" height="84" rx="14" fill="#f4efe4" stroke="#1f4d36" stroke-width="1.6" stroke-dasharray="5 4"/>
    <ellipse cx="96" cy="78" rx="7" ry="15" fill="#c99a6b" transform="rotate(20 96 78)"/><ellipse cx="124" cy="78" rx="7" ry="15" fill="#c99a6b" transform="rotate(-20 124 78)"/>
    <circle cx="110" cy="88" r="20" fill="#d8b58c"/><ellipse cx="110" cy="98" rx="10" ry="7" fill="#f3e3cf"/>
    <ellipse cx="110" cy="94" rx="4" ry="3" fill="#2b1d12"/><circle cx="103" cy="84" r="2.2" fill="#2b1d12"/><circle cx="117" cy="84" r="2.2" fill="#2b1d12"/>
    <text x="110" y="152" text-anchor="middle" ${F} font-style="italic" font-size="18" fill="#1f4d36">Your pet here</text>
    <text x="110" y="168" text-anchor="middle" ${S} font-size="7.5" letter-spacing="1" fill="#5d6862">SEND US A PHOTO</text>`,

  /* cases (canvas 25..145 x, 12..274 y) */
  plaid: () => {
    let s=`<rect width="170" height="290" fill="#b3262e"/>`;
    for(const x of [20,68,116]) s+=`<rect x="${x}" y="0" width="26" height="290" fill="#1f4d36" opacity=".55"/>`;
    for(let y=10;y<290;y+=48) s+=`<rect x="0" y="${y}" width="170" height="26" fill="#1f4d36" opacity=".45"/>`;
    for(const x of [33,81,129]) s+=`<rect x="${x}" y="0" width="2" height="290" fill="#fff" opacity=".35"/>`;
    for(let y=22;y<290;y+=48) s+=`<rect x="0" y="${y}" width="170" height="2" fill="#d9a441" opacity=".6"/>`;
    return s;
  },
  pines: () => {
    let s=`<rect width="170" height="290" fill="#14254a"/><circle cx="118" cy="104" r="16" fill="#f3ead8"/><circle cx="125" cy="99" r="14" fill="#14254a"/>`;
    const dots=[[40,95],[60,130],[100,90],[135,140],[50,170],[90,150],[120,180],[70,110],[110,125],[40,210],[140,210],[80,190]];
    for(const [x,y] of dots) s+=`<circle cx="${x}" cy="${y}" r="1.8" fill="#fff" opacity=".85"/>`;
    const trees=[[40,250,26],[70,258,34],[102,252,28],[132,260,36]];
    for(const [x,y,h] of trees) s+=`<polygon points="${x},${y-h*1.6} ${x-h*.5},${y} ${x+h*.5},${y}" fill="#2f6b4a"/><polygon points="${x},${y-h*1.6} ${x-h*.28},${y-h*.7} ${x+h*.28},${y-h*.7}" fill="#3e8a5f"/>`;
    s+=`<ellipse cx="85" cy="282" rx="90" ry="22" fill="#f3f1ea"/>`;
    return s;
  },
  cats: () => {
    let s=`<rect width="170" height="290" fill="#f6d9d3"/>`; let i=0;
    for(let y=40;y<290;y+=46){ for(let x=(Math.floor(y/46)%2?40:62);x<160;x+=44){
      s+=catHead(x,y,.9,i++%3===0?"#e07a5f":"#2b2b2b", "#f6d9d3"); } }
    return s;
  },
  pawcase: () => {
    let s=`<rect width="170" height="290" fill="#bcd0ad"/>`; let i=0;
    for(let y=34;y<290;y+=42){ for(let x=(Math.floor(y/42)%2?42:64);x<160;x+=44){
      s+=paw(x,y,.75,i++%2?"#1f4d36":"#fbf6ec",(i*37)%50-25); } }
    return s;
  },
  customcase: () => `
    <rect width="170" height="290" fill="#fbe7c8"/>
    <rect x="40" y="104" width="90" height="104" rx="18" fill="#fff8ec" stroke="#1f4d36" stroke-width="1.6" stroke-dasharray="5 4"/>
    ${catHead(85,150,1.6,"#2b2b2b","#fbe7c8")}
    <text x="85" y="236" text-anchor="middle" ${F} font-style="italic" font-size="17" fill="#1f4d36">Your pet</text>
    <text x="85" y="252" text-anchor="middle" ${S} font-size="8.5" letter-spacing="1.5" fill="#5d6862">+ THEIR NAME</text>`
};

