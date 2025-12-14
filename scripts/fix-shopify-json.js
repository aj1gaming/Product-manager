const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "../node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProvider/AppProvider.mjs"
);

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, "utf-8");

  // Remove 'with { type: 'json' }' from the import
  content = content.replace(/\s+with\s+\{\s*type:\s*'json'\s*\}\s*;/, ";");

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Fixed AppProvider.mjs successfully!");
} else {
  console.warn("AppProvider.mjs not found. Skipping patch.");
}
