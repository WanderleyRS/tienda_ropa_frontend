'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { itemsApi, ItemCreate, ItemUpdate, Item, categoriesApi, uploadApi, classificationsApi, Classification } from '@/lib/api';
import { toast } from 'sonner';
import { getValidImageUrl } from '@/lib/utils';

const itemSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  price: z.string().optional(),
  stock: z.string().min(1, 'El stock es requerido'),
  photo_url: z.string().optional(),
  category_id: z.string().optional(),
  talla: z.string().optional(), // Nueva validación
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemCreated: () => void;
  initialData?: Item | null; // Optional data for editing
}

export function CreateItemDialog({
  open,
  onOpenChange,
  onItemCreated,
  initialData,
}: CreateItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      price: '',
      stock: '1',
      photo_url: '',
      category_id: '',
      talla: '', // Valor inicial
    },
  });



  const loadData = async () => {
    try {
      const [cats, classifs] = await Promise.all([
        categoriesApi.getAll(),
        classificationsApi.list()
      ]);
      setCategories(cats);
      setClassifications(classifs);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      if (initialData) {
        // Edit Mode: Pre-fill data
        form.reset({
          title: initialData.title,
          description: initialData.description || '',
          price: initialData.price?.toString() || '',
          stock: initialData.stock.toString(),
          photo_url: initialData.photo_url,
          category_id: initialData.category_id?.toString() || '',
          talla: initialData.talla || '',
        });

        // Pre-fill images
        const existingImages = [
          initialData.photo_url,
          ...(initialData.additional_images || [])
        ].filter(Boolean);
        setImages(existingImages);
      } else {
        // Create Mode: Reset to defaults
        form.reset({
          title: '',
          description: '',
          price: '',
          stock: '1',
          photo_url: '',
          category_id: '',
          talla: '',
        });
        setImages([]);
      }
    }
  }, [open, initialData]); // Add initialData dependency

  // State for multiple images
  const [images, setImages] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 3) {
      toast.error('Máximo 3 imágenes permitidas');
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadApi.uploadImage(file));
      const results = await Promise.all(uploadPromises);

      const newImages = results.map(res => getValidImageUrl(res.url));
      const updatedImages = [...images, ...newImages];

      setImages(updatedImages);
      // Set the first image as the main photo_url
      if (updatedImages.length > 0) {
        form.setValue('photo_url', updatedImages[0]);
      }

      toast.success(`${newImages.length} imagen(es) subida(s) correctamente`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir las imágenes');
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting same file again if needed
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    // Update photo_url based on remaining images
    if (newImages.length > 0) {
      form.setValue('photo_url', newImages[0]);
    } else {
      form.setValue('photo_url', '');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await categoriesApi.create({
        name: newCategoryName,
        classification_id: selectedClassificationId ? Number(selectedClassificationId) : undefined
      });
      setCategories([...categories, newCat]);
      form.setValue('category_id', String(newCat.id));
      setIsCreatingCategory(false);
      setNewCategoryName('');
      toast.success('Categoría creada');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Error al crear categoría');
    }
  };

  const onSubmit = async (data: ItemFormValues) => {
    setIsSubmitting(true);
    try {
      // Validar precio si existe
      let priceValue: number | undefined = undefined;
      if (data.price && data.price.trim() !== '') {
        const parsed = parseFloat(data.price);
        if (isNaN(parsed) || parsed < 0) {
          form.setError('price', { message: 'El precio debe ser un número positivo' });
          setIsSubmitting(false);
          return;
        }
        priceValue = parsed;
      }

      // Validar stock
      const stockValue = parseInt(data.stock);
      if (isNaN(stockValue) || stockValue < 0) {
        form.setError('stock', { message: 'El stock debe ser un número entero positivo' });
        setIsSubmitting(false);
        return;
      }

      // Validar URL si existe
      if (data.photo_url && data.photo_url.trim() !== '') {
        try {
          new URL(data.photo_url);
        } catch {
          form.setError('photo_url', { message: 'Debe ser una URL válida' });
          setIsSubmitting(false);
          return;
        }
      }

      const itemData: any = { // Use any temporarily to handle diff between Create/Update types easier or define union
        title: data.title,
        description: data.description || undefined,
        price: priceValue,
        stock: stockValue,
        photo_url: images.length > 0 ? images[0] : (data.photo_url || 'https://via.placeholder.com/300'),
        additional_images: images.slice(1),
        category_id: data.category_id ? Number(data.category_id) : undefined,
        talla: data.talla || undefined,
      };

      if (initialData) {
        await itemsApi.update(initialData.id, itemData);
        toast.success('Ítem actualizado correctamente');
      } else {
        await itemsApi.create(itemData as ItemCreate);
        toast.success('Ítem creado correctamente');
      }

      form.reset();
      onItemCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || (initialData ? 'Error al actualizar' : 'Error al crear el ítem')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card border-border/50 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-secondary/10">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {initialData ? 'Editar producto' : 'Crear nuevo producto'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {initialData ? 'Modifica los detalles del producto' : 'Completa los detalles para añadir un ítem al inventario'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Camiseta Deportiva" {...field} className="bg-secondary/20 border-border/50 focus:bg-background transition-colors" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Talla M, Algodón, Color Azul"
                        {...field}
                        className="bg-secondary/20 border-border/50 focus:bg-background transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="talla"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Talla</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: M" {...field} className="bg-secondary/20 border-border/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Precio</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            className="pl-7 bg-secondary/20 border-border/50 focus:bg-background transition-colors"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          className="bg-secondary/20 border-border/50 focus:bg-background transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="talla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Talla</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value || ''}
                        className="w-full h-10 px-3 rounded-md border border-border/50 bg-secondary/20 focus:bg-background transition-colors text-sm"
                      >
                        <option value="">Sin talla</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        <option value="Única">Única</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo_url"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Fotos del Producto (Máx 3)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-xl bg-secondary/10">
                        <div className="flex flex-col gap-3">
                          {/* Upload Button */}
                          <div className="relative">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileUpload}
                              disabled={isUploading || images.length >= 3}
                              className="hidden"
                              id="multi-image-upload"
                            />
                            <Button
                              type="button"
                              onClick={() => document.getElementById('multi-image-upload')?.click()}
                              disabled={isUploading || images.length >= 3}
                              variant="outline"
                              className="w-full bg-background border-dashed border-2 hover:bg-secondary/50 h-24 flex flex-col items-center justify-center gap-2"
                            >
                              <span className="text-2xl">📷</span>
                              <span className="text-sm font-medium">
                                {isUploading ? 'Subiendo...' : images.length >= 3 ? 'Límite alcanzado' : 'Click para subir fotos'}
                              </span>
                              <span className="text-xs text-muted-foreground">Soporta múltiples archivos</span>
                            </Button>
                          </div>

                          {/* Image Preview Grid */}
                          {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mt-2">
                              {images.map((imgUrl, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group bg-background">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imgUrl}
                                    alt={`Preview ${index + 1}`}
                                    className="object-cover w-full h-full"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-md transform"
                                    title="Eliminar foto"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                  </button>
                                  {index === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] text-white text-[10px] uppercase font-bold text-center py-1">
                                      Principal
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Classification Selection Section */}
              <FormItem>
                <FormLabel className="text-foreground font-medium">Clasificación</FormLabel>
                <Select
                  value={selectedClassificationId}
                  onValueChange={(val) => {
                    setSelectedClassificationId(val);
                    form.setValue('category_id', ''); // Reset category when classification changes
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="bg-secondary/20 border-border/50">
                      <SelectValue placeholder="Seleccionar clasificación (Opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[200px]">
                    {classifications.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>

              {/* Category Selection Section */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Categoría</FormLabel>
                    <div className="flex gap-2">
                      {isCreatingCategory ? (
                        <div className="flex-1 flex gap-2 animate-in fade-in slide-in-from-left-2">
                          <Input
                            placeholder="Nombre nueva categoría"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            autoFocus
                            className="bg-secondary/20 border-border/50"
                          />
                          <Button type="button" size="sm" onClick={handleCreateCategory}>
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreatingCategory(false)}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="flex-1 bg-secondary/20 border-border/50">
                                <SelectValue placeholder="Seleccionar categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories
                                .filter(cat => !selectedClassificationId || cat.classification_id === Number(selectedClassificationId))
                                .map((cat) => (
                                  <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              {categories.length === 0 && (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  No hay categorías
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsCreatingCategory(true)}
                            title="Crear nueva categoría"
                            className="border-border/50 bg-secondary/20 hover:bg-secondary/40"
                          >
                            <span className="text-xl leading-none">+</span>
                          </Button>
                        </>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="border-border/50"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading} className="shadow-lg shadow-primary/20">
                  {isSubmitting ? (initialData ? 'Guardando...' : 'Creando...') : (initialData ? 'Guardar Cambios' : 'Crear Ítem')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog >
  );
}
