import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { alimentacaoService } from '../services/AlimentacaoService';
import { cuidadoService } from '../services/CuidadoService';
import { passeioService } from '../services/PasseioService';

/** Plano alimentar em vigor e as refeições de hoje. Recarrega ao voltar à tela. */
export function useAlimentacao(petId) {
  const [dados, setDados] = useState({ plano: null, refeicoes: [] });
  const recarregar = useCallback(
    () => setDados(petId ? alimentacaoService.refeicoesDeHoje(petId) : { plano: null, refeicoes: [] }),
    [petId],
  );
  useFocusEffect(recarregar);
  return { ...dados, recarregar };
}

const SEM_PASSEIOS = {
  semana: { dias: [], totalMin: 0, metaMin: 30 },
  minutosHoje: 0,
  percentualMeta: 0,
  ultimo: null,
  ativo: null,
  total: 0,
};

/** Resumo de passeios: semana, meta do dia, último passeio e passeio em andamento. */
export function usePasseios(petId) {
  const [resumo, setResumo] = useState(SEM_PASSEIOS);
  const recarregar = useCallback(
    () => setResumo(petId ? passeioService.resumo(petId) : SEM_PASSEIOS),
    [petId],
  );
  useFocusEffect(recarregar);
  return { resumo, recarregar };
}

/** Cartões de cuidados do pet (banho, tosa, antipulgas...), do mais urgente ao menos. */
export function useCuidados(petId) {
  const [cartoes, setCartoes] = useState([]);
  const recarregar = useCallback(() => setCartoes(petId ? cuidadoService.cartoes(petId) : []), [petId]);
  useFocusEffect(recarregar);
  return { cartoes, recarregar };
}
