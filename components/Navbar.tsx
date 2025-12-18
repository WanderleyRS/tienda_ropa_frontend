'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { CartButton } from '@/components/CartButton';
import { LogOut, Building2, Menu, X, Moon, Sun, Share2 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, Suspense, useEffect } from 'react';
import { toast } from 'sonner';

import { companiesApi } from '@/lib/api';

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

    // Authenticated-only navigation items
    const authNavItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/ventas', label: 'Ventas' },
        { href: '/compras', label: '🛒 Compras' },
        { href: '/agenda', label: '📦 Agenda' },
        { href: '/clientes', label: '👥 Clientes' },
        { href: '/reportes', label: '📊 Reportes' },
        { href: '/items/bulk-upload', label: 'Carga Masiva' },
        ...(user?.role === 'admin' ? [{ href: '/usuarios', label: 'Usuarios' }] : []),
    ];

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

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex gap-1">
                            {/* Public links */}
                            {publicNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                        pathname === item.href || (isPublicStore && pathname === '/tienda')
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {/* Authenticated links */}
                            {isAuthenticated && authNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {/* Enlace a Empresa - Solo para Admins */}
                            {user?.role === 'admin' && (
                                <Link
                                    href="/empresa"
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                        pathname === '/empresa'
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    Empresa
                                </Link>
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
                        {publicNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    pathname === item.href
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}

                        {/* Authenticated links */}
                        {authNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    pathname === item.href
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}

                        {/* Empresa link for admins */}
                        {user?.role === 'admin' && (
                            <Link
                                href="/empresa"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    pathname === '/empresa'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                Empresa
                            </Link>
                        )}

                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                        >
                            <LogOut className="h-4 w-4 inline mr-2" />
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
