import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { notificacaoService } from '../services/NotificacaoService';
import { painelService } from '../services/PainelService';

const VAZIO = { hoje: [], proximos: [], porPet: {} };
/** De quanto em quanto tempo o painel se atualiza sozinho enquanto está na tela. */
const ATUALIZAR_A_CADA_MS = 60 * 1000;

/**
 * Lembretes do painel do dia. Recarrega quando a tela volta ao foco, quando o app volta
 * para a frente e a cada minuto (uma refeição que passou do horário muda de cor sem precisar sair da tela).
 */
export function usePainel() {
  const [painel, setPainel] = useState(VAZIO);
  const recarregar = useCallback(() => {
    setPainel(painelService.montar());
    // Os dados podem ter mudado (novo lembrete, dose registrada...): atualiza as notificações.
    notificacaoService.reagendarEmBreve();
  }, []);

  useFocusEffect(
    useCallback(() => {
      recarregar();
      const relogio = setInterval(() => setPainel(painelService.montar()), ATUALIZAR_A_CADA_MS);
      const assinatura = AppState.addEventListener('change', (estado) => {
        if (estado === 'active') recarregar();
      });
      return () => {
        clearInterval(relogio);
        assinatura.remove();
      };
    }, [recarregar]),
  );
  return { painel, recarregar };
}
