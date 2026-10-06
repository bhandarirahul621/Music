// Catalog data, matched to the Rogue&Co brand site: Graphic Tees, Shirts, Jeans and Linen.
// In a real store this would come from a backend or a Shopify/Stripe product feed;
// keeping it in one module means swapping the source later only touches this file.

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tees", label: "Graphic Tees", art: "tee:sun", hex: "#f2ebdf" },
  { id: "shirts", label: "Shirts", art: "shirt", hex: "#dfe6ee" },
  { id: "jeans", label: "Jeans", art: "denim", hex: "#34466e" },
  { id: "linen", label: "Linen", art: "camp", hex: "#e9dfcc" },
];

const TOPS = ["XS", "S", "M", "L", "XL", "XXL"];
const WAIST = ["28", "30", "32", "34", "36", "38"];

const C = {
  cotton: { name: "Raw Cotton", hex: "#f2ebdf" },
  ink: { name: "Denim Ink", hex: "#1a2138" },
  ember: { name: "Burnt Ember", hex: "#d2542b" },
  ochre: { name: "Ochre", hex: "#e6a23c" },
  plum: { name: "Plum", hex: "#3b2f5c" },
  oxblood: { name: "Oxblood", hex: "#8c2f39" },
  sand: { name: "Sand", hex: "#c8b49a" },
  white: { name: "White", hex: "#f4f3ef" },
  sky: { name: "Sky", hex: "#bcd0e3" },
  olive: { name: "Olive", hex: "#5a5f3a" },
  raw: { name: "Raw Indigo", hex: "#243457" },
  midwash: { name: "Mid Wash", hex: "#4d6488" },
  black: { name: "Washed Black", hex: "#2b2b30" },
  natural: { name: "Natural", hex: "#e9dfcc" },
  sage: { name: "Sage", hex: "#9aa98b" },
};

export const PRODUCTS = [
  /* ---------- Graphic Tees ---------- */
  {
    id: "night-tide-tee", name: "Night Tide Tee", cat: "tees", art: "tee:sun", kind: "top",
    price: 42, colors: [C.cotton, C.ink, C.ochre], sizes: TOPS, soldOut: ["XS"],
    badge: "Drop 07", rank: 1, added: 30, run: { left: 142, of: 300 },
    blurb: "A sunset sinking into the tide, drawn by hand for Drop 07 and printed in water-based ink on 220 GSM cotton. Only 300 will be made.",
    details: ["220 GSM combed cotton, pre-shrunk", "Water-based inks that soften instead of cracking", "Artist series, print 3 of 5", "Numbered run of 300, then retired"],
    fit: "Regular fit graded on real body measurements. Take your usual size.",
  },
  {
    id: "tide-and-riot-tee", name: "Tide & Riot Tee", cat: "tees", art: "tee:wave", kind: "top",
    price: 42, colors: [C.ink, C.cotton], sizes: TOPS, soldOut: ["S", "M"],
    badge: "Low stock", rank: 2, added: 22, run: { left: 18, of: 300 },
    blurb: "The Drop 05 print that sold out in 72 hours, back for a final small run: rolling waves in ember and ochre.",
    details: ["220 GSM combed cotton", "Screen-printed with water-based inks", "Artist royalty paid on every shirt", "Final run, never restocked"],
    fit: "Regular fit. Take your usual size.",
  },
  {
    id: "ochre-hour-tee", name: "Ochre Hour Tee", cat: "tees", art: "tee:bloom", kind: "top",
    price: 42, colors: [C.plum, C.cotton, C.oxblood], sizes: TOPS,
    badge: "New", rank: 4, added: 29, run: { left: 231, of: 300 },
    blurb: "A late-afternoon bloom in ochre and ember, drawn by a guest illustrator for Drop 07.",
    details: ["220 GSM combed cotton", "Water-based inks", "Six colorways per drop", "Numbered run of 300"],
    fit: "Regular fit. Take your usual size.",
  },
  {
    id: "static-signal-tee", name: "Static Signal Tee", cat: "tees", art: "tee:lines", kind: "top",
    price: 46, colors: [C.black, C.sand], sizes: TOPS,
    rank: 7, added: 26, run: { left: 96, of: 300 },
    blurb: "Broadcast lines fading into static. It's an oversized cut with a heavier rib.",
    details: ["240 GSM combed cotton", "Oversized cut, dropped shoulder", "Water-based inks", "Numbered run of 300"],
    fit: "Oversized. Size down for a regular fit.",
  },

  /* ---------- Shirts ---------- */
  {
    id: "poplin-oxford", name: "Organic Poplin Oxford", cat: "shirts", art: "shirt", kind: "top",
    price: 68, colors: [C.white, C.sky, C.sand], sizes: TOPS,
    badge: "Bestseller", rank: 3, added: 20,
    blurb: "An oxford cut so the shoulders sit where yours do. The hem works tucked or untucked, and the collar holds its shape without a stay.",
    details: ["Organic cotton poplin", "Button-down collar", "Curved hem, works tucked or untucked", "Mother-of-pearl buttons"],
    fit: "Regular fit, body-measured sizes XS to XXL.",
  },
  {
    id: "brushed-twill-overshirt", name: "Brushed Twill Overshirt", cat: "shirts", art: "overshirt", kind: "top",
    price: 88, colors: [C.olive, C.oxblood, C.ink], sizes: TOPS,
    rank: 6, added: 24,
    blurb: "A brushed twill overshirt with two chest pockets. Wear it over a graphic tee and the outfit is done.",
    details: ["Brushed cotton twill", "Two flap chest pockets", "Snap cuffs", "Straight hem"],
    fit: "Relaxed for layering. Take your usual size.",
  },
  {
    id: "camp-collar-poplin", name: "Camp Collar Poplin Shirt", cat: "shirts", art: "camp", kind: "top",
    price: 72, colors: [C.ember, C.ink, C.white], sizes: TOPS,
    rank: 9, added: 21,
    blurb: "A short-sleeve camp collar in crisp organic poplin, made for warm evenings.",
    details: ["Organic cotton poplin", "Open camp collar", "Boxy short sleeve", "Straight hem"],
    fit: "Boxy. Take your usual size.",
  },

  /* ---------- Jeans ---------- */
  {
    id: "straight-fit-jean", name: "Straight Fit Jean", cat: "jeans", art: "denim", kind: "bottom",
    price: 89, colors: [C.raw, C.midwash], sizes: WAIST, soldOut: ["28"],
    badge: "Bestseller", rank: 5, added: 19,
    blurb: "Cone-dyed 13.5 oz denim in a straight cut, with a measured rise and inseam. It fades to fit your life over months.",
    details: ["13.5 oz cone-dyed denim", "Chain-stitched hems", "Bar-tacked pockets", "Copper rivets"],
    fit: "Straight leg, mid rise. 32 in inseam.",
  },
  {
    id: "slim-fit-jean", name: "Slim Fit Jean", cat: "jeans", art: "denim", kind: "bottom",
    price: 89, colors: [C.raw, C.black], sizes: WAIST,
    rank: 10, added: 18,
    blurb: "The same 13.5 oz denim, cut slimmer through the thigh and tapered to the ankle.",
    details: ["13.5 oz cone-dyed denim", "Tapered leg", "Chain-stitched hems", "Bar-tacked pockets"],
    fit: "Slim. Size up if you're between sizes.",
  },
  {
    id: "relaxed-fit-jean", name: "Relaxed Fit Jean", cat: "jeans", art: "denim", kind: "bottom",
    price: 94, colors: [C.midwash, C.raw], sizes: WAIST,
    badge: "New", rank: 8, added: 27,
    blurb: "A roomier leg with a slightly higher rise. The mid wash comes already softened.",
    details: ["13.5 oz denim, garment washed", "Relaxed leg, higher rise", "Chain-stitched hems", "Five pockets"],
    fit: "Relaxed. Take your usual waist size.",
  },

  /* ---------- Linen ---------- */
  {
    id: "camp-collar-linen", name: "Camp-Collar Linen Shirt", cat: "linen", art: "camp", kind: "top",
    price: 74, colors: [C.natural, C.sky, C.sage], sizes: TOPS,
    badge: "Bestseller", rank: 2.5, added: 23,
    blurb: "100% European flax, garment-washed so it arrives soft. It pulls moisture off your skin and dries fast.",
    details: ["100% European flax linen", "Garment-washed for softness", "Open camp collar", "Coconut buttons"],
    fit: "Relaxed. Take your usual size.",
  },
  {
    id: "linen-drawstring-trouser", name: "Linen Drawstring Trouser", cat: "linen", art: "trouser", kind: "bottom",
    price: 84, colors: [C.natural, C.ink], sizes: WAIST,
    rank: 11, added: 25,
    blurb: "A wide, easy trouser in the same European flax. It goes with the camp-collar shirt or a graphic tee.",
    details: ["100% European flax linen", "Drawstring waist", "Side and back pockets", "Wide straight leg"],
    fit: "Relaxed. Take your usual waist size.",
  },
  {
    id: "linen-overshirt", name: "Linen Overshirt", cat: "linen", art: "overshirt", kind: "top",
    price: 92, compareAt: 110, colors: [C.sand, C.natural], sizes: TOPS,
    badge: "Sale", rank: 12, added: 15,
    blurb: "A lightweight linen overshirt that works as a summer jacket, from last season's run.",
    details: ["100% European flax linen", "Two patch chest pockets", "Horn-effect buttons", "Garment-washed"],
    fit: "Relaxed. Size down for a closer fit.",
  },
];

export const SIZE_GUIDE = {
  top: {
    cols: ["Size", "Chest (in)", "Length (in)"],
    rows: [["XS", "36", "27"], ["S", "39", "28"], ["M", "42", "29"], ["L", "45", "30"], ["XL", "48", "31"], ["XXL", "51", "32"]],
  },
  bottom: {
    cols: ["Size", "Waist (in)", "Inseam (in)"],
    rows: [["28", "28", "32"], ["30", "30", "32"], ["32", "32", "32"], ["34", "34", "32"], ["36", "36", "32"], ["38", "38", "32"]],
  },
};

export const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
export const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? "Shop";
