export const getProductByHandle = async (
    shop: string,
    accessToken: string,
    handles: string
  ) => {
    try {
      const query = generateMultiHandleQuery(handles.split(','));
      console.log(query,"query")
  
      const response = await fetch(`https://${shop}/admin/api/2025-07/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query }), // No variables needed
      });
  
      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`);
      }
  
      const json = await response.json();
  
      if (json.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
      }
  
      const data = json.data;
      console.log(JSON.stringify(data))
      const products = Object.values(data).map((p: any) => ({
        title: p?.title,
        gid: p?.id,
        legacyResourceId: p?.legacyResourceId,
      }));
  
      return products;
  
    } catch (error) {
      console.error("Error fetching products by handle:", error);
      throw error;
    }
  };
  
  // 🔧 Helper to generate the query
  const generateMultiHandleQuery = (handles: string[]) => {
    return `
      query GetMultipleProducts {
        ${handles
          .map(
            (handle, index) => `
            p${index + 1}: productByHandle(handle: "${handle}") {
              id
              title
              description
              handle
              vendor
              tags
              legacyResourceId
            }
          `
          )
          .join("\n")}
      }
    `;
  };
  