import Link from 'next/link';
import { Mail, MessageCircle, MessagesSquare } from 'lucide-react';
import { InfoPage, InfoSection } from '../components/InfoPage';
import ChatButton from './ChatButton';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/contact';

export const metadata = {
  title: 'Contact us',
  description: 'Questions about an order, a product or your skin? Email Naya Lumière Cosmetics or chat with us.',
  alternates: { canonical: '/contact' },
};

const card = 'flex flex-col gap-3 bg-[#f6f5f2] p-6';
const action = 'mt-auto inline-flex w-fit items-center justify-center h-10 px-6 rounded-full border-[1.5px] border-[#111114] text-[13px] font-semibold text-[#111114] hover:bg-[#111114] hover:text-white transition-colors';

export default function ContactPage() {
  const whatsapp = whatsappUrl('Hello Naya Lumière, I have a question.');
  return (
    <InfoPage
      title="Contact us"
      intro="Questions about an order, a product or which routine suits your skin? We're happy to help. If it's about an order, include your order number."
      showHelp={false}
    >
      <div className={`grid gap-4 ${whatsapp ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className={card}>
          <Mail size={20} strokeWidth={1.6} className="text-[#111114]" />
          <h2 className="text-[16px] font-semibold text-[#111114]">Email</h2>
          <p className="text-[14px] text-[#4b4b53] break-words">{CONTACT_EMAIL}</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className={action}>Write to us</a>
        </div>
        {whatsapp && (
          <div className={card}>
            <MessageCircle size={20} strokeWidth={1.6} className="text-[#111114]" />
            <h2 className="text-[16px] font-semibold text-[#111114]">WhatsApp</h2>
            <p className="text-[14px] text-[#4b4b53]">{WHATSAPP_DISPLAY}</p>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={action}>Message us</a>
          </div>
        )}
        <div className={card}>
          <MessagesSquare size={20} strokeWidth={1.6} className="text-[#111114]" />
          <h2 className="text-[16px] font-semibold text-[#111114]">Chat</h2>
          <p className="text-[14px] text-[#4b4b53]">Chat with us from your account. Your order details come along, so you don't have to explain twice.</p>
          <ChatButton className={action} />
        </div>
      </div>

      <InfoSection title="Quick answers">
        <ul className="grid gap-2">
          <li><Link href="/shipping-returns" className="underline underline-offset-4 text-[#111114]">Shipping &amp; returns</Link>: delivery times and costs, pre-orders, returns and refunds.</li>
          <li><Link href="/faq" className="underline underline-offset-4 text-[#111114]">FAQ</Link>: payment, points, discount codes and more.</li>
          <li><Link href="/account/orders" className="underline underline-offset-4 text-[#111114]">My orders</Link>: track an order, download an invoice or buy again.</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
