import prisma from "@/lib/prisma";

const appUninstallHandler = async (
  topic: string,
  shop: string,
  webhookRequestBody: string
): Promise<void> => {
  try {
    const webhookBody :any = JSON.parse(webhookRequestBody);
    console.log("🧹 App Uninstalled:", topic, shop);

    await prisma.session.deleteMany({
      where: { shop },
    });
  } catch (e) {
    console.error("App Uninstall Webhook Error:", e);
  }
};

export default appUninstallHandler;
