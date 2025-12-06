'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { itemsApi, categoriesApi, Category } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Upload, Loader2 } from 'lucide-react';
import { uploadApi } from '@/lib/api';

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create preview
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

        setIsSaving(true);
        try {
            // 1. Subir imagen
            setIsUploadingImage(true);
            const imageResult = await uploadApi.uploadImage(selectedFile);
            setIsUploadingImage(false);

            // 2. Crear item
            const itemData = {
                title: formData.title,
                description: formData.description || undefined,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 1,
                photo_url: imageResult.url,
                category_id: formData.category_id || undefined,
                compra_id: compraId,
                precio_compra: parseFloat(formData.precio_compra) || undefined
            };

            await itemsApi.create(itemData);

            toast.success('Item creado exitosamente');
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Item Individual</DialogTitle>
                    <DialogDescription>
                        Crea un item y asígnalo automáticamente a esta compra
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Foto */}
                    <div>
                        <Label htmlFor="photo">Foto *</Label>
                        <div className="mt-2">
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreviewUrl('');
                                        }}
                                    >
                                        Cambiar
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">Click para subir</span> o arrastra
                                        </p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB)</p>
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

                    {/* Título */}
                    <div>
                        <Label htmlFor="title">Título *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: Polera Nike Roja"
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <Label htmlFor="description">Descripción</Label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md bg-background text-foreground dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                            placeholder="Descripción del item..."
                        />
                    </div>

                    {/* Precio Venta y Stock */}
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
                            />
                        </div>

                        <div>
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                placeholder="1"
                            />
                        </div>
                    </div>

                    {/* Precio Compra (pre-llenado) */}
                    <div>
                        <Label htmlFor="precio_compra">Precio Compra (Bs)</Label>
                        <Input
                            id="precio_compra"
                            type="number"
                            step="0.01"
                            value={formData.precio_compra}
                            onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                            placeholder="0.00"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Pre-llenado con el costo de la compra
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving || isUploadingImage}>
                            {isUploadingImage ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Subiendo imagen...
                                </>
                            ) : isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Crear Item
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
