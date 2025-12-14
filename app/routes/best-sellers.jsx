import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Image,
  Grid,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 100) {
        edges {
          node {
            id
            title
            totalInventory
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

  const data = await response.json();
  const rawProducts = data?.data?.products?.edges?.map(edge => edge.node) || [];

  const filtered = rawProducts.filter(product =>
    product.tags.includes("track-bestsellers")
  );

  const sorted = filtered
    .sort((a, b) => {
      const aScore = parseFloat(
        a.metafields?.edges?.find(m => m.node.key === "bestseller_score")?.node.value || "0"
      );
      const bScore = parseFloat(
        b.metafields?.edges?.find(m => m.node.key === "bestseller_score")?.node.value || "0"
      );
      return bScore - aScore;
    })
    .slice(0, 10); // top 10 only

  return json({ products: sorted });
};

export default function BestSellersPage() {
  const { products } = useLoaderData();

  return (
    <Page title="Best Sellers">
      {products.length === 0 ? (
        <Text as="p" variant="bodyMd">There are no tracked bestsellers yet.</Text>
      ) : (
        <Grid columns={{ xs: 1, sm: 2, md: 3, lg: 5 }} spacing="400">
          {products.map((product, index) => {
            const crown = index === 0
              ? "👑"
              : index === 1
              ? "🥈"
              : index === 2
              ? "🥉"
              : null;

            const isLowStock = product.totalInventory < 25;

            return (
              <div key={product.id} style={{ position: "relative" }}>
                {crown && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: "28px",
                      transform: "rotate(40deg)",
                      zIndex: 1,
                    }}
                  >
                    {crown}
                  </div>
                )}
                <Card
                  padding="400"
                  style={{
                    maxHeight: "250px",
                    height: "250px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {product.featuredImage?.url && (
                      <div
                        style={{
                          height: "150px",
                          overflow: "hidden",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <img
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText || product.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    )}
                    <Text fontWeight="semibold" as="h3">
                      {`${index + 1}. ${product.title}`}
                    </Text>
                  </div>
                  <Text as="span" variant="bodySm">
                    Inventory: {product.totalInventory}
                    {isLowStock && (
                      <span style={{ marginLeft: "6px", fontWeight: "bold" }}>
                        (Low stock)
                      </span>
                    )}
                  </Text>
                </Card>
              </div>
            );
          })}
        </Grid>
      )}
    </Page>
  );
}
