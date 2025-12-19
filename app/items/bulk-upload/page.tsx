'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import apiClient from '@/lib/api';
import { Image as ImageIcon, Save, ArrowLeft, ArrowRight, CheckCircle, UploadCloud } from 'lucide-react';

// Interfaces
interface Almacen {
    id: number;
    nombre: string;
}

interface Category {
    id: number;
    name: string;
}

interface ParsedItem {
    title: string;
    description: string;
    price: number;
    size?: string; // Talla extraída por Gemini/Regex
}

interface StructuredItem extends ParsedItem {
    stock: number;
    category_id: number;
    almacen_id: number;
    image_index: number; // Index in the files array
    size?: string; // Talla (inherited from ParsedItem but explicitly shown)
}

export default function BulkUploadPage() {
    const router = useRouter();
    const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    // Global State
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Data State
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

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
            if (files.length === 0) {
                throw new Error("Debes subir al menos una imagen.");
            }
            if (!rawText.trim()) {
                throw new Error("Debes ingresar el texto de los items.");
            }
            if (!selectedAlmacenId) {
                throw new Error("Selecciona un almacén.");
            }

            const formData = new FormData();
            formData.append('raw_text_block', rawText);

            // Call Parse Endpoint (Dry Run)
            const response = await apiClient.post('/items/parse-text', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const parsedData: ParsedItem[] = response.data;

            if (parsedData.length === 0) {
                throw new Error("No se detectaron items en el texto.");
            }

            // Map to Structured Items (Default assignments)
            const structured: StructuredItem[] = parsedData.map((item, index) => ({
                ...item,
                stock: 1,
                category_id: categories.length > 0 ? categories[0].id : 1,
                almacen_id: selectedAlmacenId,
                // Try to map image 1-to-1 if counts match, else default to -1 (none) or 0
                image_index: index < files.length ? index : -1,
                size: item.size || undefined // Preserve size from Gemini/Regex
            }));

            setItemsToReview(structured);
            setStep(2);
            setMessage({ type: 'success', text: `Se detectaron ${parsedData.length} items. Revisa y confirma.` });

        } catch (error: any) {
            console.error('Parse Error:', error);
            setMessage({ type: 'error', text: error.message || "Error al analizar el texto." });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handlers Step 2 ---

    const updateItem = (index: number, field: keyof StructuredItem, value: any) => {
        const newItems = [...itemsToReview];
        newItems[index] = { ...newItems[index], [field]: value };
        setItemsToReview(newItems);
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            // Validate
            for (let i = 0; i < itemsToReview.length; i++) {
                const item = itemsToReview[i];
                if (item.image_index < 0 || item.image_index >= files.length) {
                    throw new Error(`El item #${i + 1} (${item.title}) no tiene una imagen válida asignada.`);
                }
            }

            const formData = new FormData();

            // Append all files
            files.forEach((file) => {
                formData.append('files', file);
            });

            // Append data JSON
            const dataPayload = JSON.stringify(itemsToReview);
            formData.append('data', dataPayload);

            await apiClient.post('/items/bulk-create-structured', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessage({ type: 'success', text: "¡Carga masiva completada exitosamente!" });

            // Reset or Redirect
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (error: any) {
            console.error('Submit Error:', error);
            setMessage({ type: 'error', text: error.response?.data?.detail || error.message || "Error al guardar los items." });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render ---

    if (isAuthLoading || !isAuthenticated) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="max-w-6xl mx-auto p-4 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-foreground">
                        {step === 1 ? 'Carga Masiva: Preparación' : 'Carga Masiva: Revisión'}
                    </h1>
                    <div className="text-sm text-muted-foreground">
                        Paso {step} de 2
                    </div>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-md border ${message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-600'
                        : 'bg-destructive/10 border-destructive/20 text-destructive'
                        }`}>
                        {message.text}
                    </div>
                )}

                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Configuration */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuración Inicial</CardTitle>
                                    <CardDescription>Define el destino de la carga</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Seleccionar Almacén</Label>
                                        <select
                                            className="w-full p-2 border rounded-md bg-background"
                                            value={selectedAlmacenId}
                                            onChange={(e) => setSelectedAlmacenId(Number(e.target.value))}
                                        >
                                            {almacenes.map(a => (
                                                <option key={a.id} value={a.id}>{a.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Fotos seleccionadas:</span>
                                            <span className="font-bold">{files.length}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Upload Form */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-lg">1. Sube tus Fotos</Label>
                                        <div className="border-2 border-dashed border-input rounded-xl p-8 hover:bg-secondary/20 transition-colors text-center cursor-pointer relative">
                                            <Input
                                                type="file" multiple accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                            />
                                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {files.length > 0
                                                    ? `${files.length} archivos seleccionados`
                                                    : "Arrastra fotos o haz clic para seleccionar"}
                                            </p>
                                        </div>
                                        {files.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto py-2">
                                                {files.map((f, i) => (
                                                    <div key={i} className="w-16 h-16 shrink-0 rounded-md border overflow-hidden relative">
                                                        <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-lg">2. Pega la Descripción (WhatsApp)</Label>
                                        <textarea
                                            className="w-full min-h-[300px] p-4 border rounded-md bg-background font-mono text-sm"
                                            placeholder="[10:30 a. m.] Vania: Conjunto dos piezas..."
                                            value={rawText}
                                            onChange={(e) => setRawText(e.target.value)}
                                        />
                                    </div>

                                    <Button onClick={handleParse} disabled={isLoading} className="w-full h-12 text-lg">
                                        {isLoading ? 'Analizando...' : 'Analizar y Revisar'} <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Revisión de Items</CardTitle>
                                    <CardDescription>Asigna fotos y verifica detalles antes de guardar</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => setStep(1)} size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {itemsToReview.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-6 p-4 border rounded-lg bg-card/50 hover:border-primary/50 transition-colors">

                                        {/* Image Selector Section */}
                                        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                                            <Label>Imagen Asignada</Label>
                                            <div className="aspect-square rounded-md border overflow-hidden bg-secondary relative group">
                                                {item.image_index >= 0 && files[item.image_index] ? (
                                                    <img src={URL.createObjectURL(files[item.image_index])} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Sin Imagen</div>
                                                )}

                                                {/* Overlay for selection */}
                                                <select
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    value={item.image_index}
                                                    onChange={(e) => updateItem(idx, 'image_index', Number(e.target.value))}
                                                >
                                                    <option value={-1}>Sin Imagen</option>
                                                    {files.map((f, fIdx) => (
                                                        <option key={fIdx} value={fIdx}>Foto #{fIdx + 1} - {f.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center pointer-events-none">
                                                    Clic para cambiar
                                                </div>
                                            </div>
                                        </div>

                                        {/* Data Inputs */}
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Título</Label>
                                                    <Input
                                                        value={item.title}
                                                        onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Categoría</Label>
                                                    <select
                                                        className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                                                        value={item.category_id}
                                                        onChange={(e) => updateItem(idx, 'category_id', Number(e.target.value))}
                                                    >
                                                        {categories.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Descripción</Label>
                                                <textarea
                                                    className="w-full min-h-[80px] p-2 border rounded-md bg-background text-sm"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Precio</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Stock</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.stock}
                                                        onChange={(e) => updateItem(idx, 'stock', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Talla</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="XS, S, M, L..."
                                                        value={item.size || ''}
                                                        onChange={(e) => updateItem(idx, 'size', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="flex justify-end gap-4 border-t pt-6">
                                <div className="flex-1 text-sm text-muted-foreground self-center">
                                    Revisa que todos los items tengan foto asignada.
                                </div>
                                <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleFinalSubmit} disabled={isLoading} className="min-w-[200px]">
                                    {isLoading ? 'Guardando...' : 'Confirmar Todo'} <CheckCircle className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}