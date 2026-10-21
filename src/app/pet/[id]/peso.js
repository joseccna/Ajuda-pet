import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormPeso } from '../../../components/saude/FormPeso';
import { usePet } from '../../../hooks/usePet';
import { pesoService } from '../../../services/PesoService';

/** Registra uma pesagem ou edita uma existente (quando vem registroId). */
export default function PesoDoPet() {
  const router = useRouter();
  const { id, registroId } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const registro = useMemo(() => (registroId ? pesoService.buscar(registroId) : null), [registroId]);

  return (
    <Screen>
      <Cabecalho
        titulo={registro ? 'Editar peso' : 'Registrar peso'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {pet ? (
        <FormPeso
          pet={pet}
          registro={registro}
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
