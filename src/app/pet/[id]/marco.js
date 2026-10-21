import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormMarco } from '../../../components/memorial/FormMarco';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { usePet } from '../../../hooks/usePet';
import { memorialService } from '../../../services/MemorialService';
import { TemaMemorial } from '../../../theme';

function Conteudo() {
  const router = useRouter();
  const { id, marcoId } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const marco = useMemo(() => (marcoId ? memorialService.buscarMarco(marcoId) : null), [marcoId]);

  return (
    <Screen>
      <Cabecalho
        titulo={marco ? 'Lembrança' : 'Nova lembrança'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {pet ? (
        <FormMarco pet={pet} marco={marco} aoSalvar={() => router.back()} aoExcluir={() => router.back()} />
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

/** Adiciona ou edita um momento da linha do tempo do memorial. */
export default function Marco() {
  return (
    <TemaMemorial>
      <Conteudo />
    </TemaMemorial>
  );
}
