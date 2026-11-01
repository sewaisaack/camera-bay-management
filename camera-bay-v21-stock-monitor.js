
/* CAMERA BAY V21 — LOW STOCK ALERTS & HISTORY */
(function () {
  "use strict";

  const previous = window.loadStock;
  if (typeof previous !== "function") return;

  const element = (tag, text) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    return e;
  };

  function isCameraOrLens(category) {
    const c = String(category || "").toLowerCase();
    if (/lens|lenzi/.test(c)) return true;
    if (/accessor|bag|battery|charger|light|flash|tripod|mic|memory/.test(c)) return false;
    return /camera|kamera/.test(c);
  }

  function showTable(container, headers, rows) {
    const wrap = element("div");
    wrap.className = "table-wrap";
    const table = element("table");
    const head = element("tr");

    headers.forEach(h => head.appendChild(element("th", h)));
    table.appendChild(head);

    rows.forEach(values => {
      const tr = element("tr");
      values.forEach(v =>
        tr.appendChild(element("td", String(v ?? "—")))
      );
      table.appendChild(tr);
    });

    wrap.appendChild(table);
    container.replaceChildren(wrap);
  }

  window.loadStock = async function (staff, branches, feedback) {
    await previous(staff, branches, feedback);

    const root = document.getElementById("cb-v14");
    if (!root || typeof client === "undefined" || !client) return;

    document.getElementById("cb-v21")?.remove();

    const panel = element("section");
    panel.id = "cb-v21";
    panel.className = "card";
    panel.style.marginTop = "16px";

    panel.appendChild(element("h3", "⚠️ Low Stock Alerts"));
    panel.appendChild(element("p",
      "Monitoring only. No stock changes."
    ));

    const alerts = element("div", "Loading alerts...");
    panel.appendChild(alerts);

    panel.appendChild(element("h3", "📋 Stock Movement History"));
    const history = element("div", "Loading history...");
    panel.appendChild(history);
    root.appendChild(panel);

    try {
      const locations = staff.role === "super_admin"
        ? branches
        : branches.filter(b => b.id === staff.branch_id);

      const [products, inventory] = await Promise.all([
        client.from("sales_product_catalog")
          .select("id,name,category"),
        client.from("inventory")
          .select("product_id,branch_id,quantity")
      ]);

      if (products.error) throw products.error;
      if (inventory.error) throw inventory.error;

      const quantities = new Map();

      (inventory.data || []).forEach(x => {
        const key = x.product_id + ":" + x.branch_id;
        quantities.set(
          key,
          (quantities.get(key) || 0) + Number(x.quantity || 0)
        );
      });

      const warnings = [];

      (products.data || []).forEach(p => {
        const optic = isCameraOrLens(p.category);
        const branchLimit = optic ? 2 : 5;
        const totalLimit = optic ? 5 : 10;

        locations.forEach(b => {
          const qty =
            quantities.get(p.id + ":" + b.id) || 0;

          if (qty <= branchLimit) {
            warnings.push([
              p.name, b.name, qty, branchLimit, "Branch"
            ]);
          }
        });

        if (staff.role === "super_admin") {
          const total = locations.reduce(
            (sum, b) =>
              sum + (quantities.get(p.id + ":" + b.id) || 0),
            0
          );

          if (total <= totalLimit) {
            warnings.push([
              p.name, "All Stores", total,
              totalLimit, "Combined"
            ]);
          }
        }
      });

      alerts.replaceChildren(
        element("p", warnings.length + " low-stock alerts.")
      );

      const search = element("input");
      search.type = "search";
      search.placeholder = "Search low-stock products";
      alerts.appendChild(search);

      const results = element("div");
      results.style.borderLeft = "4px solid #c53042";
      results.style.paddingLeft = "8px";
      alerts.appendChild(results);

      function render() {
        const term = search.value.toLowerCase().trim();

        const filtered = warnings.filter(row =>
          row.join(" ").toLowerCase().includes(term)
        );

        showTable(results,
          ["Product", "Location", "Available",
           "Threshold", "Scope"],
          filtered.slice(0, 100)
        );
      }

      search.addEventListener("input", render);
      render();

    } catch (e) {
      alerts.textContent =
        "Alerts unavailable: " + e.message;
    }

    try {
      let query = client.from("stock_movements")
        .select(
          "created_at,product_id,branch_id,movement_type," +
          "quantity_change,quantity_before,quantity_after," +
          "performed_by,notes"
        )
        .order("created_at", { ascending: false })
        .limit(75);

      if (staff.role !== "super_admin" && staff.branch_id) {
        query = query.eq("branch_id", staff.branch_id);
      }

      const records = await query;
      if (records.error) throw records.error;

      const productResult =
        await client.from("sales_product_catalog")
          .select("id,name");

      const names = new Map(
        (productResult.data || []).map(p => [p.id, p.name])
      );

      const places = new Map(
        branches.map(b => [b.id, b.name])
      );

      const rows = (records.data || []).map(m => [
        new Date(m.created_at).toLocaleString("en-TZ"),
        names.get(m.product_id) || "Product",
        places.get(m.branch_id) || "Store",
        m.movement_type,
        m.quantity_change,
        m.quantity_before,
        m.quantity_after,
        m.performed_by || "—",
        m.notes || "—"
      ]);

      if (!rows.length) {
        history.textContent =
          "No accessible stock movements.";
      } else {
        showTable(history,
          ["Date", "Product", "Store", "Type",
           "Change", "Before", "After", "Staff ID", "Notes"],
          rows
        );
      }

    } catch (e) {
      history.textContent =
        "History unavailable: " + e.message;
    }
  };
})();
