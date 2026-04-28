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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <Card className="bg-muted/20 border-white/5 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Inversión Total</p>
                                    <p className="text-xl font-bold font-mono">{(compra.monto_total_factura || compra.monto_total).toFixed(2)} Bs</p>
                                    <Badge variant="outline" className="mt-1 text-[8px] opacity-60">FACTURA</Badge>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/20 border-white/5 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Catalogado</p>
                                    <p className="text-xl font-bold font-mono">{compraEstado.items_creados} / {compraEstado.items_esperados}</p>
                                    <div className="mt-2">
                                        <Progress value={compraEstado.progreso_porcentaje} className="h-1" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/10 border shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-[9px] uppercase font-bold text-primary tracking-widest mb-1">Bolsa Residual</p>
                                    <p className="text-xl font-black font-mono text-primary">{(compraEstado.detalles.reduce((acc, d) => acc + d.monto_restante, 0)).toFixed(2)} Bs</p>
                                    <p className="text-[9px] text-muted-foreground mt-1 italic">POR ASIGNAR</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/20 border-white/5 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Proveedor</p>
                                    <p className="text-lg font-bold truncate opacity-80">{compra.proveedor?.nombre || 'Proveedor'}</p>
                                    <p className="text-[9px] text-muted-foreground mt-1">{new Date(compra.fecha_compra).toLocaleDateString()}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="overflow-hidden border border-white/5 bg-muted/10 shadow-xl">
                            <CardHeader className="bg-muted/20 border-b py-4 px-6">
                                <CardTitle className="text-lg font-black flex items-center gap-2 italic uppercase tracking-tight">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Bolsas por Categoría
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {compraEstado.detalles.map((detalle) => {
                                        const cat = categorias.find(c => c.id === detalle.categoria_id);
                                        const isCompletado = detalle.items_restantes === 0;
                                        
                                        return (
                                            <div key={detalle.categoria_id} className="px-6 py-4 flex flex-col md:flex-row items-center gap-6 hover:bg-white/5 transition-colors group">
                                                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-muted border border-white/10 text-foreground font-black text-xl group-hover:scale-105 transition-transform italic">
                                                    {cat?.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className="font-bold text-base tracking-tight uppercase italic truncate">{cat?.name}</h3>
                                                        {isCompletado && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                    </div>
                                                    <div className="flex gap-3 text-[10px] font-bold text-muted-foreground uppercase">
                                                        <span>Inv: <span className="text-foreground/80">{detalle.subtotal.toFixed(0)}</span></span>
                                                        <span>Util: <span className="text-primary/80">{detalle.monto_utilizado.toFixed(0)}</span></span>
                                                        <span>Bolsa: <span className="text-amber-500 font-black">{detalle.monto_restante.toFixed(0)}</span></span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-row md:flex-col items-center md:items-end gap-x-4 md:gap-y-0.5 px-6 md:border-x border-white/5">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest md:block hidden">Sugerido</p>
                                                    <p className="text-xl font-black font-mono text-primary">
                                                        {detalle.costo_promedio_sugerido.toFixed(2)} <span className="text-[10px]">Bs</span>
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-bold md:block hidden">{detalle.items_creados}/{detalle.cantidad}</p>
                                                </div>

                                                <div className="shrink-0">
                                                    <div className="w-12 h-12 relative">
                                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                            <circle cx="18" cy="18" r="16" className="text-white/5" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <circle cx="18" cy="18" r="16" className="text-primary" stroke="currentColor" strokeWidth="4" strokeDasharray={`${(detalle.items_creados / detalle.cantidad) * 100}, 100`} fill="none" strokeLinecap="round" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black italic">
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
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-primary rounded-full" />
                                    <h2 className="text-xl font-black italic uppercase tracking-tight">Asistente de Catalogación</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Card className="hover:border-primary/40 transition-all cursor-pointer bg-muted/10 border-white/5 group">
                                        <CardHeader className="pb-2 pt-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-black uppercase italic tracking-tight">Catalogar Lote</CardTitle>
                                                    <CardDescription className="text-[10px] font-bold uppercase text-primary">IA Masiva</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-5 pb-5">
                                            <p className="text-[11px] text-muted-foreground mb-4 font-medium leading-relaxed opacity-70">
                                                Gemini clasificará cada prenda vinculándola a su bolsa de inversión automáticamente.
                                            </p>
                                            <Link href={`/items/bulk-upload?compra_id=${compra.id}`}>
                                                <Button size="sm" className="w-full font-black uppercase italic h-10">
                                                    <TrendingUp className="h-4 w-4 mr-2" />
                                                    Iniciar Masivo
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>

                                    <Card className="hover:border-green-500/40 transition-all bg-muted/10 border-white/5 group">
                                        <CardHeader className="pb-2 pt-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-black uppercase italic tracking-tight">Ingreso Manual</CardTitle>
                                                    <CardDescription className="text-[10px] font-bold uppercase text-green-600">Individual</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-5 pb-5">
                                            <p className="text-[11px] text-muted-foreground mb-4 font-medium leading-relaxed opacity-70">
                                                Formulario rápido para catalogar prendas VIP o únicas con sugerencia de costo.
                                            </p>
                                            <Button size="sm" className="w-full font-black uppercase italic h-10" variant="outline" onClick={() => setModalCrearOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Ingresar Prenda
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="hover:border-blue-500/40 transition-all bg-muted/10 border-white/5 group">
                                        <CardHeader className="pb-2 pt-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <Link2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-black uppercase italic tracking-tight">Vincular</CardTitle>
                                                    <CardDescription className="text-[10px] font-bold uppercase text-blue-600">Existente</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-5 pb-5">
                                            <p className="text-[11px] text-muted-foreground mb-4 font-medium leading-relaxed opacity-70">
                                                Busca items sin asignar para vincularlos a esta compra y regularizar el cuadre.
                                            </p>
                                            <Button size="sm" className="w-full font-black uppercase italic h-10 text-blue-600" variant="ghost" onClick={() => setModalRelacionarOpen(true)}>
                                                <Link2 className="h-4 w-4 mr-2" />
                                                Buscar Libres
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
