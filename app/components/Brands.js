import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from './ui/button';
import { Container } from './ui/Container';

const Brands = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <Container>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award h-4 w-4 text-[var(--brand-blue)]" aria-hidden="true">
              <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
              <circle cx="12" cy="8" r="6"></circle>
            </svg>
            <span className="text-sm text-[var(--brand-blue)] uppercase tracking-wide">Premium Partners</span>
          </div>
          <h2 className="text-4xl md:text-5xl mb-6">
            <span className="text-gray-900">Our Curated </span>
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Brands
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We partner exclusively with the world&apos;s most prestigious beauty houses, bringing you exceptional products that represent the pinnacle of luxury and innovation.
          </p>
        </div>
        <div className="space-y-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center ">
            <div className="relative ">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <Image src="https://gernetic.com/cdn/shop/files/LAPORTE8_edited_edited_1296x.jpg?v=1723020147" alt="Gernétic products" width={1000} height={500} className="w-full h-[500px] object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-blue)]/80 to-[var(--brand-blue)]/60 opacity-20"></div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-6 w-6 text-[var(--brand-pink)] mx-auto mb-2" aria-hidden="true">
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                    <path d="M20 2v4"></path>
                    <path d="M22 4h-4"></path>
                    <circle cx="4" cy="20" r="2"></circle>
                  </svg>
                  <div className="text-sm font-medium text-gray-900">Clinical Results</div>
                </div>
              </div>
            </div>
            <div className="space-y-6 ">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-3xl font-serif text-gray-900">Gernétic</h3>
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-leaf h-4 w-4 text-green-600" aria-hidden="true">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                    </svg>
                    <span className="text-xs text-green-600 uppercase tracking-wide">Premium</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide">Specialty</div>
                    <div className="text-gray-900 font-medium">Advanced Skincare Technology</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide">Founded</div>
                    <div className="text-gray-900 font-medium">Switzerland, 1976</div>
                  </div>
                </div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Swiss precision meets French elegance in this revolutionary skincare line. Gernétic combines cutting-edge biotechnology with luxurious textures for unparalleled results.
              </p>
              <div>
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-3">Featured Collections</div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Anti-Aging Serums</div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Cellular Regeneration</div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Professional Treatments</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/brand/2" passHref>
                  <button data-slot="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-6 has-[&>svg]:px-4 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 transition-opacity">
                    Explore Gernétic
                  </button>
                </Link>
                <button data-slot="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-10 rounded-md px-6 has-[&>svg]:px-4 border-gray-300 text-gray-700 hover:bg-gray-50">
                  View All Products
                </button>
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
              <div className="relative lg:order-2">
                <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                  <Image src="https://zorah.ca/cdn/shop/collections/3b92c066554239f206b5fb184b9c0dc3.png?v=1724698885&width=1100" alt="Zorah Biocosmetics products" width={1100} height={500} className="w-full h-[500px] object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-pink)]/80 to-[var(--brand-pink)]/60 opacity-20"></div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-6 w-6 text-[var(--brand-pink)] mx-auto mb-2" aria-hidden="true">
                      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                      <path d="M20 2v4"></path>
                      <path d="M22 4h-4"></path>
                      <circle cx="4" cy="20" r="2"></circle>
                    </svg>
                    <div className="text-sm font-medium text-gray-900">Certified Organic</div>
                  </div>
                </div>
              </div>
              <div className="space-y-6 lg:order-1">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-3xl font-serif text-gray-900">Zorah Biocosmetics</h3>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-leaf h-4 w-4 text-green-600" aria-hidden="true">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                      </svg>
                      <span className="text-xs text-green-600 uppercase tracking-wide">Premium</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wide">Specialty</div>
                      <div className="text-gray-900 font-medium">Organic Moroccan Beauty</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wide">Founded</div>
                      <div className="text-gray-900 font-medium">Morocco, 2008</div>
                    </div>
                  </div>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Pure Moroccan heritage meets modern sustainability. Zorah celebrates the ancient beauty secrets of Morocco with certified organic formulations and ethical practices.
                </p>
                <div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide mb-3">Featured Collections</div>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Argan Oil Collection</div>
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Natural Makeup</div>
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">Sustainable Beauty</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/brand/1" passHref>
                    <button data-slot="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-6 has-[&>svg]:px-4 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 transition-opacity">
                      Explore Zorah Biocosmetics
                    </button>
                  </Link>
                  <button data-slot="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-10 rounded-md px-6 has-[&>svg]:px-4 border-gray-300 text-gray-700 hover:bg-gray-50">
                    View All Products
                  </button>
                </div>
              </div>
            </div>
          </div>



          <div className="mt-20 text-center">
            <div className="bg-gradient-to-r from-[var(--brand-rose)] to-[var(--brand-cream)] rounded-3xl p-12">
              <h3 className="text-2xl md:text-3xl mb-4">
                <span className="text-gray-900">Discover the </span>
                <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">Full Collection</span>
              </h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Experience the complete range of premium products from our carefully selected partners. Each brand represents decades of expertise and innovation in luxury beauty.</p>
              <Button className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90 transition-opacity px-8">Shop All Brands</Button>
            </div>
          </div>
        </Container>
    </section>
  );
};

export default Brands;