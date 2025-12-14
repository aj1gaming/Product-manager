import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page fullWidth>
      <TitleBar title="Smitten Product Manager" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  Welcome to the Smitten Product Manager. This dashboard helps you manage
                  product availability, pre-orders, coming soon launches, and customer notifications —
                  all in one place. Use the tools below to get started.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Launch Manager
                  </Text>
                  <Text as="p" variant="bodyMd">
                    View and update product statuses, shipping dates, and notification settings.
                  </Text>
                  <Button url="/launch-manager" variant="primary">
                    Go to Launch Manager
                  </Button>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Best sellers
                  </Text>
                  <Text as="p" variant="bodyMd">
                    View and manage the best sellers list.
                  </Text>
                  <Button url="/best-sellers" variant="primary">
                    Go to Best sellers
                  </Button>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Comments
                  </Text>
                  <Text as="p" variant="bodyMd">
                    View and manage customer comments.
                  </Text>
                  <Button url="/comments" variant="primary">
                    Go to comments
                  </Button>
                </BlockStack>
              </Card>              
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
