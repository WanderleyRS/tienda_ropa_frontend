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
import { itemsApi, ItemCreate, categoriesApi, uploadApi, classificationsApi, Classification } from '@/lib/api';
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
}

export function CreateItemDialog({
  open,
  onOpenChange,
  onItemCreated,
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
    }
  }, [open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadApi.uploadImage(file);
      const fullUrl = getValidImageUrl(url);

      form.setValue('photo_url', fullUrl);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
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

      const itemData: ItemCreate = {
        title: data.title,
        description: data.description || undefined,
        price: priceValue,
        stock: stockValue,
        photo_url: data.photo_url || 'https://via.placeholder.com/300',
        category_id: data.category_id ? Number(data.category_id) : undefined,
        talla: data.talla || undefined, // Enviar talla
      };

      await itemsApi.create(itemData);
      toast.success('Ítem creado correctamente');
      form.reset();
      onItemCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || 'Error al crear el ítem'
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
            Crear Nuevo Ítem
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Completa el formulario para agregar un nuevo ítem al inventario
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

              {/* Image Upload Section */}
              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Imagen</FormLabel>
                    <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-xl bg-secondary/10">
                      <div className="flex gap-3 items-center">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="image-upload"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          disabled={isUploading}
                          className="w-full bg-white hover:bg-gray-50 text-foreground shadow-sm border border-border/50"
                        >
                          {isUploading ? 'Subiendo...' : '📷 Subir desde dispositivo'}
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-secondary/10 px-2 text-muted-foreground">
                            O ingresa URL
                          </span>
                        </div>
                      </div>

                      <FormControl>
                        <Input
                          placeholder="https://ejemplo.com/imagen.jpg"
                          {...field}
                          className="bg-white border-border/50"
                        />
                      </FormControl>

                      {field.value && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/50 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={field.value}
                            alt="Preview"
                            className="object-contain w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error+loading+image';
                            }}
                          />
                        </div>
                      )}
                    </div>
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
                  {isSubmitting ? 'Creando...' : 'Crear Ítem'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog >
  );
}
