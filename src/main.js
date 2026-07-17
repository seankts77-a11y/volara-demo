import "./style.css";
import "./glass.css";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches || window.innerWidth < 768;

/* ------------------------------------------------------------------
   Smooth scroll (Lenis) wired into GSAP's ticker + ScrollTrigger.
   Skipped entirely under reduced-motion so the OS setting is honored.
------------------------------------------------------------------ */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.4 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ------------------------------------------------------------------
   Fixed background video — scrubbed by scroll.
   The <video> starts with no source; we attach it and only switch the
   layer on once the file actually loads. If public/bg.mp4 is absent,
   the cinematic .bg-fallback stays visible and the site still works.
------------------------------------------------------------------ */
const bgv = document.getElementById("bgv");
let videoReady = false;
let videoDuration = 0;
let lastVideoT = -1;

function setupVideo() {
  const src = `${import.meta.env.BASE_URL}bg.mp4`;
  bgv.addEventListener(
    "loadeddata",
    () => {
      if (!bgv.duration || Number.isNaN(bgv.duration)) return;
      videoReady = true;
      videoDuration = bgv.duration;
      try { bgv.pause(); } catch (e) { /* seeking only */ }
      bgv.classList.add("is-ready");
      scrubVideo(currentProgress());
    },
    { once: true }
  );
  // On error we simply leave the fallback in place — no throw, graceful.
  bgv.addEventListener("error", () => {}, { once: true });
  bgv.src = src;
  try { bgv.load(); } catch (e) { /* noop */ }
}

function currentProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

function scrubVideo(p) {
  if (!videoReady) return;
  const t = p * (videoDuration - 0.05);
  if (Math.abs(t - lastVideoT) > 0.008) {
    lastVideoT = t;
    try { bgv.currentTime = t; } catch (e) { /* mid-seek */ }
  }
}

// Drive the scrub from a page-wide ScrollTrigger (handles pins correctly).
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => scrubVideo(self.progress),
});

setupVideo();

/* ------------------------------------------------------------------
   Nav: scrolled state + mobile menu
------------------------------------------------------------------ */
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");

function onScroll() {
  nav.classList.toggle("scrolled", window.scrollY > 20);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
/* Smooth in-page navigation: route every hash link through Lenis so section-to-section
   jumps glide instead of snapping and fighting the smooth-scroll engine. Offset keeps the
   target clear of the fixed nav. */
const NAV_OFFSET = 64;
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const hash = a.getAttribute("href");
    if (!hash || hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    if (lenis) {
      lenis.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.3, easing: easeOutExpo });
    } else {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET });
    }
    history.pushState(null, "", hash);
  })
);

/* ------------------------------------------------------------------
   Hero intro
------------------------------------------------------------------ */
if (!reduce) {
  gsap.set("[data-hero]", { opacity: 0, y: 26 });
  gsap.to("[data-hero]", {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.15,
  });
}

/* ------------------------------------------------------------------
   Scroll reveals (CSS transition via .in)
------------------------------------------------------------------ */
const reveals = gsap.utils.toArray(".reveal");
if (reduce) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  ScrollTrigger.batch(".reveal", {
    start: "top 86%",
    onEnter: (batch) =>
      batch.forEach((el, i) => gsap.delayedCall(i * 0.07, () => el.classList.add("in"))),
  });
}

/* ------------------------------------------------------------------
   Impact — pinned word-by-word reveal
------------------------------------------------------------------ */
function setupImpact() {
  const section = document.querySelector("#impact");
  const pin = section.querySelector(".impact__pin");
  const words = [...section.querySelectorAll(".word")];

  const showAll = () =>
    words.forEach((w) => {
      w.style.opacity = "1";
      w.style.filter = "none";
      w.style.transform = "none";
    });

  if (reduce || isTouch) {
    showAll();
    return;
  }

  function render(p) {
    words.forEach((word, i) => {
      const start = (i / words.length) * 0.72;
      const o = gsap.utils.clamp(0, 1, (p - start) / 0.12);
      word.style.opacity = String(0.12 + o * 0.88);
      word.style.filter = `blur(${(1 - o) * 8}px)`;
      word.style.transform = `translateY(${(1 - o) * 16}px)`;
    });
  }

  render(0);
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => "+=" + window.innerHeight * 1.7,
    pin,
    scrub: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
  });
}

/* ------------------------------------------------------------------
   Workflow — pinned one-card-at-a-time gallery (desktop only).
   On touch / small screens the CSS stacks cards vertically instead.
------------------------------------------------------------------ */
function setupWorkflow() {
  const track = document.querySelector("#workflow-track");
  const slides = [...track.querySelectorAll(".workflow-card")];
  const N = slides.length;
  const dotsWrap = document.querySelector("#workflow-dots");

  if (reduce || isTouch) return; // CSS handles the stacked layout

  slides.forEach(() => dotsWrap.appendChild(document.createElement("span")));
  const dots = [...dotsWrap.children];

  function render(p) {
    const pos = p * (N - 1);
    slides.forEach((el, i) => {
      const d = pos - i;
      const ad = Math.abs(d);
      el.style.opacity = String(Math.max(0, 1 - ad / 0.6));
      el.style.transform = `translate(calc(-50% + ${-d * 120}px), -50%) scale(${1 - Math.min(ad, 1) * 0.06})`;
      el.style.filter = `blur(${Math.min(ad * 10, 14)}px)`;
      el.style.zIndex = String(100 - Math.round(ad * 10));
      el.style.pointerEvents = Number(el.style.opacity) > 0.6 ? "auto" : "none";
    });
    const active = gsap.utils.clamp(0, N - 1, Math.round(pos));
    dots.forEach((dot, i) => dot.classList.toggle("on", i === active));
  }

  render(0);
  ScrollTrigger.create({
    trigger: "#workflow",
    start: "top top",
    end: () => "+=" + Math.max(1, N - 1) * window.innerHeight * 0.8,
    pin: ".workflow__pin",
    scrub: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
  });
}

setupImpact();
setupWorkflow();

/* ------------------------------------------------------------------
   Pre-order form
------------------------------------------------------------------ */
// The pre-order form now lives on its own page (preorder.html). Guard in case the
// home page's optional inline form is absent.
const form = document.getElementById("buyForm");
if (form) {
  const email = document.getElementById("email");
  const status = document.getElementById("buyStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!valid) {
      email.classList.add("invalid");
      status.classList.remove("ok");
      status.textContent = "Enter a valid email so we can hold your unit.";
      email.focus();
      return;
    }
    email.classList.remove("invalid");
    status.classList.add("ok");
    status.textContent = `Reserved. Check ${email.value.trim()} for confirmation.`;
    form.reset();
  });
  email.addEventListener("input", () => email.classList.remove("invalid"));
}

/* ------------------------------------------------------------------
   Refresh triggers once fonts / layout settle
------------------------------------------------------------------ */
window.addEventListener("load", () => ScrollTrigger.refresh());
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/* ------------------------------------------------------------------
   Dev hooks for verification in the browser console
------------------------------------------------------------------ */
if (import.meta.env.DEV) {
  window.__lenis = lenis;
  window.__ST = ScrollTrigger;
  window.__bgv = bgv;
}
