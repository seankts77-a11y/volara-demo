import "./style.css";
import "./glass.css";
import "./preorder.css";
import Lenis from "lenis";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* smooth scroll (lightweight — no pins on this page) */
if (!reduce) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* nav mobile menu */
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

/* scroll reveals */
const reveals = [...document.querySelectorAll(".reveal")];
if (reduce || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  reveals.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------
   Configurator: edition + quantity drive a live order summary
------------------------------------------------------------------ */
const editions = [...document.querySelectorAll(".edition")];
const radios = [...document.querySelectorAll('input[name="edition"]')];
const qtyVal = document.getElementById("qtyVal");
let qty = 1;

const money = (n) => "$" + n.toLocaleString("en-US");

function currentEdition() {
  const r = radios.find((x) => x.checked) || radios[0];
  return {
    price: Number(r.dataset.price),
    batteries: Number(r.dataset.batteries),
    name: r.value === "founding" ? "Founding Pilot" : "Standard",
  };
}

function updateSummary() {
  const ed = currentEdition();
  document.getElementById("sumEdition").textContent = ed.name;
  document.getElementById("sumUnit").textContent = money(ed.price);
  document.getElementById("sumQty").textContent = "× " + qty;
  document.getElementById("sumTotal").textContent = money(ed.price * qty);
  document.getElementById("batteryLine").textContent =
    ed.batteries === 3 ? "Three batteries" : "Two batteries";
  editions.forEach((label) =>
    label.classList.toggle("is-active", label.querySelector("input").checked)
  );
}

radios.forEach((r) => r.addEventListener("change", updateSummary));
document.getElementById("qtyPlus").addEventListener("click", () => {
  qty = Math.min(qty + 1, 9); qtyVal.textContent = String(qty); updateSummary();
});
document.getElementById("qtyMinus").addEventListener("click", () => {
  qty = Math.max(qty - 1, 1); qtyVal.textContent = String(qty); updateSummary();
});
updateSummary();

/* ------------------------------------------------------------------
   Reserve form
------------------------------------------------------------------ */
const form = document.getElementById("orderForm");
const email = document.getElementById("email");
const status = document.getElementById("orderStatus");

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
  const ed = currentEdition();
  email.classList.remove("invalid");
  status.classList.add("ok");
  status.textContent = `Reserved — ${qty} × ${ed.name}. Confirmation sent to ${email.value.trim()}.`;
});
email.addEventListener("input", () => email.classList.remove("invalid"));
