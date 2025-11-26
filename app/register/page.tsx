'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const registerSchema = z.object({
    username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, authLoading, router]);

    if (authLoading || isAuthenticated) {
        return null;
    }

    const onSubmit = async (data: RegisterFormValues) => {
        setError(null);
        setIsLoading(true);
        try {
            await authApi.register(data.username, data.password);
            toast.success('Cuenta creada exitosamente. Por favor inicia sesión.');
            router.push('/login?registered=true');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(
                err.response?.data?.detail ||
                'Error al registrarse. Intenta con otro nombre de usuario.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border shadow-lg">
                <CardHeader className="space-y-1 text-center pb-8">
                    <div className="mx-auto bg-primary/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                        <span className="text-3xl">✨</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-foreground">
                        Crear Cuenta Admin
                    </CardTitle>
                    <CardDescription className="text-base">
                        Regístrate para administrar tu tienda
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username">Usuario</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="admin"
                                {...register('username')}
                                disabled={isLoading}
                                className="h-11 bg-background/50"
                            />
                            {errors.username && (
                                <p className="text-sm text-destructive font-medium">{errors.username.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password')}
                                disabled={isLoading}
                                className="h-11 bg-background/50"
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                {...register('confirmPassword')}
                                disabled={isLoading}
                                className="h-11 bg-background/50"
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg font-medium">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
                            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                        </Button>

                        <div className="text-center text-sm mt-6">
                            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                            <Link href="/login" className="text-primary hover:underline font-semibold">
                                Inicia sesión
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
