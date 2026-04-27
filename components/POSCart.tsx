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
    <div className="space-y-2">
      {items.map((cartItem, index) => (
        <div 
          key={`${cartItem.item.id}-${index}`} 
          className="flex gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm hover:border-primary/40 transition-all group"
        >
          {/* Thumbnail */}
          <div className="h-14 w-14 rounded-lg bg-slate-50 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-border/50">
            {cartItem.item.photo_url ? (
              <img src={cartItem.item.photo_url} alt={cartItem.item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Tag className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-1">
              <h4 className="font-bold text-xs truncate pr-1 dark:text-slate-100">
                {cartItem.item.title}
                {cartItem.item.es_generico && <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-black uppercase">LOTE</span>}
              </h4>
              <button 
                onClick={() => onRemove(index)}
                className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 mt-1">
              {/* Price Editor */}
              <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 rounded px-1.5 border border-transparent hover:border-primary/30 transition-colors">
                <span className="text-[10px] font-bold text-muted-foreground">Bs</span>
                <Input 
                  type="number"
                  value={cartItem.price}
                  onChange={(e) => onUpdatePrice(index, parseFloat(e.target.value) || 0)}
                  className="h-6 w-16 text-[11px] font-black border-none bg-transparent focus-visible:ring-0 px-1 text-primary"
                />
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg h-7 px-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 hover:bg-white dark:hover:bg-slate-700" 
                  onClick={() => onUpdateQty(index, -1)}
                  disabled={cartItem.item.status === 'disponible' && !cartItem.item.es_generico && cartItem.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-[11px] font-black dark:text-slate-200">
                  {cartItem.quantity}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 hover:bg-white dark:hover:bg-slate-700" 
                  onClick={() => onUpdateQty(index, 1)}
                  disabled={!cartItem.item.es_generico && cartItem.item.status !== 'pendiente'}
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
