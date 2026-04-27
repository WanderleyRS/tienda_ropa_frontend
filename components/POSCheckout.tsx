'use client';

import { useState, useMemo } from 'react';
import { Item, ventasApi, PotencialCliente, AgendaInline } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { CreditCard, Truck, User as UserIcon, Check, Plus, Loader2, DollarSign, Wallet, Calendar } from 'lucide-react';
import { ClientSelector } from '@/components/ClientSelector';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface POSCheckoutProps {
  cart: {item: Item | any, quantity: number, price: number}[];
  selectedClient: PotencialCliente | null;
  onClientSelect: (client: PotencialCliente | null) => void;
  onSuccess: () => void;
  onAddGeneric: (item: any) => void;
}

export function POSCheckout({ cart, selectedClient, onClientSelect, onSuccess, onAddGeneric }: POSCheckoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  
  // Payment state
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [registrarAbono, setRegistrarAbono] = useState(false);
  const [montoAbono, setMontoAbono] = useState('');

  // Delivery state
  const [agendarEntrega, setAgendarEntrega] = useState(false);
  const [agendaData, setAgendaData] = useState<Partial<AgendaInline>>({
    tipo_entrega: 'Delivery',
    fecha_programada: format(new Date(), 'yyyy-MM-dd')
  });

  const total = useMemo(() => {
    return cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }, [cart]);

  const handleFinalizar = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (agendarEntrega && !selectedClient) {
      toast.error('Debe seleccionar un cliente para agendar una entrega');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        cliente_id: selectedClient?.id || null,
        metodo_pago: metodoPago,
        detalles: cart.map(item => ({
          producto_id: item.item.es_generico ? null : item.item.id,
          cantidad: item.quantity,
          precio_unitario: item.price,
          es_venta_generica: !!item.item.es_generico
        })),
        abono_inicial: registrarAbono ? {
          monto_abonado: parseFloat(montoAbono) || 0,
          metodo_pago: metodoPago
        } : null,
        agenda_inline: agendarEntrega ? {
          ...agendaData,
          fecha_programada: new Date(agendaData.fecha_programada + 'T12:00:00').toISOString()
        } as AgendaInline : null
      };

      await ventasApi.crear(payload as any);
      toast.success('¡Venta realizada con éxito!');
      onSuccess();
      
      // Reset local state
      setRegistrarAbono(false);
      setMontoAbono('');
      setAgendarEntrega(false);
    } catch (error: any) {
      console.error('Error al finalizar venta:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGenericItem = () => {
    onAddGeneric({
      id: Date.now(),
      title: 'Ítem de Lote (Genérico)',
      price: 0,
      es_generico: true,
      status: 'disponible'
    });
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Client Section */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente</Label>
            {selectedClient && (
              <Button variant="ghost" size="sm" onClick={() => onClientSelect(null)} className="h-6 text-[10px] font-bold text-primary">
                Cambiar
              </Button>
            )}
          </div>
          {selectedClient ? (
            <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/20">
              <div className="bg-primary/10 p-2 rounded-full">
                <UserIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black truncate">{selectedClient.nombre} {selectedClient.apellido_paterno}</p>
                <p className="text-[11px] text-muted-foreground">{selectedClient.celular}</p>
              </div>
              <Check className="h-4 w-4 text-green-500" />
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full h-12 justify-start gap-3 border-dashed rounded-xl border-slate-200 dark:border-slate-800"
              onClick={() => setIsClientSelectorOpen(true)}
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Asignar Cliente</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Payment & Settings */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl flex-1 flex flex-col">
        <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Método de Pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo (Caja)</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="QR">Código QR</SelectItem>
                <SelectItem value="TARJETA">Tarjeta Débito/Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div 
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                registrarAbono 
                  ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800 shadow-sm" 
                  : "bg-slate-50 dark:bg-slate-800/50 border-transparent"
              )}
              onClick={() => setRegistrarAbono(!registrarAbono)}
            >
              <div className="flex items-center gap-2">
                <DollarSign className={cn("h-4 w-4", registrarAbono ? "text-green-600" : "text-muted-foreground")} />
                <span className={cn("text-xs font-black", registrarAbono ? "text-green-700 dark:text-green-400" : "text-muted-foreground")}>Abono</span>
              </div>
            </div>
            
            <div 
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                agendarEntrega 
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 shadow-sm" 
                  : "bg-slate-50 dark:bg-slate-800/50 border-transparent"
              )}
              onClick={() => setAgendarEntrega(!agendarEntrega)}
            >
              <div className="flex items-center gap-2">
                <Truck className={cn("h-4 w-4", agendarEntrega ? "text-blue-600" : "text-muted-foreground")} />
                <span className={cn("text-xs font-black", agendarEntrega ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground")}>Entrega</span>
              </div>
            </div>
          </div>

          {/* Special Action */}
          <Button 
            variant="outline" 
            className="w-full h-10 gap-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl"
            onClick={addGenericItem}
          >
            <Wallet className="h-4 w-4" />
            Venta Genérica (Lote FIFO)
          </Button>

          {/* Conditional Forms */}
          {registrarAbono && (
            <div className="p-3 bg-green-50 dark:bg-green-950/10 rounded-xl border border-green-100 dark:border-green-900/30 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-[10px] font-bold text-green-700 uppercase">Monto Inicial</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="mt-1 h-9 bg-white border-green-200 focus:ring-green-500 rounded-lg"
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
              />
            </div>
          )}

          {agendarEntrega && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/10 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-[10px] font-bold text-blue-700 uppercase">Logística</Label>
              <Select 
                value={agendaData.tipo_entrega} 
                onValueChange={(val) => setAgendaData(prev => ({...prev, tipo_entrega: val}))}
              >
                <SelectTrigger className="h-9 text-xs bg-white rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delivery">Delivery Local</SelectItem>
                  <SelectItem value="Recoleccion_Tienda">Recojo en Tienda</SelectItem>
                  <SelectItem value="Encomienda">Encomienda</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                type="date" 
                className="h-9 text-xs bg-white rounded-lg" 
                value={agendaData.fecha_programada}
                onChange={(e) => setAgendaData(prev => ({...prev, fecha_programada: e.target.value}))}
              />
              <Input 
                placeholder="Dirección..." 
                className="h-9 text-xs bg-white rounded-lg" 
                value={agendaData.direccion_entrega || ''}
                onChange={(e) => setAgendaData(prev => ({...prev, direccion_entrega: e.target.value}))}
              />
            </div>
          )}
        </div>

        {/* Totals Section */}
        <div className="p-5 border-t bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center text-muted-foreground text-xs font-bold">
              <span>Subtotal ({cart.length} ítems)</span>
              <span>{total.toFixed(0)} Bs</span>
            </div>
            <div className="flex justify-between items-center text-primary">
              <span className="text-[11px] font-black uppercase tracking-wider">Total Final</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{total.toFixed(0)}</span>
                <span className="text-sm font-bold opacity-70">Bs</span>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 group relative overflow-hidden"
            onClick={handleFinalizar}
            disabled={isSubmitting || cart.length === 0}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center justify-center">
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  Pagar Venta
                  <Check className="ml-2 h-6 w-6 group-hover:scale-125 transition-transform" />
                </>
              )}
            </span>
          </Button>
        </div>
      </Card>

      <ClientSelector 
        isOpen={isClientSelectorOpen} 
        onClose={() => setIsClientSelectorOpen(false)} 
        onSelect={(client) => {
          onClientSelect(client);
          setIsClientSelectorOpen(false);
        }}
      />
    </div>
  );
}
