'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient, itemsApi, categoriesApi, companiesApi, classificationsApi, Item, Category, Empresa } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { Navbar } from '@/components/Navbar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Suspense } from 'react';

function TiendaContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const publicEmpresaId = searchParams.get('empresa_id');

    const [products, setProducts] = useState<Item[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedClassificationId, setSelectedClassificationId] = useState<string>('all');
    const [selectedSize, setSelectedSize] = useState<string>('all');
    const [classifications, setClassifications] = useState<any[]>([]); // Add classifications state

    // Branding State
    const [branding, setBranding] = useState({
        title1: 'Colección Exclusiva',
        title2: 'Estilo con Historia',
        subtitle: 'Piezas únicas seleccionadas para quienes buscan calidad, sostenibilidad y un estilo inconfundible.'
    });

    useEffect(() => {
        loadBranding();
    }, [user, publicEmpresaId]);

    const loadBranding = async () => {
        try {
            if (publicEmpresaId) {
                // Tienda Pública: Cargar branding de la empresa específica
                const empresaData = await companiesApi.getPublicEmpresa(Number(publicEmpresaId));
                setBranding({
                    title1: empresaData.store_title_1 || 'Colección Exclusiva',
                    title2: empresaData.store_title_2 || 'Estilo con Historia',
                    subtitle: empresaData.store_subtitle || 'Piezas únicas seleccionadas para quienes buscan calidad, sostenibilidad y un estilo inconfundible.'
                });
            } else if (user) {
                // Usuario Logueado: Cargar branding de su propia empresa
                const empresaData = await companiesApi.getEmpresa();
                setBranding({
                    title1: empresaData.store_title_1 || 'Colección Exclusiva',
                    title2: empresaData.store_title_2 || 'Estilo con Historia',
                    subtitle: empresaData.store_subtitle || 'Piezas únicas seleccionadas para quienes buscan calidad, sostenibilidad y un estilo inconfundible.'
                });
            }
        } catch (error) {
            console.log('Using default branding', error);
        }
    };

    useEffect(() => {
        loadData();
    }, [publicEmpresaId]); // Only reload when empresa changes, not when filters change

    const loadData = async () => {
        try {
            setIsLoading(true);
            const empresaIdParam = publicEmpresaId ? parseInt(publicEmpresaId) : undefined;

            const [productsData, categoriesData, classificationsData] = await Promise.all([
                itemsApi.getAll({ is_sold: false, empresa_id: empresaIdParam }),
                categoriesApi.getAll(empresaIdParam ? { empresa_id: empresaIdParam } : undefined),
                classificationsApi.getAll(empresaIdParam ? { empresa_id: empresaIdParam } : undefined)
            ]);

            setProducts(productsData);
            setCategories(categoriesData);
            setClassifications(classificationsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        // Debug logging
        console.log('Filtering product:', {
            title: product.title,
            category_id: product.category_id,
            talla: product.talla,
            selectedCategory,
            selectedSize,
            selectedClassificationId
        });

        // Filter by Category
        const matchesCategory = selectedCategory === 'all' || product.category_id === Number(selectedCategory);

        // Filter by Classification (using category relationship)
        let matchesClassification = true;
        if (selectedClassificationId !== 'all') {
            const cat = categories.find(c => c.id === product.category_id);
            matchesClassification = cat?.classification_id === Number(selectedClassificationId);
            console.log('Classification check:', {
                productCategory: cat,
                expectedClassificationId: Number(selectedClassificationId),
                matches: matchesClassification
            });
        }

        // Filter by Size
        const matchesSize = selectedSize === 'all' || product.talla === selectedSize;

        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const result = matchesCategory && matchesSearch && matchesClassification && matchesSize;
        console.log('Filter result:', { matchesCategory, matchesClassification, matchesSize, matchesSearch, finalResult: result });

        return result;
    });

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <Navbar />

            {/* Hero Section */}
            <div className="relative pt-20 pb-32 sm:pt-32 sm:pb-40 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/5 rounded-full blur-3xl opacity-30" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-secondary/30 text-xs font-medium tracking-widest text-muted-foreground mb-6 uppercase">
                        {branding.title1}
                    </span>
                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground mb-8 leading-tight">
                        {branding.title2.split(' ').slice(0, -1).join(' ')} <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                            {branding.title2.split(' ').slice(-1)}
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                        {branding.subtitle}
                    </p>

                    {/* Floating Search Bar */}
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-background/80 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-border/50 flex flex-col sm:flex-row gap-2 transition-all hover:border-primary/20 hover:shadow-primary/5">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Buscar prendas..."
                                    className="pl-12 border-0 shadow-none focus-visible:ring-0 bg-transparent h-12 text-base text-foreground placeholder:text-muted-foreground/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                                {/* Classification Filter */}
                                <Select
                                    value={selectedClassificationId}
                                    onValueChange={(val) => {
                                        setSelectedClassificationId(val);
                                        setSelectedCategory('all'); // Reset category
                                    }}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px] h-12 border-0 bg-secondary/50 hover:bg-secondary focus:ring-0 rounded-xl text-foreground font-medium transition-colors">
                                        <SelectValue placeholder="Clasificación" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {classifications.map((c: any) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Size Filter */}
                                <Select
                                    value={selectedSize}
                                    onValueChange={setSelectedSize}
                                >
                                    <SelectTrigger className="w-full sm:w-[100px] h-12 border-0 bg-secondary/50 hover:bg-secondary focus:ring-0 rounded-xl text-foreground font-medium transition-colors">
                                        <SelectValue placeholder="Talla" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'].map((size) => (
                                            <SelectItem key={size} value={size}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Category Filter */}
                                <Select
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                >
                                    <SelectTrigger className="h-12 border-0 bg-secondary/50 hover:bg-secondary focus:ring-0 rounded-xl text-foreground font-medium transition-colors">
                                        <SelectValue placeholder="Categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {categories
                                            .filter(cat => selectedClassificationId === 'all' || cat.classification_id === Number(selectedClassificationId))
                                            .map((category) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="mb-12 flex items-end justify-between border-b border-border/40 pb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground tracking-tight">
                            Catálogo
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Explora nuestras últimas adiciones
                        </p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full">
                        {products.length} items
                    </span>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="space-y-4 animate-pulse"
                            >
                                <div className="aspect-[3/4] bg-secondary/20 rounded-xl" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-secondary/20 rounded w-3/4" />
                                    <div className="h-4 bg-secondary/20 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Products Grid */}
                {!isLoading && products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && products.length === 0 && (
                    <div className="text-center py-32">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/20 mb-6">
                            <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                            Sin resultados
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            No encontramos prendas que coincidan con tu búsqueda. Intenta con otros términos o categorías.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="text-primary font-medium hover:underline underline-offset-4"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function TiendaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
            <TiendaContent />
        </Suspense>
    );
}
