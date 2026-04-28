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
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {residualPools.map(pool => {
                            const cat = categories.find(c => c.id === pool.categoria_id);
                            const isOverBudget = pool.monto_restante_local < -0.01;
                            const isOverUnits = pool.items_restantes_local < 0;
                            
                            return (
                                <Card key={pool.categoria_id} className={`border-l-4 ${isOverBudget || isOverUnits ? 'border-l-destructive bg-destructive/5' : 'border-l-primary'}`}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm truncate">{cat?.name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isOverUnits ? 'bg-destructive text-destructive-foreground' : 'bg-primary/10 text-primary'}`}>
                                                {pool.items_restantes_local} prendas por asignar
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase">Saldo Bolsa</p>
                                                <p className={`text-lg font-mono font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                                                    {pool.monto_restante_local.toFixed(2)} Bs
                                                </p>
                                            </div>
                                            {isOverBudget && <AlertCircle className="h-4 w-4 text-destructive mb-1" />}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {step === 1 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <CardTitle>Configuración</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Almacén de Destino</Label>
                                        <select
                                            className="w-full p-2 border rounded-md bg-background text-sm"
                                            value={selectedAlmacenId}
                                            onChange={(e) => setSelectedAlmacenId(Number(e.target.value))}
                                        >
                                            {almacenes.map(a => (
                                                <option key={a.id} value={a.id}>{a.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {compraId && (
                                        <Alert className="bg-primary/5 py-2">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                Modo Asistente Activo: Los items se vincularán a la compra <b>{compraEstado?.codigo}</b> automáticamente.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-base font-bold">1. Sube las Fotos</Label>
                                        <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 hover:bg-primary/5 hover:border-primary/40 transition-all text-center cursor-pointer relative group">
                                            <Input
                                                type="file" multiple accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={handleFileChange}
                                            />
                                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                                            <p className="text-sm font-medium">
                                                {files.length > 0
                                                    ? `${files.length} fotos seleccionadas`
                                                    : "Haz clic o arrastra las fotos de las prendas"}
                                            </p>
                                        </div>
                                        {files.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto py-2">
                                                {files.map((f, i) => (
                                                    <div key={i} className="w-16 h-16 shrink-0 rounded-md border overflow-hidden">
                                                        <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-base font-bold">2. Pega las descripciones de WhatsApp</Label>
                                        <textarea
                                            className="w-full min-h-[250px] p-4 border rounded-md bg-background font-mono text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="[10:30 a. m.] Vania: Polera Nike Roja XL 150&#10;[10:31 a. m.] Vania: Jean Levi's Azul 32 250..."
                                            value={rawText}
                                            onChange={(e) => setRawText(e.target.value)}
                                        />
                                    </div>

                                    <Button onClick={handleParse} disabled={isLoading} className="w-full h-12 text-lg shadow-lg shadow-primary/20">
                                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}
                                        Analizar con IA y Revisar
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Dashboard de Lote en tiempo real */}
                        {compraEstado && (
                            <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                                        <ShoppingBag className="h-4 w-4" /> Control de Bolsa Residual (Modo Asistido)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-6">
                                    {compraEstado.detalles.map(d => {
                                        // Calcular cuántos de los items en revisión pertenecen a esta categoría
                                        const enRevision = itemsToReview.filter(it => it.category_id === d.categoria_id).length;
                                        const slotsLibres = d.items_restantes - enRevision;
                                        const cat = categories.find(c => c.id === d.categoria_id);
                                        
                                        return (
                                            <div key={d.categoria_id} className={`p-3 rounded-xl border-2 transition-all ${slotsLibres < 0 ? 'bg-destructive/10 border-destructive animate-pulse' : 'bg-background border-primary/10'}`}>
                                                <p className="text-[10px] font-black uppercase text-muted-foreground truncate">{cat?.name || `Cat ${d.categoria_id}`}</p>
                                                <div className="flex justify-between items-end mt-1">
                                                    <span className="text-lg font-black leading-none">{slotsLibres}</span>
                                                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Slots</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-primary mt-1">
                                                    Pool: {d.monto_restante.toFixed(0)} Bs
                                                </p>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-primary/20 shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                                <div>
                                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Validación de Lote</CardTitle>
                                    <CardDescription>Vincula cada foto con su descripción y asigna el costo de inversión</CardDescription>
                                </div>
                                <Button variant="ghost" onClick={() => setStep(1)} size="sm" className="font-bold uppercase text-xs">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Editar Texto
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                            <div className="divide-y">
                                {itemsToReview.map((item, idx) => (
                                    <div key={idx} className="flex flex-col lg:flex-row gap-6 p-6 hover:bg-primary/5 transition-colors">
                                        {/* Selector de Imagen */}
                                        <div className="w-full lg:w-48 shrink-0">
                                            <div className="aspect-square rounded-lg border-2 border-muted overflow-hidden bg-secondary relative group">
                                                {item.image_index >= 0 && files[item.image_index] ? (
                                                    <img src={URL.createObjectURL(files[item.image_index])} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-bold uppercase">Sin Foto</div>
                                                )}
                                                <select
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    value={item.image_index}
                                                    onChange={(e) => updateItem(idx, 'image_index', Number(e.target.value))}
                                                >
                                                    <option value={-1}>Sin Imagen</option>
                                                    {files.map((f, fIdx) => (
                                                        <option key={fIdx} value={fIdx}>Foto #{fIdx + 1}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 text-center font-bold">CAMBIAR FOTO</div>
                                            </div>
                                        </div>

                                        {/* Datos del Item */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Título de la prenda</Label>
                                                    <Input value={item.title} onChange={(e) => updateItem(idx, 'title', e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Descripción / Notas</Label>
                                                    <textarea
                                                        className="w-full min-h-[80px] p-2 border rounded-md bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs uppercase font-bold text-muted-foreground">Categoría</Label>
                                                        <select
                                                            className="w-full h-10 px-2 border rounded-md bg-background text-sm"
                                                            value={item.category_id}
                                                            onChange={(e) => updateItem(idx, 'category_id', Number(e.target.value))}
                                                        >
                                                            {compraEstado 
                                                                ? compraEstado.detalles.map(d => (
                                                                    <option key={d.categoria_id} value={d.categoria_id}>
                                                                        {categories.find(c => c.id === d.categoria_id)?.name || 'Cat'}
                                                                    </option>
                                                                ))
                                                                : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                            }
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs uppercase font-bold text-muted-foreground">Talla</Label>
                                                        <Input value={item.size || ''} onChange={(e) => updateItem(idx, 'size', e.target.value)} placeholder="Ej: M" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs uppercase font-bold text-primary">Precio Venta (Bs)</Label>
                                                        <Input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(idx, 'price', Number(e.target.value))} className="font-bold border-primary/40" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs uppercase font-bold text-muted-foreground">Costo de Compra (Bs)</Label>
                                                        <Input type="number" step="0.01" value={item.precio_compra} onChange={(e) => updateItem(idx, 'precio_compra', Number(e.target.value))} className="bg-muted/50 font-mono" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t p-6 bg-muted/20">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                {itemsToReview.length} prendas listas para ingresar al sistema.
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading} className="flex-1">Cancelar</Button>
                                <Button onClick={handleFinalSubmit} disabled={isLoading} className="flex-1 min-w-[200px] shadow-lg shadow-primary/20">
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                    Confirmar y Guardar
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