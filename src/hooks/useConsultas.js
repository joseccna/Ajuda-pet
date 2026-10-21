import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { consultaService } from '../services/ConsultaService';

const VAZIO = {
  proxima: null,
  agendadas: [],
  historico: [],
  anexosPorConsulta: {},
  ano: new Date().getFullYear(),
  gastoAnoCentavos: 0,
};

/** Consultas de um pet: próxima, agendadas, histórico e gasto do ano. */
export function useConsultas(petId) {
  const [resumo, setResumo] = useState(VAZIO);
  const recarregar = useCallback(() => setResumo(petId ? consultaService.resumo(petId) : VAZIO), [petId]);
  useFocusEffect(recarregar);
  return { resumo, recarregar };
}
