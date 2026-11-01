/* CAMERA BAY V15 — dashboard polish and workflow guidance.
   Load AFTER camera-bay-v14.js. Preserves V9 and V14 functionality. */
(function () {
  'use strict';
  const css = document.createElement('style');
  css.textContent = `
    :root { color-scheme:light; }
    .wrap {max-width:1200px;margin:16px auto}
    body {background:linear-gradient(155deg,#edf7fb,#f9fcff)}
    .card {box-shadow:0 8px 28px #163a5010}
    button {touch-action:manipulation}
    button:focus-visible,input:focus-visible,select:focus-visible {outline:3px solid #6ec9f0;outline-offset:2px}
    #cb-v15-nav {display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
    #cb-v15-nav button {margin:0;padding:10px 14px}
    #cb-v15-guide {border-left:4px solid #159dc6;padding:10px 14px;background:#eff9fd;border-radius:8px;margin:12px 0}
    #cb-v15-guide p {margin:5px 0}
    #cb-v15-guide strong {color:#12364e}
    @media(max-width:650px) {
      .wrap {padding:10px;margin:0}
      .card {padding:14px;border-radius:14px}
      #cb-v15-nav button {flex:1 1 45%}
      h1 {font-size:1.65rem}
      td,th {font-size:12px}
    }`;
  document.head.appendChild(css);
  document.title='Camera Bay | Management System';
  const h=document.querySelector('body > main > h1');
  if(h)h.textContent='CAMERA BAY STORE';
  const subtitle=h?.nextElementSibling;
  if(subtitle)subtitle.textContent='Management System • Inventory • Sales • Reports';
  const legacy=document.querySelector('body > main > .notice');
  if(legacy) {
    legacy.textContent='Camera Bay Management System: Rekodi stock halisi kabla ya kuuza. POS hupunguza stock wakati mauzo yanapohifadhiwa.';
  }
  const dash=document.getElementById('dash');
  if(dash) {
    for(const item of dash.querySelectorAll('.notice')) {
      if(/not a finished POS|not.*POS/i.test(item.textContent)) {
        item.textContent='Kabla ya kutumia kwenye mauzo halisi: hakiki stock, bei, ruhusa za watumiaji na jaribu mauzo moja kutoka mwanzo hadi mwisho.';
      }
    }
    const recentTitle=[...dash.querySelectorAll('h3')].find(e=>/recent sales/i.test(e.textContent));
    if(recentTitle)recentTitle.textContent='Recent Sales / Mauzo ya Karibuni';
  }
  const previous=window.loadStock;
  if(typeof previous!=='function')return;
  window.loadStock=async function(staff,branches,feedback='') {
    await previous(staff,branches,feedback);
    const root=document.getElementById('stocktable');
    if(!root)return;
    document.getElementById('cb-v15-nav')?.remove();
    document.getElementById('cb-v15-guide')?.remove();
    // Initial Stock is for a one-time database bootstrap only; regular stock
    // must be entered through Stock In. Hide misleading duplicate workflow.
    const legacyInitial=[...root.querySelectorAll('h3')]
      .find(e=>/Initial Stock Entry/i.test(e.textContent));
    if(legacyInitial && legacyInitial.parentElement) {
      legacyInitial.parentElement.hidden=true;
    }
    const guide=document.createElement('div');
    guide.id='cb-v15-guide';
    guide.innerHTML='<strong>Stock workflow / Mwongozo</strong><p>Stock In = kuongeza mzigo; Stock Transfer = kuhamisha tawi; POS = kuuza na kupunguza stock; Stock Out = kuondoa stock bila mauzo (iliyoharibika, iliyopotea au matumizi ya ndani).</p>';
    root.prepend(guide);
    const nav=document.createElement('nav');
    nav.id='cb-v15-nav';
    nav.setAttribute('aria-label','Quick sections');
    const targets=[
      ['Products & Stock',()=>root.querySelector('.filters')],
      ['Stock In',()=>document.getElementById('v9-stock-in')],
      ['Transfer',()=>[...root.querySelectorAll('h3')].find(x=>x.textContent.includes('Stock Transfer'))],
      ['Stock Out',()=>[...root.querySelectorAll('h3')].find(x=>x.textContent.includes('Stock Out'))],
      ['POS / Sales',()=>[...root.querySelectorAll('h3')].find(x=>x.textContent.includes('POS / Record Sale'))],
      ['Reports',()=>[...root.querySelectorAll('h3')].find(x=>x.textContent.includes('Reports & Analytics'))]
    ];
    for(const [label,find] of targets) {
      const target=find();
      if(!target)continue;
      const b=document.createElement('button');
      b.type='button';b.className='secondary';b.textContent=label;
      b.onclick=()=>target.scrollIntoView({behavior:'smooth',block:'start'});
      nav.appendChild(b);
    }
    root.prepend(nav);
  };
})();
