import type { ImageMetadata } from 'astro';
import japan from '../assets/japan.png';
import portugal from '../assets/portugal.png';
import italy from '../assets/cinque-terre.png';

export type RegionSlug = 'asia' | 'europa';

export interface DestinationStop {
  city: string;
  area: string;
  description: string;
}

export interface Destination {
  slug: string;
  name: string;
  region: RegionSlug;
  cardTitle: string;
  route: string;
  headline: string;
  description: string;
  image: ImageMetadata;
  imageAlt: string;
  stops: readonly DestinationStop[];
}

export interface Region {
  slug: RegionSlug;
  name: string;
  description: string;
  image: ImageMetadata;
  destinationSlugs: readonly string[];
}

// Editorial examples for the internal review; these are not bookable packages.
export const destinations: readonly Destination[] = [
  {
    slug: 'japon',
    name: 'Japón',
    region: 'asia',
    cardTitle: 'Kioto, Japón',
    route: 'Tokio → Kioto',
    headline: 'Tokio y Kioto',
    description: 'De las calles comerciales de Asakusa a las casas de madera de Gion.',
    image: japan,
    imageAlt: 'Calle tradicional de Kioto con la pagoda de Yasaka al fondo.',
    stops: [
      {
        city: 'Tokio',
        area: 'Asakusa',
        description: 'Pasá por el templo Sensō-ji y recorré los puestos de Nakamise.',
      },
      {
        city: 'Kioto',
        area: 'Gion e Higashiyama',
        description: 'Caminá entre casas tradicionales, templos y callejones del casco histórico.',
      },
    ],
  },
  {
    slug: 'portugal',
    name: 'Portugal',
    region: 'europa',
    cardTitle: 'Oporto, Portugal',
    route: 'Lisboa → Oporto',
    headline: 'Del Tajo al Duero',
    description: 'Dos ciudades junto al río, con barrios para recorrer a pie.',
    image: portugal,
    imageAlt: 'Fachadas de colores y embarcaciones junto al Duero en Oporto.',
    stops: [
      {
        city: 'Lisboa',
        area: 'Alfama y el Tajo',
        description: 'Recorré las calles de Alfama y bajá a la Praça do Comércio, abierta al río.',
      },
      {
        city: 'Oporto',
        area: 'Ribeira y el Duero',
        description: 'Paseá junto al agua entre fachadas de colores y vistas al puente Dom Luís I.',
      },
    ],
  },
  {
    slug: 'italia',
    name: 'Italia',
    region: 'europa',
    cardTitle: 'Cinque Terre, Italia',
    route: 'Roma → Florencia → Cinque Terre',
    headline: 'Roma, Florencia y la costa',
    description: 'Un recorrido que combina dos ciudades de arte con los pueblos de la costa ligur.',
    image: italy,
    imageAlt: 'Casas de colores de Manarola sobre los acantilados de Cinque Terre.',
    stops: [
      {
        city: 'Roma',
        area: 'Centro histórico',
        description: 'Dedicá una parada a recorrer sus plazas y monumentos.',
      },
      {
        city: 'Florencia',
        area: 'Arte y arquitectura',
        description: 'Explorá el centro histórico y el entorno de la catedral.',
      },
      {
        city: 'Cinque Terre',
        area: 'Pueblos junto al mar',
        description: 'Recorré los pueblos costeros y sus miradores.',
      },
    ],
  },
];

export const regions: readonly Region[] = [
  {
    slug: 'asia',
    name: 'Asia',
    description: 'De Tokio a Kioto, un recorrido de ejemplo entre barrios urbanos, templos y calles históricas.',
    image: japan,
    destinationSlugs: ['japon'],
  },
  {
    slug: 'europa',
    name: 'Europa',
    description: 'Dos recorridos de ejemplo. Lisboa y Oporto junto al río, o ciudades italianas y pueblos de costa.',
    image: italy,
    destinationSlugs: ['portugal', 'italia'],
  },
];
