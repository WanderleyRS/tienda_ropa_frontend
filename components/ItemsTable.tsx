'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item, itemsApi } from '@/lib/api';
import { Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { getValidImageUrl } from '@/lib/utils';
import { LeadConversionModal } from '@/components/LeadConversionModal';

interface ItemsTableProps {
  items: Item[];
  onItemUpdated: () => void;
  userRole?: 'admin' | 'vendedor';
}

export function ItemsTable({ items, onItemUpdated, userRole }: ItemsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'stock' | 'price' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Estado para el modal de conversión
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [selectedItemForConversion, setSelectedItemForConversion] = useState<{ id: number, title: string, price: number } | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'vendedor';

  const startEditing = (item: Item, field: 'stock' | 'price') => {
    setEditingId(item.id);
    setEditingField(field);
    setEditValue(field === 'stock' ? item.stock.toString() : (item.price?.toString() || ''));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async (itemId: number) => {
    if (!editingField) return;

    setIsSaving(true);
    try {
      if (editingField === 'stock') {
        const stock = parseInt(editValue);
        if (isNaN(stock) || stock < 0) {
          toast.error('El stock debe ser un número positivo');
          return;
        }
        await itemsApi.updateStock(itemId, stock);
      } else if (editingField === 'price') {
        const price = parseFloat(editValue);
        if (isNaN(price) || price < 0) {
          toast.error('El precio debe ser un número positivo');
          return;
        }
        await itemsApi.updatePrice(itemId, price);
      }
      toast.success('Ítem actualizado correctamente');
      cancelEditing();
      onItemUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al actualizar el ítem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSoldClick = (item: Item) => {
    if (item.is_sold) {
      // Si ya está vendido, lo marcamos como disponible directamente
      itemsApi
        .update(item.id, { is_sold: false })
        .then(() => {
          toast.success('Ítem marcado como disponible');
          onItemUpdated();
        })
        .catch((error) => {
          toast.error('Error al actualizar estado');
        });
    } else {
      // Si está disponible, abrimos el modal para vincular con un cliente
      setSelectedItemForConversion({
        id: item.id,
        title: item.title,
        price: item.price || 0
      });
      setConversionModalOpen(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground bg-secondary/10 rounded-lg border border-dashed border-border">
        No hay ítems en el inventario
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-secondary/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead className="w-[80px]">Imagen</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Almacén</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Estado</TableHead>
            {canEdit && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-secondary/10 transition-colors">
              <TableCell className="font-medium text-muted-foreground">#{item.local_id || item.id}</TableCell>
              <TableCell>
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border/50 bg-secondary/20">
                  {item.photo_url ? (
                    <img
                      src={getValidImageUrl(item.photo_url)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3E%3F%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">N/A</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description || '-'}</div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {item.almacen_nombre || 'Desconocido'}
                </span>
              </TableCell>
              <TableCell>
                {editingId === item.id && editingField === 'price' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 h-8 text-sm"
                      disabled={isSaving}
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => saveEdit(item.id)}
                      disabled={isSaving}
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="font-medium tabular-nums">${item.price?.toFixed(2) || '-'}</span>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(item, 'price')}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editingId === item.id && editingField === 'stock' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 h-8 text-sm"
                      disabled={isSaving}
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => saveEdit(item.id)}
                      disabled={isSaving}
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="font-medium tabular-nums">{item.stock}</span>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(item, 'stock')}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.is_sold
                    ? 'bg-orange-50 text-orange-700 border-orange-100'
                    : 'bg-green-50 text-green-700 border-green-100'
                    }`}
                >
                  {item.is_sold ? 'Vendido' : 'Disponible'}
                </span>
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={item.is_sold ? "outline" : "default"}
                    onClick={() => handleSoldClick(item)}
                    className={item.is_sold
                      ? "text-muted-foreground hover:text-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"}
                  >
                    {item.is_sold ? 'Marcar Disponible' : 'Marcar Vendido'}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedItemForConversion && (
        <LeadConversionModal
          isOpen={conversionModalOpen}
          onClose={() => setConversionModalOpen(false)}
          itemId={selectedItemForConversion.id}
          itemTitle={selectedItemForConversion.title}
          itemPrice={selectedItemForConversion.price}
          onSuccess={onItemUpdated}
        />
      )}
    </div>
  );
}
