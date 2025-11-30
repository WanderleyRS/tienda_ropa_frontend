'use client';

import { useState } from 'react';
import { agendaApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Truck, Store } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleDeliveryModalProps {
    ventaId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ScheduleDeliveryModal({ ventaId, onClose, onSuccess }: ScheduleDeliveryModalProps) {
    const [tipoEntrega, setTipoEntrega] = useState<'Delivery' | 'Recoleccion_Tienda'>('Delivery');
    const [fechaProgramada, setFechaProgramada] = useState('');
    const [horaProgramada, setHoraProgramada] = useState('');
    const [direccionEntrega, setDireccionEntrega] = useState('');
    const [notasLogistica, setNotasLogistica] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación
        if (tipoEntrega === 'Delivery' && !direccionEntrega.trim()) {
            toast.error('La dirección de entrega es obligatoria para Delivery');
            return;
        }

        setIsLoading(true);

        try {
            await agendaApi.create({
                venta_id: ventaId,
                tipo_entrega: tipoEntrega,
                fecha_programada: fechaProgramada,
                hora_programada: horaProgramada || undefined,
                direccion_entrega: tipoEntrega === 'Delivery' ? direccionEntrega : undefined,
                notas_logistica: notasLogistica || undefined,
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error al programar la entrega');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50 shadow-2xl">
                <DialogHeader className="border-b border-border/50 pb-4">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-primary/10 p-2 rounded-lg text-primary">
                            <Calendar className="w-5 h-5" />
                        </span>
                        Programar Entrega
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Tipo de Entrega */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Tipo de Entrega *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTipoEntrega('Delivery')}
                                className={`p-4 rounded-xl border-2 transition-all ${tipoEntrega === 'Delivery'
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border/50 hover:border-border hover:bg-secondary/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${tipoEntrega === 'Delivery' ? 'bg-primary/10' : 'bg-secondary/50'}`}>
                                        <Truck className={`w-5 h-5 ${tipoEntrega === 'Delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium">Delivery</div>
                                        <div className="text-xs text-muted-foreground">Entrega a domicilio</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTipoEntrega('Recoleccion_Tienda')}
                                className={`p-4 rounded-xl border-2 transition-all ${tipoEntrega === 'Recoleccion_Tienda'
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border/50 hover:border-border hover:bg-secondary/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${tipoEntrega === 'Recoleccion_Tienda' ? 'bg-primary/10' : 'bg-secondary/50'}`}>
                                        <Store className={`w-5 h-5 ${tipoEntrega === 'Recoleccion_Tienda' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium">Recolección</div>
                                        <div className="text-xs text-muted-foreground">Retiro en tienda</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fecha" className="text-sm font-medium">
                                Fecha Programada *
                            </Label>
                            <Input
                                id="fecha"
                                type="date"
                                value={fechaProgramada}
                                onChange={(e) => setFechaProgramada(e.target.value)}
                                required
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hora" className="text-sm font-medium">
                                Hora Programada (Opcional)
                            </Label>
                            <Input
                                id="hora"
                                type="time"
                                value={horaProgramada}
                                onChange={(e) => setHoraProgramada(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                    </div>

                    {/* Dirección de Entrega (condicional) */}
                    {tipoEntrega === 'Delivery' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="direccion" className="text-sm font-medium">
                                Dirección de Entrega *
                            </Label>
                            <Textarea
                                id="direccion"
                                value={direccionEntrega}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDireccionEntrega(e.target.value)}
                                required
                                rows={3}
                                className="bg-background resize-none"
                                placeholder="Ingrese la dirección completa de entrega..."
                            />
                        </div>
                    )}

                    {/* Notas de Logística */}
                    <div className="space-y-2">
                        <Label htmlFor="notas" className="text-sm font-medium">
                            Notas de Logística (Opcional)
                        </Label>
                        <Textarea
                            id="notas"
                            value={notasLogistica}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotasLogistica(e.target.value)}
                            rows={2}
                            className="bg-background resize-none"
                            placeholder="Instrucciones adicionales para la entrega..."
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 shadow-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Programando...
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Programar Entrega
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
