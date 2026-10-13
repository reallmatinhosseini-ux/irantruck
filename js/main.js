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
  // motion.js holds the hero until its intro finishes
  if (hero) requestAnimationFrame(() => setTimeout(() => { if (!root.dataset.hold) hero.classList.add("is-ready"); }, 120));

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

  /* LEO range: category filter, first rows shown until "Show the full range" */
  const range = $(".range");
  if (range) {
    const items = $$(".lp", range), tabs = $$(".range__bar button", range);
    const more = $(".range__more", range), note = $(".range__note", range);
    const LIMIT = 16;
    let expanded = false;
    const alias = { accessories: "all", catalogue: "all" };
    const apply = (cat, animate) => {
      const match = items.filter((li) => cat === "all" || li.dataset.cat === cat);
      const limited = cat === "all" && !expanded;
      items.forEach((li) => { li.hidden = true; });
      const shown = limited ? match.slice(0, LIMIT) : match;
      shown.forEach((li) => { li.hidden = false; });
      if (more) more.hidden = !limited;
      tabs.forEach((t) => { const on = t.dataset.filter === cat; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
      if (note) note.textContent = `${match.length} part${match.length === 1 ? "" : "s"}`;
      if (animate && window.gsap) gsap.fromTo(shown, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", stagger: 0.03, overwrite: true });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    tabs.forEach((t) => t.addEventListener("click", () => {
      apply(t.dataset.filter, true);
      history.replaceState(null, "", t.dataset.filter === "all" ? "#range" : "#" + t.dataset.filter);
    }));
    if (more) $("button", more).addEventListener("click", () => { expanded = true; apply("all", false); gsap && gsap.fromTo(items.slice(LIMIT), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", stagger: 0.015 }); });
    const fromHash = () => {
      const h = location.hash.slice(1);
      const cat = alias[h] || h;
      if (tabs.some((t) => t.dataset.filter === cat)) { apply(cat, false); return true; }
      return false;
    };
    if (fromHash()) setTimeout(() => range.scrollIntoView(), 50); else apply("all", false);
  }

  /* Quick view: open a part in a panel, step through the range */
  const cards = $$(".lp");
  if (cards.length) {
    const qv = document.createElement("div");
    qv.className = "qv"; qv.hidden = true;
    qv.setAttribute("role", "dialog"); qv.setAttribute("aria-modal", "true"); qv.setAttribute("aria-label", "Product details");
    qv.innerHTML = `<div class="qv__backdrop"></div>
      <div class="qv__panel">
        <button type="button" class="qv__close" aria-label="Close"><svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button>
        <div class="qv__media"><img alt=""></div>
        <div class="qv__body">
          <span class="qv__cat"></span>
          <h3 class="qv__name"></h3>
          <p class="qv__text">A genuine LEO part, supplied in Iran through the official representative. Tell us your engine or vehicle — our team will confirm fit, availability and price.</p>
          <ul class="qv__points"><li>Original LEO product</li><li>Official channel in Iran</li><li>Fit confirmed before you order</li></ul>
          <div class="qv__actions">
            <a class="btn btn--accent btn--lg qv__wa" target="_blank" rel="noopener">Ask on WhatsApp<svg viewBox="0 0 16 16"><path d="M1 8h13M9 3l5 5-5 5"/></svg></a>
            <a class="btn btn--ghost btn--lg qv__mail" href="contact.html">Send an enquiry</a>
          </div>
          <div class="qv__nav"><button type="button" class="qv__prev" aria-label="Previous part"><svg viewBox="0 0 16 16"><path d="M15 8H2M7 3L2 8l5 5"/></svg></button><span class="qv__pos"></span><button type="button" class="qv__next" aria-label="Next part"><svg viewBox="0 0 16 16"><path d="M1 8h13M9 3l5 5-5 5"/></svg></button></div>
        </div>
      </div>`;
    document.body.appendChild(qv);
    const q = (s) => $(s, qv);
    const img = q(".qv__media img");
    let list = [], pos = 0, lastFocus = null;
    const show = (dir) => {
      const a = $("a", list[pos]);
      const name = $("h3", a).textContent, cat = $(".lp__cat", a).textContent, src = $("img", a).getAttribute("src");
      const fill = () => {
        img.src = src; img.alt = "Genuine LEO " + name.toLowerCase();
        q(".qv__name").textContent = name; q(".qv__cat").textContent = cat;
        q(".qv__pos").textContent = `${String(pos + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
        q(".qv__wa").href = "https://wa.me/989155072143?text=" + encodeURIComponent(`Hello Iran Truck, I would like to ask about the genuine LEO ${name.toLowerCase()}.`);
        q(".qv__mail").dataset.product = `${name} (LEO)`;
      };
      if (window.gsap && dir) {
        gsap.timeline()
          .to([img, q(".qv__name"), q(".qv__cat")], { x: -40 * dir, autoAlpha: 0, duration: 0.22, ease: "power2.in" })
          .add(fill)
          .fromTo(img, { x: 60 * dir, rotate: 4 * dir, autoAlpha: 0 }, { x: 0, rotate: 0, autoAlpha: 1, duration: 0.7, ease: "expo.out" })
          .fromTo([q(".qv__cat"), q(".qv__name")], { x: 30 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out", stagger: 0.05 }, "<0.05");
      } else fill();
    };
    const open = (li) => {
      list = cards.filter((c) => !c.hidden); pos = Math.max(0, list.indexOf(li));
      lastFocus = document.activeElement;
      qv.hidden = false; root.classList.add("qv-open"); window.__lenis?.stop();
      show(0);
      if (window.gsap) {
        gsap.fromTo(q(".qv__backdrop"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });
        gsap.fromTo(q(".qv__panel"), { y: 60, autoAlpha: 0, clipPath: "inset(8% 4% 8% 4%)" }, { y: 0, autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out" });
        gsap.fromTo(img, { scale: 0.7, rotate: -8, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", delay: 0.1 });
        gsap.fromTo(q(".qv__body").children, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", stagger: 0.05, delay: 0.15 });
      }
      q(".qv__close").focus();
    };
    const close = () => {
      const done = () => { qv.hidden = true; root.classList.remove("qv-open"); window.__lenis?.start(); lastFocus?.focus(); };
      if (window.gsap) gsap.timeline({ onComplete: done }).to(q(".qv__panel"), { y: 40, autoAlpha: 0, duration: 0.35, ease: "power2.in" }).to(q(".qv__backdrop"), { autoAlpha: 0, duration: 0.3 }, "<0.1");
      else done();
    };
    const go = (d) => { pos = (pos + d + list.length) % list.length; show(d); };
    cards.forEach((li) => $("a", li).addEventListener("click", (e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); e.stopImmediatePropagation(); open(li); }, true));
    q(".qv__backdrop").addEventListener("click", close);
    q(".qv__close").addEventListener("click", close);
    q(".qv__prev").addEventListener("click", () => go(-1));
    q(".qv__next").addEventListener("click", () => go(1));
    q(".qv__mail").addEventListener("click", () => { try { sessionStorage.setItem("itg-product", q(".qv__mail").dataset.product); } catch (e) {} });
    addEventListener("keydown", (e) => {
      if (qv.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    });
  }

  /* Live Mashhad time and opening status (every day, 9:00–17:00) */
  const lives = $$("[data-live]");
  if (lives.length && window.Intl) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => {
      const t = fmt.format(new Date()), [h, m] = t.split(":").map(Number), mins = h * 60 + m;
      const open = mins >= 540 && mins < 1020;
      const note = open ? `Open now · until 17:00` : `Closed · opens ${mins < 540 ? "today" : "tomorrow"} at 9:00`;
      lives.forEach((el) => {
        el.hidden = false;
        $("time", el).textContent = t;
        el.classList.toggle("is-open", open);
        $(".live__s > span", el).textContent = note;
      });
    };
    tick(); setInterval(tick, 20000);
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
