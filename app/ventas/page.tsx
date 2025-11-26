'use client';

import { useState, useEffect } from 'react';
import { ventasApi } from '@/lib/api';
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
import { Search, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { VentaDetailModal } from '@/components/VentaDetailModal';
import { Navbar } from '@/components/Navbar';

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
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    useEffect(() => {
        loadVentas();
    }, []);

    const loadVentas = async (search?: string) => {
        setIsLoading(true);
        try {
            const data = await ventasApi.listar(search);
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

    const getClienteName = (venta: Venta) => {
        if (!venta.cliente) return 'Sin cliente';
        const { nombre, apellido_paterno, apellido_materno } = venta.cliente;
        return `${nombre} ${apellido_paterno} ${apellido_materno || ''}`.trim();
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Ventas</h1>
                    <p className="text-muted-foreground">Historial de ventas y gestión de abonos</p>
                </div>

                {/* Buscador */}
                <div className="mb-6 flex gap-2 max-w-2xl bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por ID de venta o nombre de cliente..."
                            className="pl-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} className="shadow-sm">Buscar</Button>
                    <Button variant="ghost" onClick={() => { setSearchTerm(''); loadVentas(); }}>
                        Limpiar
                    </Button>
                </div>

                {/* Tabla de Ventas - Desktop */}
                <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
                            <span className="text-muted-foreground">Cargando ventas...</span>
                        </div>
                    ) : ventas.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground bg-secondary/10">
                            No se encontraron ventas
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
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetail(venta.id)}
                                                        className="hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Ver Detalle
                                                    </Button>
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDetail(venta.id)}
                                            className="w-full"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver Detalle
                                        </Button>
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
            </main>
        </div>
    );
}
