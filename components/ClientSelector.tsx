'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Loader2, X } from 'lucide-react';
import { clientesApi, PotencialCliente } from '@/lib/api';


interface ClientSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (cliente: PotencialCliente) => void;
}

export function ClientSelector({ isOpen, onClose, onSelect }: ClientSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clientes, setClientes] = useState<PotencialCliente[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : clientes.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                No se encontraron clientes
                            </div>
                        ) : (
                            clientes.map((cliente) => (
                                <button
                                    key={cliente.id}
                                    onClick={() => {
                                        onSelect(cliente);
                                        onClose();
                                    }}
                                    className="w-full flex items-center p-3 hover:bg-secondary/50 rounded-lg transition-colors text-left border border-transparent hover:border-border/50"
                                >
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {cliente.nombre} {cliente.apellido_paterno}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {cliente.celular || 'Sin celular'}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
