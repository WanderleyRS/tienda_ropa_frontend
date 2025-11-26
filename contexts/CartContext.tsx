'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Item } from '@/lib/api';

export interface CartItem {
    id: number;
    title: string;
    price: number;
    quantity: number;
    photo_url: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Item) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    subtotal: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('shopping_cart');
            if (savedCart) {
                try {
                    setItems(JSON.parse(savedCart));
                } catch (error) {
                    console.error('Error loading cart from localStorage:', error);
                }
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('shopping_cart', JSON.stringify(items));
        }
    }, [items]);

    const addToCart = (product: Item) => {
        setItems((currentItems) => {
            // Check if product already exists in cart
            const existingItem = currentItems.find((item) => item.id === product.id);

            if (existingItem) {
                // Increment quantity if already in cart
                return currentItems.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Add new item to cart
                return [
                    ...currentItems,
                    {
                        id: product.id,
                        title: product.title,
                        price: product.price || 0,
                        quantity: 1,
                        photo_url: product.photo_url,
                    },
                ];
            }
        });
    };

    const removeFromCart = (productId: number) => {
        setItems((currentItems) =>
            currentItems.filter((item) => item.id !== productId)
        );
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setItems((currentItems) =>
            currentItems.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    // Calculate subtotal
    const subtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    // Calculate total item count
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                subtotal,
                itemCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
