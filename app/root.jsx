import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  json,
} from "@remix-run/react";

import { AppProvider } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import { authenticate } from "./shopify.server";

import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from "@shopify/polaris/locales/en.json";

export function links() {
  return [{ rel: "stylesheet", href: polarisStyles }];
}

export const loader = async ({ request }) => {
  const { apiKey, headers } = await authenticate.admin(request);
  return json({ apiKey }, { headers });
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppBridgeProvider
          config={{
            apiKey,
            shopOrigin: window.location.hostname,
            forceRedirect: true,
          }}
        >
          <AppProvider i18n={enTranslations}>
            <Outlet />
          </AppProvider>
        </AppBridgeProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
