/* CAMERA BAY V25 — CLEAN STOCK MANAGEMENT */
(function () {
  'use strict';

  const previousLoadStock = window.loadStock;

  if (typeof previousLoadStock !== 'function') {
    console.error('V25: loadStock not found');
    return;
  }

  window.loadStock = async function (
    staff,
    branches,
    feedback = ''
  ) {
    await previousLoadStock(staff, branches, feedback);

    const root = document.getElementById('stocktable');
    if (!root) return;

    // Only change the admin stock interface.
    const isAdmin =
      staff &&
      staff.role === 'super_admin' &&
      ['admin', 'admin2'].includes(staff.username);

    if (!isAdmin) return;

    // Keep V24 as the main stock management form.
    const simpleStock = [...root.querySelectorAll('h2')]
      .find(h => h.textContent.includes('Simple Stock Management'));

    if (!simpleStock) {
      console.warn('V25: V24 form not found. Old forms kept.');
      return;
    }

    // Hide duplicate forms without deleting their code.
    const duplicateIds = [
      'v9-stock-in',
      'cb-v17-create'
    ];

    duplicateIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });

    // Hide duplicate V8 product and initial stock forms.
    const oldHeadings = [
      'Add Product / Ongeza Bidhaa',
      'Initial Stock Entry',
      'Stock Out / Toa Stock'
    ];

    root.querySelectorAll('h3').forEach(heading => {
      const title = heading.textContent.trim();

      if (oldHeadings.some(x => title.includes(x))) {
        const box = heading.closest('.card');

        if (box) box.style.display = 'none';
      }
    });

    // Move the simple stock form to the top.
    const simpleBox = simpleStock.closest('.card');

    if (simpleBox) {
      root.prepend(simpleBox);
      simpleBox.style.display = '';
    }

    // Keep Stock Transfer, POS and Reports.
    console.log('Camera Bay V25: Clean stock interface ready');
  };
})();
