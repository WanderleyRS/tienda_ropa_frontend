'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { categoriesApi, Category } from '@/lib/api';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2 } from 'lucide-react';

interface GestionCategoriasModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCategoriesChanged: () => void;
}

export function GestionCategoriasModal({ open, onOpenChange, onCategoriesChanged }: GestionCategoriasModalProps) {
    const [categorias, setCategorias] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (open) {
            loadCategorias();
        }
    }, [open]);

    const loadCategorias = async () => {
        setIsLoading(true);
        try {
            const data = await categoriesApi.getAll();
            setCategorias(data);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Error al cargar categorías');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nuevaCategoria.trim()) {
            toast.error('El nombre de la categoría es requerido');
            return;
        }

        setIsCreating(true);
        try {
            await categoriesApi.create({ name: nuevaCategoria.trim() });
            toast.success('Categoría creada exitosamente');
            setNuevaCategoria('');
            await loadCategorias();
            onCategoriesChanged();
        } catch (error: any) {
            console.error('Error creating category:', error);
            toast.error(error.response?.data?.detail || 'Error al crear categoría');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (categoryId: number, categoryName: string) => {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${categoryName}"?`)) {
            return;
        }

        try {
            await categoriesApi.delete(categoryId);
            toast.success('Categoría eliminada exitosamente');
            await loadCategorias();
            onCategoriesChanged();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            toast.error(error.response?.data?.detail || 'Error al eliminar categoría');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gestión de Categorías</DialogTitle>
                    <DialogDescription>
                        Administra las categorías de prendas de tu almacén
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Crear nueva categoría */}
                    <form onSubmit={handleCreate} className="space-y-3">
                        <Label htmlFor="nuevaCategoria">Nueva Categoría</Label>
                        <div className="flex gap-2">
                            <Input
                                id="nuevaCategoria"
                                value={nuevaCategoria}
                                onChange={(e) => setNuevaCategoria(e.target.value)}
                                placeholder="Ej: Camisas, Pantalones, Vestidos..."
                                disabled={isCreating}
                            />
                            <Button type="submit" disabled={isCreating || !nuevaCategoria.trim()}>
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Lista de categorías */}
                    <div>
                        <Label className="mb-3 block">Categorías Existentes ({categorias.length})</Label>

                        {isLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
                            </div>
                        ) : categorias.length === 0 ? (
                            <div className="text-center py-8 border rounded-lg bg-muted/50">
                                <p className="text-muted-foreground">No hay categorías creadas</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Crea tu primera categoría arriba
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {categorias.map((categoria) => (
                                    <div
                                        key={categoria.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="font-medium">{categoria.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(categoria.id, categoria.name)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botón cerrar */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
