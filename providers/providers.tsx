"use client";

import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
// import ApolloProvider from "./ApolloProvider";
import SessionProvider from "./SessionProvider";
import Link from "next/link";
import { TanstackProvider } from "./TanstackProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={translations}>
      {/* <ApolloProvider> */}
      <TanstackProvider>
        <ui-nav-menu>
          <Link href="/" rel="home">
            Home
          </Link>
          <Link href="/database">Product Database</Link>
          <Link href="/search-by-parts">SearchByParts</Link>
          <Link href="/search-by-vin">SearchByVin</Link>

          {/* <Link href="/csv-import">CSV Import</Link> */}
        </ui-nav-menu>
        <SessionProvider>{children}</SessionProvider>
      </TanstackProvider>
      {/* </ApolloProvider> */}
    </AppProvider>
  );
}

export function ExitProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider i18n={translations}>{children}</AppProvider>;
}
