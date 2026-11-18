import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormPlano } from '../../../components/rotina/FormPlano';
import { usePet } from '../../../hooks/usePet';
import { alimentacaoService } from '../../../services/AlimentacaoService';

/**
 * Cria o plano alimentar do pet, corrige o que está em vigor (Editar plano)
 * ou troca por um novo (Novo plano, com modo=novo).
 */
export default function PlanoAlimentar() {
  const router = useRouter();
  const { id, modo } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const plano = useMemo(() => alimentacaoService.planoVigente(id), [id]);
  const novo = !plano || modo === 'novo';

  return (
    <Screen>
      <Cabecalho
        titulo={novo ? 'Novo plano alimentar' : 'Editar plano alimentar'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {pet ? (
        <FormPlano
          pet={pet}
          plano={plano}
          modo={modo === 'novo' ? 'novo' : 'corrigir'}
          aoSalvar={() => router.back()}
        />
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
