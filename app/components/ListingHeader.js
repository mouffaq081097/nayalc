import Image from 'next/image';
import Link from 'next/link';
import { headingFont } from './home/SectionHeading';

function Crumbs({ crumbs, light }) {
  if (!crumbs?.length) return null;
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 text-[12px] font-medium ${light ? 'text-white/75' : 'text-[#6b6b73]'}`}>
      {crumbs.map((c, i) => (
        <span key={c.label} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true" className="opacity-50">/</span>}
          {c.href ? (
            <Link href={c.href} className={`transition-colors ${light ? 'hover:text-white' : 'hover:text-[#111114]'}`}>{c.label}</Link>
          ) : (
            <span className={light ? 'text-white' : 'text-[#111114]'}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * The page header every product list shares, in the homepage's style: with an
 * `image`, a full-width photo with the uppercase title over a dark wash (like
 * the homepage banners); without one, a white block with a centred title.
 * `crumbs` is [{ label, href? }], the last one being the current page;
 * `children` render under the subtitle (e.g. a link).
 */
export function ListingHeader({ crumbs, title, subtitle, image, imageAlt = '', children }) {
  if (image) {
    return (
      <header className="relative h-[300px] md:h-[380px] overflow-hidden bg-[#2a2622]">
        <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,12,0.62)_0%,rgba(10,10,12,0.25)_50%,rgba(10,10,12,0.05)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent md:hidden" />
        <div className="relative h-full max-w-[1320px] mx-auto px-5 md:px-8 flex flex-col justify-end pb-8 md:pb-12 gap-3">
          <Crumbs crumbs={crumbs} light />
          <h1 className={`${headingFont} text-[28px] md:text-[44px] font-medium uppercase leading-[1.08] text-white text-balance max-w-[18ch]`}>{title}</h1>
          {subtitle && <p className="max-w-[46ch] text-[14px] md:text-[15px] leading-relaxed text-white/85 line-clamp-2">{subtitle}</p>}
          {children}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-[#ececec]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 pt-10 pb-9 md:pt-16 md:pb-14 flex flex-col items-center text-center gap-3">
        <Crumbs crumbs={crumbs} />
        <h1 className={`${headingFont} text-[28px] md:text-[44px] font-medium uppercase leading-[1.08] text-[#111114] text-balance`}>{title}</h1>
        {subtitle && <p className="max-w-[52ch] text-[14px] md:text-[15px] leading-relaxed text-[#6b6b73]">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
