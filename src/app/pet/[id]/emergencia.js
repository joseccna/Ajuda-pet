import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CartaoEmergencia } from '../../../components/emergencia/CartaoEmergencia';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { useEmergencia } from '../../../hooks/useEmergencia';

/** Cartão de emergência do pet, para ler de relance e ligar com um toque. */
export default function EmergenciaDoPet() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { dados } = useEmergencia(id);

  return (
    <Screen>
      <Cabecalho titulo="Cartão de emergência" icone="fechar" aoVoltar={() => router.back()} />
      {dados ? (
        <CartaoEmergencia pet={dados.pet} cartao={dados.cartao} />
      ) : (
        <EstadoVazio
          icone="help-circle-outline"
          titulo="Pet não encontrado"
          texto="Ele pode ter sido excluído."
        />
      )}
    </Screen>
  );
}
