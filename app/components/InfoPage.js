import Link from 'next/link';
import { Container } from './ui/Container';
import { headingFont } from './home/SectionHeading';
import { CONTACT_EMAIL, whatsappUrl } from '@/lib/contact';

/**
 * Layout for the help pages (Contact, Shipping & returns, FAQ): the storefront's
 * uppercase title, a readable measure, and a "Still need help?" panel at the end.
 * Server component; these pages are plain documents.
 */
export function InfoPage({ title, intro, children, showHelp = true }) {
  const whatsapp = whatsappUrl();
  return (
    <div className="bg-white pt-8 pb-20 md:pt-12">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className={`${headingFont} text-[28px] md:text-[40px] font-medium uppercase tracking-[0.02em] leading-[1.1] text-[#111114]`}>{title}</h1>
          {intro && <p className="mt-4 text-[15px] leading-relaxed text-[#4b4b53] max-w-2xl">{intro}</p>}

          <div className="mt-10 grid gap-12">{children}</div>

          {showHelp && (
            <div className="mt-16 bg-[#f6f5f2] p-6 md:p-8">
              <h2 className="text-[16px] font-semibold text-[#111114]">Still need help?</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#4b4b53]">
                Email <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 text-[#111114]">{CONTACT_EMAIL}</a>
                {whatsapp && (
                  <> or message us on <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-[#111114]">WhatsApp</a></>
                )}
                , and include your order number if it's about an order. You'll find it in{' '}
                <Link href="/account/orders" className="underline underline-offset-4 text-[#111114]">My orders</Link> and in your confirmation email.
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

/** A titled block inside an InfoPage. */
export function InfoSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="pb-3 border-b border-[#111114] text-[17px] md:text-[18px] font-semibold text-[#111114]">{title}</h2>
      <div className="mt-4 grid gap-3 text-[15px] leading-relaxed text-[#4b4b53]">{children}</div>
    </section>
  );
}
