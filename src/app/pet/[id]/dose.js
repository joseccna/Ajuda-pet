import React, { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { FormDose } from '../../../components/saude/FormDose';
import { usePet } from '../../../hooks/usePet';
import { vacinaService } from '../../../services/VacinaService';

/** Registra uma nova dose ou edita uma existente (quando vem doseId). */
export default function DoseDeVacina() {
  const router = useRouter();
  const { id, tipoId, doseId } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);

  const dose = useMemo(() => (doseId ? vacinaService.buscarDose(doseId) : null), [doseId]);
  const tipos = useMemo(() => (pet ? vacinaService.tiposDoPet(pet.id) : []), [pet]);

  return (
    <Screen>
      <Cabecalho
        titulo={dose ? 'Editar dose' : 'Registrar dose'}
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
          icone="shield-checkmark-outline"
          titulo="Cadastre a vacina primeiro"
          texto={`Adicione a vacina à carteirinha ${pet.deNome} para registrar as doses.`}
        >
          <Button
            titulo="Adicionar vacina"
            icone="add"
            aoPressionar={() => router.replace({ pathname: '/pet/[id]/vacina-nova', params: { id: pet.id } })}
          />
        </EstadoVazio>
      ) : (
        <FormDose
          tipos={tipos}
          tipoIdInicial={tipoId}
          dose={dose}
          aoSalvar={() => router.back()}
          aoExcluir={() => router.back()}
        />
      )}
    </Screen>
  );
}
