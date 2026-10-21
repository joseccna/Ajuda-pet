import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormPasseio } from '../../../components/rotina/FormPasseio';
import { usePet } from '../../../hooks/usePet';
import { passeioService } from '../../../services/PasseioService';

/** Registra um passeio que já aconteceu ou edita um do histórico (quando vem passeioId). */
export default function RegistroDePasseio() {
  const router = useRouter();
  const { id, passeioId } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const passeio = useMemo(() => (passeioId ? passeioService.buscar(passeioId) : null), [passeioId]);

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
