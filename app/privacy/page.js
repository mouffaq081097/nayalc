import { LegalPage, Section, Bullets } from '../components/LegalPage';

export const metadata = {
  title: 'Privacy Policy | Naya Lumière Cosmetics UAE',
  description:
    'How Naya Lumière Cosmetics collects, uses, shares and protects your personal data, and the rights you hold under UAE data protection law.',
  openGraph: {
    title: 'Privacy Policy – Naya Lumière Cosmetics',
    description: 'How we handle your personal data, and the rights you hold over it.',
    url: 'https://nayalc.com/privacy',
    type: 'website',
    locale: 'en_AE',
  },
  alternates: { canonical: 'https://nayalc.com/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what personal data we collect when you shop with Naya Lumière Cosmetics, why we collect it, who we share it with, and how you can control it."
      lastUpdated="17 September 2026"
    >
      <Section n={1} title="Who we are">
        <p>
          Naya Lumière Cosmetics (&quot;we&quot;, &quot;us&quot;) operates nayalc.com, a luxury beauty
          and skincare retailer serving the United Arab Emirates. We are the controller of the
          personal data described in this policy.
        </p>
        <p>
          Registered entity: NAYA Lumiere Cosmetics FZ-LLC, a free zone limited liability company
          registered with the Ras Al Khaimah Economic Zone Authority (RAKEZ) under commercial
          licence number 5028749. Registered address: FDBC1856, Compass Building, Al Shohada Road,
          Al Hamra Industrial Zone-FZ, Ras Al Khaimah, United Arab Emirates. For any privacy
          question, contact{' '}
          <a href="mailto:info@nayalc.com" className="font-semibold" style={{ color: 'rgb(147,104,236)' }}>
            info@nayalc.com
          </a>
          .
        </p>
      </Section>

      <Section n={2} title="What we collect">
        <p>We collect only what we need to run your account and fulfil your orders:</p>
        <Bullets
          items={[
            'Account details — your name, email address and a securely hashed password. We never store your password in readable form.',
            'Order and delivery details — items purchased, shipping and billing addresses, contact phone number, order history and invoices.',
            'Payment details — processed directly by our payment providers. Full card numbers never reach our servers.',
            'Communications — messages you send through our live chat, customer service emails, and product reviews you publish.',
            'Loyalty and preferences — points balance and transactions, wishlist items, saved addresses, marketing preferences, and skin quiz responses if you choose to complete one.',
            'Technical data — IP address, browser and device information, pages viewed and approximate location, collected to keep the site secure and to understand how it is used.',
          ]}
        />
      </Section>

      <Section n={3} title="Signing in with Google or Apple">
        <p>
          If you choose to sign in with Google or Apple, we receive your name, email address and
          profile picture from that provider in order to create or match your account. We never
          receive your password.
        </p>
        <p>
          If you use Apple&apos;s &quot;Hide My Email&quot; feature, we receive a private relay
          address instead of your real one. We use it exactly as we would any other address — to
          send order confirmations and account notices.
        </p>
      </Section>

      <Section n={4} title="How we use your data">
        <Bullets
          items={[
            'To create and secure your account, and to verify your email address.',
            'To process orders, take payment, arrange delivery and handle returns.',
            'To provide customer support, including live chat and order enquiries.',
            'To run the loyalty programme, apply discount codes and calculate rewards.',
            'To send transactional messages — order confirmations, shipping updates, invoices, password resets and security notices. These are not marketing and cannot be opted out of while you hold an account.',
            'To send marketing about launches, restocks and offers, only where you have opted in. You can withdraw consent at any time.',
            'To detect fraud, prevent abuse, and meet our legal and tax obligations.',
            'To improve the store — understanding which products and pages are useful.',
          ]}
        />
      </Section>

      <Section n={5} title="AI-assisted features">
        <p>
          Some features — skin consultations, product guidance and the shopping assistant — are
          powered by a third-party AI service (Google Gemini). When you use them, the content of
          your question and relevant product information is sent to that provider to generate a
          response.
        </p>
        <p>
          Please do not enter medical information, health conditions or any sensitive personal
          detail into these features. Their output is general cosmetic guidance and is not medical
          advice.
        </p>
      </Section>

      <Section n={6} title="Who we share it with">
        <p>
          We do not sell your personal data. We share it only with providers who need it to deliver
          our service to you:
        </p>
        <Bullets
          items={[
            'Payment processing — Stripe, and instalment provider Tabby where you select it.',
            'Delivery partners — to get your order to your address.',
            'Email delivery — to send order, account and marketing messages.',
            'Image and content hosting — Cloudinary, for product and account imagery.',
            'AI services — Google, for the assisted features described above.',
            'Maps and location — Google Maps, when you pick a delivery address on a map.',
            'Analytics and hosting — Vercel, which hosts the store and provides usage analytics.',
          ]}
        />
        <p>
          We may also disclose data where required by law, to enforce our terms, or to protect the
          rights and safety of our customers.
        </p>
      </Section>

      <Section n={7} title="International transfers">
        <p>
          Several of the providers above process data outside the UAE. Where that happens, we take
          reasonable steps to ensure your data remains protected to a standard consistent with UAE
          law.
        </p>
      </Section>

      <Section n={8} title="How long we keep it">
        <p>
          We keep your account data for as long as your account is open. Order, invoice and tax
          records are retained for 5 years to meet our obligations under UAE tax law, even after an
          account is closed. Marketing preferences are kept until you withdraw consent, and chat
          transcripts for 24 months.
        </p>
      </Section>

      <Section n={9} title="Security">
        <p>
          The site is served over HTTPS, passwords are stored using industry-standard one-way
          hashing, card details never touch our servers, and access to customer data is restricted
          to staff who need it. No online service can promise perfect security, but we take these
          obligations seriously and review them regularly.
        </p>
      </Section>

      <Section n={10} title="Your rights">
        <p>
          Under the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021), you may
          ask us to:
        </p>
        <Bullets
          items={[
            'Give you a copy of the personal data we hold about you.',
            'Correct data that is inaccurate or incomplete.',
            'Delete your data, where we have no legal obligation to keep it.',
            'Restrict or object to certain processing, including direct marketing.',
            'Transfer your data to another provider in a portable format.',
            'Withdraw consent you previously gave, at any time.',
          ]}
        />
        <p>
          Email{' '}
          <a href="mailto:info@nayalc.com" className="font-semibold" style={{ color: 'rgb(147,104,236)' }}>
            info@nayalc.com
          </a>{' '}
          and we will respond within 30 days. You may
          also lodge a complaint with the UAE Data Office.
        </p>
      </Section>

      <Section n={11} title="Marketing choices">
        <p>
          Every marketing email carries an unsubscribe link, and you can change your preferences in
          your account settings at any time. Unsubscribing from marketing does not stop
          order-related messages, which are necessary to complete your purchases.
        </p>
      </Section>

      <Section n={12} title="Cookies and similar technologies">
        <p>
          We use cookies and browser storage to keep you signed in, remember your cart and
          preferences, and measure how the store is used. Essential cookies are required for the
          site to function — blocking them in your browser will break sign-in and checkout.
        </p>
      </Section>

      <Section n={13} title="Children">
        <p>
          Our store is intended for adults. We do not knowingly collect personal data from anyone
          under 18. If you believe a child has provided us with data, contact us and we will delete
          it.
        </p>
      </Section>

      <Section n={14} title="Changes to this policy">
        <p>
          We may update this policy as our service changes. The revision date at the top of this
          page always reflects the current version, and we will notify you of material changes by
          email or a notice on the site.
        </p>
      </Section>
    </LegalPage>
  );
}
