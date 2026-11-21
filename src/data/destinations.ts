import type { ImageMetadata } from 'astro';
import japan from '../assets/japan.png';
import portugal from '../assets/portugal.png';
import italy from '../assets/cinque-terre.png';
import thailand from '../assets/thailand.jpg';
import vietnam from '../assets/vietnam.jpg';
import indonesia from '../assets/indonesia.jpg';
import peru from '../assets/peru.jpg';
import mexico from '../assets/mexico.jpg';
import patagonia from '../assets/patagonia.jpg';
import iguazu from '../assets/iguazu.jpg';
import rioDeJaneiro from '../assets/rio-de-janeiro.jpg';
import florianopolis from '../assets/florianopolis.jpg';
import nuevaYork from '../assets/nueva-york.jpg';
import miami from '../assets/miami.jpg';
import puntaCana from '../assets/punta-cana.jpg';
import cancun from '../assets/cancun.jpg';

export type RegionSlug = 'argentina' | 'brasil' | 'eeuu' | 'caribe' | 'resto-america' | 'europa' | 'exoticos';

export interface DestinationStop {
  city: string;
  area: string;
  description: string;
}

interface DestinationContent {
  slug: string;
  name: string;
  region: RegionSlug;
  selectorLabel?: string;
  cardTitle: string;
  cardRoute: string;
  route: string;
  headline: string;
  description: string;
  image: ImageMetadata;
  imageAlt: string;
}

interface BriefDestination extends DestinationContent {
  kind: 'brief';
}

interface ItineraryDestination extends DestinationContent {
  kind: 'itinerary';
  stops: readonly DestinationStop[];
}

export type Destination = BriefDestination | ItineraryDestination;

export interface Region {
  slug: RegionSlug;
  name: string;
  description: string;
  destinationSlugs: readonly string[];
}

function createBriefDestination(details: Pick<DestinationContent, 'slug' | 'name' | 'region' | 'selectorLabel' | 'image' | 'imageAlt'>): BriefDestination {
  return {
    ...details,
    kind: 'brief',
    cardTitle: details.name,
    cardRoute: 'Destino de ejemplo',
    route: 'Destino de ejemplo',
    headline: 'Planificá tu próximo viaje',
    description: `Contanos qué viaje tenés en mente y definimos las opciones para conocer ${details.name}.`,
  };
}

// Editorial examples for the internal review; these are not bookable packages.
export const destinations: readonly Destination[] = [
  createBriefDestination({
    slug: 'patagonia',
    name: 'Patagonia',
    region: 'argentina',
    image: patagonia,
    imageAlt: 'Frente de un glaciar junto a un lago turquesa y montañas en la Patagonia argentina.',
  }),
  createBriefDestination({
    slug: 'iguazu',
    name: 'Iguazú',
    region: 'argentina',
    image: iguazu,
    imageAlt: 'Saltos de las cataratas del Iguazú entre vegetación y nubes de agua.',
  }),
  createBriefDestination({
    slug: 'rio-de-janeiro',
    name: 'Río de Janeiro',
    region: 'brasil',
    selectorLabel: 'Río',
    image: rioDeJaneiro,
    imageAlt: 'Pan de Azúcar y embarcaciones en la bahía de Río de Janeiro.',
  }),
  createBriefDestination({
    slug: 'florianopolis',
    name: 'Florianópolis',
    region: 'brasil',
    image: florianopolis,
    imageAlt: 'Playa de arena y mar azul junto a colinas cubiertas de vegetación en Florianópolis.',
  }),
  createBriefDestination({
    slug: 'nueva-york',
    name: 'Nueva York',
    region: 'eeuu',
    image: nuevaYork,
    imageAlt: 'Rascacielos del sur de Manhattan vistos desde el agua, con el One World Trade Center.',
  }),
  createBriefDestination({
    slug: 'miami',
    name: 'Miami',
    region: 'eeuu',
    image: miami,
    imageAlt: 'Edificios altos y paseo costero con palmeras junto a la bahía de Miami.',
  }),
  createBriefDestination({
    slug: 'punta-cana',
    name: 'Punta Cana',
    region: 'caribe',
    image: puntaCana,
    imageAlt: 'Palmeras sobre una playa de arena blanca y mar turquesa en Punta Cana.',
  }),
  createBriefDestination({
    slug: 'cancun',
    name: 'Cancún',
    region: 'caribe',
    image: cancun,
    imageAlt: 'Olas de agua turquesa sobre una playa de arena clara en Cancún.',
  }),
  {
    slug: 'japon',
    name: 'Japón',
    region: 'exoticos',
    kind: 'itinerary',
    cardTitle: 'Japón',
    cardRoute: 'Tokio → Kioto',
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
    slug: 'tailandia',
    name: 'Tailandia',
    region: 'exoticos',
    kind: 'itinerary',
    cardTitle: 'Tailandia',
    cardRoute: 'Bangkok → Chiang Mai',
    route: 'Bangkok → Chiang Mai',
    headline: 'Bangkok y Chiang Mai',
    description: 'Templos, mercados y un recorrido entre la capital y el norte del país.',
    image: thailand,
    imageAlt: 'Templo decorado y vegetación bajo el cielo de Tailandia.',
    stops: [
      {
        city: 'Bangkok',
        area: 'Barrios y templos',
        description: 'Una primera parada para explorar sus barrios y templos junto al río.',
      },
      {
        city: 'Chiang Mai',
        area: 'La ciudad antigua',
        description: 'Una segunda parada entre templos y calles del norte de Tailandia.',
      },
    ],
  },
  {
    slug: 'vietnam',
    name: 'Vietnam',
    region: 'exoticos',
    kind: 'itinerary',
    cardTitle: 'Vietnam',
    cardRoute: 'Hanói → Hoi An',
    route: 'Hanói → Ha Long → Hoi An',
    headline: 'De Hanói a Hoi An',
    description: 'Vida urbana, paisajes de la bahía y arquitectura histórica en tres paradas.',
    image: vietnam,
    imageAlt: 'Formaciones de roca y embarcaciones en las aguas de la bahía de Ha Long.',
    stops: [
      {
        city: 'Hanói',
        area: 'Barrios de la capital',
        description: 'Recorré el centro y sus calles comerciales para comenzar el viaje.',
      },
      {
        city: 'Ha Long',
        area: 'La bahía',
        description: 'Conocé el paisaje de islas y formaciones de piedra que emerge del agua.',
      },
      {
        city: 'Hoi An',
        area: 'La ciudad histórica',
        description: 'Una última parada entre casas antiguas y arquitectura de distintas tradiciones.',
      },
    ],
  },
  {
    slug: 'indonesia',
    name: 'Indonesia',
    region: 'exoticos',
    kind: 'itinerary',
    cardTitle: 'Indonesia',
    cardRoute: 'Ubud → Uluwatu',
    route: 'Ubud → Uluwatu',
    headline: 'Bali entre cultura y costa',
    description: 'Un recorrido de ejemplo entre el interior de Bali y los acantilados del sur.',
    image: indonesia,
    imageAlt: 'Paisaje de Bali entre vegetación, templos y agua.',
    stops: [
      {
        city: 'Ubud',
        area: 'Arte y paisaje',
        description: 'Explorá el entorno cultural y natural del interior de Bali.',
      },
      {
        city: 'Uluwatu',
        area: 'Templos y acantilados',
        description: 'Terminá el recorrido junto al océano, en los paisajes del sur de la isla.',
      },
    ],
  },
  {
    slug: 'portugal',
    name: 'Portugal',
    region: 'europa',
    kind: 'itinerary',
    cardTitle: 'Portugal',
    cardRoute: 'Lisboa → Oporto',
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
    kind: 'itinerary',
    cardTitle: 'Italia',
    cardRoute: 'Roma → Cinque Terre',
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
  {
    slug: 'peru',
    name: 'Perú',
    region: 'resto-america',
    kind: 'itinerary',
    cardTitle: 'Perú',
    cardRoute: 'Cusco → Machu Picchu',
    route: 'Cusco → Machu Picchu',
    headline: 'Cusco y Machu Picchu',
    description: 'Una propuesta de ejemplo entre la ciudad de Cusco y los paisajes andinos.',
    image: peru,
    imageAlt: 'Ruinas de Machu Picchu entre las montañas de los Andes.',
    stops: [
      {
        city: 'Cusco',
        area: 'La ciudad',
        description: 'Una primera parada para recorrer la ciudad y sus alrededores.',
      },
      {
        city: 'Machu Picchu',
        area: 'Paisaje e historia',
        description: 'Una segunda parada para conocer el sitio arqueológico entre montañas.',
      },
    ],
  },
  {
    slug: 'mexico',
    name: 'México',
    region: 'resto-america',
    kind: 'itinerary',
    cardTitle: 'México',
    cardRoute: 'C. de México → Oaxaca',
    route: 'Ciudad de México → Oaxaca',
    headline: 'Dos ciudades de México',
    description: 'Un recorrido de ejemplo entre la capital y Oaxaca, con foco en cultura y vida urbana.',
    image: mexico,
    imageAlt: 'Banderines de papel picado de colores sobre una plaza de México.',
    stops: [
      {
        city: 'Ciudad de México',
        area: 'La capital',
        description: 'Una primera parada para explorar barrios y espacios culturales.',
      },
      {
        city: 'Oaxaca',
        area: 'La ciudad',
        description: 'Una segunda parada para recorrer sus calles, plazas y mercados.',
      },
    ],
  },
];

export const regions: readonly Region[] = [
  {
    slug: 'argentina',
    name: 'Argentina',
    description: 'Patagonia e Iguazú: ideas de viaje por Argentina.',
    destinationSlugs: ['patagonia', 'iguazu'],
  },
  {
    slug: 'brasil',
    name: 'Brasil',
    description: 'Río y Florianópolis: ideas para recorrer Brasil.',
    destinationSlugs: ['rio-de-janeiro', 'florianopolis'],
  },
  {
    slug: 'eeuu',
    name: 'EE. UU.',
    description: 'Nueva York y Miami: dos ideas de viaje por Estados Unidos.',
    destinationSlugs: ['nueva-york', 'miami'],
  },
  {
    slug: 'caribe',
    name: 'Caribe',
    description: 'Punta Cana y Cancún: ideas para disfrutar del Caribe.',
    destinationSlugs: ['punta-cana', 'cancun'],
  },
  {
    slug: 'resto-america',
    name: 'Resto de América',
    description: 'Perú, Colombia y otros destinos de América para descubrir a tu manera.',
    destinationSlugs: ['peru', 'mexico'],
  },
  {
    slug: 'europa',
    name: 'Europa',
    description: 'Ciudades junto al río, pueblos de costa y recorridos entre Portugal e Italia.',
    destinationSlugs: ['portugal', 'italia'],
  },
  {
    slug: 'exoticos',
    name: 'Exóticos',
    description: 'Japón y otros destinos para explorar nuevas culturas y paisajes.',
    destinationSlugs: ['japon', 'tailandia', 'vietnam', 'indonesia'],
  },
];
