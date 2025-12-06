'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { comprasApi, categoriesApi, Proveedor, Category, DetalleCompraCreate } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';

export default function NuevaCompraPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [categorias, setCategorias] = useState<Category[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [proveedorId, setProveedorId] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [notas, setNotas] = useState('');
    const [detalles, setDetalles] = useState<DetalleCompraCreate[]>([
        { categoria_id: 0, cantidad: 1, costo_unitario: 0 }
    ]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, isLoading, router]);

    const loadData = async () => {
        setIsLoadingData(true);
        try {
            const [proveedoresData, categoriasData] = await Promise.all([
                comprasApi.getProveedores(true),
                categoriesApi.getAll()
            ]);
            setProveedores(proveedoresData);
            setCategorias(categoriasData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setIsLoadingData(false);
        }
    };

    const agregarDetalle = () => {
        setDetalles([...detalles, { categoria_id: 0, cantidad: 1, costo_unitario: 0 }]);
    };

    const eliminarDetalle = (index: number) => {
        if (detalles.length > 1) {
            setDetalles(detalles.filter((_, i) => i !== index));
        }
    };

    const actualizarDetalle = (index: number, field: keyof DetalleCompraCreate, value: number) => {
        const nuevosDetalles = [...detalles];
        nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value };
        setDetalles(nuevosDetalles);
    };

    const calcularTotal = () => {
        return detalles.reduce((sum, d) => sum + (d.cantidad * d.costo_unitario), 0);
    };

    const calcularTotalPrendas = () => {
        return detalles.reduce((sum, d) => sum + d.cantidad, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!proveedorId || proveedorId === 0) {
            toast.error('Selecciona un proveedor');
            return;
        }

        const detallesValidos = detalles.filter(d =>
            d.categoria_id > 0 && d.cantidad > 0 && d.costo_unitario > 0
        );

        if (detallesValidos.length === 0) {
            toast.error('Agrega al menos una categoría válida');
            return;
        }

        setIsSaving(true);
        try {
            const compra = await comprasApi.createCompra({
                proveedor_id: proveedorId,
                metodo_pago: metodoPago,
                notas: notas || undefined,
                detalles: detallesValidos
            });

            toast.success(`Compra ${compra.codigo} creada exitosamente`);
            router.push(`/compras/${compra.id}`);
        } catch (error: any) {
            console.error('Error creating compra:', error);
            toast.error(error.response?.data?.detail || 'Error al crear compra');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/compras">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Nueva Compra</h1>
                        <p className="text-muted-foreground mt-1">
                            Registra una nueva compra de prendas
                        </p>
                    </div>
                </div>

                {isLoadingData ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-4">Cargando...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {/* Información General */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Información General</CardTitle>
                                    <CardDescription>Datos básicos de la compra</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="proveedor">Proveedor *</Label>
                                            <select
                                                id="proveedor"
                                                value={proveedorId}
                                                onChange={(e) => setProveedorId(Number(e.target.value))}
                                                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground dark:bg-gray-800 dark:border-gray-700"
                                                required
                                            >
                                                <option value={0}>Selecciona un proveedor</option>
                                                {proveedores.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label htmlFor="metodoPago">Método de Pago</Label>
                                            <select
                                                id="metodoPago"
                                                value={metodoPago}
                                                onChange={(e) => setMetodoPago(e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground dark:bg-gray-800 dark:border-gray-700"
                                            >
                                                <option value="EFECTIVO">Efectivo</option>
                                                <option value="TRANSFERENCIA">Transferencia</option>
                                                <option value="QR">QR</option>
                                                <option value="CREDITO">Crédito</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="notas">Notas</Label>
                                        <textarea
                                            id="notas"
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border rounded-md"
                                            rows={3}
                                            placeholder="Notas adicionales sobre la compra..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Detalles por Categoría */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Detalles por Categoría</CardTitle>
                                            <CardDescription>Especifica cantidad y costo por categoría</CardDescription>
                                        </div>
                                        <Button type="button" onClick={agregarDetalle} size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {detalles.map((detalle, index) => (
                                            <div key={index} className="flex gap-4 items-end">
                                                <div className="flex-1">
                                                    <Label>Categoría</Label>
                                                    <select
                                                        value={detalle.categoria_id}
                                                        onChange={(e) => actualizarDetalle(index, 'categoria_id', Number(e.target.value))}
                                                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground dark:bg-gray-800 dark:border-gray-700"
                                                        required
                                                    >
                                                        <option value={0}>Selecciona categoría</option>
                                                        {categorias.map((c) => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="w-24">
                                                    <Label>Cantidad</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={detalle.cantidad}
                                                        onChange={(e) => actualizarDetalle(index, 'cantidad', Number(e.target.value))}
                                                        required
                                                    />
                                                </div>

                                                <div className="w-32">
                                                    <Label>Costo/u (Bs)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={detalle.costo_unitario}
                                                        onChange={(e) => actualizarDetalle(index, 'costo_unitario', Number(e.target.value))}
                                                        required
                                                    />
                                                </div>

                                                <div className="w-32">
                                                    <Label>Subtotal</Label>
                                                    <div className="px-3 py-2 bg-secondary rounded-md text-sm font-medium">
                                                        {(detalle.cantidad * detalle.costo_unitario).toFixed(2)} Bs
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => eliminarDetalle(index)}
                                                    disabled={detalles.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totales */}
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-lg font-semibold">
                                            <span>Total Prendas:</span>
                                            <span>{calcularTotalPrendas()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xl font-bold mt-2">
                                            <span>Total:</span>
                                            <span>{calcularTotal().toFixed(2)} Bs</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Botones */}
                            <div className="flex gap-4 justify-end">
                                <Link href="/compras">
                                    <Button type="button" variant="outline">
                                        Cancelar
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={isSaving}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSaving ? 'Guardando...' : 'Guardar Compra'}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
