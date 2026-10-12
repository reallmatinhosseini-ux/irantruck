/* ==========================================================
   Iran Truck Trading Group — motion layer
   Smooth scroll, page transitions, split headlines, scroll-driven
   scenes, cursor and magnetic buttons. Everything here is optional:
   without GSAP or with reduced motion the site works as plain HTML.
   ========================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const curtain = $(".curtain");

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove("motion");
    curtain?.remove();
    $$(".split, .js-fill").forEach((el) => el.classList.add("is-in"));
    return;
  }
  window.__motionReady = true;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // in-page anchors glide instead of jumping
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -80, duration: 1.4 });
    }));
  }

  /* ---------- page transitions ---------- */
  if (curtain) {
    gsap.to(curtain, { yPercent: -100, duration: 1.1, ease: "expo.inOut", delay: 0.15, onComplete: () => (curtain.style.visibility = "hidden") });
    $$("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || !/\.html(#.*)?$/.test(href) || a.target === "_blank") return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        curtain.style.visibility = "visible";
        gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: "expo.inOut", onComplete: () => (location.href = href) });
      });
    });
    addEventListener("pageshow", (e) => { if (e.persisted) { gsap.set(curtain, { yPercent: -100 }); curtain.style.visibility = "hidden"; } });
  }

  /* ---------- split headlines: words rise from a mask ---------- */
  $$(".split").forEach((el) => {
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
    gsap.from(words, { yPercent: 110, rotate: 3, duration: 1.3, ease: "expo.out", stagger: 0.045, scrollTrigger: { trigger: el, start: "top 88%" } });
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
    gsap.set(parts, { opacity: 0.14 });
    gsap.to(parts, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
  });

  /* ---------- hero: film settles back as you scroll away ---------- */
  if ($(".hero")) {
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
      .to(".hero__media", { yPercent: 18, scale: 1.08, ease: "none" }, 0)
      .to(".hero__content", { yPercent: -12, autoAlpha: 0.2, ease: "none" }, 0);
  }

  /* ---------- full-bleed photographs: slow zoom while in view ---------- */
  $$(".bleed").forEach((b) => {
    gsap.fromTo($(".bleed__img img", b), { scale: 1.22 }, { scale: 1, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$(".phero__bg img").forEach((img) => {
    gsap.to(img, { yPercent: 14, scale: 1.08, ease: "none", scrollTrigger: { trigger: img.closest(".phero"), start: "top top", end: "bottom top", scrub: true } });
  });

  /* ---------- pinned horizontal engines (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 921px)", () => {
    const track = $(".hs__track");
    if (!track) return;
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".hs", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$(".hs__card", track).forEach((card) => {
      gsap.fromTo($("img", card), { xPercent: 8 }, { xPercent: -8, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      gsap.from(card, { y: 90, autoAlpha: 0.3, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 95%", end: "left 60%", scrub: true } });
    });
  });

  /* ---------- filmstrip reacts to scroll speed ---------- */
  const film = $(".film__track");
  if (film) {
    film.style.animation = "none";
    const loop = gsap.to(film, { xPercent: -50, duration: 70, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      onUpdate(st) {
        const v = Math.min(Math.abs(st.getVelocity()) / 300, 6);
        gsap.to(loop, { timeScale: (st.direction || 1) * (1 + v), duration: 0.3, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, ease: "power2.out" });
      },
    });
  }

  /* ---------- catalogue rows stagger in ---------- */
  ScrollTrigger.batch(".cat-tool__body .cat-tool__row", {
    start: "top 92%",
    onEnter: (els) => gsap.from(els, { y: 30, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06, overwrite: true }),
  });

  /* ---------- cursor & magnetic buttons ---------- */
  if (fine) {
    const cur = $(".cursor");
    if (cur) {
      const x = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" });
      const y = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
      gsap.set(cur, { x: -100, y: -100 });
      addEventListener("mousemove", (e) => { x(e.clientX); y(e.clientY); });
      document.addEventListener("mouseover", (e) => {
        const view = e.target.closest(".mosaic a, .strip figure, .film figure, .vcard, .tile, .hs__card, .cgal figure");
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
  }

  addEventListener("load", () => ScrollTrigger.refresh());
})();
