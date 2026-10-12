/* ==========================================================
   Iran Truck Trading Group — motion layer
   Intro, page transitions, split type, scroll scenes, cursor.
   Optional by design: without GSAP or with reduced motion the
   site stays fully usable as plain HTML.
   ========================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const curtain = $(".curtain");
  const hero = $(".hero");

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove("motion");
    curtain?.remove();
    return;
  }
  window.__motionReady = true;
  root.dataset.hold = "1";
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -80, duration: 1.4 });
    }));
  }

  /* ---------- split helpers ---------- */
  function splitWords(el) {
    const words = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          const i = document.createElement("span"); i.textContent = t;
          w.appendChild(i); frag.appendChild(w); words.push(i);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains("w")) walk(n);
    });
    el.setAttribute("aria-label", el.textContent.trim());
    walk(el);
    return words;
  }
  function splitChars(el) {
    const chars = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach((c) => {
          const s = document.createElement("span");
          s.textContent = c === " " ? " " : c;
          s.style.display = "inline-block";
          frag.appendChild(s); chars.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    return chars;
  }

  /* ---------- intro (full on first visit, short afterwards) ---------- */
  let firstVisit = true;
  try { firstVisit = !sessionStorage.getItem("itg-intro"); sessionStorage.setItem("itg-intro", "1"); } catch (e) {}
  const heroChars = hero ? $$(".h1 .line > span", hero).flatMap((l) => splitChars(l)) : [];
  if (hero) {
    hero.classList.add("is-ready"); // line masks off; characters take over
    gsap.set(heroChars, { yPercent: 115, rotate: 6, opacity: 0 });
    gsap.set($(".hero__media", hero), { clipPath: "inset(22% 30% 22% 30%)" });
    gsap.set($$(".hero__fade", hero), { autoAlpha: 0, y: 20 });
  }
  const enter = () => {
    lenis && lenis.start();
    delete root.dataset.hold;
    if (!hero) return;
    gsap.timeline()
      .to($(".hero__media", hero), { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" })
      .to(heroChars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.012 }, "-=0.85")
      .to($$(".hero__fade", hero), { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, "-=0.9")
      .from(".header .wrap", { y: -30, autoAlpha: 0, duration: 1, ease: "power3.out" }, "<");
  };
  if (curtain) {
    const letters = $$(".curtain__word span", curtain);
    const tl = gsap.timeline({ onComplete: () => { curtain.style.visibility = "hidden"; } });
    if (firstVisit) {
      tl.from(".curtain__logo", { scale: 0.7, autoAlpha: 0, duration: 0.6, ease: "back.out(1.7)" })
        .from(letters, { yPercent: 110, duration: 0.7, ease: "expo.out", stagger: 0.03 }, "-=0.35")
        .to(".curtain__bar i", { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, "-=0.5")
        .to(".curtain__inner", { autoAlpha: 0, y: -20, duration: 0.35, ease: "power2.in" }, "+=0.05");
    } else {
      gsap.set(".curtain__inner", { autoAlpha: 0 });
    }
    tl.to(curtain, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }).add(enter, "-=0.6");

    // leaving the page: curtain closes, then navigate
    $$("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || !/\.html(#.*)?$/.test(href) || a.target === "_blank") return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        curtain.style.visibility = "visible";
        gsap.set(".curtain__inner", { autoAlpha: 0 });
        gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: "expo.inOut", onComplete: () => (location.href = href) });
      });
    });
    addEventListener("pageshow", (e) => { if (e.persisted) { gsap.set(curtain, { yPercent: -100 }); curtain.style.visibility = "hidden"; } });
  } else enter();

  /* ---------- headings: words rise; section rules draw ---------- */
  $$(".split").forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, { yPercent: 115, rotate: 4, duration: 1.3, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: el, start: "top 88%" } });
  });
  $$(".index").forEach((el) => {
    gsap.fromTo(el, { "--rule": 0 }, { "--rule": 1, duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ---------- statement: words light up as you read ---------- */
  $$(".js-fill").forEach((el) => {
    const parts = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const s = document.createElement("span"); s.textContent = t; frag.appendChild(s); parts.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    el.querySelectorAll(".dim").forEach((d) => d.classList.remove("dim"));
    gsap.set(parts, { opacity: 0.12 });
    gsap.to(parts, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
  });

  /* ---------- hero recedes as you scroll ---------- */
  if (hero) {
    gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
      .to($(".hero__media video", hero), { yPercent: 16, scale: 1.12, ease: "none" }, 0)
      .to($(".hero__content", hero), { yPercent: -14, autoAlpha: 0.1, ease: "none" }, 0);
  }

  /* ---------- photo parallax everywhere ---------- */
  $$(".mosaic img, .strip img, .company__img img, .visit__img img, .cgal img").forEach((img) => {
    img.style.height = "116%"; img.style.marginTop = "-8%";
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$(".phero__bg img").forEach((img) => {
    gsap.to(img, { yPercent: 16, scale: 1.1, ease: "none", scrollTrigger: { trigger: img.closest(".phero"), start: "top top", end: "bottom top", scrub: true } });
  });

  /* ---------- giant moving type, reacts to scroll speed ---------- */
  $$(".bigtype__track").forEach((track, i) => {
    const dir = i % 2 ? 1 : -1;
    gsap.set(track, { xPercent: dir === -1 ? 0 : -50 });
    const loop = gsap.to(track, { xPercent: dir === -1 ? -50 : 0, duration: 40, ease: "none", repeat: -1 });
    ScrollTrigger.create({ trigger: track.parentElement, start: "top bottom", end: "bottom top", onUpdate(st) {
      const v = Math.min(Math.abs(st.getVelocity()) / 250, 8);
      gsap.to(loop, { timeScale: 1 + v, duration: 0.25, overwrite: true });
      gsap.to(loop, { timeScale: 1, duration: 1.4, delay: 0.25, ease: "power2.out" });
    } });
  });

  const mm = gsap.matchMedia();

  /* ---------- LEO: frame expands to fill the screen ---------- */
  $$(".bleed--expand").forEach((sec) => {
    const img = $(".bleed__img", sec);
    mm.add({ sm: "(max-width: 920px)", lg: "(min-width: 921px)" }, (c) => {
      const from = c.conditions.sm ? "inset(24% 8% 24% 8%)" : "inset(20% 28% 20% 28%)";
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "+=120%", pin: true, scrub: 1, anticipatePin: 1 } })
        .fromTo(img, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 1 })
        .fromTo($("img", img), { scale: 1.35 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .to([$(".wrap", sec), $(".bleed__cap", sec)], { opacity: 1, duration: 0.3 }, 0.7);
    });
  });
  $$(".bleed:not(.bleed--expand)").forEach((b) => {
    gsap.fromTo($(".bleed__img img", b), { scale: 1.22 }, { scale: 1, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- stacking cards: earlier cards recede ---------- */
  const cards = $$(".stackx__card");
  cards.forEach((card, i) => {
    gsap.fromTo($("img", card), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "top 20%", scrub: true } });
    if (i === cards.length - 1) return;
    gsap.to(card, { scale: 0.92, filter: "brightness(.45)", ease: "none", scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 110px", scrub: true } });
  });

  /* ---------- pinned horizontal engines (desktop) ---------- */
  mm.add("(min-width: 921px)", () => {
    const track = $(".hs__track");
    if (!track) return;
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".hs", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$(".hs__card", track).forEach((card) => {
      gsap.fromTo($("img", card), { xPercent: 8 }, { xPercent: -8, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      gsap.from(card, { y: 120, rotate: 2, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 100%", end: "left 60%", scrub: true } });
    });
  });

  /* ---------- filmstrip reacts to scroll speed ---------- */
  const film = $(".film__track");
  if (film) {
    film.style.animation = "none";
    const loop = gsap.to(film, { xPercent: -50, duration: 70, ease: "none", repeat: -1 });
    ScrollTrigger.create({ onUpdate(st) {
      const v = Math.min(Math.abs(st.getVelocity()) / 300, 6);
      gsap.to(loop, { timeScale: (st.direction || 1) * (1 + v), duration: 0.3, overwrite: true });
      gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, ease: "power2.out" });
    } });
  }

  /* ---------- brand logos & footer wordmark ---------- */
  ScrollTrigger.batch(".brandwall img", {
    start: "top 92%",
    onEnter: (els) => gsap.from(els, { scale: 0.7, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.07, overwrite: true }),
  });
  const fw = $$(".footer__word span");
  if (fw.length) gsap.from(fw, { yPercent: 100, duration: 1.4, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: ".footer__word", start: "top 98%" } });

  /* ---------- pointer: cursor, magnetic buttons, 3D tilt ---------- */
  if (fine) {
    const cur = $(".cursor");
    if (cur) {
      const x = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" });
      const y = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
      gsap.set(cur, { x: -100, y: -100 });
      addEventListener("mousemove", (e) => { x(e.clientX); y(e.clientY); });
      document.addEventListener("mouseover", (e) => {
        const view = e.target.closest(".mosaic a, .strip figure, .film figure, .tile, .hs__card, .cgal figure, .stackx__card figure");
        const link = e.target.closest("a, button, input, select, textarea, summary, label");
        cur.classList.toggle("is-view", !!view);
        cur.classList.toggle("is-link", !!link && !view);
      });
    }
    $$(".btn, .header__phone").forEach((b) => {
      const mx = gsap.quickTo(b, "x", { duration: 0.8, ease: "elastic.out(1, .4)" });
      const my = gsap.quickTo(b, "y", { duration: 0.8, ease: "elastic.out(1, .4)" });
      b.addEventListener("mousemove", (e) => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.25); my((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener("mouseleave", () => { mx(0); my(0); });
    });
    $$(".tilt, .tile__img, .product__img").forEach((el) => {
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener("mousemove", (e) => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 10); rx((0.5 - (e.clientY - r.top) / r.height) * 10); });
      el.addEventListener("mouseleave", () => { rx(0); ry(0); });
    });
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();
