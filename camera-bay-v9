// CAMERA BAY V9.js — STOCK IN
// Admin 1 & Admin 2 only

(function () {
  const originalLoadStock = window.loadStock;

  if (typeof originalLoadStock !== "function") {
    console.error("V9: V8 loadStock function not found.");
    return;
  }

  window.loadStock = async function (staff, branches, feedback = "") {
    await originalLoadStock(staff, branches, feedback);

    if (
      staff.role !== "super_admin" ||
      !["admin", "admin2"].includes(staff.username)
    ) return;

    const container = document.getElementById("stocktable");
    if (!container) return;

    const oldBox = document.getElementById("v9-stock-in");
    if (oldBox) oldBox.remove();

    const box = document.createElement("div");
    box.id = "v9-stock-in";
    box.className = "card";

    box.innerHTML = `
      <h3>+ Stock In / Ongeza Mzigo</h3>
      <p>Ongeza bidhaa kwenye stock iliyopo.</p>

      <label>Product</label>
      <select id="v9-product"></select>

      <label>Branch / Store</label>
      <select id="v9-branch"></select>

      <label>Quantity</label>
      <input id="v9-quantity" type="number" min="1" step="1">

      <label>Notes / Invoice Number</label>
      <input id="v9-notes" type="text">

      <button id="v9-save">Save Stock In</button>
      <p id="v9-status"></p>
    `;

    container.appendChild(box);

    const productsResult = await client
      .from("sales_product_catalog")
      .select("id,name")
      .order("name");

    if (productsResult.error) {
      document.getElementById("v9-status").textContent =
        productsResult.error.message;
      return;
    }

    const productSelect = document.getElementById("v9-product");
    const branchSelect = document.getElementById("v9-branch");

    for (const product of productsResult.data || []) {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.name;
      productSelect.appendChild(option);
    }

    for (const branch of branches) {
      const option = document.createElement("option");
      option.value = branch.id;
      option.textContent = branch.name;
      branchSelect.appendChild(option);
    }

    document.getElementById("v9-save").onclick = async () => {
      const quantity = Number(
        document.getElementById("v9-quantity").value
      );

      const status = document.getElementById("v9-status");

      if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        status.textContent = "Enter a valid quantity.";
        return;
      }

      if (!confirm("Confirm Stock In: " + quantity + " units?")) {
        return;
      }

      const button = document.getElementById("v9-save");
      button.disabled = true;
      status.textContent = "Saving...";

      const { data, error } = await client.rpc("stock_in", {
        p_product_id: productSelect.value,
        p_branch_id: branchSelect.value,
        p_quantity: quantity,
        p_notes: document.getElementById("v9-notes").value || null
      });

      if (error) {
        status.textContent = "Error: " + error.message;
        button.disabled = false;
        return;
      }

      await window.loadStock(
        staff,
        branches,
        "Stock In saved successfully! New stock: " + data
      );
    };
  };
})();
