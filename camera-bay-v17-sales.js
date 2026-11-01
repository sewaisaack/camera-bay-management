/* Camera Bay V17: read-only live sales figures; preserves V9-V16. */
(function(){
'use strict';
const tz='Africa/Dar_es_Salaam';
const money=n=>'TZS '+Number(n||0).toLocaleString('en-TZ',{maximumFractionDigits:2});
const day=d=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const card=document.createElement('section');card.id='cb-v17-sales';card.style.cssText='margin:18px 0;padding:18px;border:1px solid #d8e9f1;border-radius:14px;background:#f4fbff';
const title=document.createElement('h3');title.textContent='Sales Figures / Mauzo (TZS)';card.append(title);
const status=document.createElement('p');status.setAttribute('role','status');card.append(status);
const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px';card.append(grid);
const fields=['Today','This Week','This Month','This Year','All Time','Transactions'];const nodes={};
for(const name of fields){const box=document.createElement('div');box.className='metric';box.textContent=name;const val=document.createElement('b');val.textContent='—';box.append(val);grid.append(box);nodes[name]=val;}
const details=document.createElement('div');details.style.marginTop='12px';card.append(details);
const refresh=document.createElement('button');refresh.type='button';refresh.className='secondary';refresh.textContent='Refresh Sales Figures';card.append(refresh);
let busy=false;
async function update(){
 if(busy)return;
 const dash=document.getElementById('dash');if(!dash||dash.classList.contains('hidden'))return;
 if(typeof client==='undefined'||!client){status.textContent='Connection not available.';return;}
 busy=true;refresh.disabled=true;status.textContent='Loading verified sales...';
 try{
  const now=new Date(),today=day(now),year=Number(today.slice(0,4)),month=today.slice(0,7);
  const weekday=(new Date(today+'T12:00:00Z').getUTCDay()+6)%7;
  const monday=new Date(today+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-weekday);const weekStart=day(monday);
  let rows=[],from=0;const pageSize=500;
  while(true){const {data,error}=await client.from('sales').select('id,branch_id,total_amount,created_at').order('created_at',{ascending:false}).range(from,from+pageSize-1);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<pageSize)break;from+=pageSize;if(from>=100000)throw new Error('Too many sales records; use server-side reporting.');}
  const totals={Today:0,'This Week':0,'This Month':0,'This Year':0,'All Time':0};
  for(const row of rows){const d=day(new Date(row.created_at)),amount=Number(row.total_amount||0);if(!Number.isFinite(amount))continue;totals['All Time']+=amount;if(d===today)totals.Today+=amount;if(d>=weekStart&&d<=today)totals['This Week']+=amount;if(d.slice(0,7)===month)totals['This Month']+=amount;if(Number(d.slice(0,4))===year)totals['This Year']+=amount;}
  for(const key of Object.keys(totals))nodes[key].textContent=money(totals[key]);nodes.Transactions.textContent=rows.length.toLocaleString('en-TZ');
  const isAdmin=document.getElementById('role')?.textContent.trim()==='super_admin';details.replaceChildren();
  if(isAdmin){const {data:branches,error}=await client.from('branches').select('id,name');if(error)throw error;const byBranch=new Map((branches||[]).map(b=>[b.id,{name:b.name,total:0,count:0}]));for(const row of rows){const b=byBranch.get(row.branch_id);if(b){b.total+=Number(row.total_amount||0);b.count++;}}const heading=document.createElement('h4');heading.textContent='Sales by Branch / Mauzo kwa Tawi';details.append(heading);for(const b of byBranch.values()){if(!b.count)continue;const p=document.createElement('p');p.textContent=b.name+': '+money(b.total)+' ('+b.count+' transactions)';details.append(p);}}
  status.textContent='Updated: '+new Intl.DateTimeFormat('en-TZ',{timeZone:tz,dateStyle:'medium',timeStyle:'short'}).format(now)+' · Figures reflect sales accessible to this account.';
  const old=document.getElementById('sales');if(old)old.textContent=String(rows.length);
 }catch(e){status.textContent='Unable to load sales figures: '+(e?.message||String(e));}
 finally{busy=false;refresh.disabled=false;}
}
refresh.addEventListener('click',update);
function mount(){const dash=document.getElementById('dash');if(!dash)return;const metrics=dash.querySelector('.grid');if(metrics&&!card.isConnected)metrics.insertAdjacentElement('afterend',card);}
mount();
const observer=new MutationObserver(()=>{const dash=document.getElementById('dash');if(dash&&!dash.classList.contains('hidden')){mount();update();}});
const dash=document.getElementById('dash');if(dash)observer.observe(dash,{attributes:true,attributeFilter:['class']});
window.cameraBayRefreshSales=update;
})();
