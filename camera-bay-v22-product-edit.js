/* CAMERA BAY V22 — SEARCH, SELECT & EDIT PRODUCT */
(function () {
  'use strict';

  const previousLoadStock = window.loadStock;

  if (typeof previousLoadStock !== 'function') {
    console.error('Camera Bay: loadStock not found');
    return;
  }

  window.loadStock = async function (staff, branches, feedback = '') {
    await previousLoadStock(staff, branches, feedback);

    if (
      staff.role !== 'super_admin' ||
      !['admin', 'admin2'].includes(staff.username)
    ) return;

    const root = document.getElementById('stocktable');
    if (!root) return;

    const heading = [...root.querySelectorAll('h3')]
      .find(el => el.textContent.includes('Add Product'));

    if (!heading) return;

    const box = heading.parentElement;
    const form = box.querySelector('form');

    if (!form) return;

    const inputs = form.querySelectorAll('input');
    const nameInput = inputs[0];
    const categoryInput = inputs[1];
    const priceInput = [...inputs].find(
      el => el.type === 'number'
    );

    const saveButton = form.querySelector('button[type="submit"]');

    if (!nameInput || !categoryInput || !saveButton) return;

    const { data: products, error } = await client
      .from('sales_product_catalog')
      .select('id,name,category,reference_price')
      .order('name');

    if (error) {
      console.error('Product editor:', error.message);
      return;
    }

    let selectedProduct = null;

    const wrapper = document.createElement('div');
    wrapper.style.margin = '16px 0';

    const label = document.createElement('label');
    label.textContent = 'Search Existing Product / Tafuta Bidhaa';

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Andika jina la bidhaa...';
    search.autocomplete = 'off';

    const results = document.createElement('div');
    results.style.maxHeight = '220px';
    results.style.overflowY = 'auto';
    results.style.borderRadius = '10px';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'secondary';
    cancel.textContent = 'Cancel Edit / Anza Upya';
    cancel.style.display = 'none';

    wrapper.append(label, search, results, cancel);
    box.insertBefore(wrapper, form);

    const resetEdit = () => {
      selectedProduct = null;
      nameInput.value = '';
      categoryInput.value = '';

      if (priceInput) priceInput.value = '';

      search.value = '';
      results.replaceChildren();
      cancel.style.display = 'none';
      saveButton.textContent = 'Save Product';
    };

    cancel.onclick = resetEdit;

    search.oninput = () => {
      results.replaceChildren();

      const query = search.value.trim().toLowerCase();

      if (!query) return;

      const matches = (products || [])
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, 15);

      for (const product of matches) {
        const item = document.createElement('button');

        item.type = 'button';
        item.className = 'secondary';
        item.textContent =
          product.name + ' — ' + (product.category || '');

        item.style.display = 'block';
        item.style.width = '100%';
        item.style.textAlign = 'left';
        item.style.margin = '3px 0';

        item.onclick = () => {
          selectedProduct = product;

          nameInput.value = product.name;
          categoryInput.value = product.category || '';

          if (priceInput) {
            priceInput.value =
              product.reference_price == null
                ? ''
                : product.reference_price;
          }

          search.value = product.name;
          results.replaceChildren();

          saveButton.textContent = 'Update Product';
          cancel.style.display = 'inline-block';
        };

        results.appendChild(item);
      }

      if (!matches.length) {
        const message = document.createElement('p');
        message.textContent = 'Hakuna bidhaa iliyopatikana.';
        results.appendChild(message);
      }
    };

    form.addEventListener('submit', async event => {
      if (!selectedProduct) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const productId = selectedProduct.id;
      const productName = nameInput.value.trim();
      const productCategory = categoryInput.value.trim();

      const price =
        !priceInput || priceInput.value === ''
          ? null
          : Number(priceInput.value);

      if (
        !productName ||
        !productCategory ||
        (price !== null && (!Number.isFinite(price) || price < 0))
      ) {
        alert('Jaza taarifa sahihi za bidhaa.');
        return;
      }

      if (!confirm('Unataka kusasisha bidhaa hii?')) return;

      saveButton.disabled = true;
      saveButton.textContent = 'Updating...';

      try {
        const { error: updateError } = await client.rpc(
          'update_store_product',
          {
            p_product_id: productId,
            p_name: productName,
            p_category: productCategory,
            p_reference_price: price
          }
        );

        if (updateError) throw updateError;

        await window.loadStock(
          staff,
          branches,
          'Product updated successfully!'
        );

      } catch (err) {
        alert('Update failed: ' + err.message);
        saveButton.disabled = false;
        saveButton.textContent = 'Update Product';
      }
    }, true);
  };
})();
