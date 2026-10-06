// Rogue&Co storefront: a hash-routed single-page app.
// Each "page" is a view function that renders into <main id="view">.

import { PRODUCTS, CATEGORIES, SIZE_GUIDE, findProduct, catLabel } from "./products.js";
import { art } from "./art.js";
import * as store from "./store.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const round2 = (n) => Math.round(n * 100) / 100;
const dollars = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const FREE_SHIP = 75;
const SHIPPING = {
  standard: { label: "Standard", eta: "3–5 business days", price: 6, days: 5 },
  express: { label: "Express", eta: "1–2 business days", price: 15, days: 2 },
};
const PROMOS = {
  INSIDER10: { label: "Insider 10% off", amount: (sub) => sub * 0.1 },
  FIRSTSHIP: { label: "first order shipped free", amount: () => 0, freeShip: true },
};

const ICON = {
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-8.8-8.6C2 8.4 4 5 7.3 5c1.9 0 3.2 1 4.7 2.8C13.5 6 14.8 5 16.7 5 20 5 22 8.4 20.8 11.4 19 15.6 12 20 12 20z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  return: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>`,
};

/* =========================================================================
   Shared building blocks
   ========================================================================= */

function priceHtml(p) {
  return p.compareAt
    ? `<span class="now sale">${money(p.price)}</span> <s class="was">${money(p.compareAt)}</s>`
    : `<span class="now">${money(p.price)}</span>`;
}

function badgeHtml(p) {
  if (!p.badge) return "";
  const cls = p.badge === "Sale" ? "sale" : p.badge === "New" ? "new" : "";
  return `<span class="badge ${cls}">${esc(p.badge)}</span>`;
}

function card(p) {
  const c = p.colors[0];
  const wished = store.isWished(p.id);
  return `<article class="card" data-id="${p.id}">
    <a href="#/product/${p.id}" class="card-media">${art(p.art, c.hex, esc(`${p.name} in ${c.name}`))}${badgeHtml(p)}</a>
    <button class="wish-btn ${wished ? "on" : ""}" type="button" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Save ${esc(p.name)} to wishlist">${ICON.heart}</button>
    <div class="card-body">
      <a href="#/product/${p.id}" class="card-title">${esc(p.name)}</a>
      <div class="price">${priceHtml(p)}</div>
      <div class="swatches" role="group" aria-label="Colors">
        ${p.colors.map((col, i) => `<button type="button" class="swatch ${i === 0 ? "on" : ""}" data-swatch="${esc(col.name)}" style="--c:${col.hex}" aria-label="${esc(col.name)}" aria-pressed="${i === 0}"></button>`).join("")}
      </div>
    </div>
  </article>`;
}

const grid = (list) => `<div class="grid">${list.map(card).join("")}</div>`;

function newsletterSection() {
  return `<section class="wrap section">
    <div class="newsletter">
      <div>
        <p class="eyebrow">Drop alerts</p>
        <h2>Get the next drop first</h2>
        <p class="muted">New prints, restock alerts and artist stories. Twice a month, no spam.</p>
      </div>
      <form class="news-form lg" data-newsletter novalidate>
        <input type="email" name="email" placeholder="you@email.com" aria-label="Email address" required>
        <button class="btn" type="submit">Subscribe</button>
      </form>
    </div>
  </section>`;
}

function empty(title, text, cta = `<a class="btn" href="#/shop">Shop the drop</a>`) {
  return `<div class="empty"><h2>${title}</h2><p class="muted">${text}</p>${cta}</div>`;
}

function shopHref({ cat = "all", sort = "featured", q = "" } = {}) {
  const params = new URLSearchParams();
  if (cat !== "all") params.set("cat", cat);
  if (sort !== "featured") params.set("sort", sort);
  if (q) params.set("q", q);
  const qs = params.toString();
  return `#/shop${qs ? `?${qs}` : ""}`;
}

/* ---------- Cart math ---------- */

function cartLines() {
  return store
    .getCart()
    .map((l) => {
      const p = findProduct(l.id);
      const color = p?.colors.find((c) => c.name === l.color);
      return p && color ? { ...l, p, hex: color.hex, name: p.name, art: p.art, price: p.price } : null;
    })
    .filter(Boolean);
}

function totals(lines, method = "standard") {
  const subtotal = round2(lines.reduce((s, l) => s + l.p.price * l.qty, 0));
  const code = store.getPromo();
  const promo = code && PROMOS[code];
  const discount = promo ? round2(Math.min(promo.amount(subtotal), subtotal)) : 0;
  const after = subtotal - discount;
  const ship = SHIPPING[method] ?? SHIPPING.standard;
  const freeStandard = after >= FREE_SHIP || Boolean(promo?.freeShip);
  const shipping = subtotal === 0 ? 0 : method === "standard" && freeStandard ? 0 : ship.price;
  return { subtotal, discount, code: promo ? code : null, shipping, total: round2(after + shipping), after, freeStandard };
}

function summaryRows(t) {
  return `<dl class="sum">
    <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
    ${t.discount ? `<div class="disc"><dt>Discount (${esc(t.code)})</dt><dd>−${money(t.discount)}</dd></div>` : ""}
    ${!t.discount && t.code ? `<div class="disc"><dt>Code ${esc(t.code)}</dt><dd>Free shipping</dd></div>` : ""}
    <div><dt>Shipping</dt><dd>${t.shipping === 0 ? "Free" : money(t.shipping)}</dd></div>
    <div class="total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
  </dl>`;
}

const miniLine = (l) => `<li>
  <div class="mini-art">${art(l.art, l.hex)}<span class="q">${l.qty}</span></div>
  <div><strong>${esc(l.name)}</strong><span class="muted">${esc(l.color)} · ${esc(l.size)}</span></div>
  <span>${money(l.price * l.qty)}</span>
</li>`;

function promoForm() {
  const code = store.getPromo();
  if (code) {
    return `<div class="promo-applied"><span>${ICON.check} <strong>${esc(code)}</strong> applied (${esc(PROMOS[code]?.label ?? "")})</span>
      <button type="button" class="link sm" data-promo-remove>Remove</button></div>`;
  }
  return `<form class="promo" data-promo novalidate>
    <input name="code" placeholder="Promo code" aria-label="Promo code" autocomplete="off">
    <button class="btn ghost sm" type="submit">Apply</button>
  </form>`;
}

/* =========================================================================
   Views
   ========================================================================= */

function home(main) {
  const fresh = [...PRODUCTS].sort((a, b) => b.added - a.added).slice(0, 4);
  const best = PRODUCTS.filter((p) => p.badge === "Bestseller").slice(0, 4);
  const hero = findProduct("night-tide-tee");
  const ticker = '<span>Drop 07 · Night Tide</span><span aria-hidden="true">✦</span><span>300 pieces per print</span><span aria-hidden="true">✦</span><span>European flax linen</span><span aria-hidden="true">✦</span><span>13.5 oz denim</span><span aria-hidden="true">✦</span><span>Water-based inks</span><span aria-hidden="true">✦</span>';

  main.innerHTML = `
  <section class="hero">
    <div class="wrap hero-inner">
      <div class="hero-copy">
        <p class="pill">Drop 07 is live · only 300 of each print</p>
        <h1>Wear the <em>attitude.</em> Keep the comfort.</h1>
        <p class="lede">Artist-drawn graphic tees on 220 GSM cotton, plus shirts, jeans and European linen cut to fit right and outlast five-wash basics.</p>
        <div class="hero-cta">
          <a class="btn" href="#/product/night-tide-tee">Shop Night Tide</a>
          <a class="btn ghost" href="${shopHref({ sort: "new" })}">See the whole drop</a>
        </div>
        <p class="fine-print">Free shipping over ${dollars(FREE_SHIP)} · Free 30-day returns · Size swaps on us</p>
      </div>
      <a class="hero-feature" href="#/product/night-tide-tee" aria-label="Night Tide Tee, ${money(hero.price)}">
        <span class="float f1"><strong>Drop 07 · Night Tide</strong><small>Artist series, print 3 of 5</small></span>
        ${art(hero.art, hero.colors[0].hex)}
        <span class="float f2"><strong>220 GSM</strong><small>heavyweight cotton</small></span>
        <span class="float f3"><strong>${hero.run.left} of ${hero.run.of} left</strong><span class="run"><span style="width:${(hero.run.left / hero.run.of) * 100}%"></span></span></span>
      </a>
    </div>
  </section>

  <div class="marquee" aria-hidden="true"><div class="marquee-track">${ticker.repeat(4)}</div></div>

  <section class="wrap section">
    <div class="section-head"><div><p class="eyebrow">Shop by category</p><h2>Four staples, one attitude</h2></div></div>
    <div class="cat-grid">
      ${CATEGORIES.filter((c) => c.id !== "all").map((c) => {
        const from = Math.min(...PRODUCTS.filter((p) => p.cat === c.id).map((p) => p.price));
        return `<a class="cat-tile" href="${shopHref({ cat: c.id })}">${art(c.art, c.hex)}<span>${c.label}<small>From ${dollars(from)} →</small></span></a>`;
      }).join("")}
    </div>
  </section>

  <section class="wrap section">
    <div class="section-head"><div><p class="eyebrow">Just dropped</p><h2>New this drop</h2></div><a class="link" href="${shopHref({ sort: "new" })}">View all →</a></div>
    ${grid(fresh)}
  </section>

  <section class="wrap section">
    <div class="promo-band">
      <div>
        <p class="eyebrow">Rogue Club</p>
        <h2>First order shipped on us with code <span class="code">FIRSTSHIP</span></h2>
        <p class="muted">Insiders save 10% on every order with <strong>INSIDER10</strong>.</p>
      </div>
      <a class="btn" href="${shopHref({})}">Start shopping</a>
    </div>
  </section>

  <section class="wrap section">
    <div class="section-head"><div><p class="eyebrow">In heavy rotation</p><h2>Bestsellers</h2></div><a class="link" href="#/shop">Shop all →</a></div>
    ${grid(best)}
  </section>

  <section class="wrap section perks">
    <div>${ICON.truck}<h3>Free shipping over ${dollars(FREE_SHIP)}</h3><p class="muted">Standard shipping is free over ${dollars(FREE_SHIP)}. Orders ship within 48 hours.</p></div>
    <div>${ICON.return}<h3>Free 30-day returns and size swaps</h3><p class="muted">Wrong size? Swap it for free. Return anything unworn within 30 days.</p></div>
    <div>${ICON.shield}<h3>Fabric first, fit second, trend last</h3><p class="muted">220 GSM cotton, 13.5 oz denim and European flax, built for 100+ washes.</p></div>
  </section>

  ${newsletterSection()}`;
}

function shop(main, params) {
  const cat = CATEGORIES.some((c) => c.id === params.get("cat")) ? params.get("cat") : "all";
  const sort = params.get("sort") || "featured";
  const q = (params.get("q") || "").trim();

  let list = PRODUCTS.filter((p) => cat === "all" || p.cat === cat);
  if (q) {
    const terms = q.toLowerCase().split(/\s+/);
    list = list.filter((p) => {
      const hay = [p.name, catLabel(p.cat), p.blurb, ...p.colors.map((c) => c.name)].join(" ").toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  const sorters = {
    featured: (a, b) => a.rank - b.rank,
    new: (a, b) => b.added - a.added,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  };
  list.sort(sorters[sort] ?? sorters.featured);

  const title = q ? `Results for “${esc(q)}”` : cat === "all" ? "Shop all" : catLabel(cat);
  main.innerHTML = `<section class="wrap section">
    <div class="page-head">
      <h1>${title}</h1>
      <p class="muted">${list.length} ${list.length === 1 ? "item" : "items"}</p>
    </div>
    <div class="toolbar">
      <nav class="chips" aria-label="Categories">
        ${CATEGORIES.map((c) => `<a class="chip ${c.id === cat ? "on" : ""}" href="${shopHref({ cat: c.id, sort, q })}" ${c.id === cat ? 'aria-current="page"' : ""}>${c.label}</a>`).join("")}
      </nav>
      <label class="sort">Sort
        <select id="sortSel">
          ${[["featured", "Featured"], ["new", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]]
            .map(([v, l]) => `<option value="${v}" ${v === sort ? "selected" : ""}>${l}</option>`).join("")}
        </select>
      </label>
    </div>
    ${q ? `<p class="search-note">Searching “${esc(q)}” · <a class="link" href="${shopHref({ cat, sort })}">Clear search</a></p>` : ""}
    ${list.length ? grid(list) : empty("Nothing matches that", "Try a different word or browse every category.", `<a class="btn" href="#/shop">See everything</a>`)}
  </section>`;

  $("#sortSel").addEventListener("change", (e) => (location.hash = shopHref({ cat, sort: e.target.value, q })));
}

function product(main, params, [id]) {
  const p = findProduct(id);
  if (!p) return notFound(main);

  const state = {
    color: p.colors.find((c) => c.name === params.get("color"))?.name ?? p.colors[0].name,
    size: p.sizes.length === 1 ? p.sizes[0] : null,
    qty: 1,
  };
  const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id)
    .concat(PRODUCTS.filter((x) => x.cat !== p.cat))
    .slice(0, 4);

  main.innerHTML = `<section class="wrap section">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/shop">Shop</a><span>/</span><a href="${shopHref({ cat: p.cat })}">${catLabel(p.cat)}</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
    <div class="pdp">
      <div class="pdp-media">
        <div class="pdp-main" id="pdpArt"></div>
        <div class="pdp-thumbs" role="group" aria-label="Colorways">
          ${p.colors.map((c) => `<button type="button" class="thumb" data-color="${esc(c.name)}" aria-label="View ${esc(c.name)}">${art(p.art, c.hex)}</button>`).join("")}
        </div>
      </div>
      <div class="pdp-info">
        ${badgeHtml(p)}
        <h1>${esc(p.name)}</h1>
        <div class="price lg">${priceHtml(p)}</div>
        ${p.run ? `<div class="run-meter"><span><strong>${p.run.left} of ${p.run.of}</strong> left in this run</span><span class="run"><span style="width:${(p.run.left / p.run.of) * 100}%"></span></span></div>` : ""}
        <p class="lede">${esc(p.blurb)}</p>

        <div class="opt">
          <div class="opt-label">Color: <strong id="colorName"></strong></div>
          <div class="swatches lg" role="group" aria-label="Color">
            ${p.colors.map((c) => `<button type="button" class="swatch" data-color="${esc(c.name)}" style="--c:${c.hex}" aria-label="${esc(c.name)}"></button>`).join("")}
          </div>
        </div>

        <div class="opt">
          <div class="opt-label">Size${p.sizes.length > 1 ? `: <strong id="sizeName">Select one</strong> <button type="button" class="link sm" id="sizeGuideBtn">Size guide</button>` : ""}</div>
          <div class="sizes" role="group" aria-label="Size">
            ${p.sizes.map((s) => {
              const out = p.soldOut?.includes(s);
              return `<button type="button" class="size" data-size="${s}" ${out ? 'disabled title="Sold out"' : ""}>${s}${out ? '<span class="sr"> (sold out)</span>' : ""}</button>`;
            }).join("")}
          </div>
          <p class="hint" id="sizeHint" role="alert"></p>
        </div>

        <div class="buy-row">
          <div class="qty" role="group" aria-label="Quantity">
            <button type="button" data-step="-1" aria-label="Decrease quantity">${ICON.minus}</button>
            <output id="qtyOut" aria-live="polite">1</output>
            <button type="button" data-step="1" aria-label="Increase quantity">${ICON.plus}</button>
          </div>
          <button type="button" class="btn grow" id="addBtn">Add to cart · ${money(p.price)}</button>
          <button type="button" class="icon-btn wish-lg ${store.isWished(p.id) ? "on" : ""}" data-wish="${p.id}" aria-pressed="${store.isWished(p.id)}" aria-label="Save to wishlist">${ICON.heart}</button>
        </div>
        <p class="ship-note">${ICON.truck} ${p.price >= FREE_SHIP ? "Ships free" : `Free shipping on orders over ${dollars(FREE_SHIP)}`} · Returns within 30 days</p>

        <details open><summary>Details</summary><ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></details>
        <details><summary>Size &amp; fit</summary><p>${esc(p.fit)}</p></details>
        <details><summary>Shipping &amp; returns</summary><p>Standard shipping takes 3–5 business days and is free on orders over ${dollars(FREE_SHIP)}. Express takes 1–2 business days for ${money(SHIPPING.express.price)}. You can return unworn items with tags within 30 days.</p></details>
      </div>
    </div>
  </section>
  <section class="wrap section">
    <div class="section-head"><h2>You might also like</h2></div>
    ${grid(related)}
  </section>`;

  const update = () => {
    const color = p.colors.find((c) => c.name === state.color);
    $("#pdpArt").innerHTML = art(p.art, color.hex, esc(`${p.name} in ${color.name}`)) + badgeHtml(p);
    $("#colorName").textContent = color.name;
    $$("[data-color]", main.querySelector(".pdp")).forEach((b) => {
      const on = b.dataset.color === state.color;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
    $$(".size", main).forEach((b) => {
      const on = b.dataset.size === state.size;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
    if ($("#sizeName")) $("#sizeName").textContent = state.size ?? "Select one";
    $("#qtyOut").textContent = state.qty;
    $("#addBtn").textContent = `Add to cart · ${money(p.price * state.qty)}`;
    history.replaceState(null, "", `#/product/${p.id}?color=${encodeURIComponent(state.color)}`);
  };

  main.querySelector(".pdp").addEventListener("click", (e) => {
    const colorBtn = e.target.closest("[data-color]");
    const sizeBtn = e.target.closest("[data-size]");
    const step = e.target.closest("[data-step]");
    if (colorBtn) state.color = colorBtn.dataset.color;
    else if (sizeBtn && !sizeBtn.disabled) {
      state.size = sizeBtn.dataset.size;
      $("#sizeHint").textContent = "";
    } else if (step) state.qty = Math.max(1, Math.min(10, state.qty + Number(step.dataset.step)));
    else return;
    update();
  });

  $("#addBtn").addEventListener("click", () => {
    if (!state.size) {
      $("#sizeHint").textContent = "Pick a size first.";
      const sizes = $(".sizes", main);
      sizes.classList.remove("shake");
      void sizes.offsetWidth; // restart the animation
      sizes.classList.add("shake");
      return;
    }
    store.addToCart({ id: p.id, color: state.color, size: state.size, qty: state.qty });
    toast(`Added ${esc(p.name)} (${esc(state.color)}, ${esc(state.size)})`);
    openCart();
  });

  $("#sizeGuideBtn")?.addEventListener("click", () => sizeGuide(p.kind === "bottom" ? "bottom" : "top"));
  update();
}

function wishlist(main) {
  const list = store.getWish().map(findProduct).filter(Boolean);
  main.innerHTML = `<section class="wrap section">
    <div class="page-head"><h1>Wishlist</h1><p class="muted">${list.length} saved</p></div>
    ${list.length ? grid(list) : empty("Nothing saved yet", "Tap the heart on anything you like and it'll wait here for you.")}
  </section>`;
}

function checkout(main) {
  const lines = cartLines();
  if (!lines.length) {
    main.innerHTML = `<section class="wrap section">${empty("Your cart is empty", "Add something before checking out.")}</section>`;
    return;
  }

  main.innerHTML = `<section class="wrap section">
    <div class="page-head"><h1>Checkout</h1></div>
    <div class="checkout">
      <form id="checkoutForm" class="co-form" novalidate>
        <fieldset>
          <legend>Contact</legend>
          <label class="field full">Email<input type="email" name="email" autocomplete="email" required></label>
        </fieldset>
        <fieldset>
          <legend>Shipping address</legend>
          <label class="field">First name<input name="first" autocomplete="given-name" required></label>
          <label class="field">Last name<input name="last" autocomplete="family-name" required></label>
          <label class="field full">Address<input name="address" autocomplete="address-line1" required></label>
          <label class="field full">Apartment, suite, etc. <span class="muted">(optional)</span><input name="apt" autocomplete="address-line2"></label>
          <label class="field">City<input name="city" autocomplete="address-level2" required></label>
          <label class="field">State<input name="state" autocomplete="address-level1" required maxlength="30"></label>
          <label class="field">ZIP code<input name="zip" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" required></label>
          <label class="field">Phone <span class="muted">(optional)</span><input type="tel" name="phone" autocomplete="tel"></label>
        </fieldset>
        <fieldset>
          <legend>Delivery</legend>
          ${Object.entries(SHIPPING).map(([k, s], i) => `<label class="radio">
            <input type="radio" name="method" value="${k}" ${i === 0 ? "checked" : ""}>
            <span><strong>${s.label}</strong> <span class="muted">${s.eta}</span></span>
            <span class="rp" data-rate="${k}"></span>
          </label>`).join("")}
        </fieldset>
        <fieldset>
          <legend>Payment</legend>
          <p class="demo-note">This is a demo store, so no payment is taken. When Rogue&amp;Co goes live, a provider such as Stripe or Shopify handles payment here.</p>
        </fieldset>
        <button class="btn block lg" type="submit" id="placeBtn">Place order</button>
      </form>

      <aside class="co-summary" aria-label="Order summary">
        <h2>Order summary</h2>
        <ul class="mini-lines" id="coLines"></ul>
        <div id="coPromo">${promoForm()}</div>
        <div id="coTotals"></div>
      </aside>
    </div>
  </section>`;

  const form = $("#checkoutForm");
  const refresh = () => {
    const current = cartLines();
    if (!current.length) return render();
    const method = form.elements.method.value;
    const t = totals(current, method);
    $("#coLines").innerHTML = current.map(miniLine).join("");
    $("#coTotals").innerHTML = summaryRows(t);
    $("#coPromo").innerHTML = promoForm();
    $$("[data-rate]", form).forEach((el) => {
      const k = el.dataset.rate;
      const free = k === "standard" && t.freeStandard;
      el.textContent = free ? "Free" : money(SHIPPING[k].price);
    });
    $("#placeBtn").textContent = `Place order · ${money(t.total)}`;
  };
  form.addEventListener("change", refresh);
  form.addEventListener("input", (e) => {
    if (e.target.checkValidity()) e.target.closest(".field")?.classList.remove("invalid");
  });
  checkoutRefresh = refresh;
  refresh();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    $$(".field", form).forEach((f) => f.classList.remove("invalid"));
    if (!form.checkValidity()) {
      $$("input:invalid", form).forEach((i) => i.closest(".field")?.classList.add("invalid"));
      form.querySelector("input:invalid")?.focus();
      toast("Please fill in the highlighted fields.", "warn");
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const current = cartLines();
    const t = totals(current, data.method);
    const num = "RC-" + Date.now().toString(36).toUpperCase().slice(-6);
    store.addOrder({
      num,
      date: new Date().toISOString(),
      email: data.email,
      method: data.method,
      ship: { name: `${data.first} ${data.last}`, address: data.address, apt: data.apt, city: data.city, state: data.state, zip: data.zip },
      lines: current.map((l) => ({ id: l.id, name: l.p.name, art: l.p.art, hex: l.hex, color: l.color, size: l.size, qty: l.qty, price: l.p.price })),
      totals: t,
    });
    store.clearCart();
    store.setPromo(null);
    location.hash = `#/order/${num}`;
  });
}
let checkoutRefresh = null;

function orderDetail(main, _params, [num]) {
  const o = store.getOrder(num);
  if (!o) return notFound(main);
  const placed = new Date(o.date);
  const eta = new Date(placed);
  eta.setDate(eta.getDate() + (SHIPPING[o.method]?.days ?? 5));
  const fmt = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  main.innerHTML = `<section class="wrap section narrow">
    <div class="confirm">
      <div class="confirm-mark">${ICON.check}</div>
      <p class="eyebrow">Order ${esc(o.num)}</p>
      <h1>Thanks, ${esc(o.ship.name.split(" ")[0])}. You're in.</h1>
      <p class="muted">Your confirmation goes to <strong>${esc(o.email)}</strong>. Estimated delivery: <strong>${fmt(eta)}</strong>.</p>
    </div>
    <div class="order-card">
      <ul class="mini-lines">
        ${o.lines.map(miniLine).join("")}
      </ul>
      ${summaryRows(o.totals)}
      <div class="ship-to">
        <h3>Shipping to</h3>
        <p>${esc(o.ship.name)}<br>${esc(o.ship.address)}${o.ship.apt ? `, ${esc(o.ship.apt)}` : ""}<br>${esc(o.ship.city)}, ${esc(o.ship.state)} ${esc(o.ship.zip)}</p>
        <p class="muted">${esc(SHIPPING[o.method]?.label ?? "")} · placed ${fmt(placed)}</p>
      </div>
    </div>
    <div class="center"><a class="btn" href="#/shop">Keep shopping</a> <a class="btn ghost" href="#/orders">All orders</a></div>
  </section>`;
}

function orders(main) {
  const list = store.getOrders();
  main.innerHTML = `<section class="wrap section narrow">
    <div class="page-head"><h1>Your orders</h1><p class="muted">Saved on this device</p></div>
    ${list.length
      ? `<ul class="order-list">${list.map((o) => `<li><a href="#/order/${esc(o.num)}">
          <div class="stack">${o.lines.slice(0, 3).map((l) => `<span class="mini-art">${art(l.art, l.hex)}</span>`).join("")}</div>
          <div><strong>${esc(o.num)}</strong><span class="muted">${new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${o.lines.reduce((n, l) => n + l.qty, 0)} items</span></div>
          <span>${money(o.totals.total)}</span></a></li>`).join("")}</ul>`
      : empty("No orders yet", "Once you check out, your orders show up here.")}
  </section>`;
}

function about(main) {
  main.innerHTML = `<section class="about-hero">
    <div class="wrap narrow">
      <p class="eyebrow">Our approach</p>
      <h1>Clothing made like your favorite tee, the one you never throw out.</h1>
      <p class="lede">Everyone owns one: the shirt that got better with every wash, fit like it was measured on you, and still gets compliments. Rogue&amp;Co exists to make every piece that shirt.</p>
      <p class="about-back"><a class="link" href="../">Read the full Rogue&amp;Co story →</a></p>
    </div>
  </section>
  <section class="wrap section values">
    <div><span class="num">300</span><h3>Pieces per print</h3><p class="muted">Every graphic comes from an independent illustrator, printed in a numbered run of 300 and then retired for good. Artists earn a royalty on every shirt.</p></div>
    <div><span class="num">220</span><h3>GSM cotton, water-based inks</h3><p class="muted">Heavyweight combed cotton with inks that soften instead of cracking, built and tested for 100 washes.</p></div>
    <div><span class="num">6</span><h3>Body-measured sizes</h3><p class="muted">Graded on real measurements from XS to XXL, so fit stops being a guess and returns stop being routine.</p></div>
  </section>
  ${newsletterSection()}`;
}

function notFound(main) {
  main.innerHTML = `<section class="wrap section">${empty("Page not found", "That link went rogue. Let's get you back on track.", `<a class="btn" href="#/">Go home</a>`)}</section>`;
}

const ROUTES = { "": home, shop, product, wishlist, checkout, order: orderDetail, orders, about };

/* =========================================================================
   Cart drawer
   ========================================================================= */

function renderCart() {
  const lines = cartLines();
  const count = store.cartCount();
  const badge = $("#cartCount");
  badge.textContent = count;
  badge.hidden = count === 0;
  $("#cartBtn").setAttribute("aria-label", `Open cart, ${count} ${count === 1 ? "item" : "items"}`);

  if (!lines.length) {
    $("#cartBody").innerHTML = empty("Your cart is empty", "Good taste deserves a full bag.", `<a class="btn" href="#/shop" data-close-cart>Shop the drop</a>`);
    $("#cartFoot").innerHTML = "";
    return;
  }

  const t = totals(lines);
  const left = t.freeStandard ? 0 : FREE_SHIP - t.after;
  const pct = t.freeStandard ? 100 : Math.min(100, (t.after / FREE_SHIP) * 100);

  $("#cartBody").innerHTML = `
    <div class="ship-progress">
      <p>${left > 0 ? `You're <strong>${money(left)}</strong> away from free shipping` : `${ICON.check} You've unlocked <strong>free shipping</strong>`}</p>
      <div class="bar"><span style="width:${pct}%"></span></div>
    </div>
    <ul class="lines">
      ${lines.map((l) => `<li class="line">
        <a href="#/product/${l.id}?color=${encodeURIComponent(l.color)}" class="line-art" data-close-cart>${art(l.p.art, l.hex)}</a>
        <div class="line-info">
          <a href="#/product/${l.id}?color=${encodeURIComponent(l.color)}" class="line-name" data-close-cart>${esc(l.p.name)}</a>
          <span class="muted">${esc(l.color)} · ${esc(l.size)}</span>
          <div class="qty sm" role="group" aria-label="Quantity for ${esc(l.p.name)}">
            <button type="button" data-line-step="-1" data-key="${esc(l.key)}" aria-label="Decrease">${ICON.minus}</button>
            <output>${l.qty}</output>
            <button type="button" data-line-step="1" data-key="${esc(l.key)}" aria-label="Increase">${ICON.plus}</button>
          </div>
        </div>
        <div class="line-end">
          <span>${money(l.p.price * l.qty)}</span>
          <button type="button" class="link sm" data-remove="${esc(l.key)}">Remove</button>
        </div>
      </li>`).join("")}
    </ul>`;

  $("#cartFoot").innerHTML = `
    ${promoForm()}
    ${summaryRows(t)}
    <a class="btn block lg" href="#/checkout" data-close-cart>Checkout · ${money(t.total)}</a>
    <p class="fine muted">Taxes calculated at checkout when live. Demo store, no payment taken.</p>`;
}

let lastFocus = null;
function openCart() {
  const drawer = $("#cartDrawer");
  lastFocus = document.activeElement;
  drawer.classList.add("open");
  drawer.removeAttribute("inert");
  drawer.setAttribute("aria-hidden", "false");
  $("#cartBtn").setAttribute("aria-expanded", "true");
  $("#overlay").hidden = false;
  requestAnimationFrame(() => $("#overlay").classList.add("show"));
  document.body.classList.add("locked");
  $("#cartClose").focus();
}
function closeCart() {
  const drawer = $("#cartDrawer");
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  drawer.setAttribute("inert", "");
  drawer.setAttribute("aria-hidden", "true");
  $("#cartBtn").setAttribute("aria-expanded", "false");
  $("#overlay").classList.remove("show");
  setTimeout(() => ($("#overlay").hidden = true), 250);
  document.body.classList.remove("locked");
  lastFocus?.focus?.();
}

/* =========================================================================
   Modal, toasts, theme
   ========================================================================= */

function sizeGuide(kind) {
  const g = SIZE_GUIDE[kind];
  $("#modalBody").innerHTML = `
    <div class="modal-head"><h2 id="modalTitle">Size guide</h2>
      <button class="icon-btn" type="button" data-close-modal aria-label="Close">${ICON.close}</button></div>
    <p class="muted">Garment measurements, laid flat. Between sizes? Size up for a boxier fit.</p>
    <table class="size-table"><thead><tr>${g.cols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
      <tbody>${g.rows.map((r) => `<tr>${r.map((v, i) => (i === 0 ? `<th scope="row">${v}</th>` : `<td>${v}</td>`)).join("")}</tr>`).join("")}</tbody></table>`;
  $("#modal").showModal();
}

function toast(html, kind = "ok") {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = html;
  $("#toasts").append(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

const THEMES = ["dark", "light"];
function getTheme() {
  try {
    return localStorage.getItem("rc.theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
function applyTheme(t) {
  if (t === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  try {
    localStorage.setItem("rc.theme", t);
  } catch {
    /* ignore */
  }
  $("#themeBtn").setAttribute("aria-label", `Theme: ${t}. Click to change.`);
  $("#themeBtn").title = `Theme: ${t}`;
}

/* =========================================================================
   Router + global wiring
   ========================================================================= */

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs = ""] = raw.split("?");
  return { parts: path.split("/").filter(Boolean), params: new URLSearchParams(qs) };
}

function render() {
  const { parts, params } = parseHash();
  const main = $("#view");
  const view = ROUTES[parts[0] ?? ""] ?? notFound;
  checkoutRefresh = null;
  view(main, params, parts.slice(1));

  const cat = params.get("cat");
  $$("[data-nav]").forEach((a) => {
    const on = (parts[0] === "shop" && (cat ? a.dataset.nav === cat : a.dataset.nav === "shop")) || (parts[0] === "about" && a.dataset.nav === "about");
    a.classList.toggle("on", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  document.body.classList.remove("nav-open");
  $("#menuBtn").setAttribute("aria-expanded", "false");
  const h1 = main.querySelector("h1");
  document.title = parts.length && h1 ? `${h1.textContent} · Rogue&Co` : "Rogue&Co · Streetwear made in small runs";
  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

function updateWishButtons(id, on) {
  $$(`[data-wish="${id}"]`).forEach((b) => {
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });
  const n = store.getWish().length;
  $("#wishCount").textContent = n;
  $("#wishCount").hidden = n === 0;
}

document.addEventListener("click", (e) => {
  const t = e.target;

  const wishBtn = t.closest("[data-wish]");
  if (wishBtn) {
    e.preventDefault();
    const id = wishBtn.dataset.wish;
    const on = store.toggleWish(id);
    updateWishButtons(id, on);
    toast(on ? `Saved to your wishlist` : `Removed from your wishlist`);
    if (parseHash().parts[0] === "wishlist") render();
    return;
  }

  const sw = t.closest(".card [data-swatch]");
  if (sw) {
    const cardEl = sw.closest(".card");
    const p = findProduct(cardEl.dataset.id);
    const col = p.colors.find((c) => c.name === sw.dataset.swatch);
    const media = $(".card-media", cardEl);
    media.innerHTML = art(p.art, col.hex, esc(`${p.name} in ${col.name}`)) + badgeHtml(p);
    const href = `#/product/${p.id}?color=${encodeURIComponent(col.name)}`;
    media.href = href;
    $(".card-title", cardEl).href = href;
    $$("[data-swatch]", cardEl).forEach((b) => {
      b.classList.toggle("on", b === sw);
      b.setAttribute("aria-pressed", b === sw);
    });
    return;
  }

  const step = t.closest("[data-line-step]");
  if (step) {
    const line = store.getCart().find((l) => l.key === step.dataset.key);
    if (line) store.setQty(line.key, line.qty + Number(step.dataset.lineStep));
    return;
  }
  const rm = t.closest("[data-remove]");
  if (rm) return store.removeLine(rm.dataset.remove);

  if (t.closest("[data-promo-remove]")) return store.setPromo(null);
  if (t.closest("[data-close-cart]")) return closeCart();
  if (t.closest("[data-close-modal]")) return $("#modal").close();
});

document.addEventListener("submit", (e) => {
  const form = e.target;
  if (form.matches("[data-newsletter]")) {
    e.preventDefault();
    const input = form.elements.email;
    if (!input.checkValidity()) {
      input.focus();
      toast("That email doesn't look right.", "warn");
      return;
    }
    store.subscribe(input.value.trim().toLowerCase());
    form.outerHTML = `<p class="news-done">${ICON.check} You're on the list. Watch your inbox for the next drop.</p>`;
    return;
  }
  if (form.matches("[data-promo]")) {
    e.preventDefault();
    const code = form.elements.code.value.trim().toUpperCase();
    if (PROMOS[code]) {
      store.setPromo(code);
      toast(`Code ${esc(code)} applied`);
    } else {
      toast(code ? `“${esc(code)}” isn't a valid code` : "Enter a promo code", "warn");
    }
  }
});

function init() {
  $("#year").textContent = new Date().getFullYear();

  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);

  $("#menuBtn").addEventListener("click", () => {
    // The announcement bar scrolls away, so pin the menu to wherever the header's bottom edge is right now.
    document.documentElement.style.setProperty("--nav-top", `${$(".site-header").getBoundingClientRect().bottom}px`);
    const open = document.body.classList.toggle("nav-open");
    $("#menuBtn").setAttribute("aria-expanded", open);
  });

  const bar = $("#searchBar");
  $("#searchBtn").addEventListener("click", () => {
    bar.hidden = !bar.hidden;
    $("#searchBtn").setAttribute("aria-expanded", !bar.hidden);
    if (!bar.hidden) $("#searchInput").focus();
  });
  bar.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    location.hash = shopHref({ q });
    bar.hidden = true;
    $("#searchBtn").setAttribute("aria-expanded", "false");
  });

  applyTheme(getTheme());
  $("#themeBtn").addEventListener("click", () => {
    const next = THEMES[(THEMES.indexOf(getTheme()) + 1) % THEMES.length];
    applyTheme(next);
    toast(`Theme: ${next}`);
  });

  $("#modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeCart();
    if (!bar.hidden) {
      bar.hidden = true;
      $("#searchBtn").setAttribute("aria-expanded", "false");
    }
    document.body.classList.remove("nav-open");
  });

  store.onChange((what) => {
    if (what === "cart") {
      renderCart();
      checkoutRefresh?.();
    }
  });

  renderCart();
  updateWishButtons("", false);
  window.addEventListener("hashchange", render);
  render();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
