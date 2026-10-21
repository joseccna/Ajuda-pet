import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormConsulta } from '../../../components/saude/FormConsulta';
import { usePet } from '../../../hooks/usePet';
import { consultaService } from '../../../services/ConsultaService';

/** Registra, agenda ou edita uma consulta (quando vem consultaId). */
export default function ConsultaDoPet() {
  const router = useRouter();
  const { id, consultaId } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const detalhe = useMemo(() => (consultaId ? consultaService.detalhe(consultaId) : null), [consultaId]);

  return (
    <Screen>
      <Cabecalho
        titulo={detalhe ? 'Consulta' : 'Nova consulta'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {pet ? (
        <FormConsulta
          pet={pet}
          detalhe={detalhe}
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
