'use client';

import { useState } from 'react';
import { agendaApi } from '@/lib/api';

interface ScheduleDeliveryModalProps {
    ventaId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ScheduleDeliveryModal({ ventaId, onClose, onSuccess }: ScheduleDeliveryModalProps) {
    const [tipoEntrega, setTipoEntrega] = useState<'Delivery' | 'Recoleccion_Tienda'>('Delivery');
    const [fechaProgramada, setFechaProgramada] = useState('');
    const [horaProgramada, setHoraProgramada] = useState('');
    const [direccionEntrega, setDireccionEntrega] = useState('');
    const [notasLogistica, setNotasLogistica] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validación
        if (tipoEntrega === 'Delivery' && !direccionEntrega.trim()) {
            setError('La dirección de entrega es obligatoria para Delivery');
            return;
        }

        setIsLoading(true);

        try {
            await agendaApi.create({
                venta_id: ventaId,
                tipo_entrega: tipoEntrega,
                fecha_programada: fechaProgramada,
                hora_programada: horaProgramada || undefined,
                direccion_entrega: tipoEntrega === 'Delivery' ? direccionEntrega : undefined,
                notas_logistica: notasLogistica || undefined,
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al programar la entrega');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4">Programar Entrega</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Tipo de Entrega */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Entrega
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="Delivery"
                                    checked={tipoEntrega === 'Delivery'}
                                    onChange={(e) => setTipoEntrega(e.target.value as 'Delivery')}
                                    className="mr-2"
                                />
                                🚚 Delivery
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="Recoleccion_Tienda"
                                    checked={tipoEntrega === 'Recoleccion_Tienda'}
                                    onChange={(e) => setTipoEntrega(e.target.value as 'Recoleccion_Tienda')}
                                    className="mr-2"
                                />
                                🏪 Recolección en Tienda
                            </label>
                        </div>
                    </div>

                    {/* Fecha Programada */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Programada *
                        </label>
                        <input
                            type="date"
                            value={fechaProgramada}
                            onChange={(e) => setFechaProgramada(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Hora Programada */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hora Programada (Opcional)
                        </label>
                        <input
                            type="time"
                            value={horaProgramada}
                            onChange={(e) => setHoraProgramada(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Dirección de Entrega (condicional) */}
                    {tipoEntrega === 'Delivery' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección de Entrega *
                            </label>
                            <textarea
                                value={direccionEntrega}
                                onChange={(e) => setDireccionEntrega(e.target.value)}
                                required
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ingrese la dirección completa..."
                            />
                        </div>
                    )}

                    {/* Notas de Logística */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas de Logística (Opcional)
                        </label>
                        <textarea
                            value={notasLogistica}
                            onChange={(e) => setNotasLogistica(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Instrucciones adicionales..."
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Programando...' : 'Programar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
