/* Camera Bay V14 — Stock Transfer, Stock Out, POS and Reports */
(function(){
'use strict';
const prior=window.loadStock;
if(typeof prior!=='function')return;
const money=n=>Number(n||0).toLocaleString('en-TZ');
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
function field(box,label,type='text'){
 const l=el('label',label),input=el(type==='select'?'select':'input');if(type!=='select')input.type=type;
 l.appendChild(input);box.appendChild(l);return input;
}
function fill(select,items){select.replaceChildren();for(const item of items)select.add(new Option(item.name,item.id));}
function status(box){const p=el('p','Ready');p.setAttribute('role','status');box.appendChild(p);return p;}
function section(root,title){const box=el('section');box.className='card';box.style.marginTop='16px';box.appendChild(el('h3',title));root.appendChild(box);return box;}
function button(box,title){const b=el('button',title);b.type='button';box.appendChild(b);return b;}
function getError(e){return e?.message||String(e)}
window.loadStock=async function(staff,branches,feedback=''){
 await prior(staff,branches,feedback);
 const root=document.getElementById('stocktable');if(!root)return;
 document.getElementById('cb-v14')?.remove();
 const panel=el('div');panel.id='cb-v14';root.appendChild(panel);
 const admin=staff.role==='super_admin'&&['admin','admin2'].includes(staff.username);
 const allowed=staff.role==='super_admin'||staff.role==='manager'||staff.role==='cashier';
 const ownBranches=staff.role==='super_admin'?branches:branches.filter(b=>b.id===staff.branch_id);
 let products=[];
 try{const r=await client.from('sales_product_catalog').select('id,name,reference_price').order('name');if(r.error)throw r.error;products=r.data||[];}
 catch(e){panel.appendChild(el('p','Product loading failed: '+getError(e)));return;}
 if(admin){
  const box=section(panel,'↔ Stock Transfer / Hamisha Mzigo');
  const product=field(box,'Product / Bidhaa','select'),from=field(box,'From Branch / Kutoka','select'),to=field(box,'To Branch / Kwenda','select'),qty=field(box,'Quantity / Idadi','number'),notes=field(box,'Notes / Maelezo');
  qty.min='1';qty.step='1';fill(product,products);fill(from,branches);fill(to,branches);if(to.options.length>1)to.selectedIndex=1;
  const save=button(box,'Transfer Stock'),msg=status(box);
  save.disabled=!products.length||branches.length<2;
  save.onclick=async()=>{
   const n=Number(qty.value);if(!Number.isSafeInteger(n)||n<1){msg.textContent='Enter valid quantity.';return;}
   if(from.value===to.value){msg.textContent='Select two different branches.';return;}
   if(!confirm('Transfer '+n+' '+product.selectedOptions[0].text+' from '+from.selectedOptions[0].text+' to '+to.selectedOptions[0].text+'?'))return;
   save.disabled=true;msg.textContent='Saving transfer...';
   try{const r=await client.rpc('stock_transfer',{p_product_id:product.value,p_from_branch_id:from.value,p_to_branch_id:to.value,p_quantity:n,p_notes:notes.value.trim()||null});if(r.error)throw r.error;await window.loadStock(staff,branches,'Stock Transfer saved successfully!');}
   catch(e){msg.textContent='Transfer failed: '+getError(e);save.disabled=false;}
  };
  const out=section(panel,'− Stock Out / Toa Stock');
  const op=field(out,'Product / Bidhaa','select'),ob=field(out,'Branch / Tawi','select'),oq=field(out,'Quantity / Idadi','number'),reason=field(out,'Reason / Sababu','select'),on=field(out,'Notes / Maelezo');
  oq.min='1';oq.step='1';fill(op,products);fill(ob,branches);
  [['damaged','Damaged / Imeharibika'],['lost','Lost / Imepotea'],['internal_use','Internal use / Matumizi ya kampuni'],['other','Other / Nyingine']].forEach(([v,t])=>reason.add(new Option(t,v)));
  const os=button(out,'Save Stock Out'),om=status(out);os.disabled=!products.length||!branches.length;
  os.onclick=async()=>{
   const n=Number(oq.value);if(!Number.isSafeInteger(n)||n<1){om.textContent='Enter valid quantity.';return;}
   if(!confirm('Remove '+n+' '+op.selectedOptions[0].text+' from '+ob.selectedOptions[0].text+'?'))return;
   os.disabled=true;om.textContent='Saving...';
   try{const r=await client.rpc('stock_out',{p_product_id:op.value,p_branch_id:ob.value,p_quantity:n,p_reason:reason.value,p_notes:on.value.trim()||null});if(r.error)throw r.error;await window.loadStock(staff,branches,'Stock Out saved successfully!');}
   catch(e){om.textContent='Stock Out failed: '+getError(e);os.disabled=false;}
  };
 }
 if(allowed){
  const box=section(panel,'🧾 POS / Record Sale');
  const branch=field(box,'Branch / Tawi','select'),product=field(box,'Product / Bidhaa','select'),qty=field(box,'Quantity / Idadi','number'),price=field(box,'Selling price per unit (TZS)','number'),customer=field(box,'Customer (optional)'),method=field(box,'Payment Method','select');
  fill(branch,ownBranches);fill(product,products);qty.min='1';qty.step='1';price.min='0';price.step='0.01';
  [['cash','Cash'],['mobile_money','Mobile Money'],['bank','Bank'],['card','Card']].forEach(([v,t])=>method.add(new Option(t,v)));
  product.onchange=()=>{price.value=products.find(p=>p.id===product.value)?.reference_price??'';};product.onchange();
  const cart=[];const cartView=el('div');box.appendChild(cartView);
  function drawCart(){cartView.replaceChildren();if(!cart.length){cartView.appendChild(el('p','No items in cart.'));return;}
   for(let i=0;i<cart.length;i++){const item=cart[i],row=el('div');row.className='row';row.appendChild(el('span',item.name+' × '+item.quantity+' — TZS '+money(item.unit_price*item.quantity)));const remove=button(row,'Remove');remove.className='secondary';remove.onclick=()=>{cart.splice(i,1);drawCart();};cartView.appendChild(row);}
   cartView.appendChild(el('strong','Total: TZS '+money(cart.reduce((s,i)=>s+i.quantity*i.unit_price,0))));
  }
  drawCart();const add=button(box,'Add to Cart'),save=button(box,'Confirm & Save Sale'),msg=status(box);save.disabled=!products.length||!ownBranches.length;
  add.onclick=()=>{const n=Number(qty.value),p=Number(price.value);if(!Number.isSafeInteger(n)||n<1||!Number.isFinite(p)||p<0||Math.round(p*100)!==p*100){msg.textContent='Enter valid quantity and selling price.';return;}const found=products.find(x=>x.id===product.value);if(!found)return;cart.push({product_id:found.id,name:found.name,quantity:n,unit_price:p});qty.value='';drawCart();msg.textContent='Added to cart.';};
  save.onclick=async()=>{if(!cart.length){msg.textContent='Add products to cart first.';return;}
   if(!confirm('Confirm sale: TZS '+money(cart.reduce((s,i)=>s+i.quantity*i.unit_price,0))+'? This will deduct stock.'))return;
   save.disabled=true;msg.textContent='Saving sale...';
   try{const r=await client.rpc('record_pos_sale',{p_branch_id:branch.value,p_items:cart.map(({product_id,quantity,unit_price})=>({product_id,quantity,unit_price})),p_payment_method:method.value,p_customer_name:customer.value.trim()||null});if(r.error)throw r.error;await window.loadStock(staff,branches,'Sale saved! Receipt ID: '+r.data);}
   catch(e){msg.textContent='Sale failed: '+getError(e);save.disabled=false;}
  };
 }
 const report=section(panel,'📊 Reports & Analytics');
 const from=field(report,'From date','date'),to=field(report,'To date','date'),b=field(report,'Branch','select');
 const now=new Date();const local=new Date(now.getTime()+3*3600000);const date=local.toISOString().slice(0,10);to.value=date;const past=new Date(local.getTime()-29*86400000);from.value=past.toISOString().slice(0,10);
 if(admin)b.add(new Option('All branches',''));fillExtra();
 function fillExtra(){for(const item of ownBranches)b.add(new Option(item.name,item.id));}
 const run=button(report,'Load Reports'),output=el('div');report.appendChild(output);
 run.onclick=async()=>{output.replaceChildren(el('p','Loading reports...'));run.disabled=true;
  try{const r=await client.rpc('camera_bay_reports',{p_from:from.value,p_to:to.value,p_branch_id:b.value||null});if(r.error)throw r.error;const data=r.data||{};output.replaceChildren();
   output.appendChild(el('h4','Sales: '+money(data.orders)+' | Revenue: TZS '+money(data.revenue)));
   if(admin)output.appendChild(el('p','Gross profit (before expenses): TZS '+money(data.gross_profit)));
   function table(title,rows,cols){output.appendChild(el('h4',title));if(!rows?.length){output.appendChild(el('p','No records.'));return;}
    const wrap=el('div');wrap.className='table-wrap';const t=el('table'),tr=el('tr');for(const [key,label] of cols)tr.appendChild(el('th',label));t.appendChild(tr);
    for(const row of rows){const tr=el('tr');for(const [key] of cols)tr.appendChild(el('td',String(row[key]??'')));t.appendChild(tr);}wrap.appendChild(t);output.appendChild(wrap);
   }
   table('Daily Sales',data.daily,[['day','Date'],['orders','Orders'],['revenue','TZS']]);
   table('Branches',data.branches,[['name','Branch'],['orders','Orders'],['revenue','TZS']]);
   table('Top Products',data.top_products,[['product_name','Product'],['units','Units'],['revenue','TZS']]);
   table('Low Stock Alerts',data.low_stock,[['product','Product'],['branch','Branch'],['quantity','Available'],['minimum_stock','Minimum']]);
  }catch(e){output.replaceChildren(el('p','Reports unavailable: '+getError(e)));}finally{run.disabled=false;}
 };
};
})();
