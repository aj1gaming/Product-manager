import { useFetcher, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import {
  Page,
  TextField,
  Card,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Badge,
  Banner,
  Image,
} from "@shopify/polaris";
import React, { useState, useEffect } from "react";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 100) {
        edges {
          node {
            id
            title
            tags
            featuredImage {
              url
              altText
            }
            metafields(first: 10, namespace: "custom") {
              edges {
                node {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `);
  const products = await response.json();

  return json({
    products: products.data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      tags: node.tags,
      image: node.featuredImage,
      metafields: node.metafields.edges.reduce((acc, { node }) => {
        acc[node.key] = node.value;
        return acc;
      }, {}),
    })),
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const productId = formData.get("productId");
  const actionType = formData.get("actionType");
  const dateValue = formData.get("dateValue");
  const isPreOrder = formData.get("isPreOrder") === "true";

  if (!productId || (!actionType && dateValue === null)) {
    return json({ error: "Missing productId or action type/date" }, { status: 400 });
  }

  const { admin } = await authenticate.admin(request);

  if (actionType) {
    const tagUpdates = {
      "set-coming-soon": ["coming-soon"],
      "set-pre-order": ["pre-order"],
      "set-now-shipping": [],
    };

    const removeTags = {
      "set-coming-soon": "pre-order",
      "set-pre-order": "coming-soon",
      "set-now-shipping": "pre-order,coming-soon",
    };

    const tagsToAdd = tagUpdates[actionType];
    const tagsToRemove = removeTags[actionType]
      ? removeTags[actionType].split(",")
      : [];

    const productResponse = await admin.graphql(`
      {
        product(id: "${productId}") {
          tags
        }
      }
    `);

    const currentTags = await productResponse.json();
    let updatedTags = currentTags.data.product.tags || [];

    updatedTags = updatedTags.filter(tag => !tagsToRemove.includes(tag));
    for (const tag of tagsToAdd) {
      if (!updatedTags.includes(tag)) {
        updatedTags.push(tag);
      }
    }

    await admin.graphql(`
      mutation {
        productUpdate(input: {
          id: "${productId}",
          tags: ${JSON.stringify(updatedTags)}
        }) {
          product { id }
          userErrors { field message }
        }
      }
    `);
  }

  if (dateValue !== null) {
    const key = isPreOrder ? "estimated_ship_date" : "preorder_estimate";

    if (dateValue.trim() === "") {
      return json(
        { error: "Cannot clear date here. Use the Shopify product admin to remove it." },
        { status: 400 }
      );
    }

    await admin.graphql(`
      mutation {
        metafieldsSet(metafields: [{
          ownerId: "${productId}",
          namespace: "custom",
          key: "${key}",
          type: "single_line_text_field",
          value: "${dateValue}"
        }]) {
          metafields { id }
        }
      }
    `);
  }

  return null;
};

function ProductCard({ product }) {
  const fetcher = useFetcher();
  const isPreOrder = product.tags.includes("pre-order");
  const isComingSoon = product.tags.includes("coming-soon");
  const fieldKey = isPreOrder
    ? "estimated_ship_date"
    : isComingSoon
    ? "preorder_estimate"
    : null;
  const [localDate, setLocalDate] = useState(product.metafields[fieldKey] || "");

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "320px",
        boxSizing: "border-box",
        border: "1px solid #DCDCDC",
        borderRadius: "12px",
        padding: "16px",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "300px",
      }}
    >
      <BlockStack gap="200">
        {product.image && (
          <Image
            source={product.image.url}
            alt={product.image.altText || product.title}
            style={{ width: "100%", borderRadius: "8px" }}
          />
        )}
        <Text variant="headingMd" fontWeight="semibold">
          {product.title.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </Text>
        <InlineStack gap="100">
          {isPreOrder && <Badge tone="info">Pre-order</Badge>}
          {isComingSoon && <Badge tone="attention">Coming Soon</Badge>}
        </InlineStack>

        <fetcher.Form method="POST">
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" id={`actionType-${product.id}`} name="actionType" value="" />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "8px" }}>
            {!isPreOrder && (
              <Button
                variant="primary"
                onClick={() =>
                  (document.getElementById(`actionType-${product.id}`).value = "set-pre-order")
                }
                submit
              >
                Set as Pre-order
              </Button>
            )}

            {!isComingSoon && !isPreOrder && (
              <Button
                variant="primary"
                onClick={() =>
                  (document.getElementById(`actionType-${product.id}`).value = "set-coming-soon")
                }
                submit
              >
                Set as Coming Soon
              </Button>
            )}

            {(isPreOrder || isComingSoon) && (
              <Button
                variant="primary"
                onClick={() =>
                  (document.getElementById(`actionType-${product.id}`).value = "set-now-shipping")
                }
                submit
              >
                Now Shipping
              </Button>
            )}
          </div>
        </fetcher.Form>

        {(isPreOrder || isComingSoon) && (
          <fetcher.Form
            method="POST"
            onSubmit={(e) => {
              if (localDate.trim() === "") {
                e.preventDefault();
                alert("Cannot clear date here. Use the Shopify product admin to remove it.");
              }
            }}
          >
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="isPreOrder" value={isPreOrder} />
            <TextField
              label={
                isPreOrder
                  ? "Estimated Shipping Date"
                  : "Pre-order Availability Date"
              }
              name="dateValue"
              value={localDate}
              onChange={(val) => setLocalDate(val)}
              autoComplete="on"
            />
            <div style={{ paddingTop: "8px" }}>
              <Button variant="primary" submit>
                Save
              </Button>
            </div>
          </fetcher.Form>
        )}
      </BlockStack>
    </div>
  );
}

export default function ProductManager() {
  const { products } = useLoaderData();
  const [search, setSearch] = useState("");
  const [globalError, setGlobalError] = useState(null);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {
    "pre-order": [],
    "coming-soon": [],
    none: [],
  };

  for (const product of filtered) {
    if (product.tags.includes("pre-order")) grouped["pre-order"].push(product);
    else if (product.tags.includes("coming-soon")) grouped["coming-soon"].push(product);
    else grouped.none.push(product);
  }

  return (
    <Page title="Launch Manager">
      <div style={{ maxWidth: "1288px", margin: "0 auto" }}>
        {globalError && (
          <Banner title="Error" status="critical" onDismiss={() => setGlobalError(null)}>
            <p>{globalError}</p>
          </Banner>
        )}
        <div style={{ paddingBottom: "32px" }}>
          <TextField
            label="Search Products"
            value={search}
            onChange={setSearch}
            autoComplete="off"
          />
        </div>
        <BlockStack gap="500">
          {Object.entries(grouped).map(([label, list]) => (
            list.length > 0 && (
              <div key={label}>
                <Text
                  variant="headingLg"
                  fontWeight="semibold"
                  style={{
                    borderBottom: "2px solid #ccc",
                    paddingBottom: "6px",
                    paddingLeft: "4px",
                    marginBottom: "12px",
                    width: "fit-content",
                  }}
                >
                  {label === "none"
                    ? "Other Products"
                    : label.replace(/\b\w/g, (l) => l.toUpperCase()).replace("-", " ")}
                </Text>
                <div
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #E1E3E5",
                    borderRadius: "10px",
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "24px",
                      width: "100%",
                    }}
                  >
                    {list.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </div>
            )
          ))}
        </BlockStack>
      </div>
    </Page>
  );
}
