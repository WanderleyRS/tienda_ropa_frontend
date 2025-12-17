import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clientesApi, PotencialClienteCreate } from '@/lib/api';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CreateClientModalProps {
    onClientCreated?: () => void;
    trigger?: React.ReactNode;
}

export function CreateClientModal({ onClientCreated, trigger }: CreateClientModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<PotencialClienteCreate>({
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        celular: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.nombre || !formData.apellido_paterno || !formData.celular) {
            toast.error('Nombre, Apellido Paterno y Celular son requeridos');
            return;
        }

        setIsLoading(true);
        try {
            await clientesApi.crearPotencial(formData);
            toast.success('Cliente registrado exitosamente');
            setOpen(false);
            setFormData({
                nombre: '',
                apellido_paterno: '',
                apellido_materno: '',
                celular: ''
            });
            if (onClientCreated) {
                onClientCreated();
            }
        } catch (error: any) {
            console.error('Error creating client:', error);
            toast.error(error.response?.data?.detail || 'Error al crear cliente');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                        Ingresa los datos del cliente potencial.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="col-span-3"
                            placeholder="Ej. Juan"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="apellido_paterno" className="text-right">
                            Ap. Paterno
                        </Label>
                        <Input
                            id="apellido_paterno"
                            value={formData.apellido_paterno}
                            onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                            className="col-span-3"
                            placeholder="Ej. Pérez"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="apellido_materno" className="text-right">
                            Ap. Materno
                        </Label>
                        <Input
                            id="apellido_materno"
                            value={formData.apellido_materno}
                            onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                            className="col-span-3"
                            placeholder="Ej. López (Opcional)"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="celular" className="text-right">
                            Celular
                        </Label>
                        <div className="col-span-3 flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                +591
                            </span>
                            <Input
                                id="celular"
                                value={formData.celular}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({ ...formData, celular: val });
                                }}
                                className="rounded-l-none"
                                placeholder="60000000"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Registrar Cliente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
