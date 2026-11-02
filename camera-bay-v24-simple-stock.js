/* CAMERA BAY V24 — SIMPLE STOCK MANAGEMENT */
(function () {
  'use strict';

  const previousLoadStock = window.loadStock;
  if (typeof previousLoadStock !== 'function') return;

  window.loadStock = async function (staff, branches, feedback = '') {
    await previousLoadStock(staff, branches, feedback);

    if (
      !staff ||
      staff.role !== 'super_admin' ||
      !['admin', 'admin2'].includes(staff.username)
    ) return;

    const root = document.getElementById('stocktable');
    if (!root) return;

    const oldAdd = [...root.querySelectorAll('h3')]
      .find(x => x.textContent.includes('Add Product'))?.parentElement;

    const oldInitial = [...root.querySelectorAll('h3')]
      .find(x => x.textContent.includes('Initial Stock Entry'))?.parentElement;

    if (oldAdd) oldAdd.style.display = 'none';
    if (oldInitial) oldInitial.style.display = 'none';

    const [cat, inv] = await Promise.all([
      client.from('sales_product_catalog')
        .select('id,name,category,reference_price')
        .order('name'),

      client.from('inventory')
        .select('product_id,branch_id,quantity')
    ]);

    if (cat.error || inv.error) {
      alert('V24: ' + (cat.error || inv.error).message);
      return;
    }

    const products = cat.data || [];
    const stock = new Map();

    for (const row of inv.data || []) {
      const key = row.product_id + '|' + row.branch_id;
      stock.set(
        key,
        (stock.get(key) || 0) + Number(row.quantity || 0)
      );
    }

    const box = document.createElement('section');
    box.className = 'card';
    box.style.cssText =
      'margin:14px 0;border:2px solid #139dc6';

    const heading = document.createElement('h2');
    heading.textContent = '📦 Simple Stock Management';

    const hint = document.createElement('p');
    hint.textContent =
      'Chagua tawi, tafuta bidhaa, kisha update stock.';

    const label = (text, el) => {
      const l = document.createElement('label');
      l.textContent = text;
      l.appendChild(el);
      return l;
    };

    // BRANCH
    const branch = document.createElement('select');
    branch.appendChild(new Option('Chagua tawi', ''));

    (branches || []).forEach(b => {
      branch.appendChild(new Option(b.name, b.id));
    });

    // SEARCH PRODUCT
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Tafuta bidhaa (mfano Nikon)...';

    const select = document.createElement('select');
    select.appendChild(new Option('Chagua bidhaa', ''));

    const current = document.createElement('p');
    current.style.fontWeight = 'bold';

    // ACTION
    const action = document.createElement('select');

    [
      ['add', '➕ Add Stock'],
      ['remove', '➖ Remove Stock'],
      ['count', '🔵 Stock Count (idadi halisi)']
    ].forEach(([v, t]) => {
      action.appendChild(new Option(t, v));
    });

    // QUANTITY
    const qty = document.createElement('input');
    qty.type = 'number';
    qty.min = '0';
    qty.step = '1';
    qty.placeholder = 'Idadi';

    // NOTES
    const notes = document.createElement('input');
    notes.placeholder = 'Sababu / Invoice number (optional)';

    // SAVE
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'SAVE STOCK';

    const status = document.createElement('p');
    status.setAttribute('role', 'status');

    // NEW PRODUCT
    const newButton = document.createElement('button');
    newButton.type = 'button';
    newButton.className = 'secondary';
    newButton.textContent = '➕ NEW PRODUCT';

    const newForm = document.createElement('div');
    newForm.style.display = 'none';

    const newName = document.createElement('input');
    newName.placeholder = 'Product Name';

    const newCategory = document.createElement('input');
    newCategory.placeholder = 'Category';

    const newPrice = document.createElement('input');
    newPrice.type = 'number';
    newPrice.min = '0';
    newPrice.placeholder = 'Selling Price (TZS) — optional';

    const newQty = document.createElement('input');
    newQty.type = 'number';
    newQty.min = '0';
    newQty.step = '1';
    newQty.placeholder = 'Initial Quantity (optional)';

    const newSave = document.createElement('button');
    newSave.type = 'button';
    newSave.textContent = 'SAVE NEW PRODUCT';

    newForm.append(
      label('Product Name', newName),
      label('Category', newCategory),
      label('Selling Price (TZS)', newPrice),
      label('Quantity for selected branch', newQty),
      newSave
    );

    box.append(
      heading,
      hint,
      label('1. Branch / Tawi', branch),
      label('2. Search Product', search),
      select,
      current,
      label('3. Action', action),
      label('4. Quantity', qty),
      label('Notes', notes),
      save,
      status,
      newButton,
      newForm
    );

    root.prepend(box);

    // REFRESH PRODUCT LIST
    const refresh = () => {
      const q = search.value.trim().toLowerCase();
      const selected = select.value;

      select.replaceChildren(
        new Option('Chagua bidhaa', '')
      );

      products
        .filter(p =>
          !q || p.name.toLowerCase().includes(q)
        )
        .slice(0, 150)
        .forEach(p => {
          select.appendChild(
            new Option(
              p.name + ' — ' + (p.category || ''),
              p.id
            )
          );
        });

      if ([...select.options].some(o => o.value === selected)) {
        select.value = selected;
      }

      const p = products.find(x => x.id === select.value);

      const n = p && branch.value
        ? (stock.get(p.id + '|' + branch.value) || 0)
        : null;

      current.textContent = n === null
        ? 'Chagua tawi na bidhaa kwanza'
        : 'Stock iliyopo: ' + n + ' PCS';
    };

    branch.onchange = refresh;
    search.oninput = refresh;
    select.onchange = refresh;
    refresh();

    newButton.onclick = () => {
      newForm.style.display =
        newForm.style.display === 'none'
          ? 'block'
          : 'none';
    };

    const busy = b => {
      save.disabled = b;
      newSave.disabled = b;
    };

    // UPDATE STOCK
    save.onclick = async () => {
      const p = products.find(x => x.id === select.value);
      const b = branch.value;
      const n = Number(qty.value);

      if (
        !p ||
        !b ||
        qty.value.trim() === '' ||
        !Number.isSafeInteger(n) ||
        n < 0 ||
        (action.value !== 'count' && n === 0)
      ) {
        alert('Chagua tawi, bidhaa na idadi sahihi.');
        return;
      }

      const old = stock.get(p.id + '|' + b) || 0;

      const delta =
        action.value === 'add'
          ? n
          : action.value === 'remove'
            ? -n
            : n - old;

      if (old + delta < 0) {
        alert('Huwezi kutoa stock zaidi ya iliyopo.');
        return;
      }

      if (delta === 0) {
        status.textContent =
          'Stock tayari ni ' + old +
          ' PCS. Hakuna kilichobadilika.';
        return;
      }

      const note =
        (notes.value.trim() || 'V24 ' + action.value) +
        (action.value === 'count'
          ? ' | Count: ' + old + ' → ' + n
          : '');

      const branchName =
        branches.find(x => x.id === b)?.name || '';

      if (!confirm(
        p.name + ' | ' + branchName +
        '\nStock: ' + old +
        ' → ' + (old + delta) +
        ' PCS\nThibitisha?'
      )) return;

      busy(true);
      status.textContent = 'Saving...';

      try {
        const result = delta > 0
          ? await client.rpc('stock_in', {
              p_product_id: p.id,
              p_branch_id: b,
              p_quantity: delta,
              p_notes: note
            })
          : await client.rpc('stock_out', {
              p_product_id: p.id,
              p_branch_id: b,
              p_quantity: -delta,
              p_reason:
                action.value === 'count'
                  ? 'stock_count_adjustment'
                  : 'manual_adjustment',
              p_notes: note
            });

        if (result.error) throw result.error;

        await window.loadStock(
          staff,
          branches,
          'Stock updated successfully!'
        );

      } catch (e) {
        status.textContent = 'Error: ' + e.message;
        status.className = 'error';
        busy(false);
      }
    };

    // REGISTER NEW PRODUCT
    newSave.onclick = async () => {
      const n = newName.value.trim();
      const c = newCategory.value.trim();

      const p = newPrice.value === ''
        ? null
        : Number(newPrice.value);

      const q = newQty.value === ''
        ? 0
        : Number(newQty.value);

      if (
        !n ||
        !c ||
        (p !== null && (!Number.isFinite(p) || p < 0)) ||
        !Number.isSafeInteger(q) ||
        q < 0 ||
        (q > 0 && !branch.value)
      ) {
        alert(
          'Jaza jina, category, bei na idadi sahihi. ' +
          'Chagua tawi kama kuna stock.'
        );
        return;
      }

      if (
        products.some(
          x => x.name.toLowerCase() === n.toLowerCase()
        )
      ) {
        alert(
          'Bidhaa yenye jina hili ipo tayari. ' +
          'Itafute kwenye Search Product.'
        );
        return;
      }

      if (!confirm(
        'Sajili bidhaa ' + n +
        (q ? ' na stock ' + q : '') + '?'
      )) return;

      busy(true);

      try {
        const result = await client.rpc(
          'add_store_product',
          {
            p_name: n,
            p_category: c,
            p_reference_price: p
          }
        );

        if (result.error) throw result.error;

        if (q > 0) {
          const received = await client.rpc('stock_in', {
            p_product_id: result.data,
            p_branch_id: branch.value,
            p_quantity: q,
            p_notes: 'V24 new product opening stock'
          });

          if (received.error) {
            throw new Error(
              'Bidhaa imesajiliwa lakini stock haijaingia: ' +
              received.error.message +
              ' — USISAJILI tena bidhaa.'
            );
          }
        }

        await window.loadStock(
          staff,
          branches,
          'New product saved successfully!'
        );

      } catch (e) {
        alert(e.message);
        busy(false);
      }
    };
  };
})();
