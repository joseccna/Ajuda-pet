import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormDespedida } from '../../../components/memorial/FormDespedida';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { usePet } from '../../../hooks/usePet';
import { TemaMemorial } from '../../../theme';

function Conteudo() {
  const router = useRouter();
  const { id, novo } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);

  const irParaMemorial = () => router.replace({ pathname: '/pet/[id]/memorial', params: { id } });
  // Pet que acabou de ser cadastrado só para o memorial: se a pessoa desistir, abre o perfil dele.
  const desistir = () =>
    novo === '1' ? router.replace({ pathname: '/pet/[id]', params: { id } }) : router.back();

  return (
    <Screen>
      <Cabecalho
        titulo={pet?.falecido ? 'Editar despedida' : 'Registrar despedida'}
        icone="fechar"
        aoVoltar={desistir}
      />
      {pet ? (
        <FormDespedida pet={pet} aoSalvar={irParaMemorial} aoAgoraNao={desistir} />
      ) : carregando ? null : (
        <EstadoVazio
          icone="help-circle-outline"
          titulo="Pet não encontrado"
          texto="Ele pode ter sido excluído."
        />
      )}
    </Screen>
  );
}

/** Registra a despedida (ou corrige a data e a homenagem), no tema calmo do memorial. */
export default function Despedida() {
  return (
    <TemaMemorial>
      <Conteudo />
    </TemaMemorial>
  );
}
