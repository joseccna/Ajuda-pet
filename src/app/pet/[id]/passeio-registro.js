import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormPasseio } from '../../../components/rotina/FormPasseio';
import { usePet } from '../../../hooks/usePet';
import { passeioService } from '../../../services/PasseioService';

/**
 * Registra um passeio que já aconteceu ou edita um do histórico (quando vem passeioId).
 * data, hora e observacao (opcionais) começam o formulário preenchido, como ao marcar um lembrete.
 */
export default function RegistroDePasseio() {
  const router = useRouter();
  const { id, passeioId, data, hora, observacao } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const passeio = useMemo(() => (passeioId ? passeioService.buscar(passeioId) : null), [passeioId]);
  const sugestao = useMemo(() => ({ data, hora, observacao }), [data, hora, observacao]);

  return (
    <Screen>
      <Cabecalho
        titulo={passeio ? 'Editar passeio' : 'Registrar passeio'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {pet ? (
        <FormPasseio
          pet={pet}
          passeio={passeio}
          sugestao={sugestao}
          aoSalvar={() => router.back()}
          aoExcluir={() => router.back()}
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
