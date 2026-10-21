import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormPlano } from '../../../components/rotina/FormPlano';
import { usePet } from '../../../hooks/usePet';
import { alimentacaoService } from '../../../services/AlimentacaoService';

/** Cria o plano alimentar do pet ou edita o que está em vigor. */
export default function PlanoAlimentar() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const plano = useMemo(() => alimentacaoService.planoVigente(id), [id]);

  return (
    <Screen>
      <Cabecalho
        titulo={plano ? 'Plano alimentar' : 'Novo plano alimentar'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {pet ? (
        <FormPlano pet={pet} plano={plano} aoSalvar={() => router.back()} />
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
