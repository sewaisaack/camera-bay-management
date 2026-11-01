/* Camera Bay V16 — Smart Product Search. Load after V15. */
(function(){
'use strict';
const previous=window.loadStock;
if(typeof previous!=='function')return;
const style=document.createElement('style');
style.textContent='.cb-search-results{max-height:240px;overflow:auto;border:1px solid #cddfe9;border-radius:10px;background:white;margin-top:4px}.cb-search-result{display:block;width:100%;text-align:left;background:white;color:#173047;margin:0;border-radius:0;border-bottom:1px solid #e7eef2;font-weight:500}.cb-search-result:hover,.cb-search-result:focus{background:#eaf7fc}.cb-search-result small{display:block;color:#526b7b;font-weight:400}.cb-search-wrap{margin:10px 0}.cb-search-wrap>input{margin-top:5px}.cb-search-note{font-size:13px;margin:6px 0;color:#506b7a}';
document.head.appendChild(style);
let stockCache=[];
function productSelects(root){
 const result=[];
 for(const select of root.querySelectorAll('select')){
  const options=Array.from(select.options);
  if(!options.length)continue;
  // Identify product lists by matching against catalog, not by their label or branch options.
  const hits=options.filter(o=>stockCache.some(p=>p.id===o.value));
  if(hits.length && hits.length>=Math.max(1,Math.ceil(options.length*.8)))result.push(select);
 }
 return result;
}
function setup(select){
 if(select.dataset.cbSearch==='yes')return;
 select.dataset.cbSearch='yes';
 const original=Array.from(select.options).map(o=>({id:o.value,name:o.textContent}));
 const wrap=document.createElement('div');wrap.className='cb-search-wrap';
 const input=document.createElement('input');input.type='search';input.placeholder='🔎 Tafuta bidhaa / Search product (mfano: nik)';input.autocomplete='off';input.setAttribute('aria-label','Search and select product');
 const results=document.createElement('div');results.className='cb-search-results';results.hidden=true;
 const note=document.createElement('p');note.className='cb-search-note';
 wrap.append(input,results,note);select.before(wrap);
 function stockLine(id){
  const p=stockCache.find(x=>x.id===id);if(!p)return '';
  return p.category?'Category: '+p.category:'';
 }
 function choose(item){
  // Keep the original select and options intact so existing V9/V14 logic works.
  select.value=item.id;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  input.value=item.name;
  results.hidden=true;
  note.textContent=stockLine(item.id);
 }
 function render(){
  const q=input.value.trim().toLocaleLowerCase();results.replaceChildren();
  if(!q){results.hidden=true;return;}
  const found=original.filter(o=>o.name.toLocaleLowerCase().includes(q)).slice(0,25);
  for(const item of found){
   const b=document.createElement('button');b.type='button';b.className='cb-search-result';
   b.textContent=item.name;
   const sub=document.createElement('small');sub.textContent=stockLine(item.id);b.appendChild(sub);
   b.onclick=()=>choose(item);results.appendChild(b);
  }
  if(!found.length){const p=document.createElement('p');p.textContent='Hakuna bidhaa inayolingana / No matching product';p.style.padding='8px';results.appendChild(p);}
  results.hidden=false;
 }
 input.addEventListener('input',render);
 input.addEventListener('focus',()=>{if(input.value.trim())render()});
 input.addEventListener('keydown',e=>{
  if(e.key==='Escape')results.hidden=true;
  if(e.key==='Enter'&&!results.hidden){const first=results.querySelector('button');if(first){e.preventDefault();first.click();}}
 });
 select.addEventListener('change',()=>{
  const item=original.find(o=>o.id===select.value);
  if(item){input.value=item.name;note.textContent=stockLine(item.id);}
 });
 const chosen=original.find(o=>o.id===select.value);
 if(chosen){input.value=chosen.name;note.textContent=stockLine(chosen.id);}
}
window.loadStock=async function(staff,branches,feedback=''){
 await previous(staff,branches,feedback);
 const root=document.getElementById('stocktable');if(!root)return;
 try{
  const r=await client.from('sales_product_catalog').select('id,name,category').order('name');
  if(!r.error)stockCache=r.data||[];
 }catch(e){console.warn('Smart search catalog unavailable',e);}
 for(const select of productSelects(root))setup(select);
};
})();
