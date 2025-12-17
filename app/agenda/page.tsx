'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { agendaApi, Agenda, companiesApi, Almacen, PotencialCliente } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Package, Truck, Store, CheckCircle2, Clock, MapPin, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientSelector } from '@/components/ClientSelector';
import { Skeleton } from '@/components/ui/skeleton';

interface AgendaWithClient extends Agenda {
    cliente?: {
        nombre: string;
        apellido_paterno: string;
        apellido_materno?: string;
        celular: string;
    };
    almacen?: {
        nombre: string;
    };
}

export default function AgendaPage() {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const router = useRouter();
    const [agendas, setAgendas] = useState<AgendaWithClient[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtros
    const [filtroFecha, setFiltroFecha] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('ALL');
    const [filtroEstado, setFiltroEstado] = useState('Agendado');
    const [filtroAlmacen, setFiltroAlmacen] = useState('ALL');

    // Estado para el selector de cliente
    const [selectedClient, setSelectedClient] = useState<PotencialCliente | null>(null);
    const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadInitialData();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            loadAgendas();
        }
    }, [isAuthenticated, filtroFecha, filtroTipo, filtroEstado, filtroAlmacen, selectedClient]);

    const loadInitialData = async () => {
        try {
            // Solo cargamos almacenes si es admin, y evitamos cargar todos los clientes
            if (user?.role === 'admin') {
                const almacenesData = await companiesApi.getAlmacenes();
                setAlmacenes(almacenesData);
            }
        } catch (err) {
            console.error('Error loading initial data:', err);
        }
    };

    const loadAgendas = async () => {
        setIsLoading(true);
        setError('');
        try {
            const filters: any = {};
            if (filtroFecha) filters.fecha = filtroFecha;
            if (filtroTipo && filtroTipo !== 'ALL') filters.tipo = filtroTipo;
            if (filtroEstado && filtroEstado !== 'ALL') filters.estado = filtroEstado;
            if (filtroAlmacen && filtroAlmacen !== 'ALL') filters.almacen_id = filtroAlmacen;
            if (selectedClient) filters.cliente_id = selectedClient.id;

            const data = await agendaApi.list(filters);
            setAgendas(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al cargar las entregas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompletar = async (id: number) => {
        if (!confirm('¿Marcar esta entrega como completada?')) return;

        try {
            await agendaApi.complete(id);
            toast.success('Entrega marcada como completada');
            loadAgendas();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al completar la entrega');
        }
    };

    const getClienteName = (agenda: AgendaWithClient) => {
        if (!agenda.cliente) return 'Sin cliente';
        const { nombre, apellido_paterno, apellido_materno } = agenda.cliente;
        return `${nombre} ${apellido_paterno} ${apellido_materno || ''}`.trim();
    };

    const limpiarFiltros = () => {
        setFiltroFecha('');
        setFiltroTipo('ALL');
        setFiltroEstado('ALL');
        setFiltroAlmacen('ALL');
        setSelectedClient(null);
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                        <Package className="w-8 h-8 text-primary" />
                        Agenda de Entregas
                    </h1>
                    <p className="text-muted-foreground">Gestión de entregas y recolecciones programadas</p>
                </div>

                {/* Filtros */}
                <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Filtros</h2>
                        <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                            Limpiar filtros
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                            <Input
                                type="date"
                                value={filtroFecha}
                                onChange={(e) => setFiltroFecha(e.target.value)}
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="Delivery">Delivery</SelectItem>
                                    <SelectItem value="Recoleccion_Tienda">Recolección</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Estado</label>
                            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="Agendado">Agendado</SelectItem>
                                    <SelectItem value="En_Transito">En Tránsito</SelectItem>
                                    <SelectItem value="Entregado">Entregado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {user?.role === 'admin' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Almacén</label>
                                <Select value={filtroAlmacen} onValueChange={setFiltroAlmacen}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        {almacenes.map((almacen) => (
                                            <SelectItem key={almacen.id} value={almacen.id.toString()}>
                                                {almacen.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                            {selectedClient ? (
                                <div className="flex gap-2">
                                    <div className="flex-1 flex items-center px-3 py-2 bg-primary/10 text-primary rounded-md border border-primary/20 text-sm truncate">
                                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="truncate">{selectedClient.nombre} {selectedClient.apellido_paterno}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setSelectedClient(null)}
                                        className="flex-shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsClientSelectorOpen(true)}
                                    className="w-full justify-start text-muted-foreground font-normal"
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Seleccionar cliente...
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla de Entregas */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-secondary/30">
                                    <TableRow>
                                        <TableHead className="font-semibold">ID Venta</TableHead>
                                        <TableHead className="font-semibold">Cliente</TableHead>
                                        {user?.role === 'admin' && <TableHead className="font-semibold">Almacén</TableHead>}
                                        <TableHead className="font-semibold">Tipo</TableHead>
                                        <TableHead className="font-semibold">Fecha/Hora</TableHead>
                                        <TableHead className="font-semibold">Dirección</TableHead>
                                        <TableHead className="font-semibold">Estado</TableHead>
                                        <TableHead className="text-right font-semibold">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            {user?.role === 'admin' && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : agendas.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-12 text-center">
                        <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground text-lg">No hay entregas programadas</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Las entregas aparecerán aquí una vez que sean programadas
                        </p>
                    </div>
                ) : (
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-secondary/30">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold">ID Venta</TableHead>
                                        <TableHead className="font-semibold">Cliente</TableHead>
                                        {user?.role === 'admin' && <TableHead className="font-semibold">Almacén</TableHead>}
                                        <TableHead className="font-semibold">Tipo</TableHead>
                                        <TableHead className="font-semibold">Fecha/Hora</TableHead>
                                        <TableHead className="font-semibold">Dirección</TableHead>
                                        <TableHead className="font-semibold">Estado</TableHead>
                                        <TableHead className="text-right font-semibold">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agendas.map((agenda) => (
                                        <TableRow key={agenda.id} className="hover:bg-secondary/10 transition-colors">
                                            <TableCell className="font-medium text-primary">
                                                {agenda.venta_id ? `#${agenda.venta_id}` : (
                                                    <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground" title={agenda.descripcion_paquete}>
                                                        EXTERNO
                                                    </span>
                                                )}
                                                {!agenda.venta_id && agenda.descripcion_paquete && (
                                                    <div className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                                                        {agenda.descripcion_paquete}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{getClienteName(agenda)}</TableCell>
                                            {user?.role === 'admin' && (
                                                <TableCell className="text-muted-foreground">
                                                    {agenda.almacen?.nombre || '-'}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {agenda.tipo_entrega === 'Delivery' ? (
                                                        <>
                                                            <Truck className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm">Delivery</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Store className="w-4 h-4 text-green-600" />
                                                            <span className="text-sm">Recolección</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(agenda.fecha_programada), "d MMM yyyy", { locale: es })}
                                                    {agenda.hora_programada && ` - ${agenda.hora_programada}`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-muted-foreground">
                                                {agenda.direccion_entrega ? (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{agenda.direccion_entrega}</span>
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${agenda.estado_entrega === 'Entregado'
                                                        ? 'bg-green-50 text-green-700 border-green-100'
                                                        : agenda.estado_entrega === 'En_Transito'
                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                            : 'bg-blue-50 text-blue-700 border-blue-100'
                                                        }`}
                                                >
                                                    {agenda.estado_entrega}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {agenda.estado_entrega === 'Agendado' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCompletar(agenda.id)}
                                                        className="hover:bg-green-50 hover:text-green-600"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Completar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <ClientSelector
                    isOpen={isClientSelectorOpen}
                    onClose={() => setIsClientSelectorOpen(false)}
                    onSelect={setSelectedClient}
                />
            </main>
        </div>
    );
}
