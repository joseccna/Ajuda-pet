import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PetCard } from '../components/pet/PetCard';
import { Cabecalho } from '../components/ui/Cabecalho';
import { Screen } from '../components/ui/Screen';
import { Texto } from '../components/ui/Texto';
import { usePets } from '../hooks/usePets';

const DESTINOS = {
  dose: { titulo: 'Registrar dose', rota: '/pet/[id]/dose' },
  vacina: { titulo: 'Nova vacina', rota: '/pet/[id]/vacina-nova' },
  peso: { titulo: 'Registrar peso', rota: '/pet/[id]/peso' },
  consulta: { titulo: 'Agendar consulta', rota: '/pet/[id]/consulta' },
  passeio: { titulo: 'Iniciar passeio', rota: '/pet/[id]/passeio' },
  cuidado: { titulo: 'Registrar cuidado', rota: '/pet/[id]/cuidado-registro' },
};

/** Pergunta para qual pet é a ação, quando o tutor tem mais de um. */
export default function EscolherPet() {
  const router = useRouter();
  const { destino } = useLocalSearchParams();
  const { pets } = usePets();
  const config = DESTINOS[destino] ?? DESTINOS.dose;

  return (
    <Screen>
      <Cabecalho titulo={config.titulo} icone="fechar" aoVoltar={() => router.back()} />
      <Texto variante="corpo" cor="textoSuave" style={{ marginBottom: 16 }}>
        Para qual pet?
      </Texto>
      {pets.map((pet) => (
        <PetCard
          key={pet.id}
          pet={pet}
          aoPressionar={() => router.replace({ pathname: config.rota, params: { id: pet.id } })}
        />
      ))}
    </Screen>
  );
}
