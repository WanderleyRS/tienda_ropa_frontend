'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API_BASE_URL } from '@/lib/config';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
    username: z.string().min(1, 'El nombre de usuario es requerido'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setError(null);
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
                username: data.username,
            });
            setIsSubmitted(true);
        } catch (err: any) {
            // Even if it fails, we might want to show success to prevent user enumeration, 
            // but for this MVP we can show the error if it's a connection error.
            // The backend returns 200 even if user doesn't exist (security best practice),
            // so this catch block is mostly for network errors.
            setError('Hubo un problema al procesar tu solicitud. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center mb-2">
                        <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        Recuperar Contraseña
                    </CardTitle>
                    <CardDescription className="text-center">
                        Ingresa tu usuario para recibir instrucciones
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSubmitted ? (
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                                <p>Si el usuario existe, se han enviado las instrucciones a tu correo (simulado).</p>
                                <p className="text-xs mt-2 text-gray-500">(Revisa la consola del backend para ver el token)</p>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/login">Volver al inicio de sesión</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Nombre de usuario</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="usuario"
                                    {...register('username')}
                                    disabled={isLoading}
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-500">{errors.username.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
