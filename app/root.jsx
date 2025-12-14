import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { AppProvider } from "@shopify/shopify-app-remix/react";
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
        <AppProvider
          apiKey={apiKey}
          isEmbeddedApp
          i18n={enTranslations}
        >
          <Outlet />
        </AppProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
