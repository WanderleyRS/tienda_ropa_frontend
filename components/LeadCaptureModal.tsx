import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Phone, User, Send } from 'lucide-react';
import { toast } from 'sonner';
import { clientesApi } from '@/lib/api';

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (clienteId: number, nombreCompleto: string, celularCompleto: string) => void;
    empresaId?: number;
}

const COUNTRY_PREFIXES = [
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
    { code: '+55', country: 'Brasil', flag: '🇧🇷' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
    { code: '+51', country: 'Perú', flag: '🇵🇪' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
];

export function LeadCaptureModal({ isOpen, onClose, onSuccess, empresaId }: LeadCaptureModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        prefijo: '+591',
        celular: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre || !formData.apellido_paterno || !formData.celular) {
            toast.error('Por favor completa los campos obligatorios');
            return;
        }

        const cleanPhone = formData.celular.replace(/\D/g, '');
        if (cleanPhone.length < 6) {
            toast.error('El número de celular parece inválido');
            return;
        }

        setIsLoading(true);
        try {
            const celularCompleto = `${formData.prefijo}${cleanPhone}`;
            const leadData = {
                nombre: formData.nombre,
                apellido_paterno: formData.apellido_paterno,
                apellido_materno: formData.apellido_materno || undefined,
                celular: celularCompleto
            };

            // Use public endpoint with empresa_id = 1 as default
            const cliente = await clientesApi.crearPotencialPublic(leadData, empresaId || 1);

            const nombreCompleto = `${formData.nombre} ${formData.apellido_paterno} ${formData.apellido_materno || ''}`.trim();

            onSuccess(cliente.id, nombreCompleto, celularCompleto);
            onClose();
        } catch (error) {
            console.error('Error creating lead:', error);
            toast.error('Error al guardar tus datos. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Send className="w-6 h-6" />
                        Finalizar Pedido
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Ingresa tus datos para contactarte y coordinar la entrega.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre" className="font-semibold">Nombre *</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="nombre"
                                placeholder="Tu nombre"
                                className="pl-9"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="apellido_paterno" className="font-semibold">Apellido Paterno *</Label>
                            <Input
                                id="apellido_paterno"
                                placeholder="Paterno"
                                className=""
                                value={formData.apellido_paterno}
                                onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellido_materno" className="font-semibold">Apellido Materno</Label>
                            <Input
                                id="apellido_materno"
                                placeholder="Materno"
                                className=""
                                value={formData.apellido_materno}
                                onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="celular" className="font-semibold">Celular / WhatsApp *</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.prefijo}
                                onValueChange={(value) => setFormData({ ...formData, prefijo: value })}
                            >
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="País" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRY_PREFIXES.map((prefix) => (
                                        <SelectItem key={prefix.code} value={prefix.code}>
                                            <span className="mr-2">{prefix.flag}</span>
                                            {prefix.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative flex-1">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="celular"
                                    type="tel"
                                    placeholder="Número"
                                    className="pl-9"
                                    value={formData.celular}
                                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-medium mt-6"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                Enviar Pedido por WhatsApp
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
