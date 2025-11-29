import axios from 'axios';

// Base URL for the API
import { API_BASE_URL } from '@/lib/config';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – add JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 API request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          hasToken: !!token,
        });
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle auth errors and network issues
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    }
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network error – verify backend is running', { API_BASE_URL });
    }
    return Promise.reject(error);
  }
);

// ---------- Type definitions ----------
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Almacen {
  id: number;
  nombre: string;
  empresa_id: number;
  activo: boolean;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'vendedor';
  almacenes?: Almacen[];
  empresa_id?: number;
  empresa_nombre?: string;
}

export interface Item {
  id: number;
  local_id?: number;
  title: string;
  description: string | null;
  price: number | null;
  stock: number;
  photo_url: string;
  category_id: number | null;
  is_sold: boolean;
  almacen_id: number;
  almacen_nombre?: string;
}

export interface ItemCreate {
  title: string;
  description?: string;
  price?: number;
  stock?: number;
  photo_url: string;
  category_id?: number;
}

export interface ItemUpdate {
  title?: string;
  description?: string;
  price?: number;
  stock?: number;
  photo_url?: string;
  category_id?: number;
  is_sold?: boolean;
}

export interface EmpresaCreate {
  nombre: string;
  whatsapp_numero?: string;
  nombre_almacen_inicial?: string;
}

export interface Empresa {
  id: number;
  nombre: string;
  whatsapp_numero?: string;
  fecha_registro: string;
  activa: boolean;
}

export interface AlmacenCreate {
  nombre: string;
}

export interface AlmacenUpdate {
  nombre?: string;
  activo?: boolean;
}

// ---------- API objects ----------
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const url = `${API_BASE_URL}/auth/token`;
    try {
      const response = await axios.post<LoginResponse>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        transformRequest: [(data) => data],
      });
      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid response from server: missing token');
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        status: error.response?.status,
        url,
      });
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(`Connection error – ensure backend is running at ${API_BASE_URL}`);
      } else if (error.response?.status === 401) {
        throw new Error('Incorrect credentials');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid form data');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },

  register: async (username: string, password: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', { username, password });
    return response.data;
  },

  createUserByAdmin: async (
    username: string,
    password: string,
    role: 'admin' | 'vendedor',
    almacen_ids: number[]
  ): Promise<User> => {
    const token = localStorage.getItem('auth_token');
    const response = await apiClient.post<User>(
      '/auth/users/create',
      { username, password, role, almacen_ids },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Alias for getCurrentUser (used by AuthContext)
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

export const companiesApi = {
  setup: async (data: EmpresaCreate): Promise<any> => {
    const response = await apiClient.post<any>('/companies/setup', data);
    return response.data;
  },
  getEmpresa: async (): Promise<Empresa> => {
    const response = await apiClient.get<Empresa>('/companies/empresa');
    return response.data;
  },
  updateEmpresa: async (data: EmpresaCreate): Promise<Empresa> => {
    const response = await apiClient.put<Empresa>('/companies/empresa', data);
    return response.data;
  },
  getAlmacenes: async (): Promise<Almacen[]> => {
    const response = await apiClient.get<Almacen[]>('/companies/almacenes');
    return response.data;
  },
  createAlmacen: async (data: AlmacenCreate): Promise<Almacen> => {
    const response = await apiClient.post<Almacen>('/companies/almacenes', data);
    return response.data;
  },
  updateAlmacen: async (id: number, data: AlmacenUpdate): Promise<Almacen> => {
    const response = await apiClient.put<Almacen>(`/companies/almacenes/${id}`, data);
    return response.data;
  },
};

export const itemsApi = {
  getAll: async (params?: { skip?: number; limit?: number; is_sold?: boolean; category_id?: number; search?: string }): Promise<Item[]> => {
    try {
      const response = await apiClient.get<Item[]>('/items/', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching items:', error);
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(`Cannot connect to backend at ${API_BASE_URL}`);
      }
      throw error;
    }
  },
  getById: async (id: number): Promise<Item> => {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  },
  create: async (item: ItemCreate): Promise<Item> => {
    const response = await apiClient.post<Item>('/items/', item);
    return response.data;
  },
  update: async (id: number, item: ItemUpdate): Promise<Item> => {
    const response = await apiClient.put<Item>(`/items/${id}`, item);
    return response.data;
  },
  updateStock: async (id: number, stock: number): Promise<Item> => {
    const response = await apiClient.patch<Item>(`/items/${id}/stock`, null, { params: { stock } });
    return response.data;
  },
  updatePrice: async (id: number, price: number): Promise<Item> => {
    const response = await apiClient.patch<Item>(`/items/${id}/price`, null, { params: { price } });
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },
};

// API para Clientes Potenciales (Leads)
export interface PotencialClienteCreate {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  celular: string;
}

export interface PotencialCliente {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  celular: string;
  empresa_id: number;
  estado: 'PENDIENTE' | 'CONVERTIDO';
  fecha_insercion: string;
}

export const clientesApi = {
  crearPotencial: async (data: PotencialClienteCreate): Promise<PotencialCliente> => {
    const response = await apiClient.post<PotencialCliente>('/clientes/potencial', data);
    return response.data;
  },

  listarPendientes: async (): Promise<PotencialCliente[]> => {
    const response = await apiClient.get<PotencialCliente[]>('/clientes/potencial/dashboard');
    return response.data;
  },

  listarTodos: async (): Promise<PotencialCliente[]> => {
    const response = await apiClient.get<PotencialCliente[]>('/clientes/todos');
    return response.data;
  },

  convertir: async (clienteId: number, itemId: number): Promise<PotencialCliente> => {
    const response = await apiClient.put<PotencialCliente>(`/clientes/potencial/${clienteId}/convertir`, {
      item_id: itemId
    });
    return response.data;
  },
};

export interface DetalleVenta {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface DetalleVentaCreate {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface AbonoCreate {
  monto_abonado: number;
  metodo_pago: string;
}

export interface Abono {
  id: number;
  monto_abonado: number;
  fecha_abono: string;
  metodo_pago: string;
}

export interface Agenda {
  id: number;
  venta_id: number;
  cliente_id: number;
  almacen_id: number;
  empresa_id: number;
  tipo_entrega: 'Delivery' | 'Recoleccion_Tienda';
  fecha_programada: string;
  hora_programada?: string;
  direccion_entrega?: string;
  notas_logistica?: string;
  estado_entrega: string;
  created_at: string;
}

export interface Venta {
  id: number;
  cliente_id?: number;
  almacen_id: number;
  empresa_id: number;
  fecha_venta: string;
  monto_total: number;
  estado_pago: string;
  metodo_pago?: string;
  cliente?: PotencialCliente;
  detalles: DetalleVenta[];
  abonos: Abono[];
  agenda?: Agenda;
}
export interface VentaCreate {
  cliente_id?: number;
  detalles: DetalleVentaCreate[];
  abono_inicial?: AbonoCreate;
  metodo_pago?: string;
}

export const agendaApi = {
  create: async (data: {
    venta_id: number;
    tipo_entrega: string;
    fecha_programada: string;
    hora_programada?: string;
    direccion_entrega?: string;
    notas_logistica?: string;
  }) => {
    const response = await apiClient.post<Agenda>('/agenda/', data);
    return response.data;
  },

  list: async (filters?: { fecha?: string; tipo?: string; estado?: string }) => {
    const response = await apiClient.get<Agenda[]>('/agenda/', { params: filters });
    return response.data;
  },

  complete: async (id: number) => {
    const response = await apiClient.put<Agenda>(`/agenda/${id}/completar`);
    return response.data;
  },
};

export default apiClient;
