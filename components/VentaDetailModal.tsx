import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Trash2, User, Phone, Calendar, DollarSign, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ventasApi, abonosApi } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VentaDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    ventaId: number;
    onUpdate: () => void;
}

interface DetalleVenta {
    id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    producto?: {
        title: string;
    };
}

interface Abono {
    id: number;
    monto_abonado: number;
    fecha_abono: string;
    metodo_pago: string;
}

interface VentaDetalle {
    id: number;
    fecha_venta: string;
    monto_total: number;
    estado_pago: string;
    metodo_pago?: string;
    cliente?: {
        nombre: string;
        apellido_paterno: string;
        apellido_materno?: string;
        celular: string;
    };
    detalles: DetalleVenta[];
    abonos: Abono[];
}

export function VentaDetailModal({ isOpen, onClose, ventaId, onUpdate }: VentaDetailModalProps) {
    const [venta, setVenta] = useState<VentaDetalle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteAbonoId, setDeleteAbonoId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteVenta, setShowDeleteVenta] = useState(false);
    const [isDeletingVenta, setIsDeletingVenta] = useState(false);

    // Estados para agregar abono
    const [showAbonoForm, setShowAbonoForm] = useState(false);
    const [montoAbono, setMontoAbono] = useState('');
    const [metodoPagoAbono, setMetodoPagoAbono] = useState('EFECTIVO');
    const [isCreatingAbono, setIsCreatingAbono] = useState(false);

    useEffect(() => {
        if (isOpen && ventaId) {
            loadVentaDetail();
            setShowAbonoForm(false);
            setMontoAbono('');
            setMetodoPagoAbono('EFECTIVO');
        }
    }, [isOpen, ventaId]);

    const loadVentaDetail = async () => {
        setIsLoading(true);
        try {
            const data = await ventasApi.getDetalle(ventaId);
            setVenta(data);
        } catch (error) {
            console.error('Error loading venta detail:', error);
            toast.error('Error al cargar detalle de venta');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAbono = async () => {
        if (!deleteAbonoId) return;

        setIsDeleting(true);
        try {
            await abonosApi.eliminar(deleteAbonoId);
            toast.success('Abono eliminado correctamente');
            await loadVentaDetail();
            onUpdate();
            setDeleteAbonoId(null);
        } catch (error: any) {
            console.error('Error deleting abono:', error);
            toast.error(error.response?.data?.detail || 'Error al eliminar abono');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteVenta = async () => {
        setIsDeletingVenta(true);
        try {
            await ventasApi.eliminar(ventaId);
            toast.success('Venta eliminada correctamente');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error deleting venta:', error);
            toast.error(error.response?.data?.detail || 'Error al eliminar venta');
        } finally {
            setIsDeletingVenta(false);
            setShowDeleteVenta(false);
        }
    };

    const handleCreateAbono = async () => {
        const monto = parseFloat(montoAbono);
        if (isNaN(monto) || monto <= 0) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        const saldoPendiente = (venta?.monto_total || 0) - totalAbonado;
        if (monto > saldoPendiente) {
            toast.error(`El monto no puede ser mayor al saldo pendiente ($${saldoPendiente.toFixed(2)})`);
            return;
        }

        setIsCreatingAbono(true);
        try {
            await abonosApi.crear(ventaId, {
                monto_abonado: monto,
                metodo_pago: metodoPagoAbono
            });
            toast.success('Abono registrado correctamente');
            await loadVentaDetail();
            onUpdate();
            setShowAbonoForm(false);
            setMontoAbono('');
            setMetodoPagoAbono('EFECTIVO');
        } catch (error: any) {
            console.error('Error creating abono:', error);
            toast.error(error.response?.data?.detail || 'Error al registrar abono');
        } finally {
            setIsCreatingAbono(false);
        }
    };

    const getClienteName = () => {
        if (!venta?.cliente) return 'Sin cliente';
        const { nombre, apellido_paterno, apellido_materno } = venta.cliente;
        return `${nombre} ${apellido_paterno} ${apellido_materno || ''}`.trim();
    };

    const totalAbonado = venta?.abonos.reduce((sum, a) => sum + a.monto_abonado, 0) || 0;
    const saldoPendiente = (venta?.monto_total || 0) - totalAbonado;
    const tieneAbonos = (venta?.abonos.length || 0) > 0;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border/50 shadow-2xl p-0 gap-0">
                    <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-secondary/10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <span className="bg-primary/10 p-2 rounded-lg text-primary">🧾</span>
                            Detalle de Venta #{ventaId}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
                            <span className="text-muted-foreground">Cargando detalle...</span>
                        </div>
                    ) : venta ? (
                        <div className="p-6 space-y-8">
                            {/* Información del Cliente y Venta */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 bg-secondary/20 rounded-xl border border-border/50">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                                        <User className="w-4 h-4" />
                                        Información del Cliente
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="flex justify-between">
                                            <span className="text-muted-foreground">Nombre:</span>
                                            <span className="font-medium text-foreground">{getClienteName()}</span>
                                        </p>
                                        {venta.cliente && (
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Celular:</span>
                                                <span className="font-medium text-foreground flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {venta.cliente.celular}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 bg-secondary/20 rounded-xl border border-border/50">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                                        <Calendar className="w-4 h-4" />
                                        Información de la Venta
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="flex justify-between">
                                            <span className="text-muted-foreground">Fecha:</span>
                                            <span className="font-medium text-foreground">
                                                {format(new Date(venta.fecha_venta), "d MMM yyyy, HH:mm", { locale: es })}
                                            </span>
                                        </p>
                                        <p className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Estado:</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${venta.estado_pago === 'PAGADO'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                                {venta.estado_pago}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Artículos Vendidos */}
                            <div>
                                <h3 className="font-semibold mb-4 text-lg">Artículos Vendidos</h3>
                                <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-secondary/30">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Cantidad</TableHead>
                                                <TableHead className="text-right">Precio Unit.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {venta.detalles.map((detalle) => (
                                                <TableRow key={detalle.id} className="hover:bg-secondary/10">
                                                    <TableCell className="font-medium">{detalle.producto?.title || `Producto #${detalle.producto_id}`}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{detalle.cantidad}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">${detalle.precio_unitario.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-bold text-foreground">
                                                        ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-secondary/10 font-bold">
                                                <TableCell colSpan={3} className="text-right text-muted-foreground">Total:</TableCell>
                                                <TableCell className="text-right text-lg text-primary">
                                                    ${venta.monto_total.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Abonos */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-primary" />
                                        Abonos Registrados
                                    </h3>
                                    {saldoPendiente > 0 && (
                                        <Button
                                            size="sm"
                                            onClick={() => setShowAbonoForm(!showAbonoForm)}
                                            variant={showAbonoForm ? "outline" : "default"}
                                            className={showAbonoForm ? "" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"}
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            {showAbonoForm ? 'Cancelar' : 'Agregar Abono'}
                                        </Button>
                                    )}
                                </div>

                                {/* Formulario de nuevo abono */}
                                {showAbonoForm && (
                                    <div className="mb-6 p-5 border border-primary/20 rounded-xl bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <h4 className="font-medium text-primary flex items-center gap-2">
                                            <span className="bg-primary/20 p-1 rounded text-xs">NEW</span>
                                            Registrar Nuevo Abono
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="monto-nuevo-abono" className="text-sm mb-1.5 block font-medium">
                                                    Monto
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                    <Input
                                                        id="monto-nuevo-abono"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max={saldoPendiente}
                                                        placeholder="0.00"
                                                        value={montoAbono}
                                                        onChange={(e) => setMontoAbono(e.target.value)}
                                                        className="pl-7 bg-white"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1.5">
                                                    Saldo pendiente: <span className="font-medium text-foreground">${saldoPendiente.toFixed(2)}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <Label htmlFor="metodo-pago-abono" className="text-sm mb-1.5 block font-medium">
                                                    Método de Pago
                                                </Label>
                                                <Select value={metodoPagoAbono} onValueChange={setMetodoPagoAbono}>
                                                    <SelectTrigger id="metodo-pago-abono" className="bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                                        <SelectItem value="TARJETA">Tarjeta</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                size="sm"
                                                onClick={handleCreateAbono}
                                                disabled={isCreatingAbono || !montoAbono}
                                                className="shadow-sm"
                                            >
                                                {isCreatingAbono ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Registrando...
                                                    </>
                                                ) : (
                                                    'Registrar Abono'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {venta.abonos.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-8 text-center bg-secondary/10 rounded-xl border border-dashed border-border/50">
                                        No hay abonos registrados
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-secondary/30">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Método de Pago</TableHead>
                                                    <TableHead className="text-right">Monto</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {venta.abonos.map((abono) => (
                                                    <TableRow key={abono.id} className="hover:bg-secondary/10">
                                                        <TableCell className="text-muted-foreground">
                                                            {format(new Date(abono.fecha_abono), "d MMM yyyy, HH:mm", { locale: es })}
                                                        </TableCell>
                                                        <TableCell className="font-medium">{abono.metodo_pago}</TableCell>
                                                        <TableCell className="text-right font-bold text-green-600">
                                                            ${abono.monto_abonado.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeleteAbonoId(abono.id)}
                                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Resumen de Pagos */}
                                <div className="mt-6 p-5 bg-gradient-to-br from-secondary/30 to-background rounded-xl border border-border/50 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total de la venta:</span>
                                        <span className="font-medium text-foreground">${venta.monto_total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total abonado:</span>
                                        <span className="font-medium text-green-600">${totalAbonado.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t border-border/50 pt-3 mt-2">
                                        <span>Saldo pendiente:</span>
                                        <span className={saldoPendiente > 0 ? 'text-destructive' : 'text-green-600'}>
                                            ${saldoPendiente.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex justify-between pt-6 border-t border-border/50">
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteVenta(true)}
                                    disabled={tieneAbonos}
                                    className="bg-destructive/90 hover:bg-destructive shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar Venta
                                </Button>
                                <Button variant="outline" onClick={onClose} className="border-border/50">
                                    Cerrar
                                </Button>
                            </div>

                            {tieneAbonos && (
                                <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    <AlertTriangle className="w-3 h-3" />
                                    Para eliminar la venta, primero debe eliminar todos los abonos
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-center py-12 text-muted-foreground">No se pudo cargar el detalle</p>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmación de Eliminación de Abono */}
            <AlertDialog open={!!deleteAbonoId} onOpenChange={() => setDeleteAbonoId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar abono?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el abono y recalculará el estado de pago de la venta.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAbono}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirmación de Eliminación de Venta */}
            <AlertDialog open={showDeleteVenta} onOpenChange={setShowDeleteVenta}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la venta permanentemente.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingVenta}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteVenta}
                            disabled={isDeletingVenta}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeletingVenta ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar Venta'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
