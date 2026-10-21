import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormCuidadoNovo } from '../../../components/rotina/FormCuidadoNovo';
import { usePet } from '../../../hooks/usePet';

/** Adiciona um tipo de cuidado (banho, tosa...) ao pet. */
export default function NovoCuidado() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);

  return (
    <Screen>
      <Cabecalho titulo="Novo cuidado" icone="fechar" aoVoltar={() => router.back()} />
      {pet ? (
        <FormCuidadoNovo pet={pet} aoSalvar={() => router.back()} />
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
