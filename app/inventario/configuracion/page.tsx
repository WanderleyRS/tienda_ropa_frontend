'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, FolderTree, Tag } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    classificationsApi,
    categoriesApi,
    Classification,
    Category,
    ClassificationCreate
} from '@/lib/api';

export default function InventoryConfigPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración de Inventario</h1>
                        <p className="text-muted-foreground mt-2">Gestiona las clasificaciones y categorías de tus productos.</p>
                    </div>

                    <ClassificationManager />
                </div>
            </div>
        </ProtectedRoute>
    );
}

function ClassificationManager() {
    const [classifications, setClassifications] = useState<Classification[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedClassification, setSelectedClassification] = useState<Classification | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // const { toast } = useToast(); // Using sonner directly

    // Load Data
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [classData, catData] = await Promise.all([
                classificationsApi.list(),
                categoriesApi.getAll()
            ]);
            setClassifications(classData);
            setCategories(catData);

            // Select first classification by default if none selected
            if (!selectedClassification && classData.length > 0) {
                setSelectedClassification(classData[0]);
            }
        } catch (error) {
            toast.error("Error al cargar datos", {
                description: "No se pudieron obtener las clasificaciones."
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter categories for the selected classification
    const filteredCategories = selectedClassification
        ? categories.filter(c => c.classification_id === selectedClassification.id)
        : [];

    // --- Handlers ---
    const handleCreateClassification = async (name: string, desc: string) => {
        try {
            await classificationsApi.create({ nombre: name, descripcion: desc });
            toast.success("Clasificación creada exitosamente");
            loadData();
        } catch (error) {
            toast.error("Error al crear", { description: "Verifica que el nombre no exista." });
        }
    };

    const handleDeleteClassification = async (id: number) => {
        if (!confirm("¿Estás seguro? Esto podría afectar a las categorías vinculadas.")) return;
        try {
            await classificationsApi.delete(id);
            toast.success("Clasificación eliminada");
            if (selectedClassification?.id === id) setSelectedClassification(null);
            loadData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleCreateCategory = async (name: string) => {
        if (!selectedClassification) return;
        try {
            await categoriesApi.create({
                name,
                classification_id: selectedClassification.id
            });
            toast.success("Categoría creada exitosamente");
            loadData();
        } catch (error) {
            toast.error("Error al crear categoría", { description: "Verifica duplicados." });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Sidebar: Classifications */}
            <Card className="md:col-span-4 h-fit sticky top-6">
                <CardHeader className="bg-primary/5 rounded-t-xl pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FolderTree className="h-5 w-5 text-primary" />
                                Clasificaciones
                            </CardTitle>
                            <CardDescription>Grupos principales</CardDescription>
                        </div>
                        <CreateClassificationDialog onCreate={handleCreateClassification} />
                    </div>
                </CardHeader>
                <CardContent className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
                    ) : classifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg m-2">
                            <p className="text-sm">No hay clasificaciones</p>
                        </div>
                    ) : (
                        classifications.map((cls) => (
                            <div
                                key={cls.id}
                                onClick={() => setSelectedClassification(cls)}
                                className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${selectedClassification?.id === cls.id
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "hover:bg-muted text-foreground"
                                    }`}
                            >
                                <div className="font-medium truncate">{cls.nombre}</div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 ${selectedClassification?.id === cls.id ? "text-primary-foreground hover:bg-white/20" : "text-muted-foreground hover:text-destructive"}`}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClassification(cls.id); }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Main: Categories */}
            <Card className="md:col-span-8 bg-card shadow-sm border-border">
                <CardHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Tag className="h-5 w-5 text-blue-600" />
                                {selectedClassification ? `Categorías de "${selectedClassification.nombre}"` : "Selecciona una clasificación"}
                            </CardTitle>
                            {selectedClassification?.descripcion && (
                                <CardDescription>{selectedClassification.descripcion}</CardDescription>
                            )}
                        </div>
                        {selectedClassification && (
                            <CreateCategoryDialog
                                onCreate={handleCreateCategory}
                                classificationName={selectedClassification.nombre}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {!selectedClassification ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FolderTree className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg">Selecciona una clasificación para ver sus categorías.</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
                            <p className="text-sm text-muted-foreground mb-2">Esta clasificación no tiene categorías aún.</p>
                            <CreateCategoryDialog
                                onCreate={handleCreateCategory}
                                classificationName={selectedClassification.nombre}
                                trigger={<Button variant="outline">Crear primera categoría</Button>}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCategories.map((cat) => (
                                <div key={cat.id} className="group relative bg-card border border-border rounded-lg p-4 transition-all hover:shadow-md hover:border-primary">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-foreground">{cat.name}</span>
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">ID: {cat.id}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// --- Helper Dialogs ---

function CreateClassificationDialog({ onCreate }: { onCreate: (name: string, desc: string) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        onCreate(name, desc);
        setOpen(false);
        setName("");
        setDesc("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="shadow-sm">
                    <Plus className="h-4 w-4 mr-1" /> Nueva
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nueva Clasificación</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input placeholder="Ej: Ropa Americana" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Descripción (Opcional)</Label>
                        <Input placeholder="Ej: Importada de USA de primera calidad" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Crear Clasificación</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateCategoryDialog({ onCreate, classificationName, trigger }: { onCreate: (name: string) => void, classificationName: string, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        onCreate(name);
        setOpen(false);
        setName("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-1" /> Agregar Categoría
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nueva Categoría en {classificationName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nombre de la Categoría</Label>
                        <Input placeholder="Ej: Camisas, Pantalones..." value={name} onChange={e => setName(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Guardar Categoría</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
