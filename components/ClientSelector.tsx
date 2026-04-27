'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Loader2, X, Plus } from 'lucide-react';
import { clientesApi, PotencialCliente } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';


interface ClientSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (cliente: PotencialCliente) => void;
}

export function ClientSelector({ isOpen, onClose, onSelect }: ClientSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clientes, setClientes] = useState<PotencialCliente[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Quick create state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Simple debounce logic inside effect if hook doesn't exist
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                searchClientes(searchTerm);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    const searchClientes = async (term: string) => {
        setIsLoading(true);
        try {
            // If api supports search, use it. Otherwise list all and filter (temporary until backend supports search if not already)
            // Based on previous context, clientesApi.listarTodos might be the only one. 
            // Ideally we should have a search endpoint. For now I'll assume we might need to filter client side 
            // OR better, let's check if there is a search param.
            // Checking previous logs, I don't see a specific search endpoint for clients, but usually list endpoints have search.
            // I will assume listarTodos takes a search param or I'll filter client side if the list is small enough for now, 
            // BUT the user said "200 users", so client side filtering of 200 users is actually fine for performance 
            // IF we don't render them all in a Select. 
            // However, to be scalable, we should verify if the API supports filtering.

            const data = await clientesApi.listarTodos(); // We might need to optimize this in the backend later

            let filtered = data;
            if (term) {
                const lowerTerm = term.toLowerCase();
                filtered = data.filter(c =>
                    c.nombre.toLowerCase().includes(lowerTerm) ||
                    c.apellido_paterno.toLowerCase().includes(lowerTerm) ||
                    c.celular?.includes(term)
                );
            }
            setClientes(filtered.slice(0, 50)); // Limit results for performance
        } catch (error) {
            console.error('Error searching clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const nuevoCliente = await clientesApi.crear({
                nombre: newName,
                celular: newPhone,
                status: 'Nuevo'
            });
            toast.success('Cliente registrado correctamente');
            onSelect(nuevoCliente);
            onClose();
        } catch (error) {
            console.error('Error creating client:', error);
            toast.error('Error al registrar cliente');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Seleccionar Cliente</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por nombre o celular..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : clientes.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-border/60">
                                <User className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No se encontraron clientes</p>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-4 gap-2 border-primary/20 text-primary hover:bg-primary/5"
                                    onClick={() => setShowCreateForm(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear "{searchTerm}"
                                </Button>
                            </div>
                        ) : (
                            <>
                                {clientes.map((cliente) => (
                                    <button
                                        key={cliente.id}
                                        onClick={() => {
                                            onSelect(cliente);
                                            onClose();
                                        }}
                                        className="w-full flex items-center p-3 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all text-left border border-transparent hover:border-primary/20 group"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">
                                                {cliente.nombre} {cliente.apellido_paterno}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">WhatsApp</span>
                                                {cliente.celular || 'Sin celular'}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                <div className="pt-2">
                                    <Button 
                                        variant="ghost" 
                                        className="w-full justify-start gap-3 h-12 text-primary hover:bg-primary/5 border border-dashed border-primary/20"
                                        onClick={() => setShowCreateForm(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Registrar Nuevo Cliente
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Inline Quick Create Form */}
                {showCreateForm && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-6 flex flex-col justify-center animate-in fade-in duration-200">
                        <button onClick={() => setShowCreateForm(false)} className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full">
                            <X className="h-5 w-5" />
                        </button>
                        <DialogHeader className="mb-4">
                            <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Registro Rápido
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleQuickCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Nombre Completo</Label>
                                <Input 
                                    placeholder="Ej. Juan Perez" 
                                    value={newName} 
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Celular (WhatsApp)</Label>
                                <Input 
                                    placeholder="Ej. 7854..." 
                                    value={newPhone} 
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <Button className="w-full h-12 font-bold" disabled={isCreating}>
                                {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar y Seleccionar"}
                            </Button>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
