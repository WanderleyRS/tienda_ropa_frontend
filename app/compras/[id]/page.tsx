'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { comprasApi, categoriesApi, Compra, Category, CompraAnulacionCheck, CompraEstado } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Package, CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, Link2, Archive, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { CrearItemCompraModal } from '@/components/CrearItemCompraModal';
import { RelacionarItemsModal } from '@/components/RelacionarItemsModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function CompraDetallePage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    const [compra, setCompra] = useState<Compra | null>(null);
    const [compraEstado, setCompraEstado] = useState<CompraEstado | null>(null);
    const [categorias, setCategorias] = useState<Category[]>([]);
    const [isLoadingCompra, setIsLoadingCompra] = useState(true);
    const [modalCrearOpen, setModalCrearOpen] = useState(false);
    const [modalRelacionarOpen, setModalRelacionarOpen] = useState(false);
    const [isConfirmCerrarOpen, setIsConfirmCerrarOpen] = useState(false);
    const [isProcessingCerrar, setIsProcessingCerrar] = useState(false);

    const [isAnulacionOpen, setIsAnulacionOpen] = useState(false);
    const [anulacionCheck, setAnulacionCheck] = useState<CompraAnulacionCheck | null>(null);
    const [isProcessingAnular, setIsProcessingAnular] = useState(false);

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
            const [compraData, estadoData, categoriasData] = await Promise.all([
                comprasApi.getCompra(Number(params.id)),
                comprasApi.getCompraEstado(Number(params.id)),
                categoriesApi.getAll()
            ]);
            setCompra(compraData);
            setCompraEstado(estadoData);
            setCategorias(categoriasData);
        } catch (error: any) {
            console.error('Error loading compra:', error);
            toast.error('Error al cargar compra');
            router.push('/compras');
        } finally {
            setIsLoadingCompra(false);
        }
    };

    const handleCerrarLote = async () => {
        if (!compra) return;
        setIsProcessingCerrar(true);
        try {
            await comprasApi.cerrarLote(compra.id);
            toast.success('Lote cerrado exitosamente');
            setIsConfirmCerrarOpen(false);
            loadData();
        } catch (error: any) {
            console.error('Error closing lot:', error);
            toast.error('Error al cerrar el lote');
        } finally {
            setIsProcessingCerrar(false);
        }
    };

    const handleCheckAnulacion = async () => {
        if (!compra) return;
        try {
            const check = await comprasApi.checkAnulacion(compra.id);
            setAnulacionCheck(check);
            setIsAnulacionOpen(true);
        } catch (error: any) {
            toast.error('Error al verificar estado de la compra');
        }
    };

    const handleAnularCompra = async () => {
        if (!compra) return;
        setIsProcessingAnular(true);
        try {
            await comprasApi.anularCompra(compra.id);
            toast.success('Compra anulada correctamente');
            router.push('/compras');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al anular compra');
        } finally {
            setIsProcessingAnular(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'COMPLETADA':
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">
                        <CheckCircle2 className="h-3 w-3 mr-1.5" /> COMPLETADA
                    </Badge>
                );
            case 'PROCESANDO':
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1">
                        <Clock className="h-3 w-3 mr-1.5" /> PROCESANDO
                    </Badge>
                );
            case 'PENDIENTE':
                return (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1">
                        <AlertCircle className="h-3 w-3 mr-1.5" /> PENDIENTE
                    </Badge>
                );
            default:
                return <Badge variant="outline">{estado}</Badge>;
        }
    };

    if (isLoading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
                    <Link href="/compras">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">
                                {compra?.codigo || '---'}
                            </h1>
                            {compra && getEstadoBadge(compra.estado)}
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                            <ShoppingBag className="h-4 w-4" /> 
                            Registro de lote de mercadería
                        </p>
                    </div>
                    
                    {compra && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCheckAnulacion} className="text-muted-foreground">
                                <Trash2 className="h-4 w-4 mr-2" /> Anular
                            </Button>
                            {compra.estado !== 'COMPLETADA' && (
                                <Button onClick={() => setIsConfirmCerrarOpen(true)} className="bg-foreground text-background hover:bg-foreground/90 font-bold shadow-xl">
                                    <Archive className="h-4 w-4 mr-2" /> Finalizar Lote
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {isLoadingCompra ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-muted-foreground font-medium">Sincronizando bolsa de inversión...</p>
                    </div>
                ) : compra && compraEstado ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-primary/5 border-primary/20 border-2">
                                <CardContent className="p-6">
                                    <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-1">Inversión Total</p>
                                    <p className="text-2xl font-black font-mono">{(compra.monto_total_factura || compra.monto_total).toFixed(2)} Bs</p>
                                    <Badge variant="outline" className="mt-2 text-[9px] bg-background">VALOR FACTURA</Badge>
                                </CardContent>
                            </Card>

                            <Card className="bg-green-500/5 border-green-500/20 border-2">
                                <CardContent className="p-6">
                                    <p className="text-[10px] uppercase font-black text-green-600 tracking-widest mb-1">Items Catalogados</p>
                                    <p className="text-2xl font-black font-mono">{compraEstado.items_creados} / {compraEstado.items_esperados}</p>
                                    <div className="mt-3">
                                        <Progress value={compraEstado.progreso_porcentaje} className="h-1.5" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-500/5 border-blue-500/20 border-2">
                                <CardContent className="p-6">
                                    <p className="text-[10px] uppercase font-black text-blue-600 tracking-widest mb-1">Bolsa Residual</p>
                                    <p className="text-2xl font-black font-mono">{(compraEstado.detalles.reduce((acc, d) => acc + d.monto_restante, 0)).toFixed(2)} Bs</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 italic font-medium underline">POR ASIGNAR A ITEMS</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-muted-foreground/20 border-2">
                                <CardContent className="p-6">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Origen / Fecha</p>
                                    <p className="text-xl font-bold truncate">{compra.proveedor?.nombre || 'Proveedor'}</p>
                                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(compra.fecha_compra).toLocaleDateString()}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="overflow-hidden border-2 border-foreground/5 shadow-2xl">
                            <CardHeader className="bg-muted/30 border-b py-6 px-8">
                                <CardTitle className="text-2xl font-black flex items-center gap-2 italic uppercase tracking-tighter">
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                    Control de Bolsas (Categoría)
                                </CardTitle>
                                <CardDescription>Distribución del costo de compra por clasificación de mercadería.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-foreground/5">
                                    {compraEstado.detalles.map((detalle) => {
                                        const cat = categorias.find(c => c.id === detalle.categoria_id);
                                        const isCompletado = detalle.items_restantes === 0;
                                        
                                        return (
                                            <div key={detalle.categoria_id} className="p-8 flex flex-col md:flex-row items-center gap-8 hover:bg-muted/20 transition-colors group">
                                                <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground text-background font-black text-3xl group-hover:scale-110 transition-transform italic shadow-lg">
                                                    {cat?.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-black text-2xl tracking-tighter uppercase italic">{cat?.name}</h3>
                                                        {isCompletado && <Badge className="bg-green-500 text-white border-0 text-[10px] font-black h-5">CUADRADO 100%</Badge>}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        <span>Inversión: <span className="text-foreground">{detalle.subtotal.toFixed(2)} Bs</span></span>
                                                        <span className="w-1 h-1 bg-muted-foreground/20 rounded-full self-center" />
                                                        <span>Utilizado: <span className="text-primary">{detalle.monto_utilizado.toFixed(2)} Bs</span></span>
                                                        <span className="w-1 h-1 bg-muted-foreground/20 rounded-full self-center" />
                                                        <span>Saldo Bolsa: <span className="text-amber-600 font-black">{detalle.monto_restante.toFixed(2)} Bs</span></span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 px-8 border-x border-foreground/5">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Costo Sugerido / Item</p>
                                                    <p className="text-3xl font-black font-mono text-primary leading-none">
                                                        {detalle.costo_promedio_sugerido.toFixed(2)} <span className="text-sm">Bs</span>
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground font-bold mt-1">{detalle.items_creados} / {detalle.cantidad} items</p>
                                                </div>

                                                <div className="shrink-0">
                                                    <div className="w-20 h-20 relative group-hover:scale-105 transition-transform">
                                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                            <circle cx="18" cy="18" r="16" className="text-muted/30" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <circle cx="18" cy="18" r="16" className="text-primary" stroke="currentColor" strokeWidth="4" strokeDasharray={`${(detalle.items_creados / detalle.cantidad) * 100}, 100`} fill="none" strokeLinecap="round" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-black italic">
                                                            {Math.round((detalle.items_creados / detalle.cantidad) * 100)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {compra.estado !== 'COMPLETADA' && (
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1.5 bg-primary rounded-full" />
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Asistente de Catalogación</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <Card className="hover:border-primary/50 transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2 border-2 group">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    <Package className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Catalogar Lote</CardTitle>
                                                    <CardDescription className="text-xs font-bold uppercase text-primary">Carga Masiva (Recomendado)</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed">
                                                Sube todas las fotos del lote y pega el texto de WhatsApp. Gemini clasificará cada prenda vinculándola a su bolsa de inversión automáticamente.
                                            </p>
                                            <Link href={`/items/bulk-upload?compra_id=${compra.id}`}>
                                                <Button className="w-full font-black uppercase italic shadow-xl shadow-primary/20 h-12">
                                                    <TrendingUp className="h-5 w-5 mr-2" />
                                                    Iniciar Asistente Masivo
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>

                                    <Card className="hover:border-green-500/50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2 border-2 group">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 rounded-2xl bg-green-500/10 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                                    <Plus className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Ingreso Manual</CardTitle>
                                                    <CardDescription className="text-xs font-bold uppercase text-green-600">Items Individuales</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed">
                                                Formulario rápido para catalogar prendas VIP o únicas. El sistema sugerirá el costo automático basado en el saldo de la bolsa residual.
                                            </p>
                                            <Button className="w-full font-black uppercase italic h-12" variant="outline" onClick={() => setModalCrearOpen(true)}>
                                                <Plus className="h-5 w-5 mr-2" />
                                                Ingresar Prenda
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="hover:border-blue-500/50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2 border-2 group">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <Link2 className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Vincular Prendas</CardTitle>
                                                    <CardDescription className="text-xs font-bold uppercase text-blue-600">Inventario Existente</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed">
                                                ¿Subiste items sin asignar lote? Búscalos aquí para vincularlos a esta compra y regularizar el cuadre contable.
                                            </p>
                                            <Button className="w-full font-black uppercase italic h-12 text-blue-600" variant="ghost" onClick={() => setModalRelacionarOpen(true)}>
                                                <Link2 className="h-5 w-5 mr-2" />
                                                Buscar Prendas Libres
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-32 text-center">
                        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6 opacity-20" />
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Compra no encontrada</h2>
                        <p className="text-muted-foreground mt-2 font-medium">El registro solicitado no existe o ha sido eliminado.</p>
                        <Link href="/compras" className="mt-8 block">
                            <Button variant="link">Volver al listado de compras</Button>
                        </Link>
                    </div>
                )}
            </div>

            {compra && (
                <>
                    <CrearItemCompraModal
                        open={modalCrearOpen}
                        onOpenChange={setModalCrearOpen}
                        compraId={compra.id}
                        onItemCreado={loadData}
                    />

                    <RelacionarItemsModal
                        open={modalRelacionarOpen}
                        onOpenChange={setModalRelacionarOpen}
                        compraId={compra.id}
                        onItemsRelacionados={loadData}
                    />
                </>
            )}

            <ConfirmModal
                isOpen={isConfirmCerrarOpen}
                onClose={() => setIsConfirmCerrarOpen(false)}
                onConfirm={handleCerrarLote}
                isLoading={isProcessingCerrar}
                title="¿Finalizar Carga del Lote?"
                description="Al cerrar el lote, el saldo de inversión residual se considerará como 'costo amortizado'. No podrás vincular más prendas de precisión a este presupuesto."
                confirmText="SÍ, FINALIZAR LOTE"
                variant="warning"
            />

            <ConfirmModal
                isOpen={isAnulacionOpen}
                onClose={() => setIsAnulacionOpen(false)}
                onConfirm={handleAnularCompra}
                title={anulacionCheck?.puede_anular ? "¿Anular registro definitivamente?" : "Anulación Bloqueada"}
                description={
                    anulacionCheck?.puede_anular ? (
                        <div className="space-y-4">
                            <p className="font-medium">Esta acción retirará todo el stock vinculado a este lote.</p>
                            {anulacionCheck.items_publicados > 0 && (
                                <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
                                    <div className="flex items-center gap-2 text-destructive font-black uppercase text-sm mb-1">
                                        <AlertCircle className="h-4 w-4" /> ¡ALERTA DE STOCK!
                                    </div>
                                    <p className="text-sm font-bold">Hay {anulacionCheck.items_publicados} prendas publicadas que serán ELIMINADAS.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl text-destructive font-bold text-sm">
                            MOTIVO: {anulacionCheck?.motivo_bloqueo}
                        </div>
                    )
                }
                isLoading={isProcessingAnular}
                confirmText={anulacionCheck?.puede_anular ? "CONFIRMAR ANULACIÓN" : "CERRAR"}
                variant={anulacionCheck?.puede_anular ? "danger" : "warning"}
            />
        </div>
    );
}
