"use server";
import { registerWebhooks } from "@/lib/shopify/register-webhooks";
import {
  handleSessionToke,
  handleSessionToken,
  tokenExchange,
  verifyAuth,
} from "@/lib/shopify/verify";

export async function checkSession(shop: string) {
  try {
    await verifyAuth(shop);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function doServerAction(sessionIdToken: string): Promise<{
  status: "success" | "error";
  data?: {
    shop: string;
  };
}> {
  try {
    const {
      session: { shop },
    } = await handleSessionToke(sessionIdToken);
    return {
      
      status: "success",
      data: {
        shop,
      },

    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
    };
  }
}

export async function doTokenExchange(
  shop: string,
  sessionToken: string,
  online?: boolean,
) {
  return tokenExchange(shop, sessionToken, online);
}
export async function storeToken(sessionToken: string) {
  await handleSessionToke(sessionToken, false);
}
export async function doWebhookRegistration(sessionToken: string) {
  if(sessionToken){
  const { session } = await handleSessionToke(sessionToken);
  await registerWebhooks(session);

  }else{
    console.log("sessionToken is not coming")
  }
}