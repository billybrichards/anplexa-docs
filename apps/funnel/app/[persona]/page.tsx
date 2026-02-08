import { FunnelFlow } from '../../client/src/pages/FunnelFlow';
import type { Persona } from '../../client/src/types';

interface PersonaPageProps {
  params: Promise<{ persona: string }>;
}

export default async function PersonaPage({ params }: PersonaPageProps) {
  const { persona } = await params;
  return <FunnelFlow personaId={persona as Persona} />;
}
