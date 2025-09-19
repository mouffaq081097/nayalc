'use client';
import React, { useRef, useEffect, useState } from 'react';
import './Carousel.css'; // Import the CSS for the carousel

const Carousel = ({ children }) => {
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // Tailwind's lg breakpoint
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  useEffect(() => {
    const updateItemWidth = () => {
      if (carouselRef.current && children.length > 0) {
        // Calculate item width based on the first child's width, including padding
        const firstChild = carouselRef.current.children[0];
        if (firstChild) {
          const style = window.getComputedStyle(firstChild);
          const paddingLeft = parseFloat(style.paddingLeft);
          const paddingRight = parseFloat(style.paddingRight);
          setItemWidth(firstChild.offsetWidth + paddingLeft + paddingRight);
        }
      }
    };

    updateItemWidth();
    window.addEventListener('resize', updateItemWidth);
    return () => window.removeEventListener('resize', updateItemWidth);
  }, [children]);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const newIndex = direction === 'left' 
        ? Math.max(0, currentIndex - 1) 
        : Math.min(children.length - 1, currentIndex + 1);
      
      carouselRef.current.scrollTo({
        left: newIndex * itemWidth,
        behavior: 'smooth',
      });
      setCurrentIndex(newIndex);
    }
  };

  const scrollToItem = (index) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth',
      });
      setCurrentIndex(index);
    }
  };

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper" ref={carouselRef}>
        {React.Children.map(children, (child, index) => (
          <div key={index} className="carousel-item">
            {child}
          </div>
        ))}
      </div>



      {isDesktop && (
        <>
          <button 
            className="carousel-nav-button left"
            onClick={() => scroll('left')}
            aria-label="Previous slide"
          >
            &lt;
          </button>
          <button 
            className="carousel-nav-button right"
            onClick={() => scroll('right')}
            aria-label="Next slide"
          >
            &gt;
          </button>
        </>
      )}

      {/* Pagination Dots */}
      <div className="carousel-pagination">
        {React.Children.map(children, (_, index) => (
          <button
            key={index}
            className={`carousel-pagination-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => scrollToItem(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
