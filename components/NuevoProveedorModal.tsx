'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { comprasApi, Proveedor } from '@/lib/api';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface NuevoProveedorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProveedorCreado: (proveedor: Proveedor) => void;
}

export function NuevoProveedorModal({ open, onOpenChange, onProveedorCreado }: NuevoProveedorModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        celular: '',
        email: '',
        direccion: '',
        notas: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            toast.error('El nombre del proveedor es requerido');
            return;
        }

        setIsSaving(true);
        try {
            const proveedor = await comprasApi.createProveedor({
                nombre: formData.nombre,
                celular: formData.celular || undefined,
                email: formData.email || undefined,
                direccion: formData.direccion || undefined,
                notas: formData.notas || undefined
            });

            toast.success(`Proveedor "${proveedor.nombre}" creado exitosamente`);
            onProveedorCreado(proveedor);

            // Reset form
            setFormData({
                nombre: '',
                celular: '',
                email: '',
                direccion: '',
                notas: ''
            });

            onOpenChange(false);
        } catch (error: any) {
            console.error('Error creating proveedor:', error);
            toast.error(error.response?.data?.detail || 'Error al crear proveedor');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Proveedor</DialogTitle>
                    <DialogDescription>
                        Crea un nuevo proveedor para registrar compras
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Nombre del proveedor"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="celular">Celular</Label>
                            <Input
                                id="celular"
                                value={formData.celular}
                                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                                placeholder="Ej: 70123456"
                            />
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                            id="direccion"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            placeholder="Dirección del proveedor"
                        />
                    </div>

                    <div>
                        <Label htmlFor="notas">Notas</Label>
                        <textarea
                            id="notas"
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md bg-background text-foreground dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
