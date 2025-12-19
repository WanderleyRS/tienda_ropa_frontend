'use client';

import { useState, useRef } from 'react';
import { Item } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { getValidImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils'; // Assuming cn exists, if not I'll just use template literals

interface ProductCardProps {
    product: Item;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart, items } = useCart();
    const isSold = product.is_sold;
    const isInCart = items.some(item => item.id === product.id);

    // Combine main photo and additional images
    const allImages = [
        product.photo_url,
        ...(product.additional_images || [])
    ].filter(Boolean); // Ensure no empty/null values

    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);

    const handleAddToCart = () => {
        if (isInCart) {
            toast.info(`${product.title} ya está en el carrito`);
            return;
        }
        addToCart(product);
        toast.success(`${product.title} añadido al carrito`);
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (allImages.length <= 1) return;
        setCurrentIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (allImages.length <= 1) return;
        setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;

        // Swipe threshold
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swipe Left -> Next
                nextImage();
            } else {
                // Swipe Right -> Prev
                prevImage();
            }
        }
        touchStartX.current = null;
    };

    return (
        <div className="group relative flex flex-col gap-3">
            {/* Image Container */}
            <div
                className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary/20 shadow-sm transition-all duration-500 group-hover:shadow-md"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Carousel Slides */}
                <div
                    className="flex h-full w-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {allImages.map((img, index) => (
                        <div key={index} className="min-w-full h-full relative">
                            <img
                                src={getValidImageUrl(img)}
                                alt={`${product.title} - ${index + 1}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%239ca3af"%3E%3F%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows (Desktop) */}
                {allImages.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 p-2">
                            {allImages.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Badges & Overlays */}
                {isSold && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                        <span className="border border-white/30 bg-white/10 px-6 py-2 text-sm font-medium tracking-widest text-white backdrop-blur-md">
                            VENDIDO
                        </span>
                    </div>
                )}

                {/* DESKTOP ONLY: Hover Button */}
                {!isSold && (
                    <div className="hidden md:block absolute bottom-12 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-10">
                        <Button
                            onClick={handleAddToCart}
                            disabled={isInCart}
                            className={cn(
                                "w-full shadow-lg backdrop-blur-sm font-medium",
                                isInCart ? "bg-green-600 hover:bg-green-600 text-white" : "bg-white/90 text-black hover:bg-white"
                            )}
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {isInCart ? 'En Carrito' : 'Añadir'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="space-y-2">
                <div>
                    <h3 className="font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-lg font-bold text-foreground">
                            {product.price?.toFixed(2) || '0.00'} Bs
                        </p>
                    </div>
                </div>

                {/* MOBILE ONLY: Always visible Button */}
                {!isSold && (
                    <Button
                        onClick={handleAddToCart}
                        size="sm"
                        disabled={isInCart}
                        className={cn(
                            "w-full md:hidden shadow-sm",
                            isInCart ? "bg-green-600 hover:bg-green-600 text-white" : "bg-primary text-primary-foreground"
                        )}
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {isInCart ? 'En Carrito' : 'Añadir al Carrito'}
                    </Button>
                )}
            </div>
        </div>
    );
}
