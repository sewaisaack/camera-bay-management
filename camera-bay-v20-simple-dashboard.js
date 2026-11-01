/* CAMERA BAY V20 - SIMPLE DASHBOARD
   Load AFTER V19. Keeps existing data and functions.
*/
(function () {
  "use strict";

  const dash = document.getElementById("dash");
  if (!dash || document.getElementById("cb-v20-menu")) return;

  const css = document.createElement("style");

  css.textContent = `
 /* Hide old notice after login */
body:has(#dash:not(.hidden)) > main > .notice {
  display: none !important;
}

/* Keep Dashboard sales summary only */
#dash.cb-v20-active[data-cb-v20-view="home"]
#cb-v17-sales > div:not(:first-of-type) {
  display: none !important;
}

/* Hide refresh button on Dashboard */
#dash.cb-v20-active[data-cb-v20-view="home"]
#cb-v17-sales > button {
  display: none !important;
} 
    #cb-v20-menu {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin:18px 0;
    }

    #cb-v20-menu button {
      margin:0;
      min-height:72px;
      font-size:16px;
      border-radius:14px;
    }

    #cb-v20-back {
      margin:12px 0;
    }

    #dash.cb-v20-active > .grid,
    #dash.cb-v20-active > .notice,
    #dash.cb-v20-active #recent,
    #dash.cb-v20-active #cb-v15-nav,
    #dash.cb-v20-active #cb-v15-guide {
      display:none!important;
    }

    #dash.cb-v20-active #cb-v19-stock-details,
    #dash.cb-v20-active #cb-v18-expenses,
    #dash.cb-v20-active #cb-v17-sales {
      display:none!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="home"]
      #cb-v17-sales {
      display:block!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="expenses"]
      #cb-v18-expenses {
      display:block!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="stock"]
      #cb-v19-stock-details,
    #dash.cb-v20-active[data-cb-v20-view="sales"]
      #cb-v19-stock-details,
    #dash.cb-v20-active[data-cb-v20-view="reports"]
      #cb-v19-stock-details {
      display:block!important;
    }

    #dash.cb-v20-active:not([data-cb-v20-view="home"])
      #cb-v20-menu {
      display:none!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="home"]
      #cb-v20-back {
      display:none!important;
    }

    #dash.cb-v20-active #stocktable #cb-v14 > section {
      display:none!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="stock"]
      #stocktable #cb-v14 > section:not(.cb-v20-sales):not(.cb-v20-reports) {
      display:block!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="sales"]
      #stocktable #cb-v14 > section.cb-v20-sales {
      display:block!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="reports"]
      #stocktable #cb-v14 > section.cb-v20-reports {
      display:block!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="sales"]
      #stocktable > :not(#cb-v14),
    #dash.cb-v20-active[data-cb-v20-view="reports"]
      #stocktable > :not(#cb-v14) {
      display:none!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="sales"] #stockmsg,
    #dash.cb-v20-active[data-cb-v20-view="reports"] #stockmsg {
      display:none!important;
    }

    #dash.cb-v20-active[data-cb-v20-view="sales"]
      #cb-v19-stock-details > summary,
    #dash.cb-v20-active[data-cb-v20-view="reports"]
      #cb-v19-stock-details > summary {
      display:none!important;
    }

    @media(min-width:700px) {
      #cb-v20-menu {
        grid-template-columns:repeat(4,minmax(0,1fr));
      }
    }
  `;
  document.head.appendChild(css);

  const menu = document.createElement("nav");
  menu.id = "cb-v20-menu";
  menu.setAttribute("aria-label", "Main features");

  const back = document.createElement("button");
  back.id = "cb-v20-back";
  back.type = "button";
  back.className = "secondary";
  back.textContent = "← Back to Dashboard";

  const titles = {
    home: "Dashboard",
    sales: "Sales / POS",
    expenses: "Expenses",
    stock: "Stock & Products",
    reports: "Reports"
  };

  const heading = dash.querySelector("h2");

  function markSections() {
    const root = document.getElementById("cb-v14");
    if (!root) return;

    for (const section of root.querySelectorAll(":scope > section")) {
      const h = section.querySelector("h3");
      if (!h) continue;

      section.classList.toggle(
        "cb-v20-sales",
        /POS\s*\/\s*Record Sale/i.test(h.textContent)
      );

      section.classList.toggle(
        "cb-v20-reports",
        /Reports\s*&\s*Analytics/i.test(h.textContent)
      );
    }
  }

  function view(name) {
    markSections();

    dash.dataset.cbV20View = name;

    if (heading) {
      heading.textContent = titles[name] || "Dashboard";
    }

    const details = document.getElementById(
      "cb-v19-stock-details"
    );

    if (
      details &&
      ["stock", "sales", "reports"].includes(name)
    ) {
      details.open = true;
    }

    back.hidden = name === "home";

    if (name !== "home") {
      back.scrollIntoView({
        block: "start",
        behavior: "smooth"
      });
    }
  }

  const buttons = [
    ["sales", "🛒 Sales / POS"],
    ["expenses", "💰 Expenses"],
    ["stock", "📦 Stock"],
    ["reports", "📊 Reports"]
  ];

  for (const [name, label] of buttons) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;

    btn.addEventListener("click", () => view(name));
    menu.appendChild(btn);
  }

  back.addEventListener("click", () => view("home"));

  const who = document.getElementById("who");

  if (who) {
    who.insertAdjacentElement("afterend", menu);
  } else if (heading) {
    heading.insertAdjacentElement("afterend", menu);
  }

  menu.insertAdjacentElement("afterend", back);

  for (const h of dash.querySelectorAll("h3")) {
    if (/recent sales/i.test(h.textContent)) {
      h.style.display = "none";
    }
  }

  dash.classList.add("cb-v20-active");

  const stock = document.getElementById("stocktable");

  if (stock) {
    new MutationObserver(markSections).observe(stock, {
      childList: true,
      subtree: false
    });
  }

  markSections();
  view("home");
})();
