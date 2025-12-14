// File: app/routes/comments.jsx

import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Avatar,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import "@shopify/polaris/build/esm/styles.css";

// Action: Handle delete
export const action = async ({ request }) => {
  const formData = await request.formData();
  const commentId = formData.get("commentId");

  if (commentId) {
    await prisma.ProductComment.delete({
      where: { id: commentId },
    });
  }

  return redirect("/comments");
};

// Loader: Fetch comments, products, and customer info
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const comments = await prisma.ProductComment.findMany({
    orderBy: { createdAt: "desc" },
  });

  console.log("📩 Emails from comments:");
  console.log(comments.map(c => c.email));

  const productIds = [...new Set(comments.map((c) => c.productId))];
  const customerEmails = [
    ...new Set(comments.map((c) => c.email?.toLowerCase().trim()).filter(Boolean)),
  ];

  console.log("🧹 Normalized emails used in Shopify customer query:");
  console.log(customerEmails);

  const productRes = await admin.graphql(`{
    nodes(ids: [${productIds.map(id => `"gid://shopify/Product/${id}"`).join(",")}]) {
      ... on Product {
        id
        title
      }
    }
  }`);
  const productData = await productRes.json();

  const productMap = {};
  for (const product of productData.data.nodes) {
    if (product) {
      const numericId = product.id.split("/").pop();
      productMap[numericId] = product.title;
    }
  }

  // Map customer info by matching email (no special scopes needed)
  let customerMap = {};
  if (customerEmails.length) {
    const customerChunks = [];
    for (let i = 0; i < customerEmails.length; i += 10) {
      const chunk = customerEmails.slice(i, i + 10);
      customerChunks.push(`(${chunk.map(email => `email:${email}`).join(" OR ")})`);
    }

    const allCustomers = {};
    for (const queryChunk of customerChunks) {
      const customerRes = await admin.graphql(`{
        customers(first: 100, query: "${queryChunk}") {
          edges {
            node {
              id
              firstName
              lastName
              email
            }
          }
        }
      }`);
      const customerData = await customerRes.json();

      for (const edge of customerData.data.customers.edges) {
        const node = edge.node;
        console.log("👤 Shopify Customer Found:", {
          email: node.email,
          firstName: node.firstName,
          lastName: node.lastName,
        });

        allCustomers[node.email.toLowerCase().trim()] = {
          firstName: node.firstName,
          lastName: node.lastName,
          email: node.email,
        };
      }
    }

    customerMap = allCustomers;
  }

  return json({ comments, productMap, customerMap });
};

// Page
export default function CommentsPage() {
  const { comments, productMap, customerMap } = useLoaderData();

  return (
    <Page title="Pre-order Comments">
      <BlockStack gap="400">
        {comments.map((comment) => {
          const productTitle = productMap[comment.productId] || "Unknown Product";
          const normalizedEmail = comment.email?.toLowerCase().trim();
          const customerData = customerMap[normalizedEmail] || null;

          const firstName = customerData?.firstName || "";
          const lastName = customerData?.lastName || "";
          const shopifyFullName = `${firstName} ${lastName}`.trim();

          const fallbackName = comment.name?.trim() || "";
          const displayName =
            shopifyFullName || fallbackName || comment.email || "Guest";

          const displayEmail = customerData?.email || comment.email || "No email";

          console.log("🧾 Comment:", comment.email, "→", displayName);

          return (
            <Card key={comment.id} sectioned>
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="start">
                  <Text variant="headingSm">{productTitle}</Text>
                  <Form method="post">
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: "#e00000",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </Form>
                </InlineStack>

                <Text>{comment.text}</Text>

                <InlineStack align="start" gap="200">
                  <Avatar customer name={displayName} />
                  <BlockStack gap="0">
                    <Text fontWeight="semibold">{displayName}</Text>
                    <Badge>{displayEmail}</Badge>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          );
        })}
      </BlockStack>
    </Page>
  );
}
