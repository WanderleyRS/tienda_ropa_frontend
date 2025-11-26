'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CartButton } from '@/components/CartButton';
import { LogOut, Building2, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
        setMobileMenuOpen(false);
    };

    // Public navigation items (always visible)
    const publicNavItems = [
        { href: '/tienda', label: 'Tienda' },
    ];

    // Authenticated-only navigation items
    const authNavItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/ventas', label: 'Ventas' },
        { href: '/items/bulk-upload', label: 'Carga Masiva' },
        ...(user?.role === 'admin' ? [{ href: '/usuarios', label: 'Usuarios' }] : []),
    ];

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <Link href={isAuthenticated ? "/dashboard" : "/tienda"} className="flex items-center gap-2 group">
                            <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                                <span className="text-xl">🛍️</span>
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-foreground hidden sm:block">
                                Tienda Ropa MVP
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
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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

                        {/* User info (desktop only) */}
                        {isAuthenticated && (
                            <div className="text-sm text-right hidden lg:block">
                                <div className="font-medium text-foreground">{user?.username}</div>
                                {user?.empresa_nombre && (
                                    <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                        <Building2 className="h-3 w-3" /> {user.empresa_nombre}
                                    </div>
                                )}
                            </div>
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

                        {/* Login button for non-authenticated users */}
                        {!isAuthenticated && (
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
                <div className="md:hidden border-t border-border bg-white">
                    <nav className="px-4 py-4 space-y-1">
                        {/* User info */}
                        <div className="px-4 py-3 bg-secondary/30 rounded-lg mb-3">
                            <div className="font-medium text-foreground">{user?.username}</div>
                            {user?.empresa_nombre && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Building2 className="h-3 w-3" /> {user.empresa_nombre}
                                </div>
                            )}
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
