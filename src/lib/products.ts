export type CategoryId = "jewellery" | "clothing" | "watches" | "home" | "accessories" | "beauty";

export interface Category {
  id: CategoryId;
  name: string;
  image: string;
  blurb: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: CategoryId;
  images: string[];
  /** Demo ranking only, used for "popularity" sorting. Not real sales data. */
  popularity: number;
  tags: ("featured" | "bestseller" | "new")[];
  collection?: "festive" | "everyday" | "gifting" | undefined;
  sku: string;
  stock: number;
  originalPrice?: number | undefined;
  sizes: string[];
  colors: string[];
  active: boolean;
  featured: boolean;
  /** Higher = newer. Used for "Newest first". */
  createdAt: number;
}

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const gallery = (id: string) => [
  img(id),
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=1000&q=75&crop=top`,
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=800&q=75&crop=bottom`,
];

export const categories: Category[] = [
  {
    id: "jewellery",
    name: "Jewellery",
    image: img("1515562141207-7a88fb7ce338", 600),
    blurb: "Necklaces, rings & earrings",
  },
  {
    id: "clothing",
    name: "Clothing",
    image: img("1490481651871-ab68de25d43d", 600),
    blurb: "Everyday & occasion wear",
  },
  {
    id: "watches",
    name: "Watches",
    image: img("1523275335684-37898b6baf30", 600),
    blurb: "Classic & modern timepieces",
  },
  {
    id: "home",
    name: "Home & Lifestyle",
    image: img("1586023492125-27b2c045efd7", 600),
    blurb: "Decor, lighting & comfort",
  },
  {
    id: "accessories",
    name: "Accessories",
    image: img("1548036328-c9fa89d128fa", 600),
    blurb: "Bags, eyewear & wallets",
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    image: img("1556228578-8c89e6adf883", 600),
    blurb: "Skincare & fragrance",
  },
];

type Seed = [
  string,
  string,
  number,
  string,
  CategoryId,
  number,
  Product["tags"],
  Product["collection"]?,
];

const seeds: Seed[] = [
  // Jewellery
  [
    "1515562141207-7a88fb7ce338",
    "Aurelia Pendant Necklace",
    2499,
    "Delicate gold-tone chain with a polished drop pendant.",
    "jewellery",
    92,
    ["featured", "bestseller"],
    "gifting",
  ],
  [
    "1535632066927-ab7c9ab60908",
    "Pearl Drop Earrings",
    1799,
    "Lightweight freshwater-style pearl drops for daily elegance.",
    "jewellery",
    81,
    ["new"],
    "everyday",
  ],
  [
    "1599643478518-a784e5dc4c8f",
    "Heritage Layered Necklace",
    3999,
    "Layered statement piece inspired by traditional craft.",
    "jewellery",
    77,
    ["featured"],
    "festive",
  ],
  [
    "1605100804763-247f67b3557e",
    "Solitaire Promise Ring",
    4599,
    "Minimal band with a brilliant-cut solitaire stone.",
    "jewellery",
    88,
    ["bestseller"],
    "gifting",
  ],
  [
    "1611591437281-460bfbe1220a",
    "Twisted Cuff Bracelet",
    1999,
    "Sculpted open cuff with a soft brushed finish.",
    "jewellery",
    64,
    ["new"],
  ],
  [
    "1617038220319-276d3cfab638",
    "Stackable Ring Set",
    1499,
    "Set of three slim rings to mix, match and stack.",
    "jewellery",
    70,
    [],
    "everyday",
  ],
  // Clothing
  [
    "1521572163474-6864f9cf17ab",
    "Essential Cotton Tee",
    799,
    "Soft breathable cotton tee with a relaxed fit.",
    "clothing",
    95,
    ["bestseller"],
    "everyday",
  ],
  [
    "1434389677669-e08b4cac3105",
    "Knit Lounge Sweater",
    2199,
    "Cosy ribbed knit for cool evenings.",
    "clothing",
    72,
    ["new"],
  ],
  [
    "1591047139829-d91aecb6caea",
    "Classic Denim Jacket",
    3299,
    "Timeless washed-denim jacket with metal buttons.",
    "clothing",
    85,
    ["featured"],
  ],
  [
    "1542272604-787c3835535d",
    "Slim Fit Jeans",
    2499,
    "Stretch denim with a clean, tapered silhouette.",
    "clothing",
    89,
    ["bestseller"],
    "everyday",
  ],
  [
    "1595777457583-95e059d581b8",
    "Floral Summer Dress",
    2799,
    "Flowing midi dress in a light floral print.",
    "clothing",
    78,
    ["new", "featured"],
    "festive",
  ],
  [
    "1596944924616-7b38e7cfac36",
    "Linen Weekend Shirt",
    1899,
    "Airy linen-blend shirt for warm days.",
    "clothing",
    66,
    [],
  ],
  // Watches
  [
    "1523275335684-37898b6baf30",
    "Minimal White Dial Watch",
    3499,
    "Clean white dial on a slim leather strap.",
    "watches",
    90,
    ["featured", "bestseller"],
    "gifting",
  ],
  [
    "1524592094714-0f0654e20314",
    "Chrono Steel Watch",
    6999,
    "Stainless steel chronograph with sub-dials.",
    "watches",
    83,
    ["featured"],
  ],
  [
    "1522312346375-d1a52e2b99b3",
    "Vintage Leather Watch",
    4299,
    "Warm-toned case with a classic brown strap.",
    "watches",
    74,
    ["new"],
    "gifting",
  ],
  [
    "1508685096489-7aacd43bd3b1",
    "Midnight Black Watch",
    5499,
    "All-black case and dial for a bold look.",
    "watches",
    69,
    [],
  ],
  [
    "1612817159949-195b6eb9e31a",
    "Rose Gold Mesh Watch",
    4899,
    "Elegant rose-gold tone with a mesh bracelet.",
    "watches",
    80,
    ["bestseller"],
    "festive",
  ],
  [
    "1547996160-81dfa63595aa",
    "Everyday Sport Watch",
    2999,
    "Lightweight and water-resistant for active days.",
    "watches",
    61,
    ["new"],
    "everyday",
  ],
  // Home
  [
    "1555041469-a586c61ea9bc",
    "Cloud Comfort Sofa",
    34999,
    "Deep-seat three-seater in soft woven fabric.",
    "home",
    71,
    ["featured"],
  ],
  [
    "1513694203232-719a280e022f",
    "Brass Accent Lamp",
    3999,
    "Warm ambient light with a brushed brass finish.",
    "home",
    76,
    ["new"],
  ],
  [
    "1586023492125-27b2c045efd7",
    "Lounge Accent Chair",
    12999,
    "Curved accent chair to complete any corner.",
    "home",
    68,
    [],
  ],
  [
    "1602874801007-bd458bb1b8b6",
    "Soy Wax Scented Candle",
    899,
    "Hand-poured candle with a calming fragrance.",
    "home",
    93,
    ["bestseller"],
    "gifting",
  ],
  [
    "1578500494198-246f612d3b3d",
    "Ceramic Bud Vase",
    1299,
    "Matte ceramic vase for fresh or dried stems.",
    "home",
    73,
    ["new"],
    "festive",
  ],
  [
    "1583847268964-b28dc8f51f92",
    "Woven Throw Cushion",
    1099,
    "Textured cushion cover with a neutral palette.",
    "home",
    65,
    [],
    "everyday",
  ],
  // Accessories
  [
    "1548036328-c9fa89d128fa",
    "Structured Tote Bag",
    3799,
    "Roomy everyday tote in a smooth finish.",
    "accessories",
    87,
    ["featured", "bestseller"],
    "everyday",
  ],
  [
    "1553062407-98eeb64c6a62",
    "Urban Daypack",
    2599,
    "Practical backpack with a padded laptop sleeve.",
    "accessories",
    79,
    [],
  ],
  [
    "1511499767150-a48a237f0083",
    "Classic Sunglasses",
    1599,
    "UV-protective lenses in a timeless frame.",
    "accessories",
    84,
    ["new"],
  ],
  [
    "1590874103328-eac38a683ce7",
    "Mini Crossbody Bag",
    2299,
    "Compact crossbody for the essentials.",
    "accessories",
    75,
    ["new"],
    "festive",
  ],
  [
    "1627123424574-724758594e93",
    "Leather Bifold Wallet",
    1299,
    "Slim bifold with multiple card slots.",
    "accessories",
    82,
    ["bestseller"],
    "gifting",
  ],
  [
    "1584917865442-de89df76afd3",
    "Evening Clutch",
    2899,
    "Sleek clutch for celebrations and dinners.",
    "accessories",
    63,
    ["featured"],
    "festive",
  ],
  // Beauty
  [
    "1556228578-8c89e6adf883",
    "Daily Glow Serum",
    1199,
    "Lightweight serum for a fresh, radiant look.",
    "beauty",
    91,
    ["bestseller", "featured"],
    "everyday",
  ],
  [
    "1571781926291-c477ebfd024b",
    "Hydrating Face Cream",
    999,
    "Rich moisturiser for soft, comfortable skin.",
    "beauty",
    86,
    [],
  ],
  [
    "1608248543803-ba4f8c70ae0b",
    "Botanical Body Oil",
    1399,
    "Nourishing blend of plant-based oils.",
    "beauty",
    67,
    ["new"],
    "gifting",
  ],
  [
    "1612817288484-6f916006741a",
    "Skincare Ritual Set",
    2499,
    "A curated cleanse, tone and moisturise trio.",
    "beauty",
    80,
    ["featured"],
    "gifting",
  ],
  [
    "1596462502278-27bfdc403348",
    "Signature Makeup Kit",
    1899,
    "Everyday essentials in one compact kit.",
    "beauty",
    74,
    ["new"],
    "festive",
  ],
  [
    "1620916566398-39f1143ab7be",
    "Vitamin C Face Wash",
    499,
    "Gentle foaming cleanser for daily use.",
    "beauty",
    88,
    ["bestseller"],
    "everyday",
  ],
];

const SIZES: Partial<Record<CategoryId, string[]>> = {
  clothing: ["XS", "S", "M", "L", "XL"],
};
const RING_SIZES = ["6", "7", "8", "9"];
const COLORS: Record<CategoryId, string[]> = {
  jewellery: ["Gold", "Silver", "Rose Gold"],
  clothing: ["Black", "White", "Beige"],
  watches: ["Black", "Silver", "Brown"],
  home: [],
  accessories: ["Black", "Tan", "Beige"],
  beauty: [],
};
const PREFIX: Record<CategoryId, string> = {
  jewellery: "JWL",
  clothing: "CLO",
  watches: "WAT",
  home: "HOM",
  accessories: "ACC",
  beauty: "BEA",
};

/** The 36 original demo products, enriched with demo stock/SKU/variant data. */
export const products: Product[] = seeds.map(
  ([id, name, price, description, category, popularity, tags, collection], i) => ({
    id: `p${i + 1}`,
    name,
    price,
    description,
    category,
    images: gallery(id),
    popularity,
    tags,
    collection,
    sku: `${PREFIX[category]}-${String(i + 1).padStart(3, "0")}`,
    // Deterministic demo stock; a few items are low or out of stock to exercise the UI.
    stock: i % 11 === 5 ? 0 : i % 7 === 3 ? 3 : 10 + ((i * 7) % 25),
    originalPrice: i % 4 === 0 ? Math.round((price * 1.25) / 100) * 100 - 1 : undefined,
    sizes: name.includes("Ring") ? RING_SIZES : (SIZES[category] ?? []),
    colors: COLORS[category],
    active: true,
    featured: tags.includes("featured"),
    createdAt: tags.includes("new") ? 1000 + i : i,
  }),
);

export const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;
