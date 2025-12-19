'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ItemsTable } from '@/components/ItemsTable';
import { CreateItemDialog } from '@/components/CreateItemDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { itemsApi, Item, categoriesApi, companiesApi, Category, Almacen } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filtros
  const [filterSold, setFilterSold] = useState<boolean | string | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterAlmacen, setFilterAlmacen] = useState('ALL');

  // Datos para filtros
  const [categories, setCategories] = useState<Category[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);

  const loadInitialData = async () => {
    try {
      const [catsData, almacenesData] = await Promise.all([
        categoriesApi.getAll(),
        user?.role === 'admin' ? companiesApi.getAlmacenes() : Promise.resolve([])
      ]);
      setCategories(catsData);
      if (user?.role === 'admin') {
        setAlmacenes(almacenesData);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};

      // Handle status filter
      if (filterSold === 'pendiente') {
        filters.status = 'pendiente';
      } else if (filterSold !== undefined) {
        filters.is_sold = filterSold;
      }

      if (filterCategory && filterCategory !== 'ALL') {
        filters.category_id = parseInt(filterCategory);
      }

      if (filterAlmacen && filterAlmacen !== 'ALL') {
        filters.almacen_id = parseInt(filterAlmacen);
      }

      const data = await itemsApi.getAll(filters);
      setItems(data);
    } catch (error: any) {
      console.error('Error al cargar ítems:', error);
      if (error.message) {
        console.error('Detalle del error:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Si el usuario es admin y no tiene almacenes configurados, no cargamos items
    // Mostramos el prompt de configuración en su lugar
    const hasAlmacenes = user?.almacenes && user.almacenes.length > 0;
    if (user?.role === 'admin' && !hasAlmacenes) {
      setIsLoading(false);
      return;
    }

    loadInitialData();
  }, [user]);

  useEffect(() => {
    const hasAlmacenes = user?.almacenes && user.almacenes.length > 0;
    if (user?.role === 'admin' && !hasAlmacenes) return;

    loadItems();
  }, [filterSold, filterCategory, filterAlmacen, user]);

  const handleItemCreated = () => {
    loadItems();
    setIsCreateDialogOpen(false);
  };

  const handleItemUpdated = () => {
    loadItems();
  };

  // VISTA: Admin sin empresa configurada
  const hasAlmacenes = user?.almacenes && user.almacenes.length > 0;
  if (user?.role === 'admin' && !hasAlmacenes) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Building2 className="h-6 w-6" />
                ¡Bienvenido a Tienda Ropa MVP!
              </CardTitle>
              <CardDescription className="text-blue-600 text-lg">
                Para comenzar a vender, necesitas configurar los datos de tu empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-gray-700">
                Configura el nombre de tu negocio y tu primer almacén para empezar a gestionar tu inventario.
              </p>
              <Link href="/empresa">
                <Button size="lg" className="gap-2">
                  Configurar mi Empresa <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border shadow-sm hover:shadow-md transition-all bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground font-medium">Total de Ítems</CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground">{items.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-sm hover:shadow-md transition-all bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground font-medium">Disponibles</CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground">
                {items.filter(item => !item.is_sold).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-sm hover:shadow-md transition-all bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground font-medium">Pendientes</CardDescription>
              <CardTitle className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                {items.filter(item => item.status === 'pendiente').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-sm hover:shadow-md transition-all bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground font-medium">Vendidos</CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground">
                {items.filter(item => item.is_sold).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 mb-6 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Filtro Estado */}
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
                <Button
                  variant={filterSold === undefined ? "default" : "ghost"}
                  onClick={() => setFilterSold(undefined)}
                  size="sm"
                  className="rounded-md"
                >
                  Todos
                </Button>
                <Button
                  variant={filterSold === false ? "default" : "ghost"}
                  onClick={() => setFilterSold(false)}
                  size="sm"
                  className="rounded-md"
                >
                  Disponibles
                </Button>
                <Button
                  variant={filterSold === 'pendiente' ? "default" : "ghost"}
                  onClick={() => setFilterSold('pendiente' as any)}
                  size="sm"
                  className="rounded-md"
                >
                  Pendientes
                </Button>
                <Button
                  variant={filterSold === true ? "default" : "ghost"}
                  onClick={() => setFilterSold(true)}
                  size="sm"
                  className="rounded-md"
                >
                  Vendidos
                </Button>
              </div>

              {/* Filtro Categoría */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro Almacén (Admin) */}
              {user?.role === 'admin' && (
                <Select value={filterAlmacen} onValueChange={setFilterAlmacen}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los almacenes</SelectItem>
                    {almacenes.map((almacen) => (
                      <SelectItem key={almacen.id} value={almacen.id.toString()}>
                        {almacen.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {(user?.role === 'admin' || user?.role === 'vendedor') && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ítem
              </Button>
            )}
          </div>
        </div>

        {/* Items Table */}
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventario</CardTitle>
                <CardDescription>
                  Gestión de ítems del inventario
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ItemsTable
                items={items}
                onItemUpdated={handleItemUpdated}
                userRole={user?.role}
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Item Dialog */}
      <CreateItemDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onItemCreated={handleItemCreated}
      />
    </div>
  );
}
