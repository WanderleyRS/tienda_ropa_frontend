'use client';

import { useState, useEffect } from 'react';
import { itemsApi, Item, categoriesApi } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { CartButton } from '@/components/CartButton';
import { ShoppingBag, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function TiendaPage() {
    const [products, setProducts] = useState<Item[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadProducts();
        }, 500); // Debounce search

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory]);

    const loadCategories = async () => {
        try {
            const data = await categoriesApi.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadProducts = async () => {
        try {
            setIsLoading(true);
            const params: any = { is_sold: false };

            if (searchQuery.trim()) {
                params.search = searchQuery;
            }

            if (selectedCategory !== 'all') {
                params.category_id = Number(selectedCategory);
            }

            const data = await itemsApi.getAll(params);
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/tienda" className="flex items-center gap-2 group">
                        <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                            <ShoppingBag className="h-6 w-6 text-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground hidden sm:block">
                            Tienda Ropa MVP
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <CartButton />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-secondary/30 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-6">
                        Estilo Único, <span className="text-foreground underline decoration-4 decoration-primary/20">Segunda Vida</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        Descubre prendas exclusivas, dale una nueva oportunidad a la moda y viste con conciencia. Calidad y estilo a precios increíbles.
                    </p>

                    {/* Search & Filter Toolbar */}
                    <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-lg border border-border flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="¿Qué estás buscando hoy?"
                                className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent h-12 text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                            >
                                <SelectTrigger className="h-12 border-0 bg-secondary/50 hover:bg-secondary focus:ring-0 rounded-xl">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">
                        Explorar Colección
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {products.length} productos encontrados
                    </span>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-card rounded-2xl border border-border h-[400px] animate-pulse"
                            >
                                <div className="h-64 bg-muted rounded-t-2xl" />
                                <div className="p-4 space-y-3">
                                    <div className="h-6 bg-muted rounded w-3/4" />
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Products Grid */}
                {!isLoading && products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && products.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-border">
                        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                            No encontramos lo que buscas
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Intenta ajustar los filtros o busca con otros términos. ¡Siempre agregamos nuevas prendas!
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="mt-6 text-primary font-medium hover:underline"
                        >
                            Ver todos los productos
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
