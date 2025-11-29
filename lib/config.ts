export const PROD_API_URL = 'https://tiendaropabackend-production.up.railway.app';

export const getApiUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv === 'development') {
        return envUrl || 'http://localhost:8000';
    }

    // 2. Si estamos en producción (Vercel)
    // Si no hay variable, o si la variable es "localhost" (error común), forzamos la de producción
    if (!envUrl || envUrl.includes('localhost')) {
        return PROD_API_URL;
    }

    return envUrl;
};

export const API_BASE_URL = getApiUrl();
