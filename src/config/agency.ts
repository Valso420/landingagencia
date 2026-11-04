interface AgencyConfig {
  name: string;
  description: string;
  team: readonly string[];
  mission: string;
  history: string;
  contact: {
    whatsapp: string | null;
    instagram: string | null;
  };
}

// Only add approved commercial details and confirmed, complete contact URLs.
export const agency: AgencyConfig = {
  name: 'AGENCIA',
  description: 'Agencia virtual enfocada en viajes al exterior y recorridos multidestino.',
  team: [],
  mission: 'Empezamos por escuchar qué imaginás para el viaje. A partir de esa conversación, exploramos destinos y combinaciones para darle forma a una propuesta que podamos revisar juntos.',
  history: '[Presentación del equipo, experiencia y origen del proyecto. Contenido pendiente de la agencia.]',
  contact: { whatsapp: null, instagram: null },
};
