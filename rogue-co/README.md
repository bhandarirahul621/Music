# Rogue&Co

Brand site and shopping app for **Rogue&Co**: artist-drawn graphic tees in numbered runs of 300,
plus shirts, jeans and European linen. It's a brand concept for ISM 6427C.

| Path | What it is |
| --- | --- |
| `/` (`index.html`) | The brand site: hero, categories, the problem and the approach, the cost-per-wear calculator, Rogue Club pricing and the lookbook. Its "Shop the Drop" buttons and category cards open the shop. |
| `/shop/` | The shopping app: browse, product pages with sizes and colorways, cart, promo codes, checkout, order history and wishlist. It installs on phones like an app and works offline. |
| `images/` | Photos used by the brand site (see `images/README.md`). |

Everything is plain HTML, CSS and JavaScript, so there's nothing to install or build.

## Put it online with Netlify

1. On Netlify: **Add new site → Import an existing project → GitHub** → choose **rogue-co**.
2. Leave **Build command** empty. The publish directory comes from `netlify.toml`.
3. Click **Deploy**. From then on, every change pushed to GitHub goes live automatically.

## Try it on your computer

```bash
python3 -m http.server 8080
# open http://localhost:8080 (brand site) or http://localhost:8080/shop/ (app)
```

## Promo codes in the shop

| Code | What it does |
| --- | --- |
| `FIRSTSHIP` | Free standard shipping on the first order |
| `INSIDER10` | 10% off, like a Rogue Club Insider |

## Prototype notes

- Checkout saves orders in the browser and takes **no payment**. For a live store, connect Shopify, Stripe Checkout or Snipcart.
- Product images in the shop are drawn in code (`shop/assets/js/art.js`). Replace them with real photos when they're ready.
- The product list lives in `shop/assets/js/products.js`: edit names, prices, sizes and stock there.
- After changing shop files, bump `CACHE` in `shop/sw.js` so returning visitors get the new version.
