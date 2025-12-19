'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, categoriesApi, companiesApi, classificationsApi } from '@/lib/api'; // Direct import to avoid circular dependency issues if any
import { Item, Category, Empresa } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/ProductCard';
import axios from 'axios';

interface TiendaSlugContentProps {
    slug: string;
}

function TiendaSlugContent({ slug }: TiendaSlugContentProps) {
    const { user, isAuthenticated } = useAuth();

    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [classifications, setClassifications] = useState<any[]>([]); // Add classifications state
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedClassificationId, setSelectedClassificationId] = useState<string>('all');
    const [selectedSize, setSelectedSize] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Initial load based on Slug
    useEffect(() => {
        const initPublicStore = async () => {
            if (!slug) return;

            setLoading(true);
            try {
                // 1. Fetch Company by Slug
                const empresaData = await companiesApi.getPublicEmpresaBySlug(slug);
                setEmpresa(empresaData);

                // 2. Fetch Categories and Classifications for this company
                const [categoriesData, classificationsData] = await Promise.all([
                    categoriesApi.getAll({ empresa_id: empresaData.id }),
                    classificationsApi.list(empresaData.id)
                ]);
                setCategories(categoriesData);
                setClassifications(classificationsData);

                // 3. Fetch Items for this company
                // Explicitly pass empresa_id to list endpoint
                const response = await apiClient.get<Item[]>('/items/', {
                    params: {
                        empresa_id: empresaData.id,
                        skip: 0,
                        limit: 100
                    }
                });
                // Filter only active/available items if needed, though backend should handle visibility logic
                setItems(response.data);

            } catch (err) {
                console.error("Error loading public store by slug", err);
                setError("No se pudo cargar la tienda. Verifica la dirección web.");
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setError("Tienda no encontrada.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            initPublicStore();
        }

    }, [slug]); // Only reload when slug changes, not when filters change


    // Debug: Log filter states and data BEFORE filtering
    console.log('=== FILTER DEBUG START ===');
    console.log('Filter States:', {
        selectedCategory,
        selectedClassificationId,
        selectedSize,
        searchQuery
    });
    console.log('Total items:', items.length);
    console.log('Sample item (first):', items[0]);
    console.log('Categories available:', categories.map(c => ({ id: c.id, name: c.name, classification_id: c.classification_id })));
    console.log('=== STARTING FILTER ===');

    // Filtering logic
    const filteredItems = items.filter(item => {
        // Debug logging
        console.log('Filtering item:', {
            title: item.title,
            category_id: item.category_id,
            talla: item.talla,
            selectedCategory,
            selectedSize,
            selectedClassificationId
        });

        // Filter by Category
        const matchesCategory = selectedCategory === 'all' || item.category_id === Number(selectedCategory);

        // Filter by Classification (using category relationship)
        let matchesClassification = true;
        if (selectedClassificationId !== 'all') {
            const cat = categories.find(c => c.id === item.category_id);
            matchesClassification = cat?.classification_id === Number(selectedClassificationId);
            console.log('Classification check:', {
                itemCategory: cat,
                expectedClassificationId: Number(selectedClassificationId),
                matches: matchesClassification
            });
        }

        // Filter by Size - if item has no size (null), show it in all size filters
        const matchesSize = selectedSize === 'all' || !item.talla || item.talla === selectedSize;

        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Ensure we only show unsold items for public view
        const isAvailable = !item.is_sold;

        const result = matchesCategory && matchesSearch && matchesClassification && matchesSize && isAvailable;
        console.log('Filter result:', { matchesCategory, matchesClassification, matchesSize, matchesSearch, isAvailable, finalResult: result });

        return result;
    });

    console.log('=== FILTER COMPLETE ===');
    console.log('Filtered items count:', filteredItems.length);
    console.log('=== FILTER DEBUG END ===');

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <ShoppingBag className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold">{error}</h2>
                <Button onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
        );
    }

    if (!empresa) {
        return null; // Should be handled by loading or error
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section with Company Branding */}
            <div className="bg-secondary/20 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 text-center">
                    {empresa.navbar_icon_url && (
                        <div className="mb-4 flex justify-center">
                            <img
                                src={empresa.navbar_icon_url}
                                alt={empresa.nombre}
                                className="h-20 w-20 object-contain rounded-xl bg-white p-2 shadow-sm"
                            />
                        </div>
                    )}
                    <h1 className="text-3xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-3">
                        {empresa.store_title_1 || empresa.nombre}
                    </h1>
                    {empresa.store_title_2 && (
                        <h2 className="text-xl sm:text-2xl font-semibold text-muted-foreground mb-4">
                            {empresa.store_title_2}
                        </h2>
                    )}
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {empresa.store_subtitle || "Bienvenido a nuestra tienda online."}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 bg-background/95 backdrop-blur-sm p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar productos..."
                            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar items-center">

                        {/* Classification Filter */}
                        <div className="w-full sm:w-auto">
                            {/* Simplified Select for mobile friendliness just using standard HTML select if needed or maintain UI lib */}
                        </div>

                        {/* Classification Filter */}
                        <div className="min-w-[140px]">
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedClassificationId}
                                onChange={(e) => {
                                    setSelectedClassificationId(e.target.value);
                                    setSelectedCategory('all'); // Reset category
                                }}
                            >
                                <option value="all">Clasificación</option>
                                {classifications.map((c: any) => (
                                    <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Size Filter */}
                        <div className="min-w-[100px]">
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                            >
                                <option value="all">Talla</option>
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                        <Button
                            variant={selectedCategory === 'all' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                            className="whitespace-nowrap rounded-full"
                        >
                            Todos
                        </Button>
                        {categories
                            .filter(cat => selectedClassificationId === 'all' || cat.classification_id === Number(selectedClassificationId))
                            .map((category) => (
                                <Button
                                    key={category.id}
                                    variant={selectedCategory === String(category.id) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(String(category.id))}
                                    className="whitespace-nowrap rounded-full"
                                >
                                    {category.name}
                                </Button>
                            ))}
                    </div>
                </div>

                {/* Items Grid */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
                        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No se encontraron productos</h3>
                        <p className="text-muted-foreground">Intenta cambiar los filtros o busca con otro término.</p>
                        {(selectedCategory !== 'all' || selectedClassificationId !== 'all' || selectedSize !== 'all') && (
                            <Button variant="link" onClick={() => {
                                setSelectedCategory('all');
                                setSelectedClassificationId('all');
                                setSelectedSize('all');
                            }} className="mt-2">
                                Ver todos los productos
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {filteredItems.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TiendaSlugPage({ slug }: { slug: string }) {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <TiendaSlugContent slug={slug} />
        </Suspense>
    );
}
