import { LegalPage, Section, Bullets } from '../components/LegalPage';

export const metadata = {
  title: 'Terms of Service | Naya Lumière Cosmetics UAE',
  description:
    'The terms governing your use of nayalc.com — orders, pricing, delivery, returns, loyalty rewards and your responsibilities as a customer.',
  openGraph: {
    title: 'Terms of Service – Naya Lumière Cosmetics',
    description: 'The terms governing orders, delivery, returns and use of our store.',
    url: 'https://nayalc.com/terms',
    type: 'website',
    locale: 'en_AE',
  },
  alternates: { canonical: 'https://nayalc.com/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your use of nayalc.com and every order you place with us. Please read them before purchasing."
      lastUpdated="17 September 2026"
    >
      <Section n={1} title="About these terms">
        <p>
          These terms form an agreement between you and Naya Lumière Cosmetics, the trading name of
          NAYA Lumiere Cosmetics FZ-LLC, a free zone limited liability company registered with the
          Ras Al Khaimah Economic Zone Authority (RAKEZ) under commercial licence 5028749,
          registered at FDBC1856, Compass Building, Al Shohada Road, Al Hamra Industrial Zone-FZ,
          Ras Al Khaimah, United Arab Emirates. By browsing the store, creating an account or
          placing an order, you accept them.
        </p>
      </Section>

      <Section n={2} title="Eligibility and your account">
        <p>
          You must be at least 18 and able to enter a binding contract. You are responsible for
          keeping your password confidential and for activity that happens under your account. Tell
          us immediately if you suspect unauthorised access.
        </p>
        <p>
          Please keep your details accurate — we rely on your email address for order confirmations
          and on your address for delivery. We may suspend or close accounts used fraudulently or in
          breach of these terms.
        </p>
      </Section>

      <Section n={3} title="Products and authenticity">
        <p>
          We are an official retailer of GERnétic, Zorah and Naya Lumière Perfumes. Every product we
          sell is genuine and sourced through authorised channels.
        </p>
        <p>
          We photograph products as accurately as we can, but colours and packaging can vary between
          screens and between manufacturing batches. Product descriptions, ingredient lists and
          usage guidance are provided for information — always patch test a new product and read the
          packaging before use.
        </p>
      </Section>

      <Section n={4} title="Pricing and VAT">
        <p>
          All prices are shown in UAE Dirhams (AED) and include VAT where applicable. We may change
          prices at any time, but changes never affect an order we have already accepted.
        </p>
        <p>
          We take care to price accurately. If a product is listed at an obviously incorrect price,
          we may cancel the order and refund you in full rather than fulfil it.
        </p>
      </Section>

      <Section n={5} title="Orders">
        <p>
          Your order is an offer to buy. A confirmation email acknowledges we received it — the
          contract forms when we dispatch the goods. We may decline an order where stock is
          unavailable, payment fails, the delivery address is outside our service area, or we
          suspect fraud.
        </p>
      </Section>

      <Section n={6} title="Payment">
        <p>
          We accept card payments processed securely by Stripe, and instalment payments through
          Tabby where offered. Tabby purchases are additionally governed by Tabby&apos;s own terms.
          Full card details are never stored on our servers.
        </p>
      </Section>

      <Section n={7} title="Delivery">
        <p>
          We deliver across the UAE. Delivery is charged by the number of items in your order: AED
          20 for a single item, AED 10 for two items, and free of charge on orders of three items or
          more. The amount is shown in your cart and again at checkout before you pay.
        </p>
        <p>
          Orders placed before 2:00 PM UAE time are dispatched for delivery the next business day.
          Orders placed after that cut-off are dispatched for the following business day. Business
          days exclude Saturdays and Sundays.
        </p>
        <p>
          Delivery dates shown at checkout are estimates, not guarantees. Risk in the goods passes
          to you on delivery to the address you provided.
        </p>
      </Section>

      <Section n={8} title="Returns, exchanges and cancellations">
        <p>
          You may return unopened products in their original sealed condition within 14 days of
          delivery for a refund or exchange.
        </p>
        <p>
          For reasons of hygiene and safety, cosmetics, skincare and fragrance that have been
          opened, used, or had their seal broken cannot be returned unless faulty. This does not
          affect your statutory rights in respect of faulty or misdescribed goods.
        </p>
        <p>
          To start a return, contact{' '}
          <a href="mailto:info@nayalc.com" className="font-semibold" style={{ color: 'rgb(147,104,236)' }}>
            info@nayalc.com
          </a>{' '}
          with your order number. Refunds are issued to the original payment method within 14 days
          of us receiving the goods; your bank or card issuer may take a further 5 to 10 business
          days to show the credit. Return shipping is paid by you, except for faulty items, where we
          pay.
        </p>
        <p>
          If an order is cancelled before delivery, any card payment is refunded automatically and
          any loyalty points you redeemed against it are returned to your balance.
        </p>
      </Section>

      <Section n={9} title="Loyalty rewards">
        <p>
          You earn one point for every AED 1 of your order total, multiplied by your tier: Silver
          1&times;, Gold 1.5&times;, Platinum 2&times; and Diamond 2.5&times;. Points are credited
          when an order is marked delivered, not when it is placed — until then they appear as
          pending in your loyalty history.
        </p>
        <p>
          Tiers are based on lifetime spend: Gold from AED 2,000, Platinum from AED 5,000 and
          Diamond from AED 10,000. Points are redeemed at checkout in blocks of 100, each block
          worth AED 5 off your order.
        </p>
        <p>
          Your points do not expire. They hold no cash value and cannot be sold or transferred. If
          an order is cancelled, points you redeemed against it are returned to your balance; since
          points are only credited on delivery, a cancelled order earns none. We may vary or end the
          programme with reasonable notice, and may withdraw points obtained through abuse.
        </p>
      </Section>

      <Section n={10} title="Promotions and discount codes">
        <p>
          Discount codes are valid for the stated period, apply only to qualifying products, cannot
          be exchanged for cash and — unless we say otherwise — cannot be combined with other
          offers. We may withdraw a code where it has been misused or shared beyond its intended
          audience.
        </p>
      </Section>

      <Section n={11} title="Reviews and content you post">
        <p>
          Reviews should reflect genuine experience with a product you bought. By posting, you grant
          us a non-exclusive, royalty-free licence to display and reproduce that content in
          connection with our store.
        </p>
        <p>
          We may remove content that is false, offensive, infringes someone else&apos;s rights,
          makes medical claims, or exists mainly to advertise something else.
        </p>
      </Section>

      <Section n={12} title="AI features are not medical advice">
        <p>
          Our skin quiz, consultations and shopping assistant use automated systems to suggest
          products. Their suggestions are general cosmetic guidance only — they are not a diagnosis,
          not a treatment plan, and not a substitute for advice from a doctor, dermatologist or
          pharmacist.
        </p>
        <p>
          If you have a skin condition, allergy, sensitivity, or are pregnant or breastfeeding,
          consult a qualified professional before using any new product. Always patch test and read
          the ingredient list on the packaging.
        </p>
      </Section>

      <Section n={13} title="Intellectual property">
        <p>
          The store&apos;s design, text, photography, logos and the Naya Lumière Cosmetics name are
          owned by us or our licensors and are protected by law. Brand names and marks belong to
          their respective owners. You may not copy, reproduce or use them commercially without
          written permission.
        </p>
      </Section>

      <Section n={14} title="Acceptable use">
        <p>You agree not to:</p>
        <Bullets
          items={[
            'Use the store unlawfully, fraudulently, or to resell products without our written agreement.',
            'Interfere with the site, attempt to gain unauthorised access, or probe its security.',
            'Scrape, harvest or copy content or data at scale by automated means.',
            'Submit false information, impersonate another person, or misuse promotional codes.',
          ]}
        />
      </Section>

      <Section n={15} title="Liability">
        <p>
          We do not exclude liability for death or personal injury caused by our negligence, for
          fraud, or for anything else that cannot lawfully be excluded.
        </p>
        <p>
          Subject to that, we are not liable for indirect or consequential loss, and our total
          liability for any order is limited to the amount you paid for it. We do not guarantee that
          the site will always be available or free of errors.
        </p>
      </Section>

      <Section n={16} title="Governing law">
        <p>
          These terms are governed by the laws of the United Arab Emirates as applied in the Emirate
          of Ras Al Khaimah, together with the regulations of the Ras Al Khaimah Economic Zone
          Authority. Disputes that cannot be settled amicably are subject to the exclusive
          jurisdiction of the Courts of Ras Al Khaimah.
        </p>
      </Section>

      <Section n={17} title="Changes to these terms">
        <p>
          We may update these terms from time to time. The version published when you place an order
          is the version that governs it, so please check this page before purchasing.
        </p>
      </Section>
    </LegalPage>
  );
}
