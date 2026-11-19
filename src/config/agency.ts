interface AgencyConfig {
  name: string;
  description: string;
  team: readonly string[];
  mission: string;
  history: string;
  contact: {
    email: string | null;
    phones: readonly string[];
    whatsapp: string | null;
    instagram: string | null;
  };
}

// Only add approved commercial details and confirmed, complete contact URLs.
export const agency: AgencyConfig = {
  name: 'AGENCIA',
  description: 'Viajes por Argentina y el exterior, cruceros y salidas grupales. Te acompañamos desde la primera consulta hasta que volvés a casa.',
  team: ['Sonia', 'Federico'],
  mission: 'Planificamos tu viaje con vos y te acompañamos desde la primera consulta hasta que volvés a casa.',
  history: 'Somos licenciados en Turismo con más de 15 años de experiencia en el sector.',
  contact: { email: null, phones: [], whatsapp: null, instagram: null },
};
