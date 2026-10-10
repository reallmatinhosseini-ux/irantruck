/* ==========================================================
   Iran Truck Trading Group — site behaviour (no dependencies)
   ========================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasIO = "IntersectionObserver" in window;

  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Current page in the navigation */
  const page = document.body.dataset.page;
  $$(`[data-nav="${page}"]`).forEach((a) => a.setAttribute("aria-current", "page"));

  /* Header: transparent over the hero, solid once scrolled, hides on the way down */
  const header = $(".header");
  const wa = $(".wa-float");
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("is-solid", y > 40);
    if (!root.classList.contains("menu-open")) header.classList.toggle("is-hidden", y > lastY && y > 500);
    if (wa) wa.classList.toggle("is-on", y > innerHeight * 0.8);
    lastY = y;
    parallax();
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* Mobile menu */
  const burger = $(".burger");
  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
    header.classList.remove("is-hidden");
  };
  burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  $$("#mnav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* Hero entrance */
  const hero = $(".hero");
  if (hero) requestAnimationFrame(() => setTimeout(() => hero.classList.add("is-ready"), 120));

  /* Reveal text and unveil photographs as they enter the viewport */
  const items = $$(".reveal, .unveil");
  items.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal") || c.classList.contains("unveil"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
    if (el.classList.contains("unveil")) el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 5) * 0.1}s`;
  });
  if (hasIO && !reduced) {
    // A fully clipped element never reports as intersecting, so photographs
    // being unveiled are watched through their parent instead.
    const watch = new Map();
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      (watch.get(e.target) || []).forEach((el) => el.classList.add("is-in"));
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => {
      const t = el.classList.contains("unveil") ? el.parentElement : el;
      if (!watch.has(t)) { watch.set(t, []); io.observe(t); }
      watch.get(t).push(el);
    });
  } else {
    items.forEach((el) => el.classList.add("is-in"));
  }

  /* Gentle parallax on large photographs */
  const para = $$("[data-parallax]");
  function parallax() {
    if (reduced) return;
    para.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight + r.height);
      el.style.transform = `translate3d(0, ${p * -12}%, 0)`;
    });
  }
  onScroll();

  /* Counters */
  $$(".count").forEach((el) => {
    const to = +el.dataset.to;
    if (reduced || !hasIO) return;
    el.textContent = "0";
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 500);
    }, { threshold: 0.5 });
    io.observe(el);
  });

  /* Hero film: respects reduced motion, can be paused, pauses off-screen */
  const video = $(".hero video"), vbtn = $("[data-video-toggle]");
  if (video && vbtn) {
    let userPaused = false;
    const sync = () => {
      vbtn.classList.toggle("is-paused", video.paused);
      vbtn.setAttribute("aria-label", video.paused ? "Play video" : "Pause video");
    };
    if (reduced) { video.removeAttribute("autoplay"); video.pause(); }
    vbtn.addEventListener("click", () => {
      if (video.paused) { userPaused = false; video.play().catch(() => {}); }
      else { userPaused = true; video.pause(); }
    });
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    if (hasIO) new IntersectionObserver(([e]) => {
      if (reduced || userPaused) return;
      e.isIntersecting ? video.play().catch(() => {}) : video.pause();
    }).observe(video);
    sync();
  }

  /* Product list: a photograph follows the cursor */
  const peek = $(".peek");
  if (peek && fine && !reduced) {
    const img = $("img", peek);
    let x = 0, y = 0, cx = 0, cy = 0, raf = null;
    const loop = () => {
      cx += (x - cx) * 0.14; cy += (y - cy) * 0.14;
      peek.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${peek.classList.contains("is-on") ? 1 : 0.9})`;
      raf = peek.classList.contains("is-on") || Math.abs(x - cx) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    $$(".plist a").forEach((a) => {
      a.addEventListener("mouseenter", () => {
        img.src = a.dataset.peek;
        peek.classList.add("is-on");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      a.addEventListener("mouseleave", () => peek.classList.remove("is-on"));
      a.addEventListener("mousemove", (e) => { x = e.clientX + 40; y = e.clientY; });
    });
  }

  /* Route map: line draws from Shandong to Mashhad once in view */
  const route = $(".map__route");
  if (route) {
    const len = route.getTotalLength();
    const dot = $(".map__dot");
    const draw = (p) => {
      route.style.strokeDasharray = `${len} ${len}`;
      route.style.strokeDashoffset = `${-len * (1 - p)}`; // visible: [len·(1−p), len]
      const pt = route.getPointAtLength(len * (1 - p));
      dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
    };
    if (reduced || !hasIO) draw(1);
    else {
      draw(0);
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now(), dur = 2600;
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          draw(1 - Math.pow(1 - p, 3));
          if (p < 1) requestAnimationFrame(tick);
        };
        setTimeout(() => requestAnimationFrame(tick), 300);
      }, { threshold: 0.45 });
      io.observe(route.closest("svg"));
    }
  }

  /* Products page: highlight the category in view */
  const catLinks = $$(".cat-nav a[href^='#']");
  if (catLinks.length && hasIO) {
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
      if (p) { msgField.value = `Enquiry: ${p}\n`; sessionStorage.removeItem("itg-product"); }
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
      if (first) { status.textContent = "Please complete the required fields."; first.focus(); return; }
      const d = Object.fromEntries(new FormData(form));
      const lines = [d.message, "", `Name: ${d.name}`];
      if (d.company) lines.push(`Company: ${d.company}`);
      lines.push(`Phone: ${d.phone}`);
      if (d.email) lines.push(`Email: ${d.email}`);
      if (d.vehicle) lines.push(`Vehicle: ${d.vehicle}`);
      location.href = `mailto:info@iran-truck.com?subject=${encodeURIComponent(`${d.topic} — ${d.name}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
      status.textContent = "Thank you. Your email app will open with your message ready to send.";
    });
    $$("input, textarea", form).forEach((f) => f.addEventListener("input", () => (f.closest(".field") || f.closest(".consent"))?.classList.remove("is-error")));
  }
})();
