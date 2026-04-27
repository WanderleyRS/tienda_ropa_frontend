'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { companiesApi, Empresa } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function TenantSwitcher() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [activeEmpresaId, setActiveEmpresaId] = useState<string>('');

  useEffect(() => {
    if (user?.role === 'super_admin') {
      const fetchCompanies = async () => {
        try {
          const data = await companiesApi.getAll();
          setCompanies(data);
        } catch (error) {
          console.error('Error fetching companies:', error);
          toast.error('No se pudieron cargar las empresas');
        }
      };
      fetchCompanies();

      const storedId = localStorage.getItem('active_empresa_id');
      if (storedId) {
        setActiveEmpresaId(storedId);
      }
    }
  }, [user]);

  const handleValueChange = (value: string) => {
    setActiveEmpresaId(value);
    localStorage.setItem('active_empresa_id', value);
    toast.success('Empresa cambiada exitosamente');
    // Forzamos un refresco completo para que todos los contextos se actualicen con el nuevo empresa_id
    window.location.reload();
  };

  if (user?.role !== 'super_admin') return null;

  return (
    <div className="flex items-center gap-2">
      <Select value={activeEmpresaId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px] bg-background/50 border-primary/20 hover:bg-background transition-colors">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Seleccionar Empresa" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {companies.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground text-center">Cargando empresas...</div>
          ) : (
            companies.map((company) => (
              <SelectItem key={company.id} value={company.id.toString()}>
                {company.nombre}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
