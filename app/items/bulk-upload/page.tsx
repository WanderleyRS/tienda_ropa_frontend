'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import apiClient from '@/lib/api';

export default function BulkUploadPage() {
    const router = useRouter();
    const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isAuthLoading, router]);

    const [files, setFiles] = useState<File[]>([]);
    const [rawText, setRawText] = useState('');
    const [categoryId, setCategoryId] = useState(1);
    const [stock, setStock] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Lógica para dividir el texto y contar los bloques
    const itemBlocks = useMemo(() => {
        const CHAT_LINE_START_REGEX = /^\s*\[.*?\]\s*[^:]+?:/gim;

        if (!rawText.trim()) return [];

        const normalizedText = rawText
            .replace(/\r\n/g, '\n')
            .replace(/[\u200B\u202F\u00A0]/g, ' ')
            .trim();

        const separatedText = normalizedText.replace(
            CHAT_LINE_START_REGEX,
            '|||SEPARATOR|||$&'
        );

        const blocks = separatedText.split('|||SEPARATOR|||')
            .map(block => block.trim())
            .filter(block => block.length > 0);

        return blocks;
    }, [rawText]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRawText(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 INICIO DE CARGA MASIVA');
        console.log('📊 Files:', files.length, 'Bloques:', itemBlocks.length);

        if (files.length !== itemBlocks.length) {
            console.log('❌ Error: Discrepancia en cantidad');
            setMessage({ type: 'error', text: `Error: El número de fotos (${files.length}) y bloques de texto (${itemBlocks.length}) debe coincidir.` });
            return;
        }

        if (categoryId <= 0 || stock <= 0) {
            console.log('❌ Error: Categoría o stock inválidos');
            setMessage({ type: 'error', text: 'Error: La Categoría ID y el Stock deben ser números enteros positivos.' });
            return;
        }

        if (!token) {
            console.log('❌ Error: No hay token');
            setMessage({ type: 'error', text: 'Error: No estás autenticado.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();

            // Append files
            files.forEach((file) => {
                formData.append('files', file);
            });

            // Append other fields
            formData.append('category_id', categoryId.toString());
            formData.append('raw_text_block', rawText);
            formData.append('stock', stock.toString());

            // Send request using apiClient
            const response = await apiClient.post('/items/bulk-upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ Carga exitosa:', response.data);
            setMessage({ type: 'success', text: `¡Éxito! Se han cargado ${response.data.length} ítems correctamente.` });

            // Optional: Clear form or redirect
            // setFiles([]);
            // setRawText('');
            // setTimeout(() => router.push('/items'), 2000);

        } catch (error: any) {
            console.error('❌ Error en carga masiva:', error);
            const errorMsg = error.response?.data?.detail || error.message || 'Error al cargar los ítems. Inténtalo de nuevo.';
            setMessage({
                type: 'error',
                text: errorMsg
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-card rounded-xl shadow-2xl border border-border">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold text-foreground">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    const isSubmitDisabled = isLoading || files.length === 0 || files.length !== itemBlocks.length || categoryId <= 0 || stock <= 0;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="p-4 sm:p-8 font-sans">
                <div className="max-w-5xl mx-auto py-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground text-center">
                        Carga Masiva de Ítems
                    </h1>

                    {message && (
                        <div className={`p-4 mb-8 rounded-md border ${message.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-destructive/10 border-destructive/20 text-destructive'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar / Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Estado de Carga</CardTitle>
                                    <CardDescription>Verifica la correlación</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className={`p-4 rounded-lg border text-center transition-colors ${files.length === itemBlocks.length && files.length > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-secondary/50 border-border'}`}>
                                        <div className="text-3xl font-bold text-foreground">{files.length}</div>
                                        <div className="text-sm text-muted-foreground">Fotos</div>
                                    </div>
                                    <div className={`p-4 rounded-lg border text-center transition-colors ${files.length === itemBlocks.length && itemBlocks.length > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-secondary/50 border-border'}`}>
                                        <div className="text-3xl font-bold text-foreground">{itemBlocks.length}</div>
                                        <div className="text-sm text-muted-foreground">Bloques de Texto</div>
                                    </div>
                                    {files.length !== itemBlocks.length && (
                                        <p className="text-xs text-destructive font-medium text-center">
                                            Las cantidades deben coincidir
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Form */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardContent className="p-6 space-y-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="files">1. Fotos de los Ítems</Label>
                                            <Input
                                                id="files"
                                                type="file"
                                                multiple
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="cursor-pointer"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Selecciona las imágenes en orden.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="raw_text">2. Bloque de Descripciones</Label>
                                            <textarea
                                                id="raw_text"
                                                rows={10}
                                                value={rawText}
                                                onChange={handleTextChange}
                                                placeholder="Pega aquí el texto del chat..."
                                                className="w-full p-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm font-mono bg-transparent text-foreground placeholder:text-muted-foreground"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="category_id">Categoría</Label>
                                                <select
                                                    id="category_id"
                                                    value={categoryId}
                                                    onChange={(e) => setCategoryId(parseInt(e.target.value) || 0)}
                                                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-transparent text-foreground"
                                                >
                                                    <option value={1} className="bg-popover text-popover-foreground">Ropa</option>
                                                    <option value={2} className="bg-popover text-popover-foreground">Accesorios</option>
                                                    <option value={3} className="bg-popover text-popover-foreground">Calzado</option>
                                                    <option value={4} className="bg-popover text-popover-foreground">Hogar</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="stock">Stock Inicial</Label>
                                                <Input
                                                    id="stock"
                                                    type="number"
                                                    value={stock}
                                                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                                                    min="1"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitDisabled}
                                            className="w-full"
                                        >
                                            {isLoading ? 'Procesando...' : 'Cargar Ítems'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}