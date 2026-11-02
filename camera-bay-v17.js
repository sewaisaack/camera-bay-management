/* Camera Bay V17 — Create Product + Initial Stock (atomic RPC). Load after V16. */
(function(){
'use strict';
const previous=window.loadStock;
if(typeof previous!=='function')return;
window.loadStock=async function(staff,branches,feedback=''){
 await previous(staff,branches,feedback);
 const root=document.getElementById('stocktable');
 if(!root||staff.role!=='super_admin'||!['admin','admin2'].includes(staff.username))return;
 document.getElementById('cb-v17-create')?.remove();
 const box=document.createElement('section');box.id='cb-v17-create';box.className='card';
 box.innerHTML=`<h3>➕ Add New Product + Initial Stock</h3>
 <p>Sajili bidhaa mpya na mzigo wake kwa hatua moja. Kwa bidhaa iliyopo tumia Stock In.</p>
 <label for="cb17-name">Product Name / Jina la Bidhaa</label><input id="cb17-name" maxlength="160" placeholder="Mfano: Canon EOS R6" required>
 <label for="cb17-cat">Category / Aina</label><input id="cb17-cat" placeholder="Camera, Lens, Accessories" required>
 <label for="cb17-buy">Buying Price (TZS)</label><input id="cb17-buy" type="number" min="0" step="0.01" placeholder="0" required>
 <label for="cb17-sell">Selling Price (TZS)</label><input id="cb17-sell" type="number" min="0" step="0.01" placeholder="0" required>
 <label for="cb17-branch">Branch / Tawi</label><select id="cb17-branch"></select>
 <label for="cb17-qty">Initial Stock / Idadi ya Mwanzo</label><input id="cb17-qty" type="number" min="0" step="1" value="0" required>
 <label for="cb17-notes">Supplier / Invoice Number (optional)</label><input id="cb17-notes" maxlength="250">
 <button type="button" id="cb17-save">Save Product &amp; Stock</button><p id="cb17-status" role="status"></p>`;
 const anchor=document.getElementById('v9-stock-in');
 if(anchor)anchor.before(box);else root.appendChild(box);
 const el=id=>document.getElementById(id);
 for(const b of branches){const opt=document.createElement('option');opt.value=b.id;opt.textContent=b.name;el('cb17-branch').appendChild(opt)}
 el('cb17-save').onclick=async()=>{
  const name=el('cb17-name').value.trim(),cat=el('cb17-cat').value.trim();
  const buy=Number(el('cb17-buy').value),sell=Number(el('cb17-sell').value),qty=Number(el('cb17-qty').value);
  const status=el('cb17-status');
  if(name.length<2||!cat||!el('cb17-buy').value||!el('cb17-sell').value||!el('cb17-qty').value||!el('cb17-branch').value||!Number.isFinite(buy)||!Number.isFinite(sell)||buy<0||sell<0||!Number.isSafeInteger(qty)||qty<0){status.textContent='Jaza jina, category, bei, tawi na idadi sahihi.';status.className='error';return;}
  if(!confirm('Save NEW product '+name+' with '+qty+' units?'))return;
  const button=el('cb17-save');button.disabled=true;status.textContent='Saving...';status.className='';
  try{
   const {error}=await client.rpc('create_product_with_stock',{p_name:name,p_category:cat,p_buying_price:buy,p_selling_price:sell,p_branch_id:el('cb17-branch').value,p_quantity:qty,p_notes:el('cb17-notes').value.trim()||null});
   if(error)throw error;
   await window.loadStock(staff,branches,'New product and stock saved successfully!');
  }catch(e){status.textContent='Not saved: '+e.message;status.className='error';button.disabled=false;}
 };
};
})();
