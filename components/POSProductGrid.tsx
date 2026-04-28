'use client';

import { Item } from '@/lib/api';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Info, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface POSProductGridProps {
  items: Item[];
  onAdd: (item: Item) => void;
  isLoading: boolean;
  compact?: boolean;
}

export function POSProductGrid({ items, onAdd, isLoading, compact }: POSProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed border-border">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No se encontraron productos disponibles</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-4 pb-10",
      compact 
        ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3" 
        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
    )}>
      {items.map((item) => (
        <Card 
          key={item.id} 
          className="group border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-card cursor-pointer flex flex-col"
          onClick={() => onAdd(item)}
        >
          <div className="relative aspect-[3/4] overflow-hidden">
            {item.photo_url ? (
              <img 
                src={item.photo_url} 
                alt={item.title}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold">
              ID: {item.local_id || item.id}
            </div>
            {item.talla && (
              <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-900 dark:text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-sm">
                Talla: {item.talla}
              </div>
            )}
            
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white text-primary p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
            </div>
          </div>
          
          <CardContent className="p-3 flex-1">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {item.almacen_nombre || 'Almacén'}
            </p>
          </CardContent>
          
          <CardFooter className="p-3 pt-0 flex items-center justify-between">
            <span className="font-bold text-primary">
              {item.price ? `${item.price.toFixed(2)} Bs` : 'P. N/A'}
            </span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
