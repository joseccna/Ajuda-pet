import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormPet } from '../../components/pet/FormPet';
import { Cabecalho } from '../../components/ui/Cabecalho';
import { Screen } from '../../components/ui/Screen';
/** Cadastro rápido: foto, nome e espécie. O resto é opcional. */
export default function NovoPet() {
  const router = useRouter();
  const { memorial } = useLocalSearchParams();
  return (
    <Screen>
      <Cabecalho
        titulo={memorial === '1' ? 'Pet em memorial' : 'Novo pet'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      <FormPet
        aoSalvar={(pet) =>
          memorial === '1'
            ? router.replace({ pathname: '/pet/[id]/despedida', params: { id: pet.id, novo: '1' } })
            : router.replace({ pathname: '/pet/[id]', params: { id: pet.id } })
        }
      />
    </Screen>
  );
}
