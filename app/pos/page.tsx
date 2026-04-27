'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Clock, Search, Filter, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { POSProductGrid } from '@/components/POSProductGrid';
import { POSPendingOrders } from '@/components/POSPendingOrders';
import { POSCart } from '@/components/POSCart';
import { POSCheckout } from '@/components/POSCheckout';
import { itemsApi, Item, categoriesApi, Category, ventasApi } from '@/lib/api';
import { toast } from 'sonner';

export default function POSPage() {
  return (
    <ProtectedRoute>
      <POSContent />
    </ProtectedRoute>
  );
}

function POSContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cart state
  const [cart, setCart] = useState<{item: Item | any, quantity: number, price: number}[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [itemsData, categoriesData, pendingData] = await Promise.all([
        itemsApi.getAll({ is_sold: false }),
        categoriesApi.getAll(),
        ventasApi.getPedidosPendientes()
      ]);
      
      // Filter items to only show 'disponible' (not 'pendiente')
      setItems(itemsData.filter(i => i.status === 'disponible' || !i.status));
      setCategories(categoriesData);
      setPendingItems(pendingData);
    } catch (error) {
      console.error('Error loading POS data:', error);
      toast.error('Error al cargar datos del POS');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item: Item | any) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id && !i.item.es_generico);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1, price: item.price || 0 }];
    });
    toast.success(`${item.title} añadido al carrito`);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (index: number, newPrice: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) return { ...item, price: newPrice };
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClient(null);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.local_id?.toString().includes(searchTerm));
    const matchesCategory = selectedCategory === 'ALL' || item.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] font-sans transition-colors duration-500 overflow-hidden">
      <Navbar />
      
      <main className="max-w-[1900px] mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-80px)]">
          
          {/* LEFT SIDEBAR: Catalog & Search (3/12) */}
          <div className="lg:col-span-3 flex flex-col gap-3 overflow-hidden h-full">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-md">
              <CardContent className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar..." 
                    className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-none ring-offset-transparent focus-visible:ring-primary text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <Button 
                    variant={selectedCategory === 'ALL' ? 'default' : 'secondary'} 
                    size="sm"
                    onClick={() => setSelectedCategory('ALL')}
                    className="h-7 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  >
                    Todos
                  </Button>
                  {categories.slice(0, 4).map(cat => (
                    <Button 
                      key={cat.id} 
                      variant={selectedCategory === cat.id.toString() ? 'default' : 'secondary'} 
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id.toString())}
                      className="h-7 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="catalog" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 bg-slate-200/50 dark:bg-slate-900/80 p-1 rounded-xl h-10 mb-2">
                <TabsTrigger value="catalog" className="rounded-lg text-[11px] font-bold h-8">
                  VIP
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg text-[11px] font-bold h-8">
                  WhatsApp
                  {pendingItems.length > 0 && (
                    <span className="ml-1.5 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                      {pendingItems.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <TabsContent value="catalog" className="mt-0 outline-none">
                  <POSProductGrid 
                    items={filteredItems} 
                    onAdd={addToCart} 
                    isLoading={isLoading} 
                    compact
                  />
                </TabsContent>

                <TabsContent value="pending" className="mt-0 outline-none">
                  <POSPendingOrders 
                    items={pendingItems} 
                    onAddAll={items => {
                      items.forEach(item => addToCart(item));
                    }}
                    onRefresh={loadData}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* CENTER: Expanded Cart (6/12) */}
          <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden h-full">
            <Card className="flex-1 border-none shadow-xl bg-white dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden flex flex-col rounded-[2rem] border border-white/5">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-black text-xl tracking-tight">Venta Actual</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart} 
                  className="text-muted-foreground hover:text-destructive h-8 px-4 rounded-full"
                  disabled={cart.length === 0}
                >
                  Limpiar Carrito
                </Button>
              </div>

              {/* Table Headers for Cart */}
              <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-slate-100 dark:border-slate-800/50">
                <div className="col-span-6">Producto</div>
                <div className="col-span-2 text-center">Precio</div>
                <div className="col-span-2 text-center">Cant.</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                <POSCart 
                  items={cart} 
                  onRemove={removeFromCart} 
                  onUpdateQty={updateQuantity}
                  onUpdatePrice={updatePrice}
                />
              </div>
            </Card>
          </div>

          {/* RIGHT SIDEBAR: Checkout & Totals (3/12) */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
             <POSCheckout 
              cart={cart}
              selectedClient={selectedClient}
              onClientSelect={setSelectedClient}
              onSuccess={() => {
                clearCart();
                loadData();
              }}
              onAddGeneric={(item) => addToCart(item)}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
