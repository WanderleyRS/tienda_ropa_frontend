'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserPlus, Users } from 'lucide-react';

export default function UsersManagementPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'vendedor'>('vendedor');
    const [selectedAlmacenes, setSelectedAlmacenes] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize selectedAlmacenes when user loads
    // Default to all available almacenes for convenience
    if (user?.almacenes && selectedAlmacenes.length === 0 && !isSubmitting) {
        // Optional: pre-select all? Or none? Let's pre-select all for now as it's common
        // setSelectedAlmacenes(user.almacenes.map(a => a.id));
    }

    const toggleAlmacen = (id: number) => {
        setSelectedAlmacenes(prev =>
            prev.includes(id)
                ? prev.filter(aid => aid !== id)
                : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        if (role !== 'admin' && selectedAlmacenes.length === 0) {
            toast.error('Debes asignar al menos un almacén al usuario vendedor');
            return;
        }

        setIsSubmitting(true);
        try {
            await authApi.createUserByAdmin(username, password, role, selectedAlmacenes);
            toast.success(`Usuario ${username} creado exitosamente como ${role}`);

            // Limpiar formulario
            setUsername('');
            setPassword('');
            setRole('vendedor');
            setSelectedAlmacenes([]);
        } catch (error: any) {
            console.error('Error al crear usuario:', error);
            toast.error(error.response?.data?.detail || 'Error al crear usuario');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Crea usuarios vendedores para tu empresa: <span className="font-semibold">{user?.empresa_nombre}</span>
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Crear Nuevo Usuario
                        </CardTitle>
                        <CardDescription>
                            Los usuarios creados aquí pertenecerán a tu empresa y solo verán los datos de tu negocio
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Nombre de usuario</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="vendedor1"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Rol</Label>
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'admin' | 'vendedor')}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="vendedor">Vendedor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Asignar Almacenes</Label>
                                <div className="border rounded-md p-3 space-y-2 bg-white">
                                    {user?.almacenes && user.almacenes.length > 0 ? (
                                        user.almacenes.map((almacen) => (
                                            <div key={almacen.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`almacen-${almacen.id}`}
                                                    checked={selectedAlmacenes.includes(almacen.id)}
                                                    onChange={() => toggleAlmacen(almacen.id)}
                                                    disabled={isSubmitting}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`almacen-${almacen.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                                    {almacen.nombre}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No tienes almacenes asignados para compartir.</p>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    El usuario solo podrá ver y gestionar items de los almacenes seleccionados.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información importante</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Los usuarios creados solo verán los datos de tu empresa</li>
                        <li>• Los vendedores pueden crear y editar items</li>
                        <li>• Los administradores pueden además crear usuarios y eliminar items</li>
                        <li>• Cada empresa tiene sus propios usuarios e items completamente aislados</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
