import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { agendaApi, clientesApi, PotencialCliente, AgendaCreate } from '@/lib/api';
import { toast } from 'sonner';
import { PackagePlus, CalendarIcon, MapPin, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';

interface CreateExternalDeliveryModalProps {
    onDeliveryCreated?: () => void;
}

export function CreateExternalDeliveryModal({ onDeliveryCreated }: CreateExternalDeliveryModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<PotencialCliente[]>([]);

    // Form state
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [deliveryType, setDeliveryType] = useState('Delivery');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    // Encomienda fields
    const [departamento, setDepartamento] = useState('');
    const [empresaTransporte, setEmpresaTransporte] = useState('');

    useEffect(() => {
        if (open) {
            loadClients();
        }
    }, [open]);

    const loadClients = async () => {
        try {
            const data = await clientesApi.listarTodos();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
            toast.error('Error al cargar clientes');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedClientId) {
            toast.error('Debes seleccionar un cliente');
            return;
        }
        if (!description) {
            toast.error('Debes ingresar una descripción del paquete');
            return;
        }
        if (!date) {
            toast.error('Debes seleccionar una fecha');
            return;
        }
        if (deliveryType === 'Delivery' && !address) {
            toast.error('La dirección es obligatoria para Delivery');
            return;
        }
        if (deliveryType === 'Encomienda') {
            if (!departamento) {
                toast.error('Selecciona un departamento de destino');
                return;
            }
            if (!empresaTransporte) {
                toast.error('Ingresa la empresa de transporte');
                return;
            }
        }

        setIsLoading(true);
        try {
            const payload: AgendaCreate = {
                venta_id: undefined, // Explicitly undefined for external delivery
                cliente_id: parseInt(selectedClientId),
                descripcion_paquete: description,
                tipo_entrega: deliveryType,
                fecha_programada: date.toISOString(),
                hora_programada: time || undefined,
                direccion_entrega: address || undefined,
                notas_logistica: notes || undefined,
                departamento: deliveryType === 'Encomienda' ? departamento : undefined,
                empresa_transporte: deliveryType === 'Encomienda' ? empresaTransporte : undefined,
            };

            await agendaApi.create(payload);
            toast.success('Entrega externa registrada exitosamente');
            setOpen(false);
            resetForm();
            if (onDeliveryCreated) {
                onDeliveryCreated();
            }
        } catch (error: any) {
            console.error('Error creating delivery:', error);
            toast.error('Error al registrar entrega');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedClientId('');
        setDescription('');
        setDeliveryType('Delivery');
        setDate(new Date());
        setTime('');
        setAddress('');
        setNotes('');
        setDepartamento('');
        setEmpresaTransporte('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <PackagePlus className="h-4 w-4" />
                    Registrar Entrega Externa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Entrega Externa</DialogTitle>
                    <DialogDescription>
                        Para paquetes sin venta registrada en el sistema.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.nombre} {client.apellido_paterno} ({client.celular})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {clients.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No hay clientes. Ve a "Clientes" para crear uno.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción del Paquete</Label>
                        <Textarea
                            placeholder="Ej. Paquete de 3 camisas (Venta antigua)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Entrega</Label>
                            <Select value={deliveryType} onValueChange={setDeliveryType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Delivery">Delivery a Domicilio</SelectItem>
                                    <SelectItem value="Recoleccion_Tienda">Recogida en Tienda</SelectItem>
                                    <SelectItem value="Encomienda">Encomienda (Nacional)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Programada</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {deliveryType === 'Encomienda' && (
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
                            <div className="space-y-2">
                                <Label>Departamento Destino</Label>
                                <Select value={departamento} onValueChange={setDepartamento}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="La Paz">La Paz</SelectItem>
                                        <SelectItem value="Cochabamba">Cochabamba</SelectItem>
                                        <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                                        <SelectItem value="Oruro">Oruro</SelectItem>
                                        <SelectItem value="Potosí">Potosí</SelectItem>
                                        <SelectItem value="Chuquisaca">Chuquisaca</SelectItem>
                                        <SelectItem value="Tarija">Tarija</SelectItem>
                                        <SelectItem value="Beni">Beni</SelectItem>
                                        <SelectItem value="Pando">Pando</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Empresa Transporte</Label>
                                <Input
                                    placeholder="Ej. Bolivar, Copacabana..."
                                    value={empresaTransporte}
                                    onChange={(e) => setEmpresaTransporte(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Hora (Opcional)</Label>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>

                    {deliveryType === 'Delivery' && (
                        <div className="space-y-2">
                            <Label>Dirección de Entrega</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Dirección completa..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Notas Logísticas (Opcional)</Label>
                        <Textarea
                            placeholder="Instrucciones para el repartidor..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Registrando...' : 'Registrar Entrega'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
