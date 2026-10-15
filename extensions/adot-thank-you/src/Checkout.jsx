import React from 'react';
import {
  reactExtension,
  useOrder,
  useShippingAddress,
  BlockStack,
  InlineLayout,
  Text,
  Heading,
  Divider,
  Banner,
  Button,
  View
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.thank-you.block.render', () => <App />);

function App() {
  const order = useOrder();
  const address = useShippingAddress();

  const waNumber = '923706735800';
  const orderName = order?.name || 'ADOT Order';
  const orderTotal = order?.totalPrice?.amount
    ? `Rs. ${Math.round(order.totalPrice.amount).toLocaleString()}`
    : 'Rs. 3,450';

  const waMessage = encodeURIComponent(
    `Hi ADOT, I have placed order ${orderName} (${orderTotal}). Here is my payment receipt screenshot:`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <BlockStack spacing="base" border="base" padding="loose" background="subdued" cornerRadius="none">
      
      {/* Editorial Header */}
      <InlineLayout columns={['auto', 'fill']} spacing="base" blockAlignment="center">
        <View minInlineSize="8px" minBlockSize="8px" background="success" cornerRadius="full" />
        <Text size="small" appearance="subdued">
          PAYMENT VERIFICATION // ACTION REQUIRED
        </Text>
      </InlineLayout>

      <Heading level={2}>
        {address?.name ? `Thank you, ${address.name.split(' ')[0]}.` : 'Order Placed.'}
      </Heading>

      <Text size="base">
        Please transfer <strong>{orderTotal}</strong> to our official Allied Bank account below to initiate immediate atelier dispatch.
      </Text>

      <Divider />

      {/* 4-Stage Tracker */}
      <BlockStack spacing="tight">
        <Text size="small" appearance="subdued">
          LOGISTICS JOURNEY
        </Text>
        <InlineLayout columns={['fill', 'fill', 'fill', 'fill']} spacing="extraTight">
          <BlockStack spacing="none" alignment="center">
            <Text size="small" emphasis="bold">01 Placed</Text>
            <Text size="extraSmall" appearance="subdued">Done</Text>
          </BlockStack>
          <BlockStack spacing="none" alignment="center">
            <Text size="small" emphasis="bold">02 Verify</Text>
            <Text size="extraSmall" appearance="subdued">WhatsApp</Text>
          </BlockStack>
          <BlockStack spacing="none" alignment="center">
            <Text size="small" emphasis="bold">03 Atelier</Text>
            <Text size="extraSmall" appearance="subdued">Packing</Text>
          </BlockStack>
          <BlockStack spacing="none" alignment="center">
            <Text size="small" emphasis="bold">04 Courier</Text>
            <Text size="extraSmall" appearance="subdued">3-4 Days</Text>
          </BlockStack>
        </InlineLayout>
      </BlockStack>

      <Divider />

      {/* Bank Account Details */}
      <BlockStack spacing="tight">
        <InlineLayout columns={['110px', 'fill']} spacing="base">
          <Text size="small" appearance="subdued">Bank Name</Text>
          <Text size="base" emphasis="bold">Allied Bank</Text>
        </InlineLayout>

        <InlineLayout columns={['110px', 'fill']} spacing="base">
          <Text size="small" appearance="subdued">Account Title</Text>
          <Text size="base" emphasis="bold">Muhammad Talha Shahzad</Text>
        </InlineLayout>

        <InlineLayout columns={['110px', 'fill']} spacing="base">
          <Text size="small" appearance="subdued">Account No.</Text>
          <Text size="base" emphasis="bold">08870010159734540017</Text>
        </InlineLayout>

        <InlineLayout columns={['110px', 'fill']} spacing="base">
          <Text size="small" appearance="subdued">IBAN</Text>
          <Text size="base" emphasis="bold">PK74ABPA0010159734540017</Text>
        </InlineLayout>

        <InlineLayout columns={['110px', 'fill']} spacing="base">
          <Text size="small" appearance="subdued">Reference</Text>
          <Text size="base" emphasis="bold">{orderName}</Text>
        </InlineLayout>
      </BlockStack>

      <Divider />

      {/* WhatsApp Action */}
      <BlockStack spacing="base">
        <Button
          kind="primary"
          appearance="monochrome"
          to={waUrl}
          external
        >
          Send Payment Screenshot on WhatsApp
        </Button>

        <Text size="extraSmall" appearance="subdued" alignment="center">
          Clicking directly opens WhatsApp with your order details pre-filled.
        </Text>
      </BlockStack>

    </BlockStack>
  );
}
