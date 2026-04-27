'use client';

import { useState } from 'react';
import { Item, ventasApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, RefreshCw, Clock, Tag, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface POSPendingOrdersProps {
  items: Item[];
  onAddAll: (items: Item[]) => void;
  onRefresh: () => void;
}

export function POSPendingOrders({ items, onAddAll, onRefresh }: POSPendingOrdersProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReleasing, setIsReleasing] = useState<number | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleLiberar = async (itemId: number) => {
    setIsReleasing(itemId);
    try {
      await ventasApi.liberarItems([itemId]);
      toast.success('Ítem devuelto al inventario');
      onRefresh();
    } catch (error) {
      toast.error('Error al liberar ítem');
    } finally {
      setIsReleasing(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed border-border">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">No hay pedidos pendientes de WhatsApp</p>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refrescar cola
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          Items Reservados
          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px]">
            Cola de Espera
          </span>
        </h3>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden border border-border shadow-sm bg-card group">
            <CardContent className="p-0 flex h-24">
              <div className="w-24 flex-shrink-0 bg-muted">
                {item.photo_url ? (
                  <img src={item.photo_url} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Tag className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-sm truncate leading-tight">{item.title}</h4>
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                    {item.price?.toFixed(2)} Bs
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    ID: {item.local_id || item.id} • {item.talla || 'S/T'}
                  </p>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleLiberar(item.id)}
                      disabled={isReleasing === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="h-8 px-3 text-[10px] font-bold"
                      onClick={() => onAddAll([item])}
                    >
                      <ShoppingCart className="mr-1.5 h-3 w-3" />
                      PROCESAR
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
