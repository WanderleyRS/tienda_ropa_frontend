'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { itemsApi, comprasApi, Item } from '@/lib/api';
import { toast } from 'sonner';
import { Link2, Loader2, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface RelacionarItemsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    compraId: number;
    onItemsRelacionados: () => void;
}

export function RelacionarItemsModal({
    open,
    onOpenChange,
    compraId,
    onItemsRelacionados
}: RelacionarItemsModalProps) {
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (open) {
            loadItemsSinCompra();
        }
    }, [open]);

    const loadItemsSinCompra = async () => {
        setIsLoading(true);
        try {
            const data = await itemsApi.getSinCompra();
            setItems(data);
        } catch (error: any) {
            console.error('Error loading items:', error);
            toast.error('Error al cargar items');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = (itemId: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleAsignar = async () => {
        if (selectedItems.size === 0) {
            toast.error('Selecciona al menos un item');
            return;
        }

        setIsAssigning(true);
        try {
            await comprasApi.asignarItems(compraId, Array.from(selectedItems));

            toast.success(`${selectedItems.size} items asignados exitosamente`);
            onItemsRelacionados();
            setSelectedItems(new Set());
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error assigning items:', error);
            toast.error(error.response?.data?.detail || 'Error al asignar items');
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Relacionar Items Existentes</DialogTitle>
                    <DialogDescription>
                        Selecciona items sin compra asignada para relacionarlos a esta compra
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Contador */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {filteredItems.length} items disponibles
                        </span>
                        {selectedItems.size > 0 && (
                            <span className="font-medium text-primary">
                                {selectedItems.size} seleccionados
                            </span>
                        )}
                    </div>

                    {/* Lista de Items */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">Cargando items...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/50">
                            <p className="text-muted-foreground">
                                {searchTerm ? 'No se encontraron items' : 'No hay items sin compra asignada'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Todos los items ya tienen compra asignada'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors ${selectedItems.has(item.id)
                                            ? 'border-primary bg-primary/5'
                                            : 'hover:bg-muted/50'
                                        }`}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <Checkbox
                                        checked={selectedItems.has(item.id)}
                                        onCheckedChange={() => toggleItem(item.id)}
                                    />

                                    <img
                                        src={item.photo_url}
                                        alt={item.title}
                                        className="w-16 h-16 object-cover rounded"
                                    />

                                    <div className="flex-1">
                                        <h4 className="font-medium">{item.title}</h4>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {item.description}
                                            </p>
                                        )}
                                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                            {item.price && <span>Precio: {item.price.toFixed(2)} Bs</span>}
                                            <span>Stock: {item.stock}</span>
                                            {item.local_id && <span>ID: #{item.local_id}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setSelectedItems(new Set());
                                onOpenChange(false);
                            }}
                            disabled={isAssigning}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAsignar}
                            disabled={isAssigning || selectedItems.size === 0}
                        >
                            {isAssigning ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Asignando...
                                </>
                            ) : (
                                <>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Asignar {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
