'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clientesApi, PotencialCliente } from '@/lib/api';
import { CreateClientModal } from '@/components/CreateClientModal';
import { Users, Search, Phone, Calendar, UserCheck, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClientesPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const [clientes, setClientes] = useState<PotencialCliente[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadClientes = async () => {
        setIsLoadingData(true);
        try {
            const data = await clientesApi.listarTodos();
            setClientes(data);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadClientes();
        }
    }, [isAuthenticated]);

    const filteredClientes = clientes.filter(cliente => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${cliente.nombre} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`.toLowerCase();
        return fullName.includes(searchLower) || cliente.celular.includes(searchLower);
    });

    if (isLoading) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-8 w-8" />
                            Gestión de Clientes
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Administra tu base de datos de clientes potenciales y reales.
                        </p>
                    </div>
                    <CreateClientModal onClientCreated={loadClientes} />
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle>Listado de Clientes ({filteredClientes.length})</CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre o celular..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingData ? (
                            <div className="text-center py-8 text-muted-foreground">Cargando clientes...</div>
                        ) : filteredClientes.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mt-2 text-lg font-medium">No se encontraron clientes</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                                    {searchTerm ? 'Intenta con otra búsqueda.' : 'Registra tu primer cliente usando el botón "Nuevo Cliente".'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredClientes.map((cliente) => (
                                    <div
                                        key={cliente.id}
                                        className="flex flex-col p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {cliente.nombre} {cliente.apellido_paterno}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {cliente.apellido_materno}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cliente.estado === 'CONVERTIDO'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {cliente.estado === 'CONVERTIDO' ? (
                                                    <><UserCheck className="h-3 w-3" /> Cliente Real</>
                                                ) : (
                                                    <><Clock className="h-3 w-3" /> Potencial</>
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-auto space-y-2 pt-4 border-t">
                                            <div className="flex items-center text-sm gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <a href={`https://wa.me/591${cliente.celular}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                                                    {cliente.celular}
                                                </a>
                                            </div>
                                            <div className="flex items-center text-sm gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    Registrado: {format(new Date(cliente.fecha_insercion), "d 'de' MMM, yyyy", { locale: es })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
