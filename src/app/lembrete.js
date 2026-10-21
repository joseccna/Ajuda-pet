import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormLembrete } from '../components/agenda/FormLembrete';
import { Button } from '../components/ui/Button';
import { Cabecalho } from '../components/ui/Cabecalho';
import { EstadoVazio } from '../components/ui/EstadoVazio';
import { Screen } from '../components/ui/Screen';
import { usePets } from '../hooks/usePets';
import { lembreteAvulsoService } from '../services/LembreteAvulsoService';

/** Cria um lembrete avulso (com o dia escolhido na agenda) ou edita um existente (quando vem lembreteId). */
export default function LembreteAvulsoTela() {
  const router = useRouter();
  const { lembreteId, petId, data } = useLocalSearchParams();
  const { pets, carregando } = usePets();
  const lembrete = useMemo(
    () => (lembreteId ? lembreteAvulsoService.buscar(lembreteId) : null),
    [lembreteId],
  );

  return (
    <Screen>
      <Cabecalho
        titulo={lembrete ? 'Lembrete' : 'Novo lembrete'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {pets.length === 0 ? (
        carregando ? null : (
          <EstadoVazio
            icone="paw"
            titulo="Cadastre um pet primeiro"
            texto="Os lembretes são sempre de um pet."
          >
            <Button titulo="Cadastrar pet" icone="add" aoPressionar={() => router.replace('/pet/novo')} />
          </EstadoVazio>
        )
      ) : lembreteId && !lembrete ? (
        <EstadoVazio
          icone="help-circle-outline"
          titulo="Lembrete não encontrado"
          texto="Ele pode ter sido excluído."
        />
      ) : (
        <FormLembrete
          pets={pets}
          lembrete={lembrete}
          petIdInicial={petId}
          dataInicial={data}
          aoSalvar={() => router.back()}
          aoExcluir={() => router.back()}
        />
      )}
    </Screen>
  );
}
