'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { comprasApi, categoriesApi, Compra, Category } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Package, CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, Link2 } from 'lucide-react';
import Link from 'next/link';

export default function CompraDetallePage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    const [compra, setCompra] = useState<Compra | null>(null);
    const [categorias, setCategorias] = useState<Category[]>([]);
    const [isLoadingCompra, setIsLoadingCompra] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated && params.id) {
            loadData();
        }
    }, [isAuthenticated, isLoading, params.id, router]);

    const loadData = async () => {
        setIsLoadingCompra(true);
        try {
            const [compraData, categoriasData] = await Promise.all([
                comprasApi.getCompra(Number(params.id)),
                categoriesApi.getAll()
            ]);
            setCompra(compraData);
            setCategorias(categoriasData);
        } catch (error: any) {
            console.error('Error loading compra:', error);
            toast.error('Error al cargar compra');
            router.push('/compras');
        } finally {
            setIsLoadingCompra(false);
        }
    };

    const getCategoriaNombre = (categoriaId: number) => {
        return categorias.find(c => c.id === categoriaId)?.name || 'N/A';
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'COMPLETADA':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Completada
                    </span>
                );
            case 'PROCESANDO':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Clock className="h-4 w-4" />
                        Procesando
                    </span>
                );
            case 'PENDIENTE':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="h-4 w-4" />
                        Pendiente
                    </span>
                );
            default:
                return <span className="text-sm text-muted-foreground">{estado}</span>;
        }
    };

    if (isLoading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/compras">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground">
                            {compra?.codigo || 'Cargando...'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Detalle de la compra
                        </p>
                    </div>
                    {compra && getEstadoBadge(compra.estado)}
                </div>

                {isLoadingCompra ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-4">Cargando compra...</p>
                    </div>
                ) : compra ? (
                    <div className="space-y-6">
                        {/* Información General */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Proveedor
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{compra.proveedor?.nombre || 'N/A'}</p>
                                    {compra.proveedor?.celular && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {compra.proveedor.celular}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Monto Total
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{compra.monto_total.toFixed(2)} Bs</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {compra.metodo_pago || 'N/A'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Fecha de Compra
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">
                                        {new Date(compra.fecha_compra).toLocaleDateString('es-BO')}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {new Date(compra.fecha_compra).toLocaleTimeString('es-BO', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Progreso */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Progreso de Carga</CardTitle>
                                <CardDescription>
                                    {compra.items_creados} de {compra.items_esperados} prendas cargadas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progreso total</span>
                                        <span className="font-medium">
                                            {compra.items_esperados > 0
                                                ? Math.round((compra.items_creados / compra.items_esperados) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-3">
                                        <div
                                            className="bg-primary h-3 rounded-full transition-all"
                                            style={{
                                                width: `${compra.items_esperados > 0
                                                    ? (compra.items_creados / compra.items_esperados) * 100
                                                    : 0
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detalles por Categoría */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalles por Categoría</CardTitle>
                                <CardDescription>Desglose de la compra por categoría de prenda</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {compra.detalles.map((detalle) => (
                                        <div
                                            key={detalle.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold">
                                                    {getCategoriaNombre(detalle.categoria_id)}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Costo unitario: {detalle.costo_unitario.toFixed(2)} Bs
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    {detalle.items_creados}/{detalle.cantidad} prendas
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Subtotal: {detalle.subtotal.toFixed(2)} Bs
                                                </p>
                                            </div>
                                            <div className="ml-4">
                                                <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center">
                                                    <span className="text-sm font-bold">
                                                        {detalle.cantidad > 0
                                                            ? Math.round((detalle.items_creados / detalle.cantidad) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notas */}
                        {compra.notas && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{compra.notas}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Acciones - 3 Opciones para Agregar Items */}
                        {compra.estado !== 'COMPLETADA' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">Agregar Prendas a la Compra</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Opción 1: Carga Masiva */}
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Package className="h-6 w-6 text-primary" />
                                                </div>
                                                <CardTitle className="text-lg">Carga Masiva</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="mb-4">
                                                Para múltiples items. Usa Gemini para parsear chat de WhatsApp.
                                            </CardDescription>
                                            <Link href="/items/bulk-upload">
                                                <Button className="w-full">
                                                    <TrendingUp className="h-4 w-4 mr-2" />
                                                    Ir a Carga Masiva
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>

                                    {/* Opción 2: Crear Individual */}
                                    <Card className="hover:border-primary/50 transition-colors">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-green-500/10">
                                                    <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                </div>
                                                <CardTitle className="text-lg">Crear Individual</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="mb-4">
                                                Para 1-3 items. Formulario rápido para crear prendas una por una.
                                            </CardDescription>
                                            <Button className="w-full" variant="outline" disabled>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Próximamente
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Opción 3: Relacionar Existentes */}
                                    <Card className="hover:border-primary/50 transition-colors">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-500/10">
                                                    <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <CardTitle className="text-lg">Relacionar Existentes</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="mb-4">
                                                Asigna items ya creados sin compra a esta compra.
                                            </CardDescription>
                                            <Button className="w-full" variant="outline" disabled>
                                                <Link2 className="h-4 w-4 mr-2" />
                                                Próximamente
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">Compra no encontrada</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
