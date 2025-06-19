'use client';

import { Page, Card, Text, Layout, Button } from '@shopify/polaris';

export default function NewPage() {
  return (
    <Page title="New Page">
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">
              Welcome to the new page
            </Text>
            <Text as="p">
              This is a dummy page created using Shopify Polaris components.
            </Text>
            <Button onClick={() => alert('Button clicked')}>Click me</Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

