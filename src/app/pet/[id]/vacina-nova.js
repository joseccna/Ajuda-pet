import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormVacina } from '../../../components/saude/FormVacina';
import { usePet } from '../../../hooks/usePet';

/** Adiciona um cartão (tipo de vacina) à carteirinha do pet. */
export default function NovaVacina() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);

  return (
    <Screen>
      <Cabecalho titulo="Nova vacina" icone="fechar" aoVoltar={() => router.back()} />
      {pet ? (
        <FormVacina pet={pet} aoSalvar={() => router.back()} />
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
