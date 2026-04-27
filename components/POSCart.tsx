'use client';

import { Item } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, Tag, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface POSCartProps {
  items: {item: Item | any, quantity: number, price: number}[];
  onRemove: (index: number) => void;
  onUpdateQty: (index: number, delta: number) => void;
  onUpdatePrice: (index: number, newPrice: number) => void;
}

export function POSCart({ items, onRemove, onUpdateQty, onUpdatePrice }: POSCartProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
          <ImageIcon className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium">El carrito está vacío</p>
        <p className="text-xs text-muted-foreground mt-1">Añade productos del catálogo o pedidos pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((cartItem, index) => (
        <div 
          key={`${cartItem.item.id}-${index}`} 
          className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent hover:border-primary/20 transition-all group"
        >
          {/* Thumbnail */}
          <div className="h-16 w-16 rounded-lg bg-white dark:bg-slate-900 flex-shrink-0 overflow-hidden border">
            {cartItem.item.photo_url ? (
              <img src={cartItem.item.photo_url} alt={cartItem.item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Tag className="h-6 w-6 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-semibold text-sm truncate pr-1">
                {cartItem.item.title}
                {cartItem.item.es_generico && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Lote</span>}
              </h4>
              <button 
                onClick={() => onRemove(index)}
                className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 mt-1">
              {/* Price Editor (only for generic or admins if we want) */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">Bs</span>
                <Input 
                  type="number"
                  value={cartItem.price}
                  onChange={(e) => onUpdatePrice(index, parseFloat(e.target.value) || 0)}
                  className="h-7 w-20 text-sm font-bold border-none bg-transparent hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 px-1"
                />
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border shadow-sm h-8 px-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => onUpdateQty(index, -1)}
                  disabled={cartItem.item.status === 'disponible' && !cartItem.item.es_generico && cartItem.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-xs font-bold">
                  {cartItem.quantity}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => onUpdateQty(index, 1)}
                  disabled={!cartItem.item.es_generico && cartItem.item.status !== 'pendiente'} // Items VIP solo 1 unidad
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
