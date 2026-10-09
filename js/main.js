/* ==========================================================
   Iran Truck Trading Group — "Obsidian" motion
   GSAP + ScrollTrigger + Lenis, with a complete no-motion fallback.
   ========================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const motion = !reduced && !!window.gsap && !!window.ScrollTrigger;

  $(".js-year").textContent = new Date().getFullYear();

  let lenis = null;
  if (motion) {
    window.__motionReady = true;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
      lenis.stop();
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    intro();
    scroll();
    pointer();
  } else {
    root.classList.remove("motion");
    $$(".process__list li").forEach((li) => li.classList.add("is-in"));
  }
  nav();
  menu();
  anchors();
  faq();
  form();

  /* ---------------- helpers ---------------- */
  function splitWords(el) {
    const words = [];
    const walk = (node, into) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { into.appendChild(document.createTextNode(" ")); return; }
            const m = document.createElement("span");
            m.className = "wm";
            m.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;padding:0 .06em .1em 0;margin:0 -.06em -.1em 0";
            const w = document.createElement("span");
            w.style.display = "inline-block";
            w.textContent = t;
            m.appendChild(w); into.appendChild(m); words.push(w);
          });
        } else if (n.nodeType === 1) {
          const c = n.cloneNode(false);
          if (n.tagName === "BR") { into.appendChild(c); return; }
          into.appendChild(c); walk(n, c);
        }
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const tmp = document.createElement("div");
    walk(el, tmp);
    el.innerHTML = tmp.innerHTML;
    return $$(".wm > span", el);
  }
  function plainWords(el) {
    const out = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const s = document.createElement("span"); s.textContent = t; frag.appendChild(s); out.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    return out;
  }

  /* ---------------- loader + hero entrance ---------------- */
  function intro() {
    const words = $$(".hero__title .w");
    gsap.set(words, { yPercent: 120, rotate: 6, transformOrigin: "0% 100%" });
    gsap.set(".hero__media", { scale: 1.35 });
    gsap.set(".nav", { autoAlpha: 0, y: -20 });

    const load = gsap.timeline()
      .from(".loader__logo", { autoAlpha: 0, scale: 0.8, filter: "blur(12px)", duration: 1.1, ease: "power3.out" })
      .to(".loader__line i", { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, 0.2)
      .from(".loader__word", { autoAlpha: 0, letterSpacing: "0.8em", duration: 1.2, ease: "power3.out" }, 0.3);

    const img = $(".hero__media img");
    const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    Promise.all([ready, new Promise((r) => load.eventCallback("onComplete", r))]).then(() => {
      gsap.timeline({ onComplete: () => { $(".loader")?.remove(); ScrollTrigger.refresh(); } })
        .to(".loader__inner", { autoAlpha: 0, y: -24, duration: 0.5, ease: "power2.in" })
        .add(() => { root.classList.add("ready"); lenis && lenis.start(); })
        .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut" })
        .to(".hero__media", { scale: 1, duration: 2.6, ease: "expo.out" }, "<.1")
        .to(words, { yPercent: 0, rotate: 0, duration: 1.6, ease: "expo.out", stagger: 0.09 }, "<.35")
        .to(".nav", { autoAlpha: 1, y: 0, duration: 1.2, ease: "expo.out" }, "<.3")
        .to(".hero__fade", { autoAlpha: 1, duration: 1.2, stagger: 0.1, ease: "power2.out" }, "<.2");
    });
  }

  /* ---------------- scroll motion ---------------- */
  function scroll() {
    const mm = gsap.matchMedia();

    // Hero drifts away
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
      .to(".hero__media", { yPercent: 18, ease: "none" }, 0)
      .to(".hero__main", { yPercent: -25, autoAlpha: 0, ease: "none" }, 0)
      .to(".hero__top", { autoAlpha: 0, ease: "none" }, 0);

    // Statement: words light up as you read
    $$(".js-fill").forEach((el) => {
      const words = plainWords(el);
      gsap.set(words, { opacity: 0.12 });
      gsap.to(words, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: true } });
    });

    // Titles: masked words rise
    $$(".js-split").forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, { yPercent: 115, rotate: 5, transformOrigin: "0% 100%", duration: 1.4, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 86%" } });
    });

    // Generic reveal
    ScrollTrigger.batch(".reveal", {
      start: "top 90%",
      onEnter: (els) => {
        els.forEach((e) => e.classList.add("is-in"));
        gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.3, ease: "expo.out", stagger: 0.09, overwrite: true });
      },
    });

    // Image unveil + inner parallax
    $$(".clip").forEach((el) => {
      const img = $("img", el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } })
        .to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.6, ease: "expo.inOut" })
        .from(img, { scale: 1.35, duration: 2.2, ease: "expo.out" }, 0.1);
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Counters
    $$(".count").forEach((el) => {
      const o = { v: 0 };
      gsap.to(o, { v: +el.dataset.to, duration: 2.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" }, onUpdate: () => (el.textContent = Math.round(o.v)) });
    });

    // LEO: the photograph expands to fill the screen
    mm.add({ sm: "(max-width: 1000px)", lg: "(min-width: 1001px)" }, (c) => {
      const from = c.conditions.sm ? "inset(26% 8% round 6px)" : "inset(24% 30% round 6px)";
      gsap.timeline({ scrollTrigger: { trigger: ".expand", start: "top top", end: "bottom bottom", scrub: 1 } })
        .fromTo(".expand__frame", { clipPath: from }, { clipPath: "inset(0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
        .fromTo(".expand__frame img", { scale: 1.3 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .to(".expand__veil", { opacity: 1, duration: 0.4 }, 0.55)
        .fromTo(".expand__copy", { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.62)
        .to(".expand__cap", { autoAlpha: 1, duration: 0.3 }, 0.78);
    });

    // Journey: horizontal travel on desktop
    mm.add("(min-width: 1001px)", () => {
      const track = $(".journey__track");
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".journey", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
      $$(".journey__card", track).forEach((card) => {
        const img = $("img", card);
        if (!card.classList.contains("journey__card--studio")) {
          gsap.fromTo(img, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        }
        gsap.from(card, { y: 120, rotate: 2, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "left 55%", scrub: true } });
      });
      gsap.from(".journey__end .pillar", { y: 60, autoAlpha: 0, stagger: 0.15, ease: "none", scrollTrigger: { trigger: ".journey__end", containerAnimation: tween, start: "left 90%", end: "left 50%", scrub: true } });
    });
    mm.add("(max-width: 1000px)", () => {
      $$(".journey__intro, .journey__card, .pillar").forEach((el) => gsap.from(el, { y: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
    });

    // Feature products
    $$(".feature__studio img").forEach((img) => gsap.fromTo(img, { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));

    // Values: cards stack, earlier ones recede
    const cards = $$(".stack__card");
    cards.forEach((card, i) => {
      const img = $("img", card);
      gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "top 12%", scrub: true } });
      if (i === cards.length - 1) return;
      gsap.to(card, { scale: 0.9, filter: "brightness(.45)", ease: "none", scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 12%", scrub: true } });
    });

    // Contact background
    gsap.fromTo(".contact__bg img", { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } });

    // Footer wordmark
    gsap.from(".footer__word > span", { yPercent: 100, autoAlpha: 0, duration: 1.8, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".footer__word", start: "top 95%" } });

    addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------------- pointer: cursor, magnetic, hover image ---------------- */
  function pointer() {
    if (!fine) return;
    const cur = $(".cursor");
    const cx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    gsap.set(cur, { x: -100, y: -100 });
    addEventListener("mousemove", (e) => { cx(e.clientX); cy(e.clientY); });
    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, summary, input, textarea, label");
      cur.classList.toggle("is-view", !!view);
      cur.classList.toggle("is-link", !!link && !view);
    });

    // Hero light parallax
    const hx = gsap.quickTo(".hero__media img", "x", { duration: 1.6, ease: "power3" });
    const hy = gsap.quickTo(".hero__media img", "y", { duration: 1.6, ease: "power3" });
    gsap.set(".hero__media img", { scale: 1.06 });
    $(".hero").addEventListener("mousemove", (e) => { hx((e.clientX / innerWidth - 0.5) * -34); hy((e.clientY / innerHeight - 0.5) * -20); });

    // Magnetic
    $$(".magnetic").forEach((b) => {
      const x = gsap.quickTo(b, "x", { duration: 0.8, ease: "elastic.out(1, .4)" });
      const y = gsap.quickTo(b, "y", { duration: 0.8, ease: "elastic.out(1, .4)" });
      b.addEventListener("mousemove", (e) => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.45); });
      b.addEventListener("mouseleave", () => { x(0); y(0); });
    });

    // Collection: image follows the cursor over the list
    const box = $(".hover-img"), inner = $(".hover-img__inner");
    const bx = gsap.quickTo(box, "x", { duration: 0.6, ease: "power3" });
    const by = gsap.quickTo(box, "y", { duration: 0.6, ease: "power3" });
    const br = gsap.quickTo(box, "rotate", { duration: 0.6, ease: "power3" });
    let lastX = 0;
    $$(".index-list a").forEach((a) => {
      a.addEventListener("mouseenter", () => {
        inner.style.backgroundImage = `url(${a.dataset.img})`;
        gsap.to(box, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "expo.out" });
        gsap.fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 0.9, ease: "expo.out" });
        cur.classList.remove("is-link");
      });
      a.addEventListener("mouseleave", () => gsap.to(box, { autoAlpha: 0, scale: 0.85, duration: 0.4, ease: "power2.out" }));
    });
    $(".index-list").addEventListener("mousemove", (e) => {
      bx(e.clientX); by(e.clientY);
      br(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    });
  }

  /* ---------------- nav ---------------- */
  function nav() {
    const bar = $(".nav"), wa = $(".wa"), hero = $(".hero"), contact = $("#contact");
    let last = 0;
    const update = (y) => {
      if (!root.classList.contains("menu-open")) bar.classList.toggle("is-hidden", y > last && y > innerHeight * 0.6);
      last = y;
      const c = contact.getBoundingClientRect();
      wa.classList.toggle("is-visible", y > hero.offsetHeight * 0.7 && !(c.top < innerHeight && c.bottom > 0));
    };
    if (lenis) lenis.on("scroll", (e) => update(e.scroll)); else addEventListener("scroll", () => update(scrollY), { passive: true });
    update(scrollY);

    const links = $$(".nav__pill a");
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const s = $(a.getAttribute("href")); if (s) io.observe(s); });
  }

  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    const b = $(".nav__burger");
    b.setAttribute("aria-expanded", open);
    b.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    $("#menu").setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && motion) gsap.fromTo(".menu__links a", { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1, stagger: 0.06, ease: "expo.out", delay: 0.25 });
  }
  function menu() {
    $(".nav__burger").addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("menu-open")) setMenu(false); });
  }

  function anchors() {
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const t = id === "#top" ? document.body : $(id);
      if (!t) return;
      e.preventDefault();
      if (root.classList.contains("menu-open")) setMenu(false);
      if (a.dataset.product) { const m = $("#f-msg"); if (!m.value.trim()) { m.value = `Enquiry: ${a.dataset.product}\nVehicle make / model: `; } }
      if (lenis) lenis.scrollTo(id === "#top" ? 0 : t, { duration: 1.8 });
      else t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }));
  }

  function faq() {
    $$(".qa").forEach((d) => {
      const s = $("summary", d), body = $(".qa__a", d);
      s.addEventListener("click", (e) => {
        if (!motion) return;
        e.preventDefault();
        if (d.open) {
          gsap.to(body, { height: 0, opacity: 0, duration: 0.6, ease: "expo.inOut", onComplete: () => { d.open = false; gsap.set(body, { clearProps: "all" }); ScrollTrigger.refresh(); } });
        } else {
          $$(".qa[open]").forEach((o) => o !== d && $("summary", o).click());
          d.open = true;
          gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.8, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
        }
      });
    });
  }

  function form() {
    const f = $(".form"), status = $(".form__status");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      let first = null;
      $$("[required]", f).forEach((el) => {
        const bad = el.type === "checkbox" ? !el.checked : !el.value.trim();
        (el.closest(".field") || el.closest(".consent")).classList.toggle("is-error", bad);
        if (bad && !first) first = el;
      });
      if (first) { status.textContent = "Please complete the highlighted fields."; first.focus(); return; }
      const d = Object.fromEntries(new FormData(f));
      location.href = `mailto:info@iran-truck.com?subject=${encodeURIComponent("Enquiry — " + d.name)}&body=${encodeURIComponent(`${d.message}\n\n${d.name}\n${d.reach}`)}`;
      status.textContent = "Thank you. Your email app will open with the message ready.";
    });
    $$("input, textarea", f).forEach((el) => el.addEventListener("input", () => (el.closest(".field") || el.closest(".consent"))?.classList.remove("is-error")));
  }
})();
