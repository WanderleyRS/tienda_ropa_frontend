import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, User, Phone, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { clientesApi, PotencialCliente, ventasApi } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadConversionModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: number;
    itemTitle: string;
    itemPrice: number;
    onSuccess: () => void;
}

export function LeadConversionModal({ isOpen, onClose, itemId, itemTitle, itemPrice, onSuccess }: LeadConversionModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [leads, setLeads] = useState<PotencialCliente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

    // Estados para abono inicial
    const [registrarAbono, setRegistrarAbono] = useState(false);
    const [montoAbono, setMontoAbono] = useState('');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');

    useEffect(() => {
        if (isOpen) {
            loadLeads();
            setSearchTerm('');
            setSelectedLeadId(null);
            setRegistrarAbono(false);
            setMontoAbono('');
            setMetodoPago('EFECTIVO');
        }
    }, [isOpen]);

    const loadLeads = async () => {
        setIsLoading(true);
        try {
            // Cargar TODOS los clientes activos (PENDIENTE primero, luego CONVERTIDO)
            console.log('Fetching leads...');
            const data = await clientesApi.listarTodos();
            console.log('Leads fetched:', data);
            setLeads(data);
        } catch (error) {
            console.error('Error loading leads:', error);
            toast.error('Error al cargar clientes');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const term = searchTerm.toLowerCase();
        const fullName = `${lead.nombre} ${lead.apellido_paterno} ${lead.apellido_materno || ''}`.toLowerCase();
        return fullName.includes(term) || lead.celular.includes(term);
    });

    const handleConvert = async () => {
        if (!selectedLeadId) return;

        // Validar abono si está marcado
        if (registrarAbono) {
            const monto = parseFloat(montoAbono);
            if (isNaN(monto) || monto <= 0) {
                toast.error('El monto del abono debe ser mayor a 0');
                return;
            }
            if (monto > itemPrice) {
                toast.error('El monto del abono no puede ser mayor al total de la venta');
                return;
            }
        }

        setIsConverting(true);
        try {
            const ventaData: any = {
                cliente_id: selectedLeadId,
                detalles: [
                    {
                        producto_id: itemId,
                        cantidad: 1,
                        precio_unitario: itemPrice
                    }
                ],
                metodo_pago: metodoPago
            };

            // Agregar abono inicial si está marcado
            if (registrarAbono && montoAbono) {
                ventaData.abono_inicial = {
                    monto_abonado: parseFloat(montoAbono),
                    metodo_pago: metodoPago
                };
            }

            await ventasApi.crear(ventaData);

            toast.success('Venta registrada exitosamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error converting lead:', error);
            toast.error(error.response?.data?.detail || 'Error al registrar la venta');
        } finally {
            setIsConverting(false);
        }
    };

    const getLeadFullName = (lead: PotencialCliente) => {
        return `${lead.nombre} ${lead.apellido_paterno} ${lead.apellido_materno || ''}`.trim();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Registrar Venta</DialogTitle>
                    <DialogDescription>
                        Producto: <span className="font-semibold">{itemTitle}</span> - Precio: <span className="font-semibold">{itemPrice.toFixed(2)} Bs</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Búsqueda de clientes */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Seleccionar Cliente</Label>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o celular..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Lista de clientes */}
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    Cargando clientes...
                                </div>
                            ) : filteredLeads.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    No se encontraron clientes potenciales
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className={`p-3 cursor-pointer hover:bg-accent transition-colors ${selectedLeadId === lead.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                                                }`}
                                            onClick={() => setSelectedLeadId(lead.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-medium text-foreground">{getLeadFullName(lead)}</span>
                                                        {selectedLeadId === lead.id && (
                                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        {lead.celular}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Registrado: {format(new Date(lead.fecha_insercion), 'd MMM yyyy', { locale: es })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sección de Abono Inicial */}
                    <div className="border-t pt-4">
                        <div className="flex items-center space-x-2 mb-4">
                            <Checkbox
                                id="registrar-abono"
                                checked={registrarAbono}
                                onCheckedChange={(checked) => setRegistrarAbono(checked as boolean)}
                            />
                            <Label
                                htmlFor="registrar-abono"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                ¿Registrar abono inicial?
                            </Label>
                        </div>

                        {registrarAbono && (
                            <div className="space-y-4 pl-6 border-l-2 border-primary/30">
                                <div>
                                    <Label htmlFor="monto-abono" className="text-sm font-medium mb-2 block">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Monto del Abono
                                    </Label>
                                    <Input
                                        id="monto-abono"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={itemPrice}
                                        placeholder="0.00"
                                        value={montoAbono}
                                        onChange={(e) => setMontoAbono(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Máximo: {itemPrice.toFixed(2)} Bs
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="metodo-pago" className="text-sm font-medium mb-2 block">
                                        Método de Pago
                                    </Label>
                                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                                        <SelectTrigger id="metodo-pago">
                                            <SelectValue placeholder="Seleccionar método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                            <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                            <SelectItem value="TARJETA">Tarjeta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={onClose} disabled={isConverting}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConvert}
                            disabled={!selectedLeadId || isConverting}
                        >
                            {isConverting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                'Registrar Venta'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
