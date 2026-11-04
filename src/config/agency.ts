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
  name: 'Nombre de agencia',
  description: 'Agencia virtual enfocada en viajes al exterior y recorridos multidestino.',
  team: ['Sonia', 'Federico'],
  mission: '[Texto de misión de la agencia]',
  history: '[Historia y experiencia del equipo]',
  contact: { whatsapp: null, instagram: null },
};
