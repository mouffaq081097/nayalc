import Link from 'next/link';
import { InfoPage, InfoSection } from '../components/InfoPage';
import { SHIPPING_TIERS, formatShipping, TRANSIT_LABEL, FREE_SHIPPING_FROM } from '@/lib/shipping';
import { RETURN_WINDOW_DAYS, REFUND_WITHIN_DAYS } from '@/lib/policies';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Shipping & returns',
  description: `Delivery across the UAE in ${TRANSIT_LABEL}, free from ${FREE_SHIPPING_FROM} items. Unopened products can be returned within ${RETURN_WINDOW_DAYS} days of delivery.`,
  alternates: { canonical: '/shipping-returns' },
};

const link = 'underline underline-offset-4 text-[#111114]';

export default function ShippingReturnsPage() {
  return (
    <InfoPage
      title="Shipping & returns"
      intro={`We deliver across the UAE with our courier partners. Delivery is free from ${FREE_SHIPPING_FROM} items, and unopened products can come back within ${RETURN_WINDOW_DAYS} days.`}
    >
      <InfoSection id="delivery" title="Delivery">
        <div className="overflow-x-auto">
          <table className="w-full max-w-md text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#e6e4df] text-[#6b6b73]">
                <th scope="col" className="py-2 pr-6 font-medium">Items in your order</th>
                <th scope="col" className="py-2 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {SHIPPING_TIERS.map((t) => (
                <tr key={t.label} className="border-b border-[#e6e4df]">
                  <td className="py-2.5 pr-6 text-[#111114]">{t.label}</td>
                  <td className="py-2.5 font-semibold text-[#111114] tabular-nums">{formatShipping(t.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Delivery prices include VAT. You&apos;ll see the exact amount in your bag and at checkout before you pay.</p>
        <p>
          Orders placed by 2 PM UAE time on a working day (Monday to Friday) leave our warehouse the same day.
          Orders placed later, or at the weekend, leave on the next working day. Delivery then takes {TRANSIT_LABEL}.
          Each product page shows the delivery dates for an order placed now.
        </p>
        <p>
          When your order ships, we email you the courier and a tracking link. You can follow it in{' '}
          <Link href="/account/orders" className={link}>My orders</Link> too.
        </p>
        <p>Pay by card, Apple Pay or Google Pay, in instalments with Tabby, or in cash on delivery.</p>
      </InfoSection>

      <InfoSection id="pre-orders" title="Pre-orders">
        <p>
          Some products can be pre-ordered while they&apos;re out of stock. The product page shows the date they&apos;ll
          ship by. An order with a pre-order item ships in one parcel once everything is in, and cash on delivery
          isn&apos;t available for it.
        </p>
        <p>
          If the date moves, we email you. You can cancel a waiting order from{' '}
          <Link href="/account/orders" className={link}>My orders</Link>.
        </p>
      </InfoSection>

      <InfoSection id="returns" title="Returns and exchanges">
        <p>
          You can return unopened products in their original sealed condition within {RETURN_WINDOW_DAYS} days of
          delivery, for a refund or an exchange.
        </p>
        <p>
          For hygiene and safety, skincare, cosmetics and fragrance that have been opened, used or had their seal
          broken can&apos;t be returned unless they&apos;re faulty. This doesn&apos;t affect your rights for faulty or
          misdescribed goods.
        </p>
        <p>
          To start a return, email <a href={`mailto:${CONTACT_EMAIL}`} className={link}>{CONTACT_EMAIL}</a> with your
          order number. Return shipping is paid by you, except for faulty items, where we pay.
        </p>
        <p>
          Refunds go back to your original payment method within {REFUND_WITHIN_DAYS} days of the return reaching us.
          Your bank or card issuer may take a further 5 to 10 working days to show it.
        </p>
      </InfoSection>

      <InfoSection id="cancellations" title="Cancellations">
        <p>
          If an order is cancelled before delivery, a card payment is refunded automatically and any points you used
          go back to your balance.
        </p>
        <p>
          The full conditions are in section 8 of our <Link href="/terms" className={link}>Terms of Service</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
