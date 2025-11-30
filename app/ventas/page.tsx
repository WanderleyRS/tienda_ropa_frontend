'use client';

import { useState, useEffect } from 'react';
import { ventasApi, companiesApi, categoriesApi, Almacen, Category, PotencialCliente } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Calendar, User, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { VentaDetailModal } from '@/components/VentaDetailModal';
import ScheduleDeliveryModal from '@/components/ScheduleDeliveryModal';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { ClientSelector } from '@/components/ClientSelector';
import { Skeleton } from '@/components/ui/skeleton';

interface Venta {
    id: number;
    fecha_venta: string;
    monto_total: number;
    estado_pago: string;
    cliente_id?: number;
    cliente?: {
        nombre: string;
        apellido_paterno: string;
        apellido_materno?: string;
    };
}

export default function VentasPage() {
    const { user } = useAuth();
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtros
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [categorias, setCategorias] = useState<Category[]>([]);
    const [filtroAlmacen, setFiltroAlmacen] = useState('ALL');
    const [filtroCategoria, setFiltroCategoria] = useState('ALL');
    const [selectedClient, setSelectedClient] = useState<PotencialCliente | null>(null);
    const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

    const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [ventaToSchedule, setVentaToSchedule] = useState<number | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadVentas();
    }, [filtroAlmacen, filtroCategoria, selectedClient]);

    const loadInitialData = async () => {
        try {
            const [catsData, almacenesData] = await Promise.all([
                categoriesApi.getAll(),
                user?.role === 'admin' ? companiesApi.getAlmacenes() : Promise.resolve([])
            ]);
            setCategorias(catsData);
            if (user?.role === 'admin') {
                setAlmacenes(almacenesData);
            }
        } catch (err) {
            console.error('Error loading initial data:', err);
        }
    };

    const loadVentas = async (search?: string) => {
        setIsLoading(true);
        try {
            const filters: any = {};
            if (search) filters.search = search;
            if (filtroAlmacen && filtroAlmacen !== 'ALL') filters.almacen_id = parseInt(filtroAlmacen);
            if (filtroCategoria && filtroCategoria !== 'ALL') filters.categoria_id = parseInt(filtroCategoria);
            if (selectedClient) filters.cliente_id = selectedClient.id;

            const data = await ventasApi.listar(filters);
            setVentas(data);
        } catch (error) {
            console.error('Error loading ventas:', error);
            toast.error('Error al cargar ventas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        loadVentas(searchTerm);
    };

    const handleViewDetail = (ventaId: number) => {
        setSelectedVentaId(ventaId);
        setDetailModalOpen(true);
    };

    const handleScheduleDelivery = (ventaId: number) => {
        setVentaToSchedule(ventaId);
        setScheduleModalOpen(true);
    };

    const getClienteName = (venta: Venta) => {
        if (!venta.cliente) return 'Sin cliente';
        const { nombre, apellido_paterno, apellido_materno } = venta.cliente;
        return `${nombre} ${apellido_paterno} ${apellido_materno || ''}`.trim();
    };

    const limpiarFiltros = () => {
        setSearchTerm('');
        setFiltroAlmacen('ALL');
        setFiltroCategoria('ALL');
        setSelectedClient(null);
        loadVentas('');
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Ventas</h1>
                    <p className="text-muted-foreground">Historial de ventas y gestión de abonos</p>
                </div>

                {/* Filtros y Buscador */}
                <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Filtros</h2>
                        <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                            Limpiar filtros
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Buscador */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar ID o cliente..."
                                className="pl-9 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>

                        {/* Filtro Categoría */}
                        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas las categorías</SelectItem>
                                {categorias.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Filtro Almacén (Admin) */}
                        {user?.role === 'admin' && (
                            <Select value={filtroAlmacen} onValueChange={setFiltroAlmacen}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Almacén" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los almacenes</SelectItem>
                                    {almacenes.map((almacen) => (
                                        <SelectItem key={almacen.id} value={almacen.id.toString()}>
                                            {almacen.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Filtro Cliente */}
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
                                Filtrar por cliente...
                            </Button>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSearch}>Buscar</Button>
                    </div>
                </div>

                {/* Tabla de Ventas */}
                <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-4">
                            <Table>
                                <TableHeader className="bg-secondary/30">
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Monto Total</TableHead>
                                        <TableHead>Estado de Pago</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : ventas.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground bg-secondary/10">
                            <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-lg">No se encontraron ventas</p>
                            <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-secondary/30">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[80px]">ID</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Monto Total</TableHead>
                                            <TableHead>Estado de Pago</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ventas.map((venta) => (
                                            <TableRow key={venta.id} className="hover:bg-secondary/10 transition-colors">
                                                <TableCell className="font-medium text-muted-foreground">#{venta.id}</TableCell>
                                                <TableCell>
                                                    {format(new Date(venta.fecha_venta), "d MMM yyyy, HH:mm", { locale: es })}
                                                </TableCell>
                                                <TableCell className="font-medium">{getClienteName(venta)}</TableCell>
                                                <TableCell className="font-bold text-primary">
                                                    ${venta.monto_total.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${venta.estado_pago === 'PAGADO'
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                            }`}
                                                    >
                                                        {venta.estado_pago}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {venta.estado_pago === 'PAGADO' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleScheduleDelivery(venta.id)}
                                                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                            >
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                Programar
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetail(venta.id)}
                                                            className="hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Ver Detalle
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {ventas.map((venta) => (
                                    <div
                                        key={venta.id}
                                        className="bg-secondary/10 rounded-lg p-4 border border-border/50 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">#{venta.id}</span>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${venta.estado_pago === 'PAGADO'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                    }`}
                                            >
                                                {venta.estado_pago}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Cliente</p>
                                            <p className="font-medium">{getClienteName(venta)}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Fecha</p>
                                                <p className="text-sm">
                                                    {format(new Date(venta.fecha_venta), "d MMM yyyy, HH:mm", { locale: es })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Total</p>
                                                <p className="text-lg font-bold text-primary">
                                                    ${venta.monto_total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {venta.estado_pago === 'PAGADO' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleScheduleDelivery(venta.id)}
                                                    className="flex-1"
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    Programar
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetail(venta.id)}
                                                className="flex-1"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Ver Detalle
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Modal de Detalle */}
                {selectedVentaId && (
                    <VentaDetailModal
                        isOpen={detailModalOpen}
                        onClose={() => setDetailModalOpen(false)}
                        ventaId={selectedVentaId}
                        onUpdate={loadVentas}
                    />
                )}

                {/* Modal de Programar Entrega */}
                {ventaToSchedule && (
                    <ScheduleDeliveryModal
                        ventaId={ventaToSchedule}
                        onClose={() => {
                            setScheduleModalOpen(false);
                            setVentaToSchedule(null);
                        }}
                        onSuccess={() => {
                            toast.success('Entrega programada exitosamente');
                            loadVentas();
                        }}
                    />
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
