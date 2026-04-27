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
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-base font-bold dark:text-slate-300">El carrito está vacío</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Selecciona productos del catálogo para iniciar una venta</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((cartItem, index) => (
        <div 
          key={`${cartItem.item.id}-${index}`} 
          className="grid grid-cols-12 gap-2 items-center p-2 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-primary/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all group"
        >
          {/* Product Info (6/12) */}
          <div className="col-span-6 flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-100 dark:border-white/10 group-hover:scale-105 transition-transform">
              {cartItem.item.photo_url ? (
                <img src={cartItem.item.photo_url} alt={cartItem.item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Tag className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[13px] truncate dark:text-slate-100">
                {cartItem.item.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <span className="text-[9px] text-muted-foreground font-medium">#{cartItem.item.local_id || 'TEMP'}</span>
                 {cartItem.item.es_generico && (
                   <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-black uppercase border border-amber-500/20">LOTE</span>
                 )}
              </div>
            </div>
          </div>

          {/* Price (2/12) */}
          <div className="col-span-2 flex justify-center">
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1 border border-transparent hover:border-primary/20 transition-colors">
              <span className="text-[9px] font-bold text-muted-foreground mr-1">Bs</span>
              <Input 
                type="number"
                value={cartItem.price}
                onChange={(e) => onUpdatePrice(index, parseFloat(e.target.value) || 0)}
                className="h-5 w-14 text-[12px] font-black border-none bg-transparent focus-visible:ring-0 p-0 text-primary text-center"
              />
            </div>
          </div>

          {/* Qty (2/12) */}
          <div className="col-span-2 flex justify-center">
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/80 rounded-xl h-8 px-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-white dark:hover:bg-slate-700 rounded-lg" 
                onClick={() => onUpdateQty(index, -1)}
                disabled={cartItem.item.status === 'disponible' && !cartItem.item.es_generico && cartItem.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-7 text-center text-xs font-black dark:text-slate-200">
                {cartItem.quantity}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-white dark:hover:bg-slate-700 rounded-lg" 
                onClick={() => onUpdateQty(index, 1)}
                disabled={!cartItem.item.es_generico && cartItem.item.status !== 'pendiente'}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Total & Action (2/12) */}
          <div className="col-span-2 flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-black text-slate-900 dark:text-white">
                {(cartItem.price * cartItem.quantity).toFixed(0)}
                <span className="text-[10px] ml-0.5 opacity-50">Bs</span>
              </span>
              <button 
                onClick={() => onRemove(index)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
