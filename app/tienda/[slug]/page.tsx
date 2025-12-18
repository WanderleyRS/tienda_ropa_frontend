import { Metadata, ResolvingMetadata } from 'next';
import TiendaSlugPage from './TiendaClient';
import { companiesApi } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';

type Props = {
    params: { slug: string }
};

// Generar metadata dinámicamente
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = params.slug;

    // Fetch data using fetch API as this is server side and we want to avoid issues with axios instance if it depends on browser APIs
    // However, if we can reuse the logic, even better. For public endpoints, simple fetch is robust.
    try {
        const response = await fetch(`${API_BASE_URL}/companies/public/slug/${slug}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!response.ok) {
            return {
                title: 'Tienda no encontrada',
            };
        }

        const empresa = await response.json();
        const title = empresa.store_title_1 ? `${empresa.store_title_1} | Tienda` : empresa.nombre;
        const description = empresa.store_subtitle || `Visita la tienda online de ${empresa.nombre}.`;

        return {
            title: title || 'Tienda Ropa MVP',
            description: description,
            openGraph: {
                title: title,
                description: description,
                images: empresa.navbar_icon_url ? [empresa.navbar_icon_url] : [],
                type: 'website',
            },
            icons: {
                icon: empresa.navbar_icon_url || '/favicon.ico',
            }
        };

    } catch (error) {
        console.error("Error generating metadata", error);
        return {
            title: 'Tienda Ropa MVP',
        };
    }
}

export default function Page({ params }: Props) {
    return <TiendaSlugPage slug={params.slug} />;
}
