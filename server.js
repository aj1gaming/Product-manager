import express from "express";
import { createRequestHandler } from "@remix-run/express";
import shopify from "./shopify.server"; // adjust path if needed

const app = express();

// Shopify authentication middleware
app.use(shopify.authenticate);

// Serve Remix app
app.all(
  "*",
  createRequestHandler({
    getLoadContext() {
      return { shopify };
    },
  })
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
