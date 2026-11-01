/* Camera Bay V19 — compact dashboard, stock on demand. */
(function(){
  'use strict';

  function init(){
    const dash=document.getElementById('dash');
    const stock=document.getElementById('stocktable');
    const stockMsg=document.getElementById('stockmsg');

    if(!dash||!stock||!stockMsg)return;
    if(document.getElementById('cb-v19-stock-details'))return;

    const heading=Array.from(dash.querySelectorAll('h3'))
      .find(el=>el.textContent.trim().toLowerCase()
      .includes('product catalog'));

    const details=document.createElement('details');
    details.id='cb-v19-stock-details';
    details.style.cssText=
      'margin:18px 0;border:1px solid #d5e3e9;' +
      'border-radius:12px;background:#fff;overflow:hidden';

    const summary=document.createElement('summary');
    summary.textContent='📦 View Stock & Products';
    summary.style.cssText=
      'cursor:pointer;padding:16px;font-weight:700;' +
      'background:#edf7fa;color:#173047';

    const body=document.createElement('div');
    body.style.cssText='padding:12px;overflow-x:auto';

    body.append(stockMsg,stock);
    details.append(summary,body);

    if(heading){
      heading.replaceWith(details);
    }else{
      dash.append(details);
    }

    const inventory=document.getElementById('inventory');
    if(inventory&&inventory.closest('.metric')){
      inventory.closest('.metric').style.display='none';
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
