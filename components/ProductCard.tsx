'use client';

import { Item } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { getValidImageUrl } from '@/lib/utils';

interface ProductCardProps {
    product: Item;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const isSold = product.is_sold;

    const handleAddToCart = () => {
        addToCart(product);
        toast.success(`${product.title} añadido al carrito`);
    };

    return (
        <div className="group relative flex flex-col gap-3">
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary/20 shadow-sm transition-all duration-500 group-hover:shadow-md">
                <img
                    src={getValidImageUrl(product.photo_url)}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%239ca3af"%3E%3F%3C/text%3E%3C/svg%3E';
                    }}
                />

                {/* Badges & Overlays */}
                {isSold && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <span className="border border-white/30 bg-white/10 px-6 py-2 text-sm font-medium tracking-widest text-white backdrop-blur-md">
                            VENDIDO
                        </span>
                    </div>
                )}

                {/* DESKTOP ONLY: Hover Button */}
                {!isSold && (
                    <div className="hidden md:block absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <Button
                            onClick={handleAddToCart}
                            className="w-full bg-white/90 text-black hover:bg-white shadow-lg backdrop-blur-sm font-medium"
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Añadir
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
                            ${product.price?.toFixed(2) || '0.00'}
                        </p>
                    </div>
                </div>

                {/* MOBILE ONLY: Always visible Button */}
                {!isSold && (
                    <Button
                        onClick={handleAddToCart}
                        size="sm"
                        className="w-full md:hidden bg-primary text-primary-foreground shadow-sm"
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Añadir al Carrito
                    </Button>
                )}
            </div>
        </div>
    );
}
