/* ==========================================================
   LEO parts catalogue — transcribed from the product sheets
   published on iran-truck.com (Cylinder Combination, Piston Ring).
   [LEO number, OEM article, product, application]
   ========================================================== */
window.ITG_CATALOG = [
  ["LEO101207A", "612600030068", "Cylinder combination", "WP10 Euro 4"],
  ["LEO101366A", "1000076563", "Cylinder combination", "X3000"],
  ["LEO110894A", "1002347077", "Cylinder combination", "WP13"],
  ["LEO111665A", "1001758754-SPT", "Cylinder combination", "WP13"],
  ["LEO101042A", "612650020002-SPT", "Cylinder combination", "Shaanxi WP10 Euro 4/5"],
  ["LEO110672A", "200V02511-0771", "Cylinder combination", "HOWO T5G / C7H / MC11"],
  ["LEO110850A", "202V02511-0683", "Cylinder combination", "MC13"],
  ["LEO110846A", "1004011C81DM", "Cylinder combination", "FAW J6 (CA6DM2)"],
  ["LEO111731A", "MM35000J-PJ6P", "Cylinder combination", "FAW J6"],
  ["LEO111710A", "MM50000J-PJ6P", "Cylinder combination", "FAW"],
  ["LEO110650A", "VG1238030001", "Cylinder combination", "HOWO CNG"],
  ["LEO110651A", "612600030071", "Cylinder combination", "Weichai WP10 CNG"],
  ["LEO110652A", "612600030072", "Cylinder combination", "Weichai WP12 CNG"],
  ["LEO110653A", "VG1238030002", "Cylinder combination", "Weichai D12 CNG"],
  ["LEO110742A", "612700020016", "Cylinder combination", "Weichai WP13 CNG"],
  ["LEO111166A", "3102367 / 3893752", "Piston ring set", "Shaanxi ISM11E5"],
  ["LEO110895A", "612700020061", "Piston ring set", "WP13"],
  ["LEO110857A", "202V02503-6005", "Piston ring set", "MC11, MC13"],
  ["LEO110858A", "201V02503-6001", "Piston ring set", "MC11 Sitrak / HOWO"],
  ["LEO110896A", "1004BBB-81D", "Piston ring set", "FAW J6"],
  ["LEO110670A", "VG1540030011", "Piston ring set", "HOWO T12 CNG"],
  ["LEO110671A", "612600030080", "Piston ring set", "Weichai WP10 / WP12 CNG"],
];

/* Renders every [data-catalog] block: a search field, product filter and results table. */
(() => {
  const data = window.ITG_CATALOG;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  document.querySelectorAll("[data-catalog]").forEach((root) => {
    const limit = +root.dataset.limit || Infinity;
    root.innerHTML = `
      <div class="cat-tool__bar">
        <label class="cat-tool__search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
          <input type="search" placeholder="Search LEO number, OEM number or engine — e.g. WP13, HOWO, 612600" aria-label="Search the parts catalogue">
        </label>
        <div class="cat-tool__filters" role="group" aria-label="Filter by product">
          <button type="button" class="is-on" data-f="">All</button>
          <button type="button" data-f="Cylinder combination">Cylinder kits</button>
          <button type="button" data-f="Piston ring set">Piston rings</button>
        </div>
      </div>
      <div class="cat-tool__table" role="table" aria-label="LEO parts catalogue">
        <div class="cat-tool__row cat-tool__head" role="row"><span role="columnheader">LEO no.</span><span role="columnheader">OEM article</span><span role="columnheader">Product</span><span role="columnheader">Application</span><span></span></div>
        <div class="cat-tool__body"></div>
      </div>
      <div class="cat-tool__foot"><span class="cat-tool__count" aria-live="polite"></span>${limit < Infinity ? '<a href="products.html#catalogue" class="link">Full catalogue<svg viewBox="0 0 16 16"><path d="M1 8h13M9 3l5 5-5 5"/></svg></a>' : ""}</div>`;
    const input = root.querySelector("input");
    const body = root.querySelector(".cat-tool__body");
    const count = root.querySelector(".cat-tool__count");
    let filter = "";
    const render = () => {
      const q = input.value.trim().toLowerCase().replace(/\s+/g, " ");
      const rows = data.filter((r) => (!filter || r[2] === filter) && (!q || r.join(" ").toLowerCase().includes(q)));
      const shown = q || filter ? rows : rows.slice(0, limit);
      body.innerHTML = shown.length
        ? shown.map((r) => `<a class="cat-tool__row" role="row" href="contact.html" data-product="${esc(r[2])} — ${esc(r[0])} (${esc(r[3])})"><span role="cell" class="mono">${esc(r[0])}</span><span role="cell" class="mono">${esc(r[1])}</span><span role="cell">${esc(r[2])}</span><span role="cell">${esc(r[3])}</span><span class="cat-tool__go" aria-hidden="true">Enquire →</span></a>`).join("")
        : `<p class="cat-tool__empty">No match in the published catalogue — <a href="contact.html" class="link">ask us, we will source it.</a></p>`;
      count.textContent = `${shown.length} of ${data.length} LEO part numbers`;
      body.querySelectorAll("[data-product]").forEach((a) => a.addEventListener("click", () => {
        try { sessionStorage.setItem("itg-product", a.dataset.product); } catch (e) {}
      }));
    };
    input.addEventListener("input", render);
    root.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.f;
      root.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("is-on", x === b));
      render();
    }));
    render();
  });
})();
