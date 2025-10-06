'use client';
import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

import { Container } from '../components/ui/Container';
import { Flower, Heart, Star, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppContext } from '../context/AppContext';

const fragranceFamilies = [
  {
    icon: Flower,
    title: 'Floral',
    description: 'Romantic and feminine with delicate petals',
    notes: ['Rose', 'Jasmine', 'Peony'],
    color: 'from-[var(--brand-pink)]/20 to-[var(--brand-pink)]/10'
  },
  {
    icon: Star,
    title: 'Oriental',
    description: 'Exotic and warm with mysterious depth',
    notes: ['Amber', 'Vanilla', 'Spices'],
    color: 'from-[var(--brand-blue)]/20 to-[var(--brand-blue)]/10'
  },
  {
    icon: Heart,
    title: 'Fresh',
    description: 'Clean and invigorating for everyday wear',
    notes: ['Citrus', 'Green', 'Aquatic'],
    color: 'from-[var(--brand-blue)]/15 to-[var(--brand-pink)]/15'
  },
  {
    icon: Sparkles,
    title: 'Woody',
    description: 'Sophisticated and grounding with natural elegance',
    notes: ['Sandalwood', 'Cedar', 'Patchouli'],
    color: 'from-[var(--brand-pink)]/15 to-[var(--brand-blue)]/15'
  }
];

export default function FragrancePage() {
  const { fetchProductsByCategory } = useAppContext();
  const [fragranceProducts, setFragranceProducts] = useState([]);

  useEffect(() => {
    const fetchFragranceProducts = async () => {
      try {
        const products = await fetchProductsByCategory([4]);
        setFragranceProducts(products);
      } catch (error) {
        console.error(error);
      }
    };

    fetchFragranceProducts();
  }, [fetchProductsByCategory]);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white">
                Luxury Fragrances
              </Badge>
              <h1 className="text-4xl md:text-5xl mb-6">
                <span className="text-gray-900">Captivating </span>
                <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                  Fragrances
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover our exquisite collection of perfumes and body mists. Each fragrance tells 
                a unique story, crafted with the finest ingredients from around the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                >
                  Shop Fragrances
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-[var(--brand-blue)] text-[var(--brand-blue)]"
                >
                  Fragrance Quiz
                </Button>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="/WhatsApp Image 2025-07-14 at 19.58.12_7d2e719f.jpg"
                alt="Luxury fragrance collection"
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </Container>
      </section>


      {/* Fragrance Families */}
      <section className="py-16 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Explore Fragrance Families</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each fragrance family offers a distinct personality and mood. 
              Find the perfect scent that resonates with your unique style.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {fragranceFamilies.map((family, index) => (
              <div key={index} className={`bg-gradient-to-br ${family.color} rounded-2xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer`}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-sm">
                  <family.icon className="h-8 w-8 text-[var(--brand-blue)]" />
                </div>
                <h3 className="text-lg mb-2">{family.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{family.description}</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {family.notes.map((note) => (
                    <Badge key={note} variant="secondary" className="text-xs bg-white/80">
                      {note}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
</section>
      {/* Featured Fragrances */}
      <section className="py-16">
        <Container>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl">Signature Fragrances</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="outline" size="sm">For Her</Button>
              <Button variant="outline" size="sm">For Him</Button>
              <Button variant="outline" size="sm">Unisex</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {fragranceProducts.map((product) => (
              <ProductCard key={product.id} {...product} image={product.imageUrl} />
            ))}
          </div>
        </Container>

</section>
      {/* Fragrance Layering Guide */}
      <section className="py-16 bg-gradient-to-br from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">
              <span className="text-gray-900">The Art of </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Fragrance Layering
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create your signature scent by masterfully combining different fragrances. 
              Learn the art of layering for a truly personalized fragrance experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">1️⃣</div>
              <h3 className="text-xl mb-3">Base Layer</h3>
              <p className="text-gray-600 mb-4">Start with a rich, woody or musky foundation that will anchor your scent.</p>
              <Button variant="outline" size="sm">Shop Base Notes</Button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">2️⃣</div>
              <h3 className="text-xl mb-3">Heart Layer</h3>
              <p className="text-gray-600 mb-4">Add floral or spicy middle notes to create the main character of your fragrance.</p>
              <Button variant="outline" size="sm">Shop Heart Notes</Button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">3️⃣</div>
              <h3 className="text-xl mb-3">Top Layer</h3>
              <p className="text-gray-600 mb-4">Finish with fresh, citrusy top notes for an immediate burst of fragrance.</p>
              <Button variant="outline" size="sm">Shop Top Notes</Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Fragrance Care */}
      <section className="py-16 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl mb-6">
                <span className="text-gray-900">Preserve Your </span>
                <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                  Precious Scents
                </span>
              </h2>
              <p className="text-gray-600 mb-6">
                Learn how to properly store and apply your fragrances to maintain their quality 
                and ensure they last longer while delivering the best scent experience.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--brand-pink)]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-[var(--brand-pink)] rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Store in Cool, Dark Places</h4>
                    <p className="text-gray-600 text-sm">Keep away from sunlight and heat to preserve fragrance integrity.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--brand-blue)]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-[var(--brand-blue)] rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Apply to Pulse Points</h4>
                    <p className="text-gray-600 text-sm">Wrists, neck, and behind ears for optimal scent projection.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--brand-pink)]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-[var(--brand-pink)] rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Don&apos;t Rub After Application</h4>
                    <p className="text-gray-600 text-sm">Let the fragrance settle naturally for best scent development.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[var(--brand-blue)]/10 to-[var(--brand-pink)]/10 rounded-2xl p-8 text-center">
              <Sparkles className="h-16 w-16 text-[var(--brand-blue)] mx-auto mb-6" />
              <h3 className="text-xl mb-4">Fragrance Consultation</h3>
              <p className="text-gray-600 mb-6">
                Get personalized fragrance recommendations from our scent experts. 
                Book a complimentary consultation to find your perfect signature scent.
              </p>
              <Button 
                className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
              >
                Book Consultation
              </Button>
            </div>
          </div>
        </Container>
      </section>
      </div>
  );
}
