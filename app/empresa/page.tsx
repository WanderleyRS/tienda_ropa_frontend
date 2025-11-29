'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { companiesApi, Almacen } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Warehouse, Plus, CheckCircle2, Phone, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmpresaPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();

    // State for Company Setup
    const [companyName, setCompanyName] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [initialWarehouse, setInitialWarehouse] = useState('');
    const [isSettingUp, setIsSettingUp] = useState(false);

    // State for Warehouse Management
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [isLoadingAlmacenes, setIsLoadingAlmacenes] = useState(false);
    const [newWarehouseName, setNewWarehouseName] = useState('');
    const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        } else if (user?.role === 'vendedor') {
            router.push('/dashboard');
        } else if (user?.almacenes && user.almacenes.length > 0) {
            loadAlmacenes();
            loadEmpresaData();
        }
    }, [user, isAuthenticated, isLoading, router]);

    const loadAlmacenes = async () => {
        setIsLoadingAlmacenes(true);
        try {
            const data = await companiesApi.getAlmacenes();
            setAlmacenes(data);
        } catch (error) {
            console.error('Error loading warehouses:', error);
            toast.error('Error al cargar almacenes');
        } finally {
            setIsLoadingAlmacenes(false);
        }
    };

    // State for Company Info
    const [empresaData, setEmpresaData] = useState<any>(null);
    const [isLoadingEmpresa, setIsLoadingEmpresa] = useState(false);
    const [isEditingEmpresa, setIsEditingEmpresa] = useState(false);
    const [editedEmpresaName, setEditedEmpresaName] = useState('');
    const [editedWhatsApp, setEditedWhatsApp] = useState('');
    const [isSavingEmpresa, setIsSavingEmpresa] = useState(false);

    const loadEmpresaData = async () => {
        setIsLoadingEmpresa(true);
        try {
            const data = await companiesApi.getEmpresa();
            setEmpresaData(data);
            setEmpresaData(data);
            setEditedEmpresaName(data.nombre);
            // Remove +591 prefix if present for display
            const rawPhone = data.whatsapp_numero || '';
            setEditedWhatsApp(rawPhone.replace(/^(\+?591)?\s*/, ''));
        } catch (error) {
            console.error('Error loading empresa:', error);
            toast.error('Error al cargar datos de empresa');
        } finally {
            setIsLoadingEmpresa(false);
        }
    };

    const handleSetupCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName) return;

        setIsSettingUp(true);
        try {
            await companiesApi.setup({
                nombre: companyName,
                whatsapp_numero: whatsappNumber ? `+591${whatsappNumber.trim()}` : undefined,
                nombre_almacen_inicial: initialWarehouse || undefined
            });
            toast.success('Empresa configurada. Inicia sesión nuevamente para continuar.');

            // Logout para obtener un nuevo token con almacen_ids
            logout();

            // Redirigir al login
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al configurar empresa');
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleCreateWarehouse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWarehouseName) return;

        setIsCreatingWarehouse(true);
        try {
            await companiesApi.createAlmacen({ nombre: newWarehouseName });
            toast.success('Almacén creado exitosamente');
            setNewWarehouseName('');
            loadAlmacenes();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al crear almacén');
        } finally {
            setIsCreatingWarehouse(false);
        }
    };

    const handleSaveEmpresa = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar que sea un número
        if (editedWhatsApp && !/^\d+$/.test(editedWhatsApp)) {
            toast.error('El número debe contener solo dígitos');
            return;
        }

        setIsSavingEmpresa(true);
        try {
            await companiesApi.updateEmpresa({
                nombre: editedEmpresaName,
                whatsapp_numero: editedWhatsApp ? `+591${editedWhatsApp.trim()}` : undefined
            });
            toast.success('Datos de empresa actualizados');
            setIsEditingEmpresa(false);
            loadEmpresaData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error al actualizar empresa');
        } finally {
            setIsSavingEmpresa(false);
        }
    };

    if (isLoading || !isAuthenticated) return null;

    // VISTA 1: Configuración Inicial
    const hasAlmacenes = user?.almacenes && user.almacenes.length > 0;
    if (!hasAlmacenes) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Building2 className="h-6 w-6 text-blue-600" />
                                Configura tu Empresa
                            </CardTitle>
                            <CardDescription>
                                Antes de comenzar, necesitamos configurar los datos básicos de tu negocio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSetupCompany} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="Ej. Mi Tienda de Ropa"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                            🇧🇴 +591
                                        </span>
                                        <Input
                                            id="whatsappNumber"
                                            placeholder="63411905"
                                            value={whatsappNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setWhatsappNumber(val);
                                            }}
                                            className="rounded-l-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Ingresa solo el número de celular (sin el código de país).
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="initialWarehouse">Nombre del Almacén Principal</Label>
                                    <Input
                                        id="initialWarehouse"
                                        placeholder="Ej. Almacén Central (Opcional)"
                                        value={initialWarehouse}
                                        onChange={(e) => setInitialWarehouse(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Crearemos un primer almacén automáticamente para ti.
                                    </p>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSettingUp}>
                                    {isSettingUp ? 'Configurando...' : 'Guardar y Continuar'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // VISTA 2: Gestión de Empresa
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        {user?.empresa_nombre || 'Mi Empresa'}
                    </h1>
                    <p className="text-gray-600 mt-2">Gestión de empresa y almacenes</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Datos de la Empresa */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Datos de la Empresa
                                </div>
                                {!isEditingEmpresa && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditingEmpresa(true)}
                                        disabled={isLoadingEmpresa}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Información general de tu empresa y contacto para pedidos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingEmpresa ? (
                                <div className="text-center py-8 text-gray-500">Cargando...</div>
                            ) : isEditingEmpresa ? (
                                <form onSubmit={handleSaveEmpresa} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="editEmpresaName">Nombre de la Empresa</Label>
                                        <Input
                                            id="editEmpresaName"
                                            value={editedEmpresaName}
                                            onChange={(e) => setEditedEmpresaName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editWhatsApp">Número de WhatsApp</Label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                                🇧🇴 +591
                                            </span>
                                            <Input
                                                id="editWhatsApp"
                                                placeholder="63411905"
                                                value={editedWhatsApp}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setEditedWhatsApp(val);
                                                }}
                                                className="rounded-l-none"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Ingresa solo el número de celular (sin el código de país).
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isSavingEmpresa}>
                                            {isSavingEmpresa ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditingEmpresa(false);
                                                setEditedEmpresaName(empresaData?.nombre || '');
                                                const rawPhone = empresaData?.whatsapp_numero || '';
                                                setEditedWhatsApp(rawPhone.replace(/^(\+?591)?\s*/, ''));
                                            }}
                                            disabled={isSavingEmpresa}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Nombre</p>
                                        <p className="text-lg font-semibold">{empresaData?.nombre || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            WhatsApp para Pedidos
                                        </p>
                                        {empresaData?.whatsapp_numero ? (
                                            <p className="text-lg font-semibold text-green-600">
                                                {empresaData.whatsapp_numero}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">
                                                No configurado. Haz clic en "Editar" para agregar un número.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mis Almacenes */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Warehouse className="h-5 w-5" />
                                    Mis Almacenes
                                </div>
                            </CardTitle>
                            <CardDescription>
                                Gestiona los puntos de venta o almacenamiento de tu inventario.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <form onSubmit={handleCreateWarehouse} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="newWarehouse">Nuevo Almacén</Label>
                                        <Input
                                            id="newWarehouse"
                                            placeholder="Ej. Sucursal Norte"
                                            value={newWarehouseName}
                                            onChange={(e) => setNewWarehouseName(e.target.value)}
                                            disabled={isCreatingWarehouse}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isCreatingWarehouse || !newWarehouseName}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Crear
                                    </Button>
                                </form>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                                    {almacenes.map((almacen) => (
                                        <div
                                            key={almacen.id}
                                            className="p-4 rounded-lg border bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-gray-900">{almacen.nombre}</h3>
                                                    {almacen.activo ? (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Inactivo</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">ID: {almacen.id}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
