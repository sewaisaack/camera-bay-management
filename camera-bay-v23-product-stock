/* CAMERA BAY V23 — Add/update product and receive stock in one form */
(function () {
  'use strict';
  const previous = window.loadStock;
  if (typeof previous !== 'function') return;
  window.loadStock = async function (staff, branches, feedback = '') {
    await previous(staff, branches, feedback);
    if (!staff || staff.role !== 'super_admin' || !['admin', 'admin2'].includes(staff.username)) return;
    const root = document.getElementById('stocktable');
    if (!root) return;
    const heading = [...root.querySelectorAll('h3')].find(h => h.textContent.includes('Add Product'));
    const form = heading?.parentElement?.querySelector('form');
    if (!form || form.querySelector('[data-cb-v23]')) return;
    const inputs = [...form.querySelectorAll('input')];
    const name = inputs.find(i => i.placeholder === 'Product Name');
    const category = inputs.find(i => i.placeholder.startsWith('Category'));
    const price = inputs.find(i => i.type === 'number');
    const button = form.querySelector('button[type="submit"]');
    if (!name || !category || !button) return;

    const panel = document.createElement('div');
    panel.dataset.cbV23 = '1';
    panel.style.cssText = 'margin:14px 0;padding:14px;border:1px solid #c9dce5;border-radius:12px;background:#f6fbfd';
    const title = document.createElement('strong');
    title.textContent = 'Stock / Idadi ya Bidhaa (optional)';
    const branchLabel = document.createElement('label'); branchLabel.textContent = 'Branch / Tawi';
    const branch = document.createElement('select');
    const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'Chagua tawi'; branch.append(blank);
    for (const b of branches || []) { const o = document.createElement('option'); o.value = b.id; o.textContent = b.name; branch.append(o); }
    const qtyLabel = document.createElement('label'); qtyLabel.textContent = 'Quantity / Idadi ya kuongeza';
    const qty = document.createElement('input'); qty.type = 'number'; qty.min = '1'; qty.step = '1'; qty.placeholder = 'Mfano: 5 (acha wazi kama hakuna stock)';
    const noteLabel = document.createElement('label'); noteLabel.textContent = 'Invoice / Notes (optional)';
    const notes = document.createElement('input'); notes.type = 'text'; notes.placeholder = 'Namba ya invoice au maelezo';
    const hint = document.createElement('p'); hint.textContent = 'Ukiweka idadi, bidhaa itahifadhiwa na stock itaongezwa kwenye tawi ulilochagua.';
    hint.style.cssText = 'font-size:13px;color:#567';
    panel.append(title, branchLabel, branch, qtyLabel, qty, noteLabel, notes, hint);
    form.insertBefore(panel, button);

    // Run before V22 and the original form handlers only when quantity is entered.
    form.addEventListener('submit', async e => {
      if (qty.value.trim() === '') return;
      e.preventDefault(); e.stopImmediatePropagation();
      const n = Number(qty.value);
      const productName = name.value.trim();
      const productCategory = category.value.trim();
      const p = !price || price.value === '' ? null : Number(price.value);
      if (!productName || !productCategory || (p !== null && (!Number.isFinite(p) || p < 0))) { alert('Jaza jina, category na bei sahihi.'); return; }
      if (!Number.isSafeInteger(n) || n <= 0 || !branch.value) { alert('Chagua tawi na idadi sahihi zaidi ya 0.'); return; }
      const editing = button.textContent.trim() === 'Update Product';
      const search = [...heading.parentElement.querySelectorAll('input')].find(i => i.placeholder === 'Andika jina la bidhaa...');
      if (editing && !search?.value.trim()) { alert('Chagua bidhaa iliyopo kwenye Search Existing Product kwanza.'); return; }
      if (!confirm((editing ? 'Update product' : 'Save new product') + ' + ongeza stock ' + n + '?')) return;
      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = 'Saving...';
      let productSaved = false;
      try {
        let productId;
        if (editing) {
          const { data: matches, error: findError } = await client.from('sales_product_catalog')
            .select('id,name').eq('name', search.value.trim());
          if (findError) throw findError;
          if (!matches || matches.length !== 1) throw new Error('Bidhaa haijapatikana kwa uhakika. Ichague tena kwenye search.');
          productId = matches[0].id;
          const { error } = await client.rpc('update_store_product', {
            p_product_id: productId, p_name: productName, p_category: productCategory, p_reference_price: p
          });
          if (error) throw error;
        } else {
          const { data, error } = await client.rpc('add_store_product', {
            p_name: productName, p_category: productCategory, p_reference_price: p
          });
          if (error) throw error;
          productId = data;
        }
        productSaved = true;
        const { error: stockError } = await client.rpc('stock_in', {
          p_product_id: productId, p_branch_id: branch.value, p_quantity: n,
          p_notes: notes.value.trim() || null
        });
        if (stockError) throw stockError;
        await window.loadStock(staff, branches, 'Product and stock saved successfully!');
      } catch (err) {
        alert((productSaved ? 'Bidhaa imehifadhiwa LAKINI stock haijaongezwa. Usisajili tena bidhaa; tumia Stock In. ' : 'Haijahifadhiwa: ') + err.message);
        button.disabled = false;
        button.textContent = originalText;
      }
    }, true);
  };
})();
