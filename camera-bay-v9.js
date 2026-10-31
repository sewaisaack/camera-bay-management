/* CAMERA BAY V9 — STOCK IN */
(function () {
  'use strict';

  const oldLoadStock = window.loadStock;

  if (typeof oldLoadStock !== 'function') {
    console.error('V8 loadStock not found');
    return;
  }

  window.loadStock = async function (
    staff, branches, feedback = ''
  ) {
    await oldLoadStock(staff, branches, feedback);

    if (
      staff.role !== 'super_admin' ||
      !['admin', 'admin2'].includes(staff.username)
    ) return;

    const root = document.getElementById('stocktable');
    if (!root) return;

    document.getElementById('v9-stock-in')?.remove();

    const box = document.createElement('section');
    box.id = 'v9-stock-in';
    box.className = 'card';

    box.innerHTML = `
      <h3>+ Stock In / Ongeza Mzigo</h3>

      <label>Product / Bidhaa</label>
      <select id="v9-product"></select>

      <label>Branch / Store</label>
      <select id="v9-branch"></select>

      <label>Quantity / Idadi</label>
      <input id="v9-qty"
             type="number"
             min="1"
             step="1">

      <label>Notes / Invoice Number</label>
      <input id="v9-notes" type="text">

      <button id="v9-save">Save Stock In</button>
      <p id="v9-status"></p>
    `;

    root.appendChild(box);

    const $ = id => document.getElementById(id);
    const save = $('v9-save');
    const status = $('v9-status');

    save.disabled = true;
    status.textContent = 'Loading products...';

    try {
      const { data, error } = await client
        .from('sales_product_catalog')
        .select('id,name')
        .order('name');

      if (error) throw error;

      for (const p of data || []) {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        $('v9-product').appendChild(option);
      }

      for (const b of branches || []) {
        const option = document.createElement('option');
        option.value = b.id;
        option.textContent = b.name;
        $('v9-branch').appendChild(option);
      }

      if (!$('v9-product').value || !$('v9-branch').value) {
        status.textContent = 'No products or branches found.';
        return;
      }

      save.disabled = false;
      status.textContent = 'Ready';

    } catch (err) {
      status.textContent = 'Error: ' + err.message;
      return;
    }

    save.onclick = async () => {
      const qty = Number($('v9-qty').value);

      if (!Number.isSafeInteger(qty) || qty <= 0) {
        status.textContent = 'Enter valid quantity.';
        return;
      }

      if (!confirm('Confirm Stock In: ' + qty + '?')) {
        return;
      }

      save.disabled = true;
      status.textContent = 'Saving...';

      try {
        const { data, error } = await client.rpc(
          'stock_in',
          {
            p_product_id: $('v9-product').value,
            p_branch_id: $('v9-branch').value,
            p_quantity: qty,
            p_notes: $('v9-notes').value.trim() || null
          }
        );

        if (error) throw error;

        await window.loadStock(
          staff,
          branches,
          'Stock In saved successfully!'
        );

      } catch (err) {
        status.textContent =
          'Stock In not saved: ' + err.message;
        save.disabled = false;
      }
    };
  };
})();
