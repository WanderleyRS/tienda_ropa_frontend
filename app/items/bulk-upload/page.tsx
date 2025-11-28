'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';

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
            setMessage({ type: 'error', text: 'Error: Sesión no válida. Por favor, intenta iniciar sesión de nuevo.' });
            return;
        }

        console.log('✅ Validaciones pasadas, preparando FormData...');
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
            setRawText('');
        } else {
            const errorData = await response.json();
            console.error('❌ API Bulk Upload Error:', errorData);

            if(response.status === 401) {
            console.log('🔒 Token expirado, redirigiendo a login...');
            router.push('/login?expired=true');
            return;
        }

        setMessage({ type: 'error', text: `Error ${response.status}: ${errorData.detail || 'Fallo en la carga masiva.'}` });
    }
} catch (error) {
    console.error('💥 Network Error:', error);
    setMessage({ type: 'error', text: 'Error de red. No se pudo conectar con el servidor de la API.' });
} finally {
    console.log('🏁 Finalizando carga, setIsLoading(false)');
    setIsLoading(false);
}
};

if (isAuthLoading || !isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-2xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-lg font-semibold text-gray-700">Verificando sesión...</p>
            </div>
        </div>
    );
}

const isSubmitDisabled = isLoading || files.length === 0 || files.length !== itemBlocks.length || categoryId <= 0 || stock <= 0;

return (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-4 sm:p-8 font-sans">
            <div className="max-w-5xl mx-auto py-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900 text-center">
                    Carga Masiva de Ítems
                </h1>

                {message && (
                    <div className={`p-4 mb-8 rounded-md border ${message.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
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
                                <div className={`p-4 rounded-lg border text-center transition-colors ${files.length === itemBlocks.length && files.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="text-3xl font-bold text-gray-900">{files.length}</div>
                                    <div className="text-sm text-gray-500">Fotos</div>
                                </div>
                                <div className={`p-4 rounded-lg border text-center transition-colors ${files.length === itemBlocks.length && itemBlocks.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="text-3xl font-bold text-gray-900">{itemBlocks.length}</div>
                                    <div className="text-sm text-gray-500">Bloques de Texto</div>
                                </div>
                                {files.length !== itemBlocks.length && (
                                    <p className="text-xs text-red-600 font-medium text-center">
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
                                        <p className="text-xs text-gray-500">
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
                                            className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-mono"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category_id">Categoría</Label>
                                            <select
                                                id="category_id"
                                                value={categoryId}
                                                onChange={(e) => setCategoryId(parseInt(e.target.value) || 0)}
                                                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                            >
                                                <option value={1}>Ropa</option>
                                                <option value={2}>Accesorios</option>
                                                <option value={3}>Calzado</option>
                                                <option value={4}>Hogar</option>
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