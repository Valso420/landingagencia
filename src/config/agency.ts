interface AgencyConfig {
  name: string;
  description: string;
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
  description: 'Planificación, gestión y seguimiento de viajes por Argentina y el exterior, con Sonia y Federico, licenciados en Turismo con más de 15 años de trayectoria.',
  contact: { email: null, phones: [], whatsapp: null, instagram: null },
};
