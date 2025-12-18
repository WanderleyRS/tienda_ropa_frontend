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

const BOLIVIA_LOCATIONS: Record<string, string[]> = {
    "La Paz": ["Murillo", "Pedro Domingo Murillo", "Aroma", "Nor Yungas", "Sud Yungas", "Omasuyos", "Pacajes", "Larecaja", "Inquisivi", "Abel Iturralde", "Caranavi", "Sud Yungas", "Franz Tamayo", "Muñecas", "Camacho", "Loayza", "Gualberto Villarroel", "Gral. José Manuel Pando", "José Manuel Pando"],
    "Cochabamba": ["Cercado", "Chapare", "Quillacollo", "Punata", "Esteban Arce", "Carrasco", "Germán Jordán", "Mizque", "Campero", "Ayopaya", "Capinota", "Arani", "Arque", "Tapacarí", "Bolívar", "Tiraque"],
    "Santa Cruz": ["Andrés Ibáñez", "Warnes", "Obispo Santistevan", "Sara", "Cordillera", "Chiquitos", "Ñuflo de Chávez", "Guarayos", "Ichilo", "Velasco", "Germán Busch", "Florida", "Caballero", "Ignacio Warnes", "José Miguel de Velasco"],
    "Oruro": ["Cercado", "Pantaleón Dalence", "Saucarí", "Poopó", "Abaroa", "Sebastián Pagador", "Ladislao Cabrera", "San Pedro de Totora", "Nor Carangas", "Sud Carangas", "Sajama", "Litoral", "Tomás Barrón", "Sabaya", "Carangas", "Mejillones"],
    "Potosí": ["Tomás Frías", "Rafael Bustillo", "Sud Chichas", "Nor Chichas", "Modesto Omiste", "Cornelio Saavedra", "Linares", "Alonzo de Ibáñez", "Daniel Campos", "Nor Lípez", "Sud Lípez", "Enrique Baldivieso", "Bernardino Bilbao", "Antonio Quijarro", "Charcas", "Chayanta"],
    "Chuquisaca": ["Oropeza", "Zudáñez", "Yamparáez", "Nor Cinti", "Sud Cinti", "Hernando Siles", "Tomina", "Azurduy", "Belisario Boeto", "Luis Calvo"],
    "Tarija": ["Cercado", "Gran Chaco", "Arce", "Avilés", "Méndez", "Burnet O'Connor"],
    "Beni": ["Cercado", "Vaca Díez", "Ballivián", "Yacuma", "Moxos", "Marbán", "Mamoré", "Iténez"],
    "Pando": ["Nicolás Suárez", "Manuripi", "Madre de Dios", "Abuná", "Federico Román"]
};

const TRANSPORT_COMPANIES = [
    "Flota Bolivar", "Trans Copacabana", "El Mexicano", "Trans Azul", "Flota Yungueña",
    "Trans. San Francisco", "Trans. Illimani", "Trans. Dorado", "Trans. Bioceánico", "Flota Cosmos"
];

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
    const [provincia, setProvincia] = useState('');
    const [empresaTransporte, setEmpresaTransporte] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredProvinces, setFilteredProvinces] = useState<string[]>([]);

    // Transport Autocomplete State
    const [showTransportSuggestions, setShowTransportSuggestions] = useState(false);
    const [filteredTransports, setFilteredTransports] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            loadClients();
        }
    }, [open]);

    useEffect(() => {
        setProvincia('');
        setFilteredProvinces([]);
    }, [departamento]);

    const handleProvinceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setProvincia(value);

        if (departamento && BOLIVIA_LOCATIONS[departamento]) {
            const filtered = BOLIVIA_LOCATIONS[departamento].filter(p =>
                p.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredProvinces(filtered);
            setShowSuggestions(true);
        }
    };

    const selectProvince = (value: string) => {
        setProvincia(value);
        setShowSuggestions(false);
    };

    const handleTransportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmpresaTransporte(value);

        const filtered = TRANSPORT_COMPANIES.filter(t =>
            t.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredTransports(filtered);
        setShowTransportSuggestions(true);
    };

    const selectTransport = (value: string) => {
        setEmpresaTransporte(value);
        setShowTransportSuggestions(false);
    };

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
                provincia: deliveryType === 'Encomienda' ? provincia : undefined,
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
        setProvincia('');
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
                            <div className="space-y-2 relative">
                                <Label>Provincia / Localidad</Label>
                                <Input
                                    placeholder={departamento ? "Escriba o seleccione..." : "Primero elija Dpto."}
                                    value={provincia}
                                    onChange={handleProvinceChange}
                                    onFocus={() => {
                                        if (departamento && BOLIVIA_LOCATIONS[departamento]) {
                                            setFilteredProvinces(BOLIVIA_LOCATIONS[departamento]);
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    disabled={!departamento}
                                    autoComplete="off"
                                />
                                {showSuggestions && filteredProvinces.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                                        {filteredProvinces.map((prov) => (
                                            <div
                                                key={prov}
                                                className="px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                onMouseDown={(e) => {
                                                    e.preventDefault(); // Prevent blur
                                                    selectProvince(prov);
                                                }}
                                            >
                                                {prov}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 col-span-2 relative">
                                <Label>Empresa Transporte</Label>
                                <Input
                                    placeholder="Ej. Bolivar, Copacabana... (Escriba o seleccione)"
                                    value={empresaTransporte}
                                    onChange={handleTransportChange}
                                    onFocus={() => {
                                        setFilteredTransports(TRANSPORT_COMPANIES);
                                        setShowTransportSuggestions(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowTransportSuggestions(false), 200)}
                                    autoComplete="off"
                                />
                                {showTransportSuggestions && filteredTransports.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                                        {filteredTransports.map((t) => (
                                            <div
                                                key={t}
                                                className="px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectTransport(t);
                                                }}
                                            >
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                )}
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
