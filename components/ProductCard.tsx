'use client';

import { Item } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

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
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border bg-card hover:-translate-y-1">
            <div className="relative aspect-[4/5] overflow-hidden bg-secondary/20">
                <img
                    src={product.photo_url.startsWith('http') ? product.photo_url : `${API_BASE_URL}${product.photo_url}`}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%239ca3af"%3E%3F%3C/text%3E%3C/svg%3E';
                    }}
                />
                {isSold && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white text-black px-6 py-2 font-bold text-lg border-2 border-black transform -rotate-12 shadow-xl">
                            VENDIDO
                        </span>
                    </div>
                )}
                {!isSold && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            onClick={handleAddToCart}
                            className="w-full bg-white text-black hover:bg-gray-200 font-semibold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 border-none"
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Añadir al Carrito
                        </Button>
                    </div>
                )}
            </div>
            <CardContent className="p-5">
                <div className="mb-2">
                    <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2 min-h-[3rem] group-hover:underline decoration-1 underline-offset-4 transition-all">
                        {product.title}
                    </h3>
                </div>
                <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Precio</span>
                        <span className="text-2xl font-bold text-foreground">
                            ${product.price?.toFixed(2) || '0.00'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
