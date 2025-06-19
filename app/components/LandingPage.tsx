"use client";

import React from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  InlineStack,
  Banner,
  List,
  Icon,
  BlockStack,
  Box,
  Link,
} from "@shopify/polaris";
import { SearchIcon, ProductIcon, MobileIcon } from "@shopify/polaris-icons";

const LandingPage = () => {
  return (
    <Page fullWidth>
      {/* Hero Section */}
      <Layout.Section>
        <div
          style={{
            background: "linear-gradient(135deg, #ea262d 0%, #e41d24 100%)",
            color: "white",
            padding: "5rem 2rem",
            textAlign: "center",
            borderRadius: " 8px ",
          }}
        >
          <BlockStack gap="400" align="center">
            <Text as="h1" variant="headingXl" fontWeight="bold">
              Eparts master
            </Text>
            <Text as="p" variant="headingLg">
              Supercharge your Shopify store with advanced vehicle-based product
              search
            </Text>
            <InlineStack align="center" gap="400">
              <Button variant="primary" size="large">
                Get Started
              </Button>
              <Button size="large">View Demo</Button>
            </InlineStack>
          </BlockStack>
        </div>
      </Layout.Section>

      {/* Value Proposition */}
      <Layout.Section>
        <Layout>
          <Layout.Section>
            <Card padding="400">
              <BlockStack gap="400">
                <Text as="h2" variant="headingXl" fontWeight="bold">
                  Precision Product Discovery
                </Text>
                <Text as="p" variant="bodyLg">
                  Reduce returns and improve conversions by helping customers
                  find exactly what fits their vehicle.
                </Text>
                <List type="bullet">
                  <List.Item>Year/Make/Model filtering</List.Item>
                  <List.Item>Lightning-fast search</List.Item>
                  <List.Item>Mobile-optimized experience</List.Item>
                  <List.Item>Easy setup with metafields or tags</List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Layout.Section>

      {/* Features */}
      <Layout.Section>
        <Box paddingBlockEnd="400">
          <Text as="h2" variant="headingXl" fontWeight="bold">
            Key Features
          </Text>
        </Box>
        <Layout>
          <Layout.Section variant="oneThird">
            <Card padding="400">
              <BlockStack gap="300">
                <Icon source={SearchIcon} tone="textCritical" />
                <Text as="h3" variant="headingLg" fontWeight="semibold">
                  Intuitive Search
                </Text>
                <Text as="p" variant="bodyMd">
                  Customers can filter by Year, Make, and Model with dropdown
                  selectors that work on any device.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card padding="400">
              <BlockStack gap="300">
                <Icon source={ProductIcon} tone="textCritical" />
                <Text as="h3" variant="headingLg" fontWeight="semibold">
                  Flexible Compatibility
                </Text>
                <Text as="p" variant="bodyMd">
                  Map products to vehicles using Shopify metafields or tags -
                  whichever works best for your workflow.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card padding="400">
              <BlockStack gap="300">
                <Icon source={MobileIcon} tone="textCritical" />
                <Text as="h3" variant="headingLg" fontWeight="semibold">
                  Mobile Optimized
                </Text>
                <Text as="p" variant="bodyMd">
                  Responsive design ensures perfect experience on all devices
                  using Shopify Polaris components.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Layout.Section>

      {/* Use Cases */}
      <Layout.Section>
        <Box paddingBlockEnd="400">
          <Text as="h2" variant="headingXl" fontWeight="bold">
            Perfect For
          </Text>
        </Box>
        <Layout>
          <Layout.Section variant="oneHalf">
            <Banner title="Automotive Parts Stores" tone="critical">
              <List type="bullet">
                <List.Item>Brake pads and rotors</List.Item>
                <List.Item>Filters and fluids</List.Item>
                <List.Item>Suspension components</List.Item>
              </List>
            </Banner>
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <Banner title="Vehicle Accessories" tone="critical">
              <List type="bullet">
                <List.Item>Floor mats and seat covers</List.Item>
                <List.Item>Tonneau covers and racks</List.Item>
                <List.Item>Lighting and appearance items</List.Item>
              </List>
            </Banner>
          </Layout.Section>
        </Layout>
      </Layout.Section>

      {/* CTA */}
      <Layout.Section>
        <Card padding="400">
          <BlockStack gap="400" align="center">
            <Text
              as="h2"
              variant="headingXl"
              fontWeight="bold"
              alignment="center"
            >
              Ready to transform your product search?
            </Text>
            <InlineStack align="center" gap="400">
              <Link url="/database">
                <Button variant="primary" size="large">
                  Eparts master
                </Button>
              </Link>
            </InlineStack>
            {/* <Text as="p" variant="bodyMd" tone="subdued">
              14-day free trial · No coding required
            </Text> */}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Page>
  );
};

export default LandingPage;
