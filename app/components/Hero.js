'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';

const Hero = () => {
    const slides = [
        {
            image: 'https://img.freepik.com/free-photo/young-woman-applying-moisturizer-face-with-closed-eyes_651396-1779.jpg?t=st=1757861088~exp=1757864688~hmac=e2e17999d37c302aa3116218212e64f091d516ecacf421f8bc046b9fe8508398&w=1480',
            title: 'SHOP NOW, PAY LATER',
            tags: ['4 payments', 'no interest', 'no fee']
        },
        {
            image: 'https://img.freepik.com/free-photo/cosmetologist-doing-face-treatment-applying-face-mask_1303-28042.jpg?t=st=1757861262~exp=1757864862~hmac=d83e8a9833159dd557439b0cea9f03cddd8b3dc5a52285d825c83432c6d9f296&w=1480',
            title: 'AUTUMN COLLECTION ARRIVES',
            tags: ['new shades', 'limited edition']
        },
        {
            image: 'https://img.freepik.com/free-photo/portrait-woman-wearing-towel_23-2148752520.jpg?t=st=1757861291~exp=1757864891~hmac=652b01bdb101d8883cf5596a7cdbeb6b4ce8da23ac7fa98cf9f66cff61d34e1f&w=1480',
            title: 'FREE SHIPPING ON ORDERS AED 50+',
            tags: ['shop now', 'limited time']
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    return (
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                    <Image src={slide.image} alt="Hero background" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
                    <div className="absolute inset-0 flex flex-col justify-center items-start text-white p-8 sm:p-12 md:p-24">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif max-w-md leading-tight">{slide.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-6">
                            {slide.tags.map(tag => (
                                <span key={tag} className="bg-white/30 backdrop-blur-sm text-white text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full">{tag}</span>
                            ))}
                        </div>
                        <button className="mt-8 bg-[#4A6D70] text-white px-8 py-2 sm:px-10 sm:py-3 rounded-full font-bold hover:opacity-90 transition-colors text-sm sm:text-base">
                            SHOP NOW
                        </button>
                    </div>
                </div>
            ))}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-white/50'}`}></button>
                ))}
            </div>
        </div>
    );
};

export default Hero;
