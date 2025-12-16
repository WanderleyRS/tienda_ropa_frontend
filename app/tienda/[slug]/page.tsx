'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, categoriesApi, companiesApi } from '@/lib/api'; // Direct import to avoid circular dependency issues if any
import { Item, Category, Empresa } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/ProductCard';
import axios from 'axios';

function TiendaSlugContent() {
    const params = useParams();
    const slug = params.slug as string;

    const { user, isAuthenticated } = useAuth();

    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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

                // 2. Fetch Categories for this company
                // Note: we might need to adjust getAll to accept just empresa_id, assuming backend handles filtering
                const categoriesData = await categoriesApi.getAll({ empresa_id: empresaData.id });
                setCategories(categoriesData);

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

    }, [slug]);


    // Filtering logic (same as main TiendaPage)
    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Ensure we only show unsold items for public view unless authenticated logic says otherwise
        // But the requirement is specific to public store view, ideally backend filters sold items.
        // For now, let's trust the backend or add client-side filter if needed.
        // Assuming public view should hide sold items:
        const isAvailable = !item.is_sold;

        return matchesCategory && matchesSearch && isAvailable;
    });

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
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {empresa.store_subtitle || "Bienvenido a nuestra tienda online."}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-16 z-30 bg-background/95 backdrop-blur-sm p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar productos..."
                            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar items-center">
                        <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                            className="whitespace-nowrap rounded-full"
                        >
                            Todos
                        </Button>
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={selectedCategory === category.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category.id)}
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
                        {selectedCategory && (
                            <Button variant="link" onClick={() => setSelectedCategory(null)} className="mt-2">
                                Ver todos los productos
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {filteredItems.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TiendaSlugPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <TiendaSlugContent />
        </Suspense>
    );
}
