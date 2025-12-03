import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadApi } from '@/lib/api';
import { toast } from 'sonner';

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    maxSize?: number; // in pixels
    aspectRatio?: number; // width/height
    label?: string;
}

export function ImageUploader({ value, onChange, maxSize = 128, aspectRatio = 1, label = "Subir Imagen" }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resizeImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    // Calculate dimensions
                    let width = img.width;
                    let height = img.height;

                    // Resize to maxSize while maintaining aspect ratio
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert canvas to blob
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Could not convert canvas to blob'));
                            return;
                        }
                        const resizedFile = new File([blob], file.name, {
                            type: 'image/png',
                            lastModified: Date.now(),
                        });
                        resolve(resizedFile);
                    }, 'image/png');
                };
                img.onerror = () => reject(new Error('Could not load image'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Could not read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida');
            return;
        }

        setIsUploading(true);
        try {
            // Resize image
            const resizedFile = await resizeImage(file);

            // Upload to server
            const formData = new FormData();
            formData.append('file', resizedFile);
            const response = await uploadApi.uploadImage(resizedFile);

            onChange(response.url);
            toast.success('Imagen subida correctamente');
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error(error.message || 'Error al subir la imagen');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleRemove = () => {
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative inline-block">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-32 h-32 object-contain rounded-lg border border-border bg-white p-2"
                        onError={(e) => {
                            console.error('Error loading image:', value);
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                        }}
                        onLoad={() => console.log('Image loaded successfully:', value)}
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemove}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/20'
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                    <div className="flex flex-col items-center gap-2">
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                <p className="text-sm text-muted-foreground">Subiendo...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground">
                                    Arrastra una imagen o haz clic para seleccionar
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Se redimensionará automáticamente a {maxSize}x{maxSize}px
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
