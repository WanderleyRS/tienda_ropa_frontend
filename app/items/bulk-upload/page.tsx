'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import apiClient, { comprasApi, CompraEstado, Category } from '@/lib/api';
import { Image as ImageIcon, Save, ArrowLeft, ArrowRight, CheckCircle, UploadCloud, ShoppingBag, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

// Interfaces
interface Almacen {
    id: number;
    nombre: string;
}

interface ParsedItem {
    title: string;
    description: string;
    price: number;
    size?: string;
}

interface StructuredItem extends ParsedItem {
    stock: number;
    category_id: number;
    almacen_id: number;
    image_index: number;
    size?: string;
    precio_compra: number;
    compra_id?: number;
}

function BulkUploadContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    
    // Contexto de Compra
    const compraIdStr = searchParams.get('compra_id');
    const compraId = compraIdStr ? parseInt(compraIdStr) : null;

    // Global State
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Data State
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [compraEstado, setCompraEstado] = useState<CompraEstado | null>(null);

    // Step 1 State
    const [files, setFiles] = useState<File[]>([]);
    const [rawText, setRawText] = useState('');
    const [selectedAlmacenId, setSelectedAlmacenId] = useState<number>(0);

    // Step 2 State
    const [itemsToReview, setItemsToReview] = useState<StructuredItem[]>([]);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            fetchInitialData();
        }
    }, [isAuthenticated, isAuthLoading, router]);

    const fetchInitialData = async () => {
        try {
            const [almacenesRes, categoriesRes] = await Promise.all([
                apiClient.get('/companies/almacenes'),
                apiClient.get('/categories/')
            ]);
            setAlmacenes(almacenesRes.data);
            setCategories(categoriesRes.data);

            if (almacenesRes.data.length > 0) {
                setSelectedAlmacenId(almacenesRes.data[0].id);
            }

            // Si hay compra_id, cargar su estado
            if (compraId) {
                const estado = await comprasApi.getCompraEstado(compraId);
                setCompraEstado(estado);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            setMessage({ type: 'error', text: 'Error cargando almacenes o categorías.' });
        }
    };

    // --- Handlers Step 1 ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleParse = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsLoading(true);

        try {
            if (files.length === 0) throw new Error("Debes subir al menos una imagen.");
            if (!rawText.trim()) throw new Error("Debes ingresar el texto de los items.");
            if (!selectedAlmacenId) throw new Error("Selecciona un almacén.");

            const formData = new FormData();
            formData.append('raw_text_block', rawText);

            const response = await apiClient.post('/items/parse-text', formData);
            const parsedData: ParsedItem[] = response.data;

            if (parsedData.length === 0) throw new Error("No se detectaron items en el texto.");

            // Si estamos en modo compra, usar solo categorías de la compra
            let defaultCategoryId = categories.length > 0 ? categories[0].id : 1;
            if (compraEstado && compraEstado.detalles.length > 0) {
                defaultCategoryId = compraEstado.detalles[0].categoria_id;
            }

            const structured: StructuredItem[] = parsedData.map((item, index) => {
                const detail = compraEstado?.detalles.find(d => d.categoria_id === defaultCategoryId);
                return {
                    ...item,
                    stock: 1,
                    category_id: defaultCategoryId,
                    almacen_id: selectedAlmacenId,
                    image_index: index < files.length ? index : -1,
                    size: item.size || undefined,
                    precio_compra: detail ? detail.costo_promedio_sugerido : 0,
                    compra_id: compraId || undefined
                };
            });

            setItemsToReview(structured);
            setStep(2);
            toast.success(`Se detectaron ${parsedData.length} items.`);

        } catch (error: any) {
            console.error('Parse Error:', error);
            setMessage({ type: 'error', text: error.message || "Error al analizar el texto." });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Lógica de Bolsa Residual en Tiempo Real (Frontend) ---
    const residualPools = useMemo(() => {
        if (!compraEstado) return null;

        // Clonar detalles para calcular el restante localmente
        const pools = compraEstado.detalles.map(d => ({
            ...d,
            monto_restante_local: d.monto_restante,
            items_restantes_local: d.items_restantes
        }));

        // Restar lo que el usuario está configurando en la tabla
        itemsToReview.forEach(item => {
            const pool = pools.find(p => p.categoria_id === item.category_id);
            if (pool) {
                pool.monto_restante_local -= (item.precio_compra || 0);
                pool.items_restantes_local -= 1;
            }
        });

        return pools;
    }, [compraEstado, itemsToReview]);

    const updateItem = (index: number, field: keyof StructuredItem, value: any) => {
        const newItems = [...itemsToReview];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Si cambió la categoría, actualizar el costo de compra sugerido
        if (field === 'category_id' && compraEstado) {
            const detail = compraEstado.detalles.find(d => d.categoria_id === value);
            if (detail) {
                newItems[index].precio_compra = detail.costo_promedio_sugerido;
            }
        }
        
        setItemsToReview(newItems);
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            formData.append('data', JSON.stringify(itemsToReview));

            await apiClient.post('/items/bulk-create-structured', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("¡Carga masiva completada exitosamente!");
            setTimeout(() => router.push(compraId ? `/compras/${compraId}` : '/dashboard'), 1500);

        } catch (error: any) {
            console.error('Submit Error:', error);
            toast.error(error.response?.data?.detail || "Error al guardar los items.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthLoading || !isAuthenticated) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="max-w-6xl mx-auto p-4 sm:p-8">
                {/* Header Contextual */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <ShoppingBag className="h-8 w-8 text-primary" />
                            {compraId ? 'Clasificación de Lote (Asistente)' : 'Carga Masiva General'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {compraId 
                                ? `Procesando compra ${compraEstado?.codigo || '...'}` 
                                : 'Sube múltiples prendas rápidamente usando fotos y texto.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            1. Preparación
                        </div>
                        <div className="h-px w-4 bg-muted" />
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            2. Revisión
                        </div>
                    </div>
                </div>

                {/* Dashboard de Bolsa (Solo en Paso 2 y Modo Compra) */}
                {step === 2 && residualPools && (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {residualPools.map(pool => {
                            const cat = categories.find(c => c.id === pool.categoria_id);
                            const isOverBudget = pool.monto_restante_local < -0.01;
                            const isOverUnits = pool.items_restantes_local < 0;
                            
                            return (
                                <Card key={pool.categoria_id} className={`border-1 transition-all ${isOverBudget || isOverUnits ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/10 border-white/5'}`}>
                                    <CardContent className="p-3">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase truncate mb-1">{cat?.name}</p>
                                        <div className="flex justify-between items-end">
                                            <p className={`text-sm font-black ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                                                {pool.monto_restante_local.toFixed(0)} <span className="text-[8px]">Bs</span>
                                            </p>
                                            <span className={`text-[9px] font-bold ${isOverUnits ? 'text-destructive' : 'text-foreground/60'}`}>
                                                {pool.items_restantes_local} slots
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {step === 1 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="bg-muted/10 border-white/5">
                                <CardHeader className="py-4 px-5">
                                    <CardTitle className="text-sm uppercase font-black">Configuración</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 px-5 pb-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Almacén de Destino</Label>
                                        <select
                                            className="w-full h-9 px-2 border rounded-md bg-background text-sm border-white/10"
                                            value={selectedAlmacenId}
                                            onChange={(e) => setSelectedAlmacenId(Number(e.target.value))}
                                        >
                                            {almacenes.map(a => (
                                                <option key={a.id} value={a.id}>{a.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {compraId && (
                                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-3">
                                            <Info className="h-4 w-4 text-primary shrink-0" />
                                            <p className="text-[10px] leading-tight font-medium opacity-80">
                                                <b>Modo Asistente:</b> Vinculación automática a compra {compraEstado?.codigo}.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            <Card className="bg-muted/10 border-white/5">
                                <CardContent className="p-5 space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold opacity-80 italic uppercase">1. Sube las Fotos</Label>
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:bg-white/5 hover:border-primary/40 transition-all text-center cursor-pointer relative group">
                                            <Input
                                                type="file" multiple accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={handleFileChange}
                                            />
                                            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                                            <p className="text-xs font-medium opacity-60">
                                                {files.length > 0
                                                    ? `${files.length} fotos seleccionadas`
                                                    : "Arrastra las fotos de las prendas"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold opacity-80 italic uppercase">2. Texto de WhatsApp</Label>
                                        <textarea
                                            className="w-full min-h-[200px] p-4 border rounded-md bg-background font-mono text-xs border-white/10 focus:ring-1 focus:ring-primary/40 outline-none"
                                            placeholder="[10:30 a. m.] Vania: Polera Nike Roja XL 150..."
                                            value={rawText}
                                            onChange={(e) => setRawText(e.target.value)}
                                        />
                                    </div>

                                    <Button onClick={handleParse} disabled={isLoading} className="w-full h-11 text-base font-black italic uppercase shadow-lg shadow-primary/10">
                                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                        Analizar con IA
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Card className="bg-muted/10 border-white/5 shadow-xl">
                            <CardHeader className="py-3 px-6 border-b border-white/5 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-black uppercase italic tracking-tight">Revisión del Lote</CardTitle>
                                    <CardDescription className="text-[10px]">Valida la clasificación y costos antes de guardar</CardDescription>
                                </div>
                                <Button variant="ghost" onClick={() => setStep(1)} size="sm" className="h-8 text-[10px] font-bold uppercase border border-white/5">
                                    <ArrowLeft className="mr-2 h-3 w-3" /> Editar
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {itemsToReview.map((item, idx) => (
                                        <div key={idx} className="flex flex-col lg:flex-row gap-4 p-4 hover:bg-white/5 transition-colors">
                                            {/* Selector de Imagen */}
                                            <div className="w-full lg:w-32 shrink-0">
                                                <div className="aspect-square rounded-lg border border-white/10 overflow-hidden bg-muted relative group">
                                                    {item.image_index >= 0 && files[item.image_index] ? (
                                                        <img src={URL.createObjectURL(files[item.image_index])} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-[9px] font-bold opacity-40 uppercase">Sin Foto</div>
                                                    )}
                                                    <select
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        value={item.image_index}
                                                        onChange={(e) => updateItem(idx, 'image_index', Number(e.target.value))}
                                                    >
                                                        <option value={-1}>N/A</option>
                                                        {files.map((f, fIdx) => (
                                                            <option key={fIdx} value={fIdx}>Foto {fIdx + 1}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Datos del Item */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Título</Label>
                                                        <Input size={1} className="h-8 text-sm border-white/10" value={item.title} onChange={(e) => updateItem(idx, 'title', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Descripción</Label>
                                                        <textarea
                                                            className="w-full h-14 p-2 border rounded-md bg-background text-xs border-white/10 outline-none"
                                                            value={item.description}
                                                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Categoría</Label>
                                                        <select
                                                            className="w-full h-8 px-2 border rounded-md bg-background text-xs border-white/10"
                                                            value={item.category_id}
                                                            onChange={(e) => updateItem(idx, 'category_id', Number(e.target.value))}
                                                        >
                                                            {compraEstado 
                                                                ? compraEstado.detalles.map(d => (
                                                                    <option key={d.categoria_id} value={d.categoria_id}>
                                                                        {categories.find(c => c.id === d.categoria_id)?.name}
                                                                    </option>
                                                                ))
                                                                : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                            }
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Talla</Label>
                                                        <Input className="h-8 text-xs border-white/10" value={item.size || ''} onChange={(e) => updateItem(idx, 'size', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-primary opacity-80">Precio Venta</Label>
                                                        <Input type="number" step="0.01" className="h-8 text-xs font-bold border-primary/20" value={item.price} onChange={(e) => updateItem(idx, 'price', Number(e.target.value))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Costo Compra</Label>
                                                        <Input type="number" step="0.01" className="h-8 text-xs font-mono bg-muted/20 border-white/10" value={item.precio_compra} onChange={(e) => updateItem(idx, 'precio_compra', Number(e.target.value))} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center py-4 px-6 border-t border-white/5 bg-muted/20">
                                <div className="text-[11px] text-muted-foreground font-medium italic">
                                    {itemsToReview.length} prendas listas.
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={isLoading} className="h-9 text-xs uppercase font-bold">Cancelar</Button>
                                    <Button onClick={handleFinalSubmit} disabled={isLoading} className="h-9 px-8 text-xs font-black uppercase italic shadow-lg shadow-primary/10">
                                        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                        Guardar Todo
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BulkUploadPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
            <BulkUploadContent />
        </Suspense>
    );
}