'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { companiesApi, Almacen, Empresa } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Warehouse, Plus, CheckCircle2, Phone, Edit, Bot, ShieldAlert } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { useRouter } from 'next/navigation';

export default function EmpresaPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();

    // State for Company Setup
    const [companyName, setCompanyName] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [initialWarehouse, setInitialWarehouse] = useState('');
    const [telegramToken, setTelegramToken] = useState('');
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
    const [empresaData, setEmpresaData] = useState<Empresa | null>(null);
    const [isLoadingEmpresa, setIsLoadingEmpresa] = useState(false);
    const [isEditingEmpresa, setIsEditingEmpresa] = useState(false);
    const [editedEmpresaName, setEditedEmpresaName] = useState('');
    const [editedWhatsApp, setEditedWhatsApp] = useState('');
    const [editedTelegramToken, setEditedTelegramToken] = useState('');
    const [isSavingEmpresa, setIsSavingEmpresa] = useState(false);

    const loadEmpresaData = async () => {
        setIsLoadingEmpresa(true);
        try {
            const data = await companiesApi.getEmpresa();
            setEmpresaData(data);
            setEditedEmpresaName(data.nombre);
            // Remove +591 prefix if present for display
            const rawPhone = data.whatsapp_numero || '';
            setEditedWhatsApp(rawPhone.replace(/^(\+?591)?\s*/, ''));
            setEditedTelegramToken(data.telegram_token || '');
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
                nombre_almacen_inicial: initialWarehouse || undefined,
                telegram_token: telegramToken || undefined
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

    const loadSuggestedWarehouseName = async () => {
        try {
            const { suggested_name } = await companiesApi.getNextAlmacenName();
            setNewWarehouseName(suggested_name);
        } catch (error) {
            console.error('Error loading suggested name:', error);
        }
    };

    const handleSaveEmpresa = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar que sea un número
        if (editedWhatsApp && !/^\d+$/.test(editedWhatsApp)) {
            toast.error('El número debe contener solo dígitos');
            return;
        }

        if (!empresaData) return;

        setIsSavingEmpresa(true);
        try {
            await companiesApi.updateEmpresa({
                nombre: editedEmpresaName,
                whatsapp_numero: editedWhatsApp ? `+591${editedWhatsApp.trim()}` : undefined,
                navbar_title: empresaData.navbar_title,
                navbar_icon_url: empresaData.navbar_icon_url,
                store_title_1: empresaData.store_title_1,
                store_title_2: empresaData.store_title_2,
                store_subtitle: empresaData.store_subtitle,
                telegram_token: editedTelegramToken || undefined
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
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Building2 className="h-6 w-6 text-primary" />
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
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-muted-foreground text-sm">
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
                                    <p className="text-xs text-muted-foreground">
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
                                    <p className="text-xs text-muted-foreground">
                                        Crearemos un primer almacén automáticamente para ti.
                                    </p>
                                </div>

                                {user?.role === 'super_admin' && (
                                    <div className="space-y-2 border-t pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                                            <Label htmlFor="telegramToken">Token de Telegram (Jarvis)</Label>
                                        </div>
                                        <Input
                                            id="telegramToken"
                                            type="password"
                                            placeholder="7123456789:AAF..."
                                            value={telegramToken}
                                            onChange={(e) => setTelegramToken(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Solo visible para Súper Administradores. Este token vincula el bot de Jarvis a esta empresa.
                                        </p>
                                    </div>
                                )}
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
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        {user?.empresa_nombre || 'Mi Empresa'}
                    </h1>
                    <p className="text-muted-foreground mt-2">Gestión de empresa y almacenes</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Datos de la Empresa */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Datos de la Empresa & Branding
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
                                Información general y personalización de la marca de tu tienda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingEmpresa ? (
                                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                            ) : isEditingEmpresa ? (
                                <form onSubmit={handleSaveEmpresa} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
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
                                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-muted-foreground text-sm">
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
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <h3 className="font-medium text-foreground">Personalización de Tienda</h3>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="navbarTitle">Título del Navbar</Label>
                                                <Input
                                                    id="navbarTitle"
                                                    placeholder="Ej. Mi Marca"
                                                    value={empresaData?.navbar_title || ''}
                                                    onChange={(e) => empresaData && setEmpresaData({ ...empresaData, navbar_title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="navbarIcon">Icono del Navbar</Label>
                                                <ImageUploader
                                                    value={empresaData?.navbar_icon_url || ''}
                                                    onChange={(url) => empresaData && setEmpresaData({ ...empresaData, navbar_icon_url: url })}
                                                    maxSize={128}
                                                    label="Subir Icono"
                                                    folder="branding"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="storeTitle1">Título Principal (Línea 1)</Label>
                                            <Input
                                                id="storeTitle1"
                                                placeholder="Ej. Colección Exclusiva"
                                                value={empresaData?.store_title_1 || ''}
                                                onChange={(e) => empresaData && setEmpresaData({ ...empresaData, store_title_1: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="storeTitle2">Título Principal (Línea 2 - Gradiente)</Label>
                                            <Input
                                                id="storeTitle2"
                                                placeholder="Ej. Estilo con Historia"
                                                value={empresaData?.store_title_2 || ''}
                                                onChange={(e) => empresaData && setEmpresaData({ ...empresaData, store_title_2: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="storeSubtitle">Subtítulo</Label>
                                            <Input
                                                id="storeSubtitle"
                                                placeholder="Ej. Piezas únicas seleccionadas..."
                                                value={empresaData?.store_subtitle || ''}
                                                onChange={(e) => empresaData && setEmpresaData({ ...empresaData, store_subtitle: e.target.value })}
                                            />
                                        </div>

                                        {user?.role === 'super_admin' && (
                                            <div className="space-y-2 border-t pt-4 bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                                                    <Label htmlFor="editTelegramToken" className="text-amber-700 dark:text-amber-400 font-bold">
                                                        Token de Telegram (Jarvis) - Seguridad Crítica
                                                    </Label>
                                                </div>
                                                <Input
                                                    id="editTelegramToken"
                                                    type="password"
                                                    value={editedTelegramToken}
                                                    onChange={(e) => setEditedTelegramToken(e.target.value)}
                                                    className="bg-background border-amber-500/30 focus-visible:ring-amber-500"
                                                />
                                                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                                                    Este campo solo es visible y editable para Súper Administradores.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditingEmpresa(false);
                                                loadEmpresaData(); // Reset changes
                                            }}
                                            disabled={isSavingEmpresa}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={isSavingEmpresa}>
                                            {isSavingEmpresa ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Nombre Legal</p>
                                            <p className="text-lg font-semibold text-foreground">{empresaData?.nombre || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                                <Phone className="h-4 w-4" />
                                                WhatsApp
                                            </p>
                                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                {empresaData?.whatsapp_numero || 'No configurado'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Vista Previa Branding</h3>
                                        <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">Icono Navbar:</span>
                                                {empresaData?.navbar_icon_url ? (
                                                    <img src={empresaData.navbar_icon_url} alt="Icon" className="h-10 w-10 object-contain rounded-lg border bg-white p-1" />
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Sin icono</span>
                                                )}
                                            </div>
                                            <p className="text-sm"><span className="font-semibold">Navbar:</span> {empresaData?.navbar_title || 'Default'}</p>
                                            <p className="text-sm"><span className="font-semibold">Título 1:</span> {empresaData?.store_title_1 || 'Default'}</p>
                                            <p className="text-sm"><span className="font-semibold">Título 2:</span> {empresaData?.store_title_2 || 'Default'}</p>
                                        </div>
                                    </div>

                                    {user?.role === 'super_admin' && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4" />
                                                Integración Jarvis (Solo Super Admin)
                                            </h3>
                                            <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Bot className="h-5 w-5 text-amber-500" />
                                                    <div>
                                                        <p className="text-sm font-medium">Token de Telegram</p>
                                                        <p className="text-xs font-mono text-muted-foreground">
                                                            {empresaData?.telegram_token ? '••••••••••••••••••••' : 'No configurado'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {empresaData?.telegram_token && (
                                                    <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full border border-green-500/20">
                                                        VINCULADO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                                <form onSubmit={handleCreateWarehouse} className="flex gap-4 items-end bg-secondary/20 p-4 rounded-lg border border-border">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="newWarehouse">Nuevo Almacén</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="newWarehouse"
                                                placeholder="Ej. Sucursal Norte o Almacén 1"
                                                value={newWarehouseName}
                                                onChange={(e) => setNewWarehouseName(e.target.value)}
                                                disabled={isCreatingWarehouse}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={loadSuggestedWarehouseName}
                                                disabled={isCreatingWarehouse}
                                                title="Sugerir nombre automático"
                                            >
                                                Sugerir Nombre
                                            </Button>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={isCreatingWarehouse || !newWarehouseName}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Crear
                                    </Button>
                                </form>

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                                    {almacenes.map((almacen, index) => (
                                        <div
                                            key={almacen.id}
                                            className="p-4 rounded-lg border bg-card shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-card-foreground">{almacen.nombre}</h3>
                                                    {almacen.activo ? (
                                                        <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">Inactivo</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Almacén #{index + 1}</p>
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
