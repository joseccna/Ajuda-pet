import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormPet } from '../../../components/pet/FormPet';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { usePet } from '../../../hooks/usePet';
export default function EditarPet() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  return (
    <Screen>
      <Cabecalho titulo="Editar pet" icone="fechar" aoVoltar={() => router.back()} />
      {pet ? (
        <FormPet petInicial={pet} aoSalvar={() => router.back()} />
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
