import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(distDir, "assets");

if (!fs.existsSync(distDir)) {
  console.error("Error: dist directory does not exist.");
  process.exit(1);
}

// Find main CSS and JS entry points in dist/assets
let mainCss = "";
let mainJs = "";

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const cssFile =
    files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) ||
    files.find((f) => f.endsWith(".css"));
  const jsFile =
    files.find((f) => f.startsWith("index-") && f.endsWith(".js")) ||
    files.find((f) => f.endsWith(".js"));

  if (cssFile) mainCss = `/assets/${cssFile}`;
  if (jsFile) mainJs = `/assets/${jsFile}`;
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>The Vijay Store</title>
    <meta name="description" content="Premium jewellery, fashion, watches and lifestyle e-commerce store with admin catalog, cart, wishlist, and order management." />
    <meta property="og:title" content="The Vijay Store" />
    <meta property="og:description" content="Premium jewellery, fashion, watches and lifestyle e-commerce store with admin catalog, cart, wishlist, and order management." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500;600&display=swap" />
    ${mainCss ? `<link rel="stylesheet" href="${mainCss}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    ${mainJs ? `<script type="module" src="${mainJs}"></script>` : ""}
  </body>
</html>
`;

// Write index.html and 404.html to dist/
fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf8");
fs.writeFileSync(path.join(distDir, "404.html"), htmlContent, "utf8");
console.log("Successfully generated dist/index.html and dist/404.html");

// Also synchronize to .output/public for completeness
const outputPublic = path.join(rootDir, ".output", "public");
try {
  if (fs.existsSync(outputPublic)) {
    fs.writeFileSync(path.join(outputPublic, "index.html"), htmlContent, "utf8");
    fs.writeFileSync(path.join(outputPublic, "404.html"), htmlContent, "utf8");
  }
} catch (e) {
  // non-fatal
}
