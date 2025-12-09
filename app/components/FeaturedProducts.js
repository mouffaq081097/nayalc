
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';

export function FeaturedProducts() {
  const { featuredProducts } = useAppContext();
  const displayedProducts = featuredProducts;

  return (
    <section className="py-8 bg-white">
      <Container>
        {/* Section Header */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl md:text-4xl">
            <span className="text-gray-900">Our </span>
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Favorites
            </span>
          </h2>
          <Link
            href="/all-products"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border-[var(--brand-pink)] text-[var(--brand-pink)] hover:bg-[var(--brand-pink)] hover:text-white"
          >
            View all products
          </Link>
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
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.imageUrl}
                  averageRating={product.averageRating}
                  reviewCount={product.reviewCount}
                  category={product.categoryName || product.category}
                  brandName={product.brandName} // Add brandName
                  stock_quantity={product.stock_quantity} // Pass stock_quantity
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Container>
    </section>
  );
}