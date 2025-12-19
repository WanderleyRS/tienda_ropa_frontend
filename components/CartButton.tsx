'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

export function CartButton() {
    const { itemCount } = useCart();

    return (
        <Link href="/carrito">
            <Button
                size="lg"
                className="relative h-14 w-14 rounded-full shadow-2xl hover:shadow-primary/50 transition-all hover:scale-110 bg-primary hover:bg-primary/90"
            >
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                        {itemCount}
                    </span>
                )}
            </Button>
        </Link>
    );
}
