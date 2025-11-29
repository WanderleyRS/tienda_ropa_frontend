'use client';

import { CartItem } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemCardProps {
    item: CartItem;
    onUpdateQuantity: (id: number, quantity: number) => void;
    onRemove: (id: number) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
    const itemSubtotal = item.price * item.quantity;

    return (
        <div className="flex gap-4 p-4 bg-white rounded-lg border">
            {/* Product Image */}
            <div className="w-24 h-24 flex-shrink-0">
                <img
                    src={item.photo_url.startsWith('http') ? item.photo_url : `${process.env.NEXT_PUBLIC_API_URL || 'https://tiendaropabackend-production.up.railway.app'}${item.photo_url}`}
                    alt={item.title}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect width="96" height="96" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%239ca3af"%3E%3F%3C/text%3E%3C/svg%3E';
                    }}
                />
            </div>

            {/* Product Info */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-gray-500">Precio unitario: ${item.price.toFixed(2)}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border rounded-lg">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Subtotal */}
            <div className="flex flex-col items-end justify-between">
                <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-xl font-bold">${itemSubtotal.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
}
