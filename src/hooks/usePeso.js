import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { pesoService } from '../services/PesoService';

const VAZIO = { registros: [], serie: [], atual: null, variacao: null, avisoVariacao: false };

/** Resumo de peso de um pet no período escolhido. Recarrega ao voltar à tela. */
export function usePeso(petId, periodo = '6m') {
  const [resumo, setResumo] = useState(VAZIO);
  const recarregar = useCallback(
    () => setResumo(petId ? pesoService.resumo(petId, periodo) : VAZIO),
    [petId, periodo],
  );
  useFocusEffect(recarregar);
  return { resumo, recarregar };
}
