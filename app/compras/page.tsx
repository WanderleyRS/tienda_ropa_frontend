'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { comprasApi, Compra } from '@/lib/api';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Eye, Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ComprasPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [compras, setCompras] = useState<Compra[]>([]);
    const [isLoadingCompras, setIsLoadingCompras] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState<string>('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            loadCompras();
        }
    }, [isAuthenticated, isLoading, router, filtroEstado]);

    const loadCompras = async () => {
        setIsLoadingCompras(true);
        try {
            const data = await comprasApi.getCompras(filtroEstado || undefined);
            setCompras(data);
        } catch (error) {
            console.error('Error loading compras:', error);
            toast.error('Error al cargar compras');
        } finally {
            setIsLoadingCompras(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'COMPLETADA':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Completada
                    </span>
                );
            case 'PROCESANDO':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Clock className="h-3 w-3" />
                        Procesando
                    </span>
                );
            case 'PENDIENTE':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="h-3 w-3" />
                        Pendiente
                    </span>
                );
            default:
                return <span className="text-xs text-muted-foreground">{estado}</span>;
        }
    };

    if (isLoading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <ShoppingCart className="h-8 w-8" />
                            Compras
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Gestiona las compras de prendas y proveedores
                        </p>
                    </div>
                    <Link href="/compras/nueva">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Compra
                        </Button>
                    </Link>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={filtroEstado === '' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroEstado('')}
                    >
                        Todas
                    </Button>
                    <Button
                        variant={filtroEstado === 'PENDIENTE' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroEstado('PENDIENTE')}
                    >
                        Pendientes
                    </Button>
                    <Button
                        variant={filtroEstado === 'PROCESANDO' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroEstado('PROCESANDO')}
                    >
                        Procesando
                    </Button>
                    <Button
                        variant={filtroEstado === 'COMPLETADA' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroEstado('COMPLETADA')}
                    >
                        Completadas
                    </Button>
                </div>

                {/* Lista de compras */}
                {isLoadingCompras ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-4">Cargando compras...</p>
                    </div>
                ) : compras.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No hay compras</h3>
                            <p className="text-muted-foreground mb-4">
                                {filtroEstado
                                    ? `No hay compras con estado "${filtroEstado}"`
                                    : 'Comienza registrando tu primera compra'}
                            </p>
                            <Link href="/compras/nueva">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nueva Compra
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {compras.map((compra) => (
                            <Card key={compra.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {compra.codigo}
                                                {getEstadoBadge(compra.estado)}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                Proveedor: {compra.proveedor?.nombre || 'N/A'} •{' '}
                                                {new Date(compra.fecha_compra).toLocaleDateString('es-BO')}
                                            </CardDescription>
                                        </div>
                                        <Link href={`/compras/${compra.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver Detalle
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Monto Total</p>
                                            <p className="text-lg font-semibold">
                                                {compra.monto_total.toFixed(2)} Bs
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Prendas</p>
                                            <p className="text-lg font-semibold">
                                                {compra.items_creados}/{compra.items_esperados}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Progreso</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-secondary rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all"
                                                        style={{
                                                            width: `${compra.items_esperados > 0
                                                                    ? (compra.items_creados / compra.items_esperados) * 100
                                                                    : 0
                                                                }%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">
                                                    {compra.items_esperados > 0
                                                        ? Math.round(
                                                            (compra.items_creados / compra.items_esperados) * 100
                                                        )
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Método de Pago</p>
                                            <p className="text-sm font-medium">{compra.metodo_pago || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
