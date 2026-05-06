import React from "react";
import { useNavigate } from "react-router-dom";
import NayaHeader from "@/components/NayaHeader";
import NayaFooter from "@/components/NayaFooter";git add .
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-[1180px] mx-auto px-6 py-10">
          <div className="border border-border rounded-lg bg-background p-12 grid grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="text-[12px] font-semibold tracking-[0.22em] uppercase text-primary mb-3">
                New · Vitamin C Serum
              </div>
              <h1 className="text-[clamp(36px,4.4vw,56px)] font-semibold tracking-tight leading-[1.05] mb-4">
                Skin, lit from within.
              </h1>
              <p className="text-[18px] text-ink-500 leading-relaxed max-w-[46ch] mb-6">
                A clinical 15% vitamin C blend, balanced with squalane and hyaluronic acid for a calm, radiant finish — morning and night.
              </p>
              <div className="flex items-center gap-4">
                <Button className="group" onClick={() => navigate("/cart")}>
                  Shop the Serum
                  <ArrowIcon />
                </Button>
                <a href="#" className="text-[13px] font-medium text-ink-700 hover:text-foreground transition-colors">
                  Read the ingredients →
                </a>
              </div>
            </div>
            <div className="aspect-[1/1.05] bg-ink-50 border border-border rounded-lg flex items-center justify-center overflow-hidden">
              <img src={productSerum} alt="Vitamin C Serum" className="w-[60%] object-contain" />
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="max-w-[1180px] mx-auto px-6 pb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-ink-400 mb-1">Shop</div>
              <h2 className="text-[28px] font-semibold tracking-tight">Bestsellers</h2>
            </div>
            <a href="#" className="text-[13px] font-medium text-primary hover:underline underline-offset-3">View all →</a>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {products.map((p) => (
              <article
                key={p.id}
                className="border border-border rounded-lg overflow-hidden flex flex-col hover:border-ink-300 hover:shadow-2 hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-[4/5] bg-ink-50 relative flex items-center justify-center overflow-hidden">
                  {p.badge && (
                    <span className={`absolute top-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-pill ${
                      p.badgeType === "brand" ? "bg-primary/10 text-primary" : "bg-ink-100 text-ink-700"
                    }`}>
                      {p.badge}
                    </span>
                  )}
                  <img src={p.image} alt={p.name} className="w-[70%] object-contain" loading="lazy" />
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-500">Naya Lumière</div>
                  <div className="text-[15px] font-semibold text-foreground leading-snug">{p.name}</div>
                  <div className="text-[12px] text-ink-500 flex items-center gap-1">
                    <span className="text-[#e0a800]">★★★★★</span> {p.rating} ({p.reviews})
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[15px] font-semibold">AED {p.price}</span>
                    {p.originalPrice && (
                      <span className="text-[13px] text-ink-400 line-through">AED {p.originalPrice}</span>
                    )}
                  </div>
                  <Button size="sm" className="w-full mt-2 group">
                    Add to Bag
                    <ArrowIcon className="w-4 h-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="max-w-[1180px] mx-auto px-6 pb-12">
          <div className="border border-border rounded-lg p-8 grid grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[11px] font-medium bg-ink-100 text-ink-700 px-2.5 py-1 rounded-pill">Members get more</span>
              <h3 className="text-[28px] font-semibold tracking-tight mt-2.5 mb-2">Join the ritual.</h3>
              <p className="text-ink-500 text-[15px] leading-relaxed max-w-[38ch]">
                Early access to new launches, restock alerts, and a 10% welcome discount.
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-[420px]">
              <div>
                <label className="block text-[12px] font-medium text-ink-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-[42px] px-3 border border-border rounded-md bg-background text-[14px] placeholder:text-ink-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button className="self-start group">
                Subscribe
                <ArrowIcon />
              </Button>
              <p className="text-[11px] text-ink-400">By subscribing you agree to our privacy policy.</p>
            </div>
          </div>
        </section>
      </main>

      <NayaFooter />
    </div>
  );
};

export default Index;
