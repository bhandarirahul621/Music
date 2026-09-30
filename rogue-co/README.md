# Rogue&Co storefront

An installable web app (PWA) for the Rogue&Co clothing brand. It's plain HTML, CSS and JavaScript
with no build step, like Hookline in this repository.

## What's in it

| Area | Features |
| --- | --- |
| **Home** | Hero, scrolling ticker, shop-by-category tiles, new arrivals, bestsellers, promo banner, perks, newsletter sign-up. |
| **Shop** | Category chips, sorting (featured, newest, price), search from the header, and color swatches that recolor each card. |
| **Product page** | Colorway gallery, size picker with sold-out sizes, size guide, quantity, wishlist, details/fit/shipping accordions, related items. |
| **Cart** | Slide-out drawer, quantity controls, a free-shipping progress bar (free over $100), and promo codes (`ROGUE10` for 10% off, `FIRSTDROP` for $15 off $75+). |
| **Checkout** | Contact and address form with validation, standard or express delivery, a live order summary, and an order confirmation with estimated delivery date. |
| **Account-lite** | Wishlist and order history, saved on the device in `localStorage`. |
| **App** | Installable on phones and desktop (manifest + service worker), works offline after the first visit, light/dark/system themes, keyboard and screen-reader friendly. |

## Before going live

This is a working front end with **placeholder content**. Before selling real products:

1. **Products:** replace the catalog in `public/assets/js/products.js` with the real items, prices and sizes.
2. **Photos:** product images are SVG illustrations from `public/assets/js/art.js`. Swap the `art(...)` calls
   for `<img>` tags pointing at real product photos.
3. **Copy:** update the About page and taglines in `public/assets/js/app.js` so they tell the real brand story.
4. **Payments and orders:** checkout currently saves the order in the browser and takes no payment. Connect
   Shopify (Storefront API or Buy Button), Stripe Checkout or Snipcart so orders and payments are real.
5. **Newsletter:** sign-ups are stored locally. Point the form at Mailchimp, Klaviyo or similar.

## Run locally

```bash
python3 -m http.server -d rogue-co/public 8080
# then open http://localhost:8080
```

## Deploy on Netlify

Create a **new** Netlify site from this repository and set **Base directory** to `rogue-co`.
Netlify then reads `rogue-co/netlify.toml` (publish directory `public`, no build command).
Hookline keeps deploying from the repository root as before.

When you ship changes, bump `CACHE` in `public/sw.js` (for example `rogueco-v2`) so returning
visitors pick up the new files.

## Project layout

```
rogue-co/
  netlify.toml
  public/
    index.html               app shell: header, footer, cart drawer, modal
    manifest.webmanifest     install metadata (name, icons, colors)
    sw.js                    offline cache
    assets/css/styles.css    design tokens (light/dark), layout, components
    assets/js/app.js         router, pages, cart drawer, checkout
    assets/js/products.js    catalog, categories, size guide
    assets/js/store.js       cart, wishlist, orders (localStorage)
    assets/js/art.js         SVG garment illustrations
    assets/js/theme-boot.js  applies the saved theme before first paint
    assets/img/              app icons
```
