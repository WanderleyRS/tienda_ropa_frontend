'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { CartButton } from '@/components/CartButton';
import { LogOut, Building2, Menu, X, Moon, Sun, Share2, ChevronDown, LayoutDashboard, ShoppingBag, Settings, Briefcase, Users, Package, FileText, Calendar, UserCheck, ClipboardList, Database } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, Suspense, useEffect } from 'react';
import { toast } from 'sonner';

import { companiesApi } from '@/lib/api';
import { TenantSwitcher } from '@/components/TenantSwitcher';

function NavbarContent() {
    const { user, logout, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [publicBranding, setPublicBranding] = useState<{ title?: string, logo?: string } | null>(null);

    // Detect if we are in public store mode
    const publicEmpresaId = searchParams.get('empresa_id');
    const isPublicStore = !!publicEmpresaId;

    // Fetch public branding if in public mode and not authenticated
    useEffect(() => {
        const fetchBranding = async () => {
            if (isPublicStore && !isAuthenticated && publicEmpresaId) {
                try {
                    const empresa = await companiesApi.getPublicEmpresa(Number(publicEmpresaId));
                    setPublicBranding({
                        title: empresa.navbar_title || empresa.nombre,
                        logo: empresa.navbar_icon_url
                    });
                } catch (error) {
                    console.error("Error loading public branding", error);
                }
            }
        };
        fetchBranding();
    }, [isPublicStore, isAuthenticated, publicEmpresaId]);

    const handleLogout = () => {
        logout();
        router.push('/login');
        setMobileMenuOpen(false);
    };

    // Public navigation items (always visible)
    const publicNavItems = [
        { href: isPublicStore ? `/tienda?empresa_id=${publicEmpresaId}` : '/tienda', label: 'Tienda' },
    ];

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isSuperAdmin = user?.role === 'super_admin';

    // Dropdown states
    const [gestionOpen, setGestionOpen] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);

    // Determine Logo Link
    const logoLink = isAuthenticated
        ? "/dashboard"
        : (isPublicStore ? `/tienda?empresa_id=${publicEmpresaId}` : "/tienda");

    // Determine Display Data (User -> Public -> Default)
    const displayLogo = user?.empresa_navbar_icon_url || publicBranding?.logo;
    const displayTitle = user?.empresa_navbar_title || publicBranding?.title || "Tienda Ropa MVP";

    return (
        <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <Link href={logoLink} className="flex items-center gap-2 group">
                            {displayLogo ? (
                                <img
                                    src={displayLogo}
                                    alt="Logo"
                                    className="h-10 w-10 object-contain rounded-lg bg-white p-1"
                                />
                            ) : (
                                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <span className="text-xl">🛍️</span>
                                </div>
                            )}
                            <span className="text-lg sm:text-xl font-bold text-foreground hidden sm:block">
                                {displayTitle}
                            </span>
                        </Link>

                        {/* Tenant Switcher for Super Admins */}
                        {user?.role === 'super_admin' && (
                            <div className="hidden lg:block">
                                <TenantSwitcher />
                            </div>
                        )}

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {/* Tienda (Public/Private) */}
                            <Link
                                href={isPublicStore ? `/tienda?empresa_id=${publicEmpresaId}` : '/tienda'}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                    pathname === '/tienda' || (isPublicStore && pathname === '/tienda')
                                        ? "bg-primary/10 text-primary font-bold shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <ShoppingBag className="h-4 w-4" />
                                <span>Tienda</span>
                            </Link>

                            {isAuthenticated && (
                                <>
                                    {/* Dashboard */}
                                    <Link
                                        href="/dashboard"
                                        className={cn(
                                            "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                            pathname === '/dashboard'
                                                ? "bg-primary/10 text-primary font-bold shadow-sm"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>Dashboard</span>
                                    </Link>

                                    {/* Gestión Dropdown */}
                                    <div className="relative group" onMouseEnter={() => setGestionOpen(true)} onMouseLeave={() => setGestionOpen(false)}>
                                        <button
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                                ['/ventas', '/compras', '/agenda', '/clientes', '/reportes'].includes(pathname)
                                                    ? "bg-primary/10 text-primary font-bold"
                                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            <Briefcase className="h-4 w-4" />
                                            <span>Gestión</span>
                                            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", gestionOpen && "rotate-180")} />
                                        </button>
                                        
                                        {gestionOpen && (
                                            <div className="absolute top-full left-0 w-48 mt-1 bg-popover border border-border rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                                                <Link href="/ventas" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <ClipboardList className="h-4 w-4" /> Ventas
                                                </Link>
                                                <Link href="/compras" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <Package className="h-4 w-4" /> Compras
                                                </Link>
                                                <Link href="/agenda" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <Calendar className="h-4 w-4" /> Agenda
                                                </Link>
                                                <Link href="/clientes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <Users className="h-4 w-4" /> Clientes
                                                </Link>
                                                <Link href="/reportes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <FileText className="h-4 w-4" /> Reportes
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Configuración Dropdown */}
                                    <div className="relative group" onMouseEnter={() => setConfigOpen(true)} onMouseLeave={() => setConfigOpen(false)}>
                                        <button
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                                ['/items/bulk-upload', '/inventario/configuracion', '/empresa', '/usuarios'].includes(pathname)
                                                    ? "bg-primary/10 text-primary font-bold"
                                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span>Configuración</span>
                                            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", configOpen && "rotate-180")} />
                                        </button>
                                        
                                        {configOpen && (
                                            <div className="absolute top-full right-0 lg:left-0 w-52 mt-1 bg-popover border border-border rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                                                <Link href="/inventario/configuracion" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <Database className="h-4 w-4" /> Inventario
                                                </Link>
                                                <Link href="/items/bulk-upload" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                    <Share2 className="h-4 w-4" /> Carga Masiva
                                                </Link>
                                                {isAdmin && (
                                                    <>
                                                        <div className="h-px bg-border my-1" />
                                                        <Link href="/empresa" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                            <Building2 className="h-4 w-4" /> Datos Empresa
                                                        </Link>
                                                        <Link href="/usuarios" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                                                            <UserCheck className="h-4 w-4" /> Usuarios
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Cart Button (always visible) */}
                        <CartButton />

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>

                        {/* Share Store Button (Authenticated) */}
                        {isAuthenticated && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (user) {
                                        const empresaId = user.empresa_id || (user.almacenes && user.almacenes.length > 0 ? user.almacenes[0].empresa_id : null);
                                        const empresaSlug = user.empresa_slug;

                                        if (empresaSlug) {
                                            const link = `${window.location.origin}/tienda/${empresaSlug}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success(`Enlace copiado: ${link}`);
                                        } else if (empresaId) {
                                            const link = `${window.location.origin}/tienda?empresa_id=${empresaId}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success('Enlace de tienda copiado al portapapeles');
                                        } else {
                                            toast.error('No se pudo identificar tu empresa');
                                        }
                                    }
                                }}
                                className="text-muted-foreground hover:text-primary hidden md:flex gap-2"
                                title="Copiar enlace de tienda"
                            >
                                <Share2 className="h-4 w-4" />
                                <span className="hidden lg:inline">Compartir</span>
                            </Button>
                        )}

                        {/* Logout button (desktop) */}
                        {isAuthenticated && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hidden md:flex"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Login button for non-authenticated users - HIDDEN IN PUBLIC STORE MODE */}
                        {!isAuthenticated && !isPublicStore && (
                            <Link href="/login" className="hidden sm:block">
                                <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20">
                                    Iniciar sesión
                                </Button>
                            </Link>
                        )}

                        {/* Mobile menu button */}
                        {isAuthenticated && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden"
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && isAuthenticated && (
                <div className="md:hidden border-t border-border bg-background">
                    <nav className="px-4 py-4 space-y-1">
                        {/* User info */}
                        <div className="px-4 py-3 bg-secondary/30 rounded-lg mb-3">
                            <div className="font-medium text-foreground">{user?.username}</div>
                            {user?.empresa_nombre && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Building2 className="h-3 w-3" /> {user.empresa_nombre}
                                </div>
                            )}

                            {/* Share Store Action Mobile */}
                            <button
                                onClick={() => {
                                    if (user) {
                                        const empresaId = user.empresa_id || (user.almacenes && user.almacenes.length > 0 ? user.almacenes[0].empresa_id : null);
                                        const empresaSlug = user.empresa_slug;

                                        if (empresaSlug) {
                                            const link = `${window.location.origin}/tienda/${empresaSlug}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success(`Enlace copiado: ${link}`);
                                        } else if (empresaId) {
                                            const link = `${window.location.origin}/tienda?empresa_id=${empresaId}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success('Enlace de tienda copiado al portapapeles');
                                        } else {
                                            toast.error('No se pudo identificar tu empresa');
                                        }
                                        setMobileMenuOpen(false);
                                    }
                                }}
                                className="mt-3 flex items-center w-full px-3 py-2 text-sm text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir Tienda
                            </button>
                        </div>

                        {/* Public links */}
                        <Link
                            href={isPublicStore ? `/tienda?empresa_id=${publicEmpresaId}` : '/tienda'}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                pathname === '/tienda' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            <ShoppingBag className="h-5 w-5" /> Tienda
                        </Link>

                        {/* Authenticated links */}
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                pathname === '/dashboard' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            <LayoutDashboard className="h-5 w-5" /> Dashboard
                        </Link>

                        <div className="pt-2 pb-1 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Gestión</div>
                        <Link href="/ventas" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><ClipboardList className="h-4 w-4" /> Ventas</Link>
                        <Link href="/compras" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><Package className="h-4 w-4" /> Compras</Link>
                        <Link href="/agenda" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> Agenda</Link>
                        <Link href="/clientes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><Users className="h-4 w-4" /> Clientes</Link>
                        <Link href="/reportes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><FileText className="h-4 w-4" /> Reportes</Link>

                        <div className="pt-4 pb-1 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Configuración</div>
                        <Link href="/inventario/configuracion" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><Database className="h-4 w-4" /> Inventario</Link>
                        <Link href="/items/bulk-upload" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><Share2 className="h-4 w-4" /> Carga Masiva</Link>
                        
                        {isAdmin && (
                            <>
                                <Link href="/empresa" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><Building2 className="h-4 w-4" /> Datos Empresa</Link>
                                <Link href="/usuarios" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground"><UserCheck className="h-4 w-4" /> Usuarios</Link>
                            </>
                        )}

                        <div className="pt-4" />
                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                        >
                            <LogOut className="h-5 w-5" />
                            Cerrar sesión
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}

export function Navbar() {
    return (
        <Suspense fallback={<header className="h-16 border-b bg-background/80" />}>
            <NavbarContent />
        </Suspense>
    );
}
