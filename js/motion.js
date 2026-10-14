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
    window.__lenis = lenis;
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
        // characters are grouped per word so lines only ever break between words
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
          const word = document.createElement("span");
          word.style.cssText = "display:inline-block;white-space:nowrap";
          [...t].forEach((c) => {
            const s = document.createElement("span");
            s.textContent = c;
            s.style.display = "inline-block";
            word.appendChild(s); chars.push(s);
          });
          frag.appendChild(word);
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
      const from = c.conditions.sm ? "inset(14% 6% 14% 6%)" : "inset(10% 24% 10% 24%)";
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "+=120%", pin: true, scrub: 1, anticipatePin: 1 } })
        .fromTo(img, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 1 })
        .fromTo($("img", img), { scale: 1.35 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .to([$(".wrap", sec), $(".bleed__cap", sec)], { opacity: 1, duration: 0.3 }, 0.7);
    });
  });
  $$(".bleed:not(.bleed--expand)").forEach((b) => {
    gsap.fromTo($(".bleed__img img", b), { scale: 1.22 }, { scale: 1, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- why cards: rise in, photos settle ---------- */
  ScrollTrigger.batch(".stackx__card", {
    start: "top 88%",
    onEnter: (els) => gsap.from(els, { y: 80, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.12, overwrite: true }),
  });
  $$(".stackx__card img").forEach((img) => {
    gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img.closest(".stackx__card"), start: "top bottom", end: "bottom 40%", scrub: true } });
  });

  /* ---------- pinned horizontal engines (desktop) ---------- */
  mm.add("(min-width: 921px)", () => {
    const track = $(".hs__track");
    if (!track) return;
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".hs", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$(".hs__card", track).forEach((card) => {
      gsap.fromTo($("img", card), { xPercent: 8 }, { xPercent: -8, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
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

  /* ---------- scroll progress line ---------- */
  const bar = document.createElement("div");
  bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- LEO ring: scroll turns a 3D carousel of parts ---------- */
  const orbit = $(".orbit");
  if (orbit) {
    const ring = $(".orbit__ring", orbit), items = $$(".orbit__item", orbit);
    const nameEl = $(".orbit__name", orbit), catEl = $(".orbit__cat", orbit), countEl = $(".orbit__count b", orbit);
    const n = items.length, step = 360 / n, rad = Math.PI / 180;
    const state = { rot: 0 };
    let R = 400, tilt = 0, tiltTo = 0, active = false, current = 0;
    orbit.classList.add("is-3d");
    const layout = () => {
      const w = innerWidth, size = w < 700 ? Math.min(170, w * 0.42) : Math.min(250, Math.max(190, w * 0.15));
      orbit.style.setProperty("--item", size + "px");
      R = Math.max(size * 1.7, Math.min(w * (w < 700 ? 0.5 : 0.4), 640));
    };
    layout(); addEventListener("resize", layout);
    const render = () => {
      tilt += (tiltTo - tilt) * 0.08;
      ring.style.transform = `translateZ(${-R}px) rotateX(${-8 + tilt}deg) rotateY(${state.rot}deg)`;
      items.forEach((it, i) => {
        let a = (((i * step + state.rot) % 360) + 360) % 360; if (a > 180) a -= 360;
        const k = Math.cos(a * rad);
        const f = Math.max(0, k), sc = 0.62 + 0.68 * f * f * f;      // the part in front grows, the rest step back
        it.style.transform = `rotateY(${i * step}deg) translateZ(${R}px) rotateY(${-(i * step + state.rot)}deg) rotateX(${8 - tilt}deg) scale(${sc.toFixed(3)})`;
        const cut = innerWidth < 700 ? 0.55 : 0.15;                  // phones show only the front three
        const vis = Math.max(0, (k - cut) / (1 - cut));
        it.style.opacity = Math.pow(vis, 1.4).toFixed(3);
        it.style.visibility = vis > 0.01 ? "visible" : "hidden";
        it.style.setProperty("--b", (0.3 + 0.7 * Math.max(0, k)).toFixed(2));
      });
      const idx = ((Math.round(-state.rot / step) % n) + n) % n;
      if (idx !== current) {
        current = idx;
        const it = items[idx];
        gsap.timeline()
          .to([catEl, nameEl], { yPercent: -100, autoAlpha: 0, duration: 0.2, ease: "power2.in" })
          .add(() => { nameEl.textContent = it.dataset.name; catEl.textContent = it.dataset.cat; countEl.textContent = String(idx + 1).padStart(2, "0"); })
          .fromTo([catEl, nameEl], { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out", stagger: 0.05 });
      }
    };
    render();
    gsap.ticker.add(() => { if (active) render(); });
    gsap.to(state, { rot: -(360 - step), ease: "none", scrollTrigger: {
      trigger: orbit, start: "top top", end: () => "+=" + innerHeight * 2.4, pin: true, scrub: 1, anticipatePin: 1,
    } });
    new IntersectionObserver(([e]) => { active = e.isIntersecting; }, { rootMargin: "100px" }).observe(orbit);
    orbit.addEventListener("pointermove", (e) => { tiltTo = (e.clientY / innerHeight - 0.5) * -10; });
    orbit.addEventListener("pointerleave", () => { tiltTo = 0; });
    items.forEach((it) => it.addEventListener("click", () => { location.href = "products.html#range"; }));
  }

  /* ---------- products hero: parts float, drift with the pointer ---------- */
  const floats = $$(".phero__float span");
  if (floats.length) {
    gsap.from($$("img", $(".phero__float")), { y: 160, autoAlpha: 0, scale: 0.8, rotate: () => gsap.utils.random(-14, 14), duration: 1.8, ease: "expo.out", stagger: 0.09, delay: 0.5 });
    floats.forEach((sp) => {
      const img = $("img", sp), d = +sp.dataset.depth || 1;
      gsap.to(img, { y: gsap.utils.random(-22, 22), rotation: gsap.utils.random(-5, 5), duration: gsap.utils.random(3.2, 5.2), ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 });
      gsap.to(sp, { yPercent: -60 * d, ease: "none", scrollTrigger: { trigger: ".phero", start: "top top", end: "bottom top", scrub: true } });
      if (fine) {
        const qx = gsap.quickTo(sp, "x", { duration: 1.2, ease: "power3" }), qy = gsap.quickTo(sp, "y", { duration: 1.2, ease: "power3" });
        addEventListener("mousemove", (e) => { qx((e.clientX / innerWidth - 0.5) * -60 * d); qy((e.clientY / innerHeight - 0.5) * -40 * d); });
      }
    });
  }

  /* ---------- LEO range cards rise in ---------- */
  ScrollTrigger.batch(".lp", { start: "top 94%", once: true,
    onEnter: (els) => gsap.fromTo(els.filter((e) => !e.hidden), { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.06, overwrite: true }) });

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
        const view = e.target.closest(".lp a, .orbit__item, .mosaic a, .strip figure, .film figure, .tile, .hs__card, .cgal figure, .stackx__card figure");
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
    // range cards: a soft light follows the pointer, the part tilts toward it
    $$(".lp a").forEach((a) => {
      const fig = $("figure", a);
      const rx = gsap.quickTo(fig, "rotationX", { duration: 0.7, ease: "power3" });
      const ry = gsap.quickTo(fig, "rotationY", { duration: 0.7, ease: "power3" });
      gsap.set(fig, { transformPerspective: 700 });
      a.addEventListener("mousemove", (e) => {
        const r = a.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        a.style.setProperty("--mx", px * 100 + "%"); a.style.setProperty("--my", py * 100 + "%");
        ry((px - 0.5) * 18); rx((0.5 - py) * 14);
      });
      a.addEventListener("mouseleave", () => { rx(0); ry(0); });
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
