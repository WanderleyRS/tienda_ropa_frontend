'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { CartItemCard } from '@/components/CartItemCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendToWhatsApp } from '@/lib/whatsapp';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { companiesApi, Empresa, itemsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';


export default function CarritoPage() {
    const { items, updateQuantity, removeFromCart, subtotal, clearCart } = useCart();
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const router = useRouter();
    const { user } = useAuth();

    // Load empresa data to get WhatsApp number
    useEffect(() => {
        const loadEmpresa = async () => {
            try {
                // Try to get empresaId from authenticated user first, then from localStorage
                let empresaId: number | null = null;

                if (user?.empresa_id) {
                    empresaId = user.empresa_id;
                    console.log('Using empresa_id from user:', empresaId);
                } else {
                    const storedId = localStorage.getItem('publicEmpresaId');
                    console.log('publicEmpresaId from localStorage:', storedId);
                    if (storedId) {
                        empresaId = parseInt(storedId);
                        console.log('Parsed empresaId:', empresaId);
                    }
                }

                if (empresaId) {
                    console.log('Loading empresa data for ID:', empresaId);
                    const empresaData = await companiesApi.getPublicEmpresa(empresaId);
                    console.log('Empresa data loaded:', empresaData);
                    setEmpresa(empresaData);
                } else {
                    console.warn('No empresa_id found in user or localStorage');
                    toast.error('No se pudo cargar la información de la tienda. Por favor, accede desde el enlace compartido.');
                }
            } catch (error) {
                console.error('Error loading empresa:', error);
                toast.error('Error al cargar información de la tienda');
            }
        };
        loadEmpresa();
    }, [user]);

    const handleSendToWhatsApp = () => {
        if (items.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }
        setIsLeadModalOpen(true);
    };



    const handleLeadCaptureSuccess = async (clienteId: number, nombreCompleto: string, celularCompleto: string) => {
        // Verificar que la empresa y su número de WhatsApp estén cargados
        if (!empresa || !empresa.whatsapp_numero) {
            toast.error('Error: No se pudo cargar el número de WhatsApp de la tienda');
            console.error('Empresa data:', empresa);
            return;
        }

        const whatsappNumber = empresa.whatsapp_numero;
        console.log('Enviando pedido a WhatsApp:', whatsappNumber);

        // Send WhatsApp message
        sendToWhatsApp(items, subtotal, nombreCompleto, celularCompleto, whatsappNumber);

        // Mark items as pending
        try {
            const itemIds = items.map(item => item.id);
            await itemsApi.markPending(itemIds);
            console.log('Items marked as pending:', itemIds);
            toast.success('Pedido enviado y productos reservados');
        } catch (error) {
            console.error('Error marking items as pending:', error);
            toast.warning('Pedido enviado pero no se pudieron reservar los productos');
        }

        // Limpiar carrito y redirigir a la tienda
        setTimeout(() => {
            clearCart();
            router.push('/tienda');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground">
                            🛒 Carrito de Compras
                        </h1>
                        <Link href="/tienda">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver a la tienda
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {items.length === 0 ? (
                    /* Empty Cart State */
                    <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
                        <div className="bg-secondary/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCart className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                            Tu carrito está vacío
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Parece que aún no has elegido nada. Explora nuestra tienda y encuentra prendas únicas.
                        </p>
                        <Link href="/tienda">
                            <Button size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:shadow-primary/25 transition-all">
                                Ir a la tienda
                            </Button>
                        </Link>
                    </div>
                ) : (
                    /* Cart with Items */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-foreground">
                                    Tu Pedido <span className="text-muted-foreground text-lg font-normal ml-2">({items.length} productos)</span>
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <CartItemCard
                                        key={item.id}
                                        item={item}
                                        onUpdateQuantity={updateQuantity}
                                        onRemove={removeFromCart}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-4">
                            <Card className="sticky top-24 border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                                <CardHeader className="bg-secondary/30 border-b border-border/50 pb-6">
                                    <CardTitle className="text-xl">Resumen del Pedido</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm group">
                                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                                    {item.title} <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                                                </span>
                                                <span className="font-medium tabular-nums">
                                                    {(item.price * item.quantity).toFixed(2)} Bs
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-border/50 pt-6">
                                        <div className="flex justify-between items-end mb-6">
                                            <span className="text-lg font-medium text-muted-foreground">Total a Pagar</span>
                                            <span className="text-3xl font-bold text-primary tabular-nums">
                                                {subtotal.toFixed(2)} Bs
                                            </span>
                                        </div>

                                        <Button
                                            onClick={handleSendToWhatsApp}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 hover:shadow-green-600/30 transition-all text-lg h-12 rounded-xl"
                                        >
                                            📱 Enviar Pedido por WhatsApp
                                        </Button>

                                        <p className="text-xs text-muted-foreground text-center mt-4 px-4">
                                            Al hacer clic, se abrirá WhatsApp con el detalle de tu pedido para coordinar el pago y envío.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={clearCart}
                                        variant="ghost"
                                        className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        size="sm"
                                    >
                                        Vaciar carrito
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            <LeadCaptureModal
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
                onSuccess={handleLeadCaptureSuccess}
            />
        </div>
    );
}
