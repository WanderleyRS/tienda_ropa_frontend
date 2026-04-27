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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
    <div className="space-y-4">
      {/* Client Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Cliente</Label>
          {selectedClient && (
            <Button variant="ghost" size="sm" onClick={() => onClientSelect(null)} className="h-6 text-[10px]">
              Cambiar
            </Button>
          )}
        </div>
        {selectedClient ? (
          <div className="flex items-center gap-3 bg-primary/5 p-2 rounded-lg border border-primary/20">
            <div className="bg-primary/10 p-2 rounded-full">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{selectedClient.nombre} {selectedClient.apellido_paterno}</p>
              <p className="text-[10px] text-muted-foreground">{selectedClient.celular}</p>
            </div>
            <Check className="h-4 w-4 text-green-500" />
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full h-12 justify-start gap-3 border-dashed"
            onClick={() => setIsClientSelectorOpen(true)}
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Seleccionar o crear cliente</span>
          </Button>
        )}
      </div>

      {/* Payment & Options */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="QR">Código QR</SelectItem>
                <SelectItem value="TARJETA">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            className="mt-6 h-10 gap-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
            onClick={addGenericItem}
          >
            <Wallet className="h-4 w-4" />
            Lote FIFO
          </Button>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-2 rounded-lg border bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium">Abono</span>
            </div>
            <Checkbox checked={registrarAbono} onCheckedChange={(val) => setRegistrarAbono(!!val)} />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg border bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium">Entrega</span>
            </div>
            <Checkbox checked={agendarEntrega} onCheckedChange={(val) => setAgendarEntrega(!!val)} />
          </div>
        </div>

        {/* Conditional Forms */}
        {registrarAbono && (
          <div className="p-3 bg-green-50 dark:bg-green-950/10 rounded-xl border border-green-100 dark:border-green-900/30 animate-in slide-in-from-top-2 duration-300">
            <Label className="text-[10px] font-bold text-green-700 uppercase">Monto de Abono</Label>
            <Input 
              type="number" 
              placeholder="0.00" 
              className="mt-1 border-green-200 focus:ring-green-500"
              value={montoAbono}
              onChange={(e) => setMontoAbono(e.target.value)}
            />
          </div>
        )}

        {agendarEntrega && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/10 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-2 animate-in slide-in-from-top-2 duration-300">
            <Label className="text-[10px] font-bold text-blue-700 uppercase">Datos de Entrega</Label>
            
            <Select 
              value={agendaData.tipo_entrega} 
              onValueChange={(val) => setAgendaData(prev => ({...prev, tipo_entrega: val}))}
            >
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Delivery">Delivery Local</SelectItem>
                <SelectItem value="Recoleccion_Tienda">Recojo en Tienda</SelectItem>
                <SelectItem value="Encomienda">Encomienda (Nacional)</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
               <Input 
                 type="date" 
                 className="h-8 text-xs bg-white" 
                 value={agendaData.fecha_programada}
                 onChange={(e) => setAgendaData(prev => ({...prev, fecha_programada: e.target.value}))}
               />
               <Input 
                 placeholder="Hora (opc)" 
                 className="h-8 text-xs bg-white" 
                 value={agendaData.hora_programada || ''}
                 onChange={(e) => setAgendaData(prev => ({...prev, hora_programada: e.target.value}))}
               />
            </div>

            <Input 
              placeholder="Dirección completa..." 
              className="h-8 text-xs bg-white" 
              value={agendaData.direccion_entrega || ''}
              onChange={(e) => setAgendaData(prev => ({...prev, direccion_entrega: e.target.value}))}
            />

            {agendaData.tipo_entrega === 'Encomienda' && (
              <div className="grid grid-cols-2 gap-2">
                 <Input 
                   placeholder="Dpto" 
                   className="h-8 text-xs bg-white" 
                   value={agendaData.departamento || ''}
                   onChange={(e) => setAgendaData(prev => ({...prev, departamento: e.target.value}))}
                 />
                 <Input 
                   placeholder="Transporte" 
                   className="h-8 text-xs bg-white" 
                   value={agendaData.empresa_transporte || ''}
                   onChange={(e) => setAgendaData(prev => ({...prev, empresa_transporte: e.target.value}))}
                 />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Totals & Action */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex justify-between items-end">
          <span className="text-muted-foreground font-medium">Subtotal ({cart.length} ítems)</span>
          <span className="text-lg font-bold">{total.toFixed(2)} Bs</span>
        </div>
        
        <div className="flex justify-between items-center text-primary">
          <span className="text-sm font-bold uppercase tracking-wider">Total a Pagar</span>
          <span className="text-3xl font-black">{total.toFixed(2)} <span className="text-sm">Bs</span></span>
        </div>

        <Button 
          className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 group"
          onClick={handleFinalizar}
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Finalizar Venta
              <Check className="ml-2 h-5 w-5 group-hover:scale-125 transition-transform" />
            </>
          )}
        </Button>
      </div>

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
