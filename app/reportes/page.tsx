'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportesApi, ResumenEjecutivo, EstadoResultados, MetricasInventario, TopProducto } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    Calendar as CalendarIcon, DollarSign, TrendingUp, Package, ShoppingBag,
    AlertCircle, ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    const [selectedAlmacen, setSelectedAlmacen] = useState<string>('all');

    // Data states
    const [resumen, setResumen] = useState<ResumenEjecutivo | null>(null);
    const [estadoResultados, setEstadoResultados] = useState<EstadoResultados | null>(null);
    const [metricasInventario, setMetricasInventario] = useState<MetricasInventario | null>(null);
    const [topProductos, setTopProductos] = useState<TopProducto[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user) {
            loadData();
        }
    }, [isAuthenticated, user, dateRange, selectedAlmacen]);

    const loadData = async () => {
        setLoading(true);
        try {
            const almacenId = selectedAlmacen === 'all' ? undefined : parseInt(selectedAlmacen);
            const fechaInicio = format(dateRange.from, 'yyyy-MM-dd');
            const fechaFin = format(dateRange.to, 'yyyy-MM-dd');

            const [resumenData, estadoData, inventarioData, topData] = await Promise.all([
                reportesApi.getResumenEjecutivo(fechaInicio, fechaFin, almacenId),
                reportesApi.getEstadoResultados(fechaInicio, fechaFin, almacenId),
                reportesApi.getMetricasInventario(almacenId),
                reportesApi.getTopProductos(5, almacenId)
            ]);

            setResumen(resumenData);
            setEstadoResultados(estadoData);
            setMetricasInventario(inventarioData);
            setTopProductos(topData.top_productos_rentables);
        } catch (error) {
            console.error('Error loading reports:', error);
            toast.error('Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || !user) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(value);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Reportes Financieros</h1>
                        <p className="text-muted-foreground">
                            Análisis detallado de utilidades, ventas e inventario
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Filtro de Almacén */}
                        <Select value={selectedAlmacen} onValueChange={setSelectedAlmacen}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Todos los almacenes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los almacenes</SelectItem>
                                {user.almacenes?.map(a => (
                                    <SelectItem key={a.id} value={a.id.toString()}>
                                        {a.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Filtro de Fecha */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                                            </>
                                        ) : (
                                            format(dateRange.from, 'dd/MM/yyyy')
                                        )
                                    ) : (
                                        <span>Seleccionar fechas</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from}
                                    selected={dateRange}
                                    onSelect={(range: any) => range && setDateRange(range)}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <Tabs defaultValue="resumen" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="resumen">Resumen Ejecutivo</TabsTrigger>
                        <TabsTrigger value="resultados">Estado de Resultados</TabsTrigger>
                        <TabsTrigger value="inventario">Inventario</TabsTrigger>
                    </TabsList>

                    {/* TAB: RESUMEN EJECUTIVO */}
                    <TabsContent value="resumen" className="space-y-6">
                        {/* KPIs Principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {resumen ? formatCurrency(resumen.ventas.ingresos_totales) : '...'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {resumen?.ventas.total_ventas} ventas realizadas
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Utilidad Bruta</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {resumen ? formatCurrency(resumen.utilidad.utilidad_bruta) : '...'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Margen: {resumen?.utilidad.margen_bruto_porcentaje}%
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {resumen ? formatCurrency(resumen.ventas.ticket_promedio) : '...'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Por venta realizada
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {resumen ? formatCurrency(resumen.inventario.valor_inventario) : '...'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {resumen?.inventario.items_en_stock} items en stock
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gráficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Productos Rentables */}
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Top 5 Productos Más Rentables</CardTitle>
                                    <CardDescription>Productos con mayor ganancia neta</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topProductos} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="title" type="category" width={100} fontSize={12} />
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            <Bar dataKey="ganancia" fill="#10b981" radius={[0, 4, 4, 0]} name="Ganancia" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Distribución de Costos vs Utilidad */}
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>Ingresos vs Costos</CardTitle>
                                    <CardDescription>Desglose de rentabilidad</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px] flex justify-center">
                                    {resumen && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Costo Ventas', value: resumen.costos.costo_ventas },
                                                        { name: 'Utilidad Bruta', value: resumen.utilidad.utilidad_bruta }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#ef4444" /> {/* Costo - Rojo */}
                                                    <Cell fill="#10b981" /> {/* Utilidad - Verde */}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB: ESTADO DE RESULTADOS */}
                    <TabsContent value="resultados">
                        <Card>
                            <CardHeader>
                                <CardTitle>Estado de Resultados</CardTitle>
                                <CardDescription>
                                    Del {format(dateRange.from, 'dd/MM/yyyy')} al {format(dateRange.to, 'dd/MM/yyyy')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {estadoResultados && (
                                    <div className="space-y-4 max-w-3xl mx-auto">
                                        {/* Ingresos */}
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-lg">INGRESOS</h3>
                                            <div className="flex justify-between pl-4">
                                                <span>Ventas Totales</span>
                                                <span>{formatCurrency(estadoResultados.ingresos.ventas)}</span>
                                            </div>
                                            <div className="flex justify-between pl-4 font-medium border-t pt-2">
                                                <span>Total Ingresos</span>
                                                <span>{formatCurrency(estadoResultados.ingresos.total_ingresos)}</span>
                                            </div>
                                        </div>

                                        {/* Costos */}
                                        <div className="space-y-2 pt-4">
                                            <h3 className="font-semibold text-lg">COSTOS</h3>
                                            <div className="flex justify-between pl-4">
                                                <span>Costo de Mercancía Vendida</span>
                                                <span className="text-red-500">-{formatCurrency(estadoResultados.costos.costo_mercancia_vendida)}</span>
                                            </div>
                                        </div>

                                        {/* Utilidad Bruta */}
                                        <div className="bg-muted/50 p-4 rounded-lg mt-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-bold text-xl">UTILIDAD BRUTA</h3>
                                                    <span className="text-sm text-muted-foreground">
                                                        Margen: {estadoResultados.utilidad_bruta.margen_porcentaje}%
                                                    </span>
                                                </div>
                                                <span className="text-xl font-bold text-green-600">
                                                    {formatCurrency(estadoResultados.utilidad_bruta.monto)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Gastos Operativos */}
                                        <div className="space-y-2 pt-4">
                                            <h3 className="font-semibold text-lg">GASTOS OPERATIVOS</h3>
                                            <div className="flex justify-between pl-4 text-muted-foreground">
                                                <span>(Sin gastos registrados)</span>
                                                <span>{formatCurrency(0)}</span>
                                            </div>
                                        </div>

                                        {/* Utilidad Neta */}
                                        <div className="bg-primary/10 p-6 rounded-lg mt-6 border border-primary/20">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-bold text-2xl text-primary">UTILIDAD NETA</h3>
                                                    <span className="text-sm text-muted-foreground">
                                                        Margen Neto: {estadoResultados.utilidad_neta.margen_porcentaje}%
                                                    </span>
                                                </div>
                                                <span className="text-2xl font-bold text-primary">
                                                    {formatCurrency(estadoResultados.utilidad_neta.monto)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: INVENTARIO */}
                    <TabsContent value="inventario">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Valor del Inventario</CardTitle>
                                    <CardDescription>Costo vs Venta Potencial</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-sm text-muted-foreground">Costo Total (Inversión)</span>
                                            <div className="text-2xl font-bold">
                                                {metricasInventario ? formatCurrency(metricasInventario.valores.valor_inventario_costo) : '...'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted-foreground">Venta Potencial</span>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {metricasInventario ? formatCurrency(metricasInventario.valores.valor_potencial_venta) : '...'}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <span className="text-sm text-muted-foreground">Ganancia Potencial</span>
                                            <div className="text-xl font-bold text-green-600">
                                                +{metricasInventario ? formatCurrency(metricasInventario.valores.ganancia_potencial) : '...'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Rotación</CardTitle>
                                    <CardDescription>Eficiencia de inventario</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                                                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {metricasInventario?.rotacion.rotacion_inventario}x
                                                </div>
                                                <p className="text-sm text-muted-foreground">Rotación anual</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                                                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {metricasInventario?.rotacion.dias_promedio_venta} días
                                                </div>
                                                <p className="text-sm text-muted-foreground">Promedio para vender</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Alertas</CardTitle>
                                    <CardDescription>Atención requerida</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                <span>Bajo Stock (≤1)</span>
                                            </div>
                                            <span className="font-bold text-yellow-700">
                                                {metricasInventario?.alertas.items_bajo_stock} items
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                <span>Sin Precio Compra</span>
                                            </div>
                                            <span className="font-bold text-red-700">
                                                {metricasInventario?.alertas.items_sin_precio_compra} items
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

// Icono Clock faltante
function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
