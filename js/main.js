/* ==========================================================
   Iran Truck Trading Group — site behaviour (no dependencies)
   ========================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lang = window.ITG_LANG || "en";
  const msg = window.ITG_MSG || {};
  const fmt = (n) => n.toLocaleString(lang === "fa" ? "fa-IR" : "en-US");

  $$(".js-year").forEach((el) => (el.textContent = fmt(new Date().getFullYear()).replace(/[٬,]/g, "")));

  /* Current page in the navigation */
  const page = document.body.dataset.page;
  $$(`[data-nav="${page === "index" ? "home" : page}"]`).forEach((a) => a.setAttribute("aria-current", "page"));

  /* Keep the chosen language when moving between pages */
  if (lang === "fa") {
    $$('a[href$=".html"], a[href*=".html#"]').forEach((a) => {
      const [path, hash] = a.getAttribute("href").split("#");
      a.setAttribute("href", `${path}?lang=fa${hash ? "#" + hash : ""}`);
    });
  }

  /* Header shadow on scroll */
  const header = $(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const burger = $(".burger");
  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  $$("#mnav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* Reveal on scroll, with a small stagger between siblings */
  const reveals = $$(".reveal");
  reveals.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 5) * 0.07}s`);
  });
  const show = (el) => el.classList.add("is-in");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach(show);
  }

  /* Counters */
  $$(".count").forEach((el) => {
    const to = +el.dataset.to;
    el.textContent = fmt(to);
    if (reduced || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* Hero video: respects reduced motion, pausable, pauses off-screen */
  const video = $(".hero video"), vbtn = $("[data-video-toggle]");
  if (video && vbtn) {
    let userPaused = false;
    const sync = () => {
      vbtn.classList.toggle("is-paused", video.paused);
      vbtn.setAttribute("aria-label", video.paused ? msg.play || "Play video" : msg.pause || "Pause video");
    };
    if (reduced) { video.removeAttribute("autoplay"); video.pause(); }
    vbtn.addEventListener("click", () => {
      if (video.paused) { userPaused = false; video.play().catch(() => {}); }
      else { userPaused = true; video.pause(); }
    });
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        if (reduced || userPaused) return;
        e.isIntersecting ? video.play().catch(() => {}) : video.pause();
      }).observe(video);
    }
    sync();
  }

  /* Route map: line draws from Shandong to Mashhad when it comes into view */
  const route = $(".map__route");
  if (route) {
    const len = route.getTotalLength();
    const dot = $(".map__dot"), glow = $(".map__glow");
    const draw = (p) => {
      route.style.strokeDasharray = `${len} ${len}`;
      route.style.strokeDashoffset = `${-len * (1 - p)}`; // visible: [len·(1−p), len]
      const pt = route.getPointAtLength(len * (1 - p));
      dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
      glow.setAttribute("cx", pt.x); glow.setAttribute("cy", pt.y);
    };
    if (reduced || !("IntersectionObserver" in window)) draw(1);
    else {
      draw(0);
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now(), dur = 2400;
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          draw(1 - Math.pow(1 - p, 3));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      io.observe(route.closest("svg"));
    }
  }

  /* Products: highlight the category in view */
  const catLinks = $$(".cat-nav a[href^='#']");
  if (catLinks.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) catLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-30% 0px -60% 0px" });
    catLinks.forEach((a) => { const s = $(a.getAttribute("href")); if (s) io.observe(s); });
  }

  /* Product enquiry links prefill the contact form */
  $$("[data-product]").forEach((a) => a.addEventListener("click", () => {
    try { sessionStorage.setItem("itg-product", a.dataset.product); } catch (e) {}
  }));
  const msgField = $("#f-msg");
  if (msgField) {
    try {
      const p = sessionStorage.getItem("itg-product");
      if (p) { msgField.value = `${msg.enquiry || "Enquiry"}: ${p}\n`; sessionStorage.removeItem("itg-product"); }
    } catch (e) {}
  }

  /* Contact form → opens the visitor's email app with the message ready */
  const form = $(".form");
  if (form) {
    const status = $(".form__status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let first = null;
      $$("[required]", form).forEach((f) => {
        const bad = f.type === "checkbox" ? !f.checked : !f.value.trim();
        (f.closest(".field") || f.closest(".consent")).classList.toggle("is-error", bad);
        if (bad && !first) first = f;
      });
      if (first) { status.textContent = msg.error || "Please complete the required fields."; first.focus(); return; }
      const d = Object.fromEntries(new FormData(form));
      const lines = [d.message, "", `Name: ${d.name}`];
      if (d.company) lines.push(`Company: ${d.company}`);
      lines.push(`Phone: ${d.phone}`);
      if (d.email) lines.push(`Email: ${d.email}`);
      if (d.vehicle) lines.push(`Vehicle: ${d.vehicle}`);
      location.href = `mailto:info@iran-truck.com?subject=${encodeURIComponent(`${d.topic} — ${d.name}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
      status.textContent = msg.sent || "Thank you. Your email app will open with your message ready to send.";
    });
    $$("input, textarea", form).forEach((f) => f.addEventListener("input", () => (f.closest(".field") || f.closest(".consent"))?.classList.remove("is-error")));
  }
})();
