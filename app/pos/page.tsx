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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Navbar />
      
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          
          {/* Left Panel: Catalog & Pending */}
          <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nombre o código..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button 
                      variant={selectedCategory === 'ALL' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setSelectedCategory('ALL')}
                      className="whitespace-nowrap"
                    >
                      Todos
                    </Button>
                    {categories.map(cat => (
                      <Button 
                        key={cat.id} 
                        variant={selectedCategory === cat.id.toString() ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSelectedCategory(cat.id.toString())}
                        className="whitespace-nowrap"
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="catalog" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm h-12">
                <TabsTrigger value="catalog" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Catálogo VIP
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10">
                  <Clock className="mr-2 h-4 w-4" />
                  Pedidos WhatsApp
                  {pendingItems.length > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {pendingItems.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="flex-1 overflow-y-auto mt-0 scrollbar-hide">
                <POSProductGrid 
                  items={filteredItems} 
                  onAdd={addToCart} 
                  isLoading={isLoading} 
                />
              </TabsContent>

              <TabsContent value="pending" className="flex-1 overflow-y-auto mt-0 scrollbar-hide">
                <POSPendingOrders 
                  items={pendingItems} 
                  onAddAll={items => {
                    items.forEach(item => addToCart(item));
                  }}
                  onRefresh={loadData}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel: Cart & Checkout */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            <Card className="flex-1 border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col rounded-2xl">
              <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-bold text-lg">Carrito de Venta</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">
                  Vaciar
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <POSCart 
                  items={cart} 
                  onRemove={removeFromCart} 
                  onUpdateQty={updateQuantity}
                  onUpdatePrice={updatePrice}
                />
              </div>

              <div className="mt-auto border-t p-4 bg-slate-50/50 dark:bg-slate-800/50">
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
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
