import { Button } from './ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import ProductCard from './ProductCard';

export function FeaturedProducts({ products }) { // Accept products prop
  // Use products prop to select featured products
  const displayedProducts = products;

  return (
    <section className="py-16 bg-white">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl mb-4">
            <span className="text-gray-900">Our </span>
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Favorites
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our selection of exceptional products,
            loved by our most discerning customers.
          </p>
        </div>

        {/* Products Grid */}
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {displayedProducts.map((product) => (
              <CarouselItem key={product.id} className="basis-1/2 md:basis-1/2 lg:basis-1/4">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  // originalPrice={product.originalPrice} // Not available in current product data
                  image={product.imageUrl}
                  rating={4.5} // Hardcoded for now
                  reviewCount={120} // Hardcoded for now
                  // isNew={product.isNew} // Not available in current product data
                  // isBestseller={product.isBestseller} // Not available in current product data
                  category={product.categoryName || product.category}
                  brandName={product.brandName} // Add brandName
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-[var(--brand-pink)] text-[var(--brand-pink)] hover:bg-[var(--brand-pink)] hover:text-white"
          >
            View all products
          </Button>
        </div>
      </Container>
    </section>
  );
}