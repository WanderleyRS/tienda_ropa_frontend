'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { itemsApi, categoriesApi, Category, comprasApi, CompraEstado } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Upload, Loader2, Info, ShoppingBag } from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CrearItemCompraModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    compraId: number;
    categoriaId?: number;
    precioCompra?: number;
    onItemCreado: () => void;
}

export function CrearItemCompraModal({
    open,
    onOpenChange,
    compraId,
    categoriaId,
    precioCompra,
    onItemCreado
}: CrearItemCompraModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isLoadingEstado, setIsLoadingEstado] = useState(false);
    const [compraEstado, setCompraEstado] = useState<CompraEstado | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        stock: '1',
        photo_url: '',
        category_id: categoriaId || 0,
        precio_compra: precioCompra?.toString() || ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Cargar estado de la compra y categorías al abrir
    useEffect(() => {
        if (open && compraId) {
            loadInitialData();
        }
    }, [open, compraId]);

    const loadInitialData = async () => {
        setIsLoadingEstado(true);
        try {
            const [estado, allCategories] = await Promise.all([
                comprasApi.getCompraEstado(compraId),
                categoriesApi.getAll()
            ]);
            setCompraEstado(estado);
            setCategories(allCategories);
            
            // Si hay categorías en la compra, seleccionar la primera o la pasada por prop
            if (!formData.category_id && estado.detalles.length > 0) {
                const firstCat = estado.detalles[0];
                handleCategoryChange(firstCat.categoria_id, estado, allCategories);
            } else if (formData.category_id) {
                handleCategoryChange(formData.category_id, estado, allCategories);
            }
        } catch (error) {
            console.error('Error loading modal data:', error);
            toast.error('Error al cargar datos de la compra');
        } finally {
            setIsLoadingEstado(false);
        }
    };

    const handleCategoryChange = (catId: number, estado?: CompraEstado | null, allCats?: Category[]) => {
        const currentEstado = estado || compraEstado;
        const currentCats = allCats || categories;
        
        const detail = currentEstado?.detalles.find(d => d.categoria_id === catId);
        
        setFormData(prev => ({ 
            ...prev, 
            category_id: catId,
            // Sugerir el costo promedio restante de la bolsa
            precio_compra: detail ? detail.costo_promedio_sugerido.toString() : prev.precio_compra
        }));
    };

    const selectedCategoryDetail = useMemo(() => {
        return compraEstado?.detalles.find(d => d.categoria_id === formData.category_id);
    }, [compraEstado, formData.category_id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('El título es requerido');
            return;
        }

        if (!selectedFile) {
            toast.error('Debes seleccionar una foto');
            return;
        }

        if (!formData.category_id) {
            toast.error('Selecciona una categoría');
            return;
        }

        setIsSaving(true);
        try {
            setIsUploadingImage(true);
            const imageResult = await uploadApi.uploadImage(selectedFile);
            setIsUploadingImage(false);

            const itemData = {
                title: formData.title,
                description: formData.description || undefined,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 1,
                photo_url: imageResult.url,
                category_id: formData.category_id,
                compra_id: compraId,
                precio_compra: parseFloat(formData.precio_compra) || 0
            };

            await itemsApi.create(itemData);

            toast.success('Item creado y vinculado exitosamente');
            onItemCreado();

            // Reset form
            setFormData({
                title: '',
                description: '',
                price: '',
                stock: '1',
                photo_url: '',
                category_id: categoriaId || 0,
                precio_compra: precioCompra?.toString() || ''
            });
            setSelectedFile(null);
            setPreviewUrl('');

            onOpenChange(false);
        } catch (error: any) {
            console.error('Error creating item:', error);
            toast.error(error.response?.data?.detail || 'Error al crear item');
        } finally {
            setIsSaving(false);
            setIsUploadingImage(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        Crear Item Individual (Modo Asistente)
                    </DialogTitle>
                    <DialogDescription>
                        Clasifica una prenda de la compra <span className="font-bold text-foreground">{compraEstado?.codigo}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Panel de Bolsa Residual */}
                    {selectedCategoryDetail && (
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4" />
                            <AlertTitle className="text-sm font-semibold">Bolsa de Categoría</AlertTitle>
                            <AlertDescription className="mt-2">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground">Inversión Restante</p>
                                        <p className="font-mono text-sm font-bold">
                                            {selectedCategoryDetail.monto_restante.toFixed(2)} Bs
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-muted-foreground">Prendas por Catalogar</p>
                                        <p className="font-mono text-sm font-bold">
                                            {selectedCategoryDetail.items_restantes} / {selectedCategoryDetail.cantidad}
                                        </p>
                                    </div>
                                    <div className="col-span-2 pt-1 border-t border-primary/10">
                                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Costo sugerido para esta prenda</p>
                                        <p className="text-primary font-bold">{selectedCategoryDetail.costo_promedio_sugerido.toFixed(2)} Bs</p>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna Izquierda: Foto */}
                        <div className="space-y-4">
                            <Label>Foto de la Prenda *</Label>
                            <div className="relative group">
                                {previewUrl ? (
                                    <div className="relative aspect-square overflow-hidden rounded-xl border">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setPreviewUrl('');
                                                }}
                                            >
                                                Cambiar Foto
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all">
                                        <div className="flex flex-col items-center justify-center p-6 text-center">
                                            <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                                            <p className="text-sm font-medium">Click para subir foto</p>
                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 5MB</p>
                                        </div>
                                        <input
                                            id="photo"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Columna Derecha: Datos */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="category">Categoría de la Factura *</Label>
                                <select
                                    id="category"
                                    className="w-full h-10 px-3 py-2 mt-1.5 border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={formData.category_id}
                                    onChange={(e) => handleCategoryChange(Number(e.target.value))}
                                    disabled={isLoadingEstado}
                                >
                                    {isLoadingEstado ? (
                                        <option>Cargando categorías...</option>
                                    ) : (
                                        compraEstado?.detalles.map(det => {
                                            const cat = categories.find(c => c.id === det.categoria_id);
                                            return (
                                                <option key={det.categoria_id} value={det.categoria_id}>
                                                    {cat?.name || `Cat #${det.categoria_id}`} ({det.items_creados}/{det.cantidad})
                                                </option>
                                            );
                                        })
                                    )}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="title">Título de la Prenda *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Polera Nike Roja"
                                    className="mt-1.5"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price">Precio Venta (Bs)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="mt-1.5 font-bold text-primary"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="precio_compra">Precio Compra (Bs)</Label>
                                    <Input
                                        id="precio_compra"
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_compra}
                                        onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                                        className="mt-1.5 bg-muted/50 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full mt-1.5 px-3 py-2 border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    rows={3}
                                    placeholder="Talla, material, estado..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving || isUploadingImage} className="min-w-[140px]">
                            {isUploadingImage ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Subiendo...
                                </>
                            ) : isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Vincular Prenda
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
