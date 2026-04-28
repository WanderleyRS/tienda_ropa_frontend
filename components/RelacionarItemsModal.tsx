'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { itemsApi, comprasApi, Item, CompraEstado } from '@/lib/api';
import { toast } from 'sonner';
import { Link2, Loader2, Search, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    const [compraEstado, setCompraEstado] = useState<CompraEstado | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [itemsData, estadoData] = await Promise.all([
                itemsApi.getSinCompra(),
                comprasApi.getCompraEstado(compraId)
            ]);
            setItems(itemsData);
            setCompraEstado(estadoData);
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Error al sincronizar con la bolsa de la compra');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = (itemId: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            // Validar si hay espacio en la bolsa de esa categoría (opcional, el backend lo hará)
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const getAvailableSlots = (categoryId: number) => {
        if (!compraEstado) return 0;
        const detail = compraEstado.detalles.find(d => d.categoria_id === categoryId);
        return detail ? detail.items_restantes : 0;
    };

    const getCategoryName = (categoryId: number) => {
        if (!compraEstado) return 'Cat';
        // En una app real, tendríamos el nombre en el estado o un mapa global
        return `Categoría #${categoryId}`; 
    };

    const handleAsignar = async () => {
        if (selectedItems.size === 0) {
            toast.error('Selecciona al menos una prenda');
            return;
        }

        setIsAssigning(true);
        try {
            await comprasApi.asignarItems(compraId, Array.from(selectedItems));
            toast.success(`${selectedItems.size} prendas vinculadas al lote correctamente`);
            onItemsRelacionados();
            setSelectedItems(new Set());
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error assigning items:', error);
            const errorData = error.response?.data?.detail;
            if (typeof errorData === 'object' && errorData.detalles) {
                toast.error(errorData.error, { description: errorData.detalles.join('\n') });
            } else {
                toast.error(errorData || 'Error al vincular prendas');
            }
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calcular validación de slots seleccionados vs disponibles
    const selectionCountByCat: Record<number, number> = {};
    selectedItems.forEach(id => {
        const item = items.find(i => i.id === id);
        if (item?.category_id) {
            selectionCountByCat[item.category_id] = (selectionCountByCat[item.category_id] || 0) + 1;
        }
    });

    const overCapacity = Object.entries(selectionCountByCat).some(([catId, count]) => 
        count > getAvailableSlots(Number(catId))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-2 shadow-2xl">
                <DialogHeader className="p-6 bg-muted/30 border-b">
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                        <Link2 className="h-6 w-6 text-primary" />
                        Vincular Prendas Libres
                    </DialogTitle>
                    <DialogDescription className="font-medium">
                        Asigna prendas creadas sin lote a la bolsa de inversión de esta compra.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Panel de Estado de Bolsa */}
                    {compraEstado && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {compraEstado.detalles.map(d => (
                                <div key={d.categoria_id} className={`p-2 rounded-lg border text-center ${d.items_restantes > 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted border-muted-foreground/10 opacity-50'}`}>
                                    <p className="text-[9px] font-black uppercase text-muted-foreground truncate">Cat #{d.categoria_id}</p>
                                    <p className="text-lg font-black leading-none">{d.items_restantes} <span className="text-[10px]">Libres</span></p>
                                </div>
                            ))}
                        </div>
                    )}

                    {overCapacity && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 animate-pulse">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-black uppercase italic text-xs">Exceso de Capacidad</AlertTitle>
                            <AlertDescription className="text-xs font-medium">
                                Has seleccionado más prendas de las que permite la bolsa en algunas categorías.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar por título, descripción o marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-12 text-lg font-medium border-2 focus-visible:ring-primary"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="font-black uppercase italic text-muted-foreground">Sincronizando inventario...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/20">
                            <Info className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="font-black uppercase italic text-muted-foreground text-xl">No hay prendas huérfanas</p>
                            <p className="text-sm text-muted-foreground font-medium">Todas las prendas ya tienen un lote asignado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredItems.map((item) => {
                                const isSelected = selectedItems.has(item.id);
                                const slots = item.category_id ? getAvailableSlots(item.category_id) : 0;
                                const isDisabled = slots === 0 && !isSelected;

                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative flex items-center gap-4 p-4 border-2 rounded-2xl transition-all cursor-pointer ${
                                            isSelected 
                                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                                            : isDisabled 
                                            ? 'opacity-40 grayscale cursor-not-allowed border-muted bg-muted/50' 
                                            : 'hover:border-foreground/20 hover:bg-muted/30 border-foreground/5'
                                        }`}
                                        onClick={() => !isDisabled && toggleItem(item.id)}
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={item.photo_url || '/placeholder.png'}
                                                alt={item.title}
                                                className="w-20 h-24 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform"
                                            />
                                            {isSelected && (
                                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-1 min-w-0">
                                            <h4 className="font-black uppercase italic tracking-tighter truncate text-lg leading-none">{item.title}</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {item.category_id && (
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-background">
                                                        CAT #{item.category_id}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-[9px] font-black uppercase bg-muted/50">
                                                    ID: #{item.local_id || item.id}
                                                </Badge>
                                            </div>
                                            <p className="text-xl font-black font-mono text-primary leading-none pt-1">
                                                {item.price.toFixed(2)} <span className="text-[10px]">Bs</span>
                                            </p>
                                        </div>
                                        
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => !isDisabled && toggleItem(item.id)}
                                            className="h-6 w-6 rounded-lg"
                                            disabled={isDisabled}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">
                        {selectedItems.size} Prendas seleccionadas
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isAssigning}
                            className="font-bold uppercase tracking-widest text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAsignar}
                            disabled={isAssigning || selectedItems.size === 0 || overCapacity}
                            className="font-black uppercase italic tracking-widest h-12 px-10 shadow-xl"
                        >
                            {isAssigning ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Link2 className="h-5 w-5 mr-2" />
                            )}
                            Vincular al Lote
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
