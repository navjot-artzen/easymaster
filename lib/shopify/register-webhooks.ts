import { DeliveryMethod, Session } from "@shopify/shopify-api";
import { setupGDPRWebHooks } from "../../helpers/gdpr";
import shopify from "./initialize-context";
import { AppInstallations } from "../db/app-installations";

let webhooksInitialized = false;

export function addHandlers() {
  if (!webhooksInitialized) {
    setupGDPRWebHooks("/api/webhooks");
    shopify.webhooks.addHandlers({
      ['APP_UNINSTALLED']: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks",
        callback: async (_topic, shop, _body) => {
          console.log("Uninstalled app from shop: " + shop);
          await AppInstallations.delete(shop);
        },
      },
    });
    webhooksInitialized = true;

    console.log("Added webhook");
  } else {
    console.log("Handlers already added");
  }
}

export async function registerWebhooks(session: Session) {
  console.log("regiter webhook by session", session);
  addHandlers();
  const responses = await shopify.webhooks.register({ session });
  console.log("Webhooks added", responses);
}