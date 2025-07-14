export const GET_PRODUCTS_QUERY = `
  query GetProducts {
    products(first: 30) {
      edges {
        node {
          id
          title
          descriptionHtml
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
              }
            }
          }
        }
      }
    }
}
`;

export const PRODUCTS_BY_HANDLE_QUERY = `
query GetProductByHandle($handle: String!) {
  productByHandle(handle: $handle) {
    id
    title
    description
    handle
    vendor
    tags
    images(first: 5) {
      edges {
        node {
          originalSrc
          altText
        }
      }
    }
    variants(first: 10) {
      edges {
        node {
          id
          title
          price {
            amount
            currencyCode
          }
          availableForSale
        }
      }
    }
  }
}
`;

export const PRODUCT_UPDATE_MUTATION=`mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      tags
    }
    userErrors {
      field
      message
    }
  }
}`

export const QUERY_PRODUCTS_BY_TAGS = `
  query ProductsByTags($query: String!) {
    products(first: 10, query: $query) {
      edges {
        node {
          id
          title
          tags
        }
      }
    }
  }
`;


