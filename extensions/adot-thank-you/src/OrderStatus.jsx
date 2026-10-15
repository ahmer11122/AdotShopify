import React, { useState } from 'react';
import {
  reactExtension,
  useOrder,
  BlockStack,
  InlineLayout,
  InlineStack,
  Text,
  Heading,
  Divider,
  Button,
  View
} from '@shopify/ui-extensions-react/customer-account';

export default reactExtension('customer-account.order-status.block.render', () => <OrderStatusApp />);

function OrderStatusApp() {
  const order = useOrder();
  const [copiedKey, setCopiedKey] = useState(null);

  const waNumber = '923706735800';
  const orderName = order?.name || 'ADOT Order';
  const orderTotal = order?.totalPrice?.amount
    ? `Rs. ${Math.round(order.totalPrice.amount).toLocaleString()}`
    : 'Rs. 3,450';

  const waMessage = encodeURIComponent(
    `Hi ADOT, I have placed order ${orderName} (${orderTotal}). Here is my payment receipt screenshot:`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  const copyToClipboard = (text, key) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (e) {}
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 1500);
  };

  return (
    <BlockStack spacing="loose" border="base" padding="loose" background="subdued" cornerRadius="none">
      
      {/* Editorial Header */}
      <InlineStack spacing="tight" blockAlignment="center">
        <View minInlineSize="8px" minBlockSize="8px" background="success" cornerRadius="full" />
        <Text size="extraSmall" appearance="subdued" emphasis="bold">
          PAYMENT VERIFICATION REQUIRED
        </Text>
      </InlineStack>

      <BlockStack spacing="extraTight">
        <Heading level={2}>
          Payment Pending for {orderName}
        </Heading>
        <Text size="base">
          Please transfer <Text size="base" emphasis="bold">{orderTotal}</Text> using any account below. Tap <Text size="small" emphasis="bold">COPY</Text> to paste into your banking app, then tap the WhatsApp button below to submit your receipt.
        </Text>
      </BlockStack>

      <Divider />

      {/* 4-Stage Logistics Journey */}
      <BlockStack spacing="tight">
        <Text size="extraSmall" appearance="subdued" emphasis="bold">
          ORDER JOURNEY
        </Text>
        <InlineLayout columns={['fill', 'fill', 'fill', 'fill']} spacing="extraTight">
          <BlockStack spacing="none" alignment="center">
            <Text size="extraSmall" emphasis="bold">01 PLACED</Text>
            <Text size="extraSmall" appearance="subdued">Recorded</Text>
          </BlockStack>
          <BlockStack spacing="none" alignment="center">
            <Text size="extraSmall" emphasis="bold">02 VERIFY</Text>
            <Text size="extraSmall" appearance="success">WhatsApp</Text>
          </BlockStack>
          <BlockStack spacing="none" alignment="center">
            <Text size="extraSmall" emphasis="bold">03 ATELIER</Text>
            <Text size="extraSmall" appearance="subdued">Packing</Text>
          </BlockStack>
          <BlockStack spacing="none" alignment="center">
            <Text size="extraSmall" emphasis="bold">04 COURIER</Text>
            <Text size="extraSmall" appearance="subdued">3-4 Days</Text>
          </BlockStack>
        </InlineLayout>
      </BlockStack>

      <Divider />

      {/* Option 1: Allied Bank */}
      <BlockStack spacing="base" border="base" padding="base" cornerRadius="none" background="base">
        <InlineLayout columns={['fill', 'auto']} spacing="base" blockAlignment="center">
          <Text size="small" emphasis="bold">01 // ALLIED BANK (RAAST / DIRECT)</Text>
          <Text size="extraSmall" appearance="subdued">Instant Verification</Text>
        </InlineLayout>

        {/* Account Title */}
        <InlineLayout columns={['fill', 'auto']} spacing="tight" blockAlignment="center">
          <BlockStack spacing="none">
            <Text size="extraSmall" appearance="subdued">ACCOUNT TITLE</Text>
            <Text size="small" emphasis="bold">Muhammad Talha Shahzad</Text>
          </BlockStack>
          <Button
            size="small"
            kind="secondary"
            accessibilityLabel="Copy account title"
            onPress={() => copyToClipboard('Muhammad Talha Shahzad', 'allied_title')}
          >
            {copiedKey === 'allied_title' ? 'COPIED ✓' : 'COPY'}
          </Button>
        </InlineLayout>

        {/* Account Number */}
        <InlineLayout columns={['fill', 'auto']} spacing="tight" blockAlignment="center">
          <BlockStack spacing="none">
            <Text size="extraSmall" appearance="subdued">ACCOUNT NUMBER</Text>
            <Text size="small" emphasis="bold">08870010159734540017</Text>
          </BlockStack>
          <Button
            size="small"
            kind="secondary"
            accessibilityLabel="Copy account number"
            onPress={() => copyToClipboard('08870010159734540017', 'allied_acc')}
          >
            {copiedKey === 'allied_acc' ? 'COPIED ✓' : 'COPY'}
          </Button>
        </InlineLayout>

        {/* IBAN */}
        <InlineLayout columns={['fill', 'auto']} spacing="tight" blockAlignment="center">
          <BlockStack spacing="none">
            <Text size="extraSmall" appearance="subdued">IBAN</Text>
            <Text size="small" emphasis="bold">PK74ABPA0010159734540017</Text>
          </BlockStack>
          <Button
            size="small"
            kind="secondary"
            accessibilityLabel="Copy IBAN"
            onPress={() => copyToClipboard('PK74ABPA0010159734540017', 'allied_iban')}
          >
            {copiedKey === 'allied_iban' ? 'COPIED ✓' : 'COPY'}
          </Button>
        </InlineLayout>
      </BlockStack>

      {/* Option 2: Easypaisa */}
      <BlockStack spacing="base" border="base" padding="base" cornerRadius="none" background="base">
        <Text size="small" emphasis="bold">02 // EASYPAISA</Text>

        <InlineLayout columns={['fill', 'auto']} spacing="tight" blockAlignment="center">
          <BlockStack spacing="none">
            <Text size="extraSmall" appearance="subdued">ACCOUNT TITLE</Text>
            <Text size="small" emphasis="bold">Muhammad Talha Shahzad</Text>
          </BlockStack>
          <Button
            size="small"
            kind="secondary"
            accessibilityLabel="Copy Easypaisa title"
            onPress={() => copyToClipboard('Muhammad Talha Shahzad', 'ep_title')}
          >
            {copiedKey === 'ep_title' ? 'COPIED ✓' : 'COPY'}
          </Button>
        </InlineLayout>

        <InlineLayout columns={['fill', 'auto']} spacing="tight" blockAlignment="center">
          <BlockStack spacing="none">
            <Text size="extraSmall" appearance="subdued">MOBILE NUMBER</Text>
            <Text size="small" emphasis="bold">03706735800</Text>
          </BlockStack>
          <Button
            size="small"
            kind="secondary"
            accessibilityLabel="Copy Easypaisa number"
            onPress={() => copyToClipboard('03706735800', 'ep_num')}
          >
            {copiedKey === 'ep_num' ? 'COPIED ✓' : 'COPY'}
          </Button>
        </InlineLayout>
      </BlockStack>

      {/* Option 3: JazzCash */}
      <BlockStack spacing="base" border="base" padding="base" cornerRadius="none" background="base">
        <Text size="small" emphasis="bold">03 // JAZZCASH</Text>

        <InlineLayout columns={['fill', 'auto']} spacing="tight" blockAlignment="center">
          <BlockStack spacing="none">
            <Text size="extraSmall" appearance="subdued">ACCOUNT TITLE</Text>
            <Text size="small" emphasis="bold">Muhammad Talha Shahzad</Text>
          </BlockStack>
          <Button
            size="small"
            kind="secondary"
            accessibilityLabel="Copy JazzCash title"
            onPress={() => copyToClipboard('Muhammad Talha Shahzad', 'jc_title')}
          >
            {copiedKey === 'jc_title' ? 'COPIED ✓' : 'COPY'}
          </Button>
        </InlineLayout>

        <InlineLayout columns={['fill', 'auto']} spacing="tight" blockAlignment="center">
          <BlockStack spacing="none">
            <Text size="extraSmall" appearance="subdued">MOBILE NUMBER</Text>
            <Text size="small" emphasis="bold">03706735800</Text>
          </BlockStack>
          <Button
            size="small"
            kind="secondary"
            accessibilityLabel="Copy JazzCash number"
            onPress={() => copyToClipboard('03706735800', 'jc_num')}
          >
            {copiedKey === 'jc_num' ? 'COPIED ✓' : 'COPY'}
          </Button>
        </InlineLayout>
      </BlockStack>

      {/* Order Reference */}
      <InlineLayout columns={['fill', 'auto']} spacing="base" padding="extraTight" blockAlignment="center">
        <BlockStack spacing="none">
          <Text size="extraSmall" appearance="subdued">PAYMENT REFERENCE</Text>
          <Text size="base" emphasis="bold">{orderName}</Text>
        </BlockStack>
        <Button
          size="small"
          kind="secondary"
          accessibilityLabel="Copy order reference"
          onPress={() => copyToClipboard(orderName, 'ref')}
        >
          {copiedKey === 'ref' ? 'COPIED ✓' : 'COPY'}
        </Button>
      </InlineLayout>

      <Divider />

      {/* Direct WhatsApp Call-to-Action */}
      <BlockStack spacing="tight">
        <Button
          kind="primary"
          appearance="monochrome"
          to={waUrl}
          external
        >
          Send Payment Screenshot on WhatsApp
        </Button>

        <Text size="extraSmall" appearance="subdued" alignment="center">
          Opens WhatsApp (+92 370 6735800) with order reference pre-filled. Attach your transfer receipt and send.
        </Text>
      </BlockStack>

    </BlockStack>
  );
}
