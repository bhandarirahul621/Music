// Catalog data. In a real store this would come from a backend or a Shopify/Stripe product feed;
// keeping it in one module means swapping the source later only touches this file.

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tees", label: "Tees", art: "tee", hex: "#e9e4d8" },
  { id: "hoodies", label: "Hoodies & Crews", art: "hoodie", hex: "#5e1f24" },
  { id: "outerwear", label: "Outerwear", art: "jacket", hex: "#4b5230" },
  { id: "bottoms", label: "Bottoms", art: "cargo", hex: "#c9c0ad" },
  { id: "accessories", label: "Accessories", art: "cap", hex: "#1c1c1c" },
];

const TOPS = ["XS", "S", "M", "L", "XL", "XXL"];
const ONE = ["One size"];

const C = {
  bone: { name: "Bone", hex: "#e9e4d8" },
  ink: { name: "Ink", hex: "#1c1c1c" },
  rust: { name: "Rust", hex: "#b5532f" },
  washed: { name: "Washed Black", hex: "#3a3a3a" },
  sage: { name: "Sage", hex: "#8a9a7b" },
  heather: { name: "Heather", hex: "#9a9a9a" },
  oxblood: { name: "Oxblood", hex: "#5e1f24" },
  olive: { name: "Olive", hex: "#4b5230" },
  tan: { name: "Tan", hex: "#a7825a" },
  stone: { name: "Stone", hex: "#c9c0ad" },
  indigo: { name: "Indigo", hex: "#2f3e5c" },
  lightwash: { name: "Light Wash", hex: "#7d93b2" },
  cobalt: { name: "Cobalt", hex: "#2748a8" },
};

export const PRODUCTS = [
  {
    id: "outlaw-heavy-tee", name: "Outlaw Heavy Tee", cat: "tees", art: "tee", kind: "top",
    price: 38, colors: [C.bone, C.ink, C.rust], sizes: TOPS, soldOut: ["XS"],
    badge: "Bestseller", rank: 1, added: 14,
    blurb: "The one we built the brand on. 280gsm cotton, boxy through the body, collar that won't bacon.",
    details: ["280gsm 100% organic cotton jersey", "Garment dyed for a lived-in color", "Ribbed crew neck, double-needle hems", "Small R&CO chest print"],
    fit: "Boxy, slightly cropped. Take your usual size for the intended fit, or size down for a closer cut.",
  },
  {
    id: "no-masters-boxy-tee", name: "No Masters Boxy Tee", cat: "tees", art: "tee", kind: "top",
    price: 42, colors: [C.washed, C.sage], sizes: TOPS,
    badge: "New", rank: 6, added: 20,
    blurb: "Oversized tee with a back graphic that says what we mean. Washed for softness out of the bag.",
    details: ["240gsm cotton, enzyme washed", "Dropped shoulders", "Screen-printed back graphic", "Pre-shrunk"],
    fit: "Oversized. Size down if you want a regular fit.",
  },
  {
    id: "stray-dog-longsleeve", name: "Stray Dog Longsleeve", cat: "tees", art: "longsleeve", kind: "top",
    price: 48, colors: [C.bone, C.oxblood], sizes: TOPS,
    rank: 9, added: 11,
    blurb: "A longsleeve heavy enough to wear alone in autumn, with ribbed cuffs that hold their shape.",
    details: ["260gsm cotton jersey", "1x1 ribbed cuffs", "Sleeve print", "Machine wash cold"],
    fit: "Relaxed. True to size.",
  },
  {
    id: "rogue-standard-hoodie", name: "Rogue Standard Hoodie", cat: "hoodies", art: "hoodie", kind: "top",
    price: 88, colors: [C.ink, C.heather, C.oxblood], sizes: TOPS, soldOut: ["S"],
    badge: "Bestseller", rank: 2, added: 13,
    blurb: "450gsm brushed fleece, a double-layer hood and no side seams. It's the hoodie you'll reach for most.",
    details: ["450gsm cotton fleece, brushed inside", "Double-layer hood with flat drawcords", "Kangaroo pocket", "Tubular body, no side seams"],
    fit: "Relaxed with room to layer. True to size.",
  },
  {
    id: "night-shift-hoodie", name: "Night Shift Hoodie", cat: "hoodies", art: "hoodie", kind: "top",
    price: 96, colors: [C.washed, C.cobalt], sizes: TOPS,
    badge: "New", rank: 5, added: 19,
    blurb: "Pigment-dyed so every one fades a little differently. Tonal embroidery on the chest.",
    details: ["420gsm cotton fleece", "Pigment dyed, each piece varies", "Tonal chest embroidery", "Ribbed hem and cuffs"],
    fit: "Slightly oversized. True to size.",
  },
  {
    id: "hideout-fleece-crew", name: "Hideout Fleece Crew", cat: "hoodies", art: "longsleeve", kind: "top",
    price: 72, colors: [C.heather, C.sage, C.stone], sizes: TOPS,
    rank: 10, added: 9,
    blurb: "Classic crew in the same fleece as the Standard Hoodie. V-insert at the neck, raglan sleeves.",
    details: ["450gsm cotton fleece", "V-stitch neck insert", "Raglan sleeves", "Ribbed hem"],
    fit: "Relaxed. True to size.",
  },
  {
    id: "getaway-coach-jacket", name: "Getaway Coach Jacket", cat: "outerwear", art: "jacket", kind: "top",
    price: 128, colors: [C.ink, C.olive], sizes: TOPS,
    rank: 4, added: 16,
    blurb: "Water-resistant nylon coach jacket with a snap front and a mesh lining that breathes.",
    details: ["Water-resistant nylon shell", "Mesh lining", "Snap front, drawcord hem", "Two side pockets"],
    fit: "Regular. Size up to layer over a hoodie.",
  },
  {
    id: "backroad-work-jacket", name: "Backroad Work Jacket", cat: "outerwear", art: "jacket", kind: "top",
    price: 148, colors: [C.tan, C.ink], sizes: TOPS, soldOut: ["XXL"],
    badge: "Low stock", rank: 3, added: 12,
    blurb: "12oz duck canvas that starts stiff and breaks in to your shape. Corduroy collar, triple stitching.",
    details: ["12oz cotton duck canvas", "Corduroy collar", "Quilted lining", "Triple-stitched seams"],
    fit: "Boxy. True to size.",
  },
  {
    id: "midnight-puffer", name: "Midnight Puffer", cat: "outerwear", art: "puffer", kind: "top",
    price: 179, compareAt: 229, colors: [C.ink, C.oxblood], sizes: TOPS,
    badge: "Sale", rank: 7, added: 8,
    blurb: "A recycled-fill puffer for proper cold. It packs into its own pocket.",
    details: ["Recycled polyester fill", "Matte ripstop shell", "Packs into interior pocket", "Two-way zip"],
    fit: "Relaxed. True to size.",
  },
  {
    id: "alleyway-cargo-pant", name: "Alleyway Cargo Pant", cat: "bottoms", art: "cargo", kind: "bottom",
    price: 98, colors: [C.olive, C.ink, C.stone], sizes: TOPS,
    badge: "Bestseller", rank: 2.5, added: 15,
    blurb: "Wide-leg cargos in ripstop cotton. Six pockets, and the bellows ones actually fit a phone.",
    details: ["Cotton ripstop", "Six pockets", "Adjustable ankle toggles", "Button fly"],
    fit: "Wide leg, mid rise. True to size.",
  },
  {
    id: "loose-cannon-denim", name: "Loose Cannon Denim", cat: "bottoms", art: "denim", kind: "bottom",
    price: 112, colors: [C.indigo, C.lightwash], sizes: TOPS,
    badge: "New", rank: 8, added: 18,
    blurb: "Rigid 14oz denim with a baggy cut and contrast stitching. It fades with how you wear it.",
    details: ["14oz rigid cotton denim", "Contrast gold stitching", "Five pockets", "Copper rivets"],
    fit: "Baggy. Size down for a straighter look.",
  },
  {
    id: "drift-sweat-short", name: "Drift Sweat Short", cat: "bottoms", art: "shorts", kind: "bottom",
    price: 54, colors: [C.heather, C.ink], sizes: TOPS,
    rank: 12, added: 7,
    blurb: "Fleece shorts cut just above the knee, with a drawcord waist and deep pockets.",
    details: ["400gsm cotton fleece", "Drawcord waist", "Side and back pockets", "Raw-edge hem"],
    fit: "Relaxed. True to size.",
  },
  {
    id: "rogue-standard-sweatpant", name: "Rogue Standard Sweatpant", cat: "bottoms", art: "pants", kind: "bottom",
    price: 78, colors: [C.heather, C.ink, C.oxblood], sizes: TOPS,
    rank: 11, added: 10,
    blurb: "Made to match the Standard Hoodie. A straight leg that stacks over sneakers instead of cuffing.",
    details: ["450gsm cotton fleece", "Straight leg, open hem", "Zip back pocket", "Flat drawcord"],
    fit: "Relaxed straight. True to size.",
  },
  {
    id: "crooked-six-panel-cap", name: "Crooked Six-Panel Cap", cat: "accessories", art: "cap", kind: "acc",
    price: 32, colors: [C.ink, C.bone, C.rust], sizes: ONE,
    rank: 13, added: 17,
    blurb: "Unstructured six-panel in washed twill with a brass buckle strap.",
    details: ["Washed cotton twill", "Unstructured crown", "Brass buckle closure", "Embroidered R&CO"],
    fit: "One size, adjustable.",
  },
  {
    id: "lookout-beanie", name: "Lookout Beanie", cat: "accessories", art: "beanie", kind: "acc",
    price: 28, colors: [C.rust, C.ink, C.sage], sizes: ONE,
    badge: "New", rank: 14, added: 21,
    blurb: "A fisherman beanie with a wide cuff and a woven label.",
    details: ["Merino wool blend", "Chunky rib knit", "Woven label", "Hand wash"],
    fit: "One size. Sits above the ear.",
  },
  {
    id: "contraband-tote", name: "Contraband Tote", cat: "accessories", art: "tote", kind: "acc",
    price: 36, colors: [C.bone, C.ink], sizes: ONE,
    rank: 15, added: 6,
    blurb: "A heavy canvas tote that carries a laptop, groceries or both.",
    details: ["16oz cotton canvas", "Inside zip pocket", "Reinforced handles", "40 × 38 × 12 cm"],
    fit: "One size.",
  },
];

export const SIZE_GUIDE = {
  top: {
    cols: ["Size", "Chest (in)", "Length (in)"],
    rows: [["XS", "36", "27"], ["S", "39", "28"], ["M", "42", "29"], ["L", "45", "30"], ["XL", "48", "31"], ["XXL", "51", "32"]],
  },
  bottom: {
    cols: ["Size", "Waist (in)", "Inseam (in)"],
    rows: [["XS", "27–28", "30"], ["S", "29–30", "31"], ["M", "31–32", "31"], ["L", "33–34", "32"], ["XL", "35–36", "32"], ["XXL", "37–38", "32"]],
  },
};

export const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
export const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? "Shop";
