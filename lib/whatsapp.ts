import { CartItem } from '@/contexts/CartContext';
import { API_BASE_URL } from '@/lib/config';

// WhatsApp phone number for orders (Bolivia)
const WHATSAPP_PHONE = '59163411905';

/**
 * Builds a formatted WhatsApp message with order details 
 * Note: For image previews to work in WhatsApp, the image URLs must be publicly accessible.
 * localhost URLs will not generate previews.
 */
export function buildWhatsAppMessage(cartItems: CartItem[], subtotal: number, clienteNombre?: string, clienteCelular?: string): string {
    let message = "";

    if (clienteNombre && clienteCelular) {
        message += "[NUEVO PEDIDO]\n";
        message += `Cliente: ${clienteNombre}\n`;
        message += `Contacto: ${clienteCelular}\n`;
        message += "---\n\n";
    } else {
        message += "Hola, estoy interesado/a en reservar el siguiente pedido:\n\n";
    }

    message += "📦 *Detalle del Pedido:*\n\n";

    cartItems.forEach((item, index) => {
        // Add title
        message += `${index + 1}. *${item.title}*\n`;

        // Add price and quantity
        message += `   💰 $${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}\n`;

        // Add image URL - WhatsApp will auto-generate preview if URL is public
        const imageUrl = item.photo_url.startsWith('http')
            ? item.photo_url
            : `${API_BASE_URL}${item.photo_url}`;

        // Put image URL on its own line for better WhatsApp preview generation
        message += `   ${imageUrl}\n\n`;
    });

    message += `💰 *TOTAL: $${subtotal.toFixed(2)}*\n\n`;

    if (!clienteNombre) {
        message += "Por favor, confírmenme la disponibilidad. ¡Gracias!";
    }

    return message;
}

/**
 * Opens WhatsApp with pre-filled order message
 * @param phoneNumber - Optional WhatsApp number to send to (defaults to WHATSAPP_PHONE)
 */
export function sendToWhatsApp(
    cartItems: CartItem[],
    subtotal: number,
    clienteNombre?: string,
    clienteCelular?: string,
    phoneNumber?: string
): void {
    const message = buildWhatsAppMessage(cartItems, subtotal, clienteNombre, clienteCelular);
    const encodedMessage = encodeURIComponent(message);
    const targetPhone = phoneNumber || WHATSAPP_PHONE;
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

    // Open in new tab
    window.open(whatsappUrl, '_blank');
}

/**
 * Get the configured WhatsApp phone number
 */
export function getWhatsAppPhone(): string {
    return WHATSAPP_PHONE;
}
