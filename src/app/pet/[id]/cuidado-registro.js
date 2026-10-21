import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormRegistroCuidado } from '../../../components/rotina/FormRegistroCuidado';
import { usePet } from '../../../hooks/usePet';
import { cuidadoService } from '../../../services/CuidadoService';

/** Registra ou agenda um cuidado, ou edita um registro (quando vem registroId). */
export default function RegistroDeCuidado() {
  const router = useRouter();
  const { id, tipoId, registroId } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const detalhe = useMemo(
    () => (registroId ? cuidadoService.detalheRegistro(registroId) : null),
    [registroId],
  );
  const tipos = useMemo(() => (pet ? cuidadoService.tiposDoPet(pet.id) : []), [pet]);

  return (
    <Screen>
      <Cabecalho
        titulo={detalhe ? 'Editar cuidado' : 'Registrar cuidado'}
        icone="fechar"
        aoVoltar={() => router.back()}
      />
      {!pet ? (
        carregando ? null : (
          <EstadoVazio
            icone="help-circle-outline"
            titulo="Pet não encontrado"
            texto="Ele pode ter sido excluído."
          />
        )
      ) : tipos.length === 0 ? (
        <EstadoVazio
          icone="sparkles-outline"
          titulo="Cadastre o cuidado primeiro"
          texto={`Adicione o cuidado à lista ${pet.deNome} para registrar quando foi feito.`}
        >
          <Button
            titulo="Adicionar cuidado"
            icone="add"
            aoPressionar={() =>
              router.replace({ pathname: '/pet/[id]/cuidado-novo', params: { id: pet.id } })
            }
          />
        </EstadoVazio>
      ) : (
        <FormRegistroCuidado
          tipos={tipos}
          tipoIdInicial={tipoId}
          detalhe={detalhe}
          aoSalvar={() => router.back()}
          aoExcluir={() => router.back()}
        />
      )}
    </Screen>
  );
}
