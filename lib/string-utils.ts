/**
 * Normaliza las claves de nutrición para que puedan usarse en las traducciones.
 * Convierte texto a minúsculas y elimina caracteres especiales.
 */
export function getNormalizedNutritionKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ""); // Eliminar caracteres especiales
}

/**
 * Trunca un texto a una longitud máxima, añadiendo puntos suspensivos si es necesario.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Capitaliza la primera letra de un texto.
 */
export function capitalizeFirstLetter(text: string): string {
  if (!text || text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convierte un texto a slug (URL amigable).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}
