import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { gradeDoMes } from '../models/regrasAgenda';
import { agendaService } from '../services/AgendaService';
import { notificacaoService } from '../services/NotificacaoService';

/** Grade e eventos de um mês. Recarrega ao voltar à tela (depois de criar ou editar um lembrete). */
export function useAgenda(ano, mes) {
  const [dados, setDados] = useState(() => ({ grade: gradeDoMes(ano, mes), eventos: [] }));
  const recarregar = useCallback(() => setDados(agendaService.doMes(ano, mes)), [ano, mes]);
  useFocusEffect(recarregar);
  return { ...dados, recarregar };
}

/** { disponivel, permitido, podePedir } das notificações, e uma função para pedir permissão. */
export function useNotificacoes() {
  const [estado, setEstado] = useState({ disponivel: false, permitido: false, podePedir: false });
  const atualizar = useCallback(() => {
    notificacaoService.estado().then(setEstado);
  }, []);
  useFocusEffect(atualizar);

  const pedir = useCallback(async () => {
    const novo = await notificacaoService.pedirPermissao();
    setEstado(novo);
    if (novo.permitido) notificacaoService.reagendar();
    return novo;
  }, []);

  return { estado, pedir };
}

/**
 * O app está fora da economia de bateria? true, false ou null (não dá para saber).
 * Confere de novo ao voltar à tela (o usuário pode ter mudado nas configurações).
 */
export function useBateria() {
  const [liberada, setLiberada] = useState(null);
  const atualizar = useCallback(() => {
    notificacaoService.bateriaLiberada().then(setLiberada);
  }, []);
  useFocusEffect(atualizar);

  const pedir = useCallback(async () => {
    const nova = await notificacaoService.pedirLiberarBateria();
    setLiberada(nova);
    return nova;
  }, []);

  return { liberada, pedir };
}
