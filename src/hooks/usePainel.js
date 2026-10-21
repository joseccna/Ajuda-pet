import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { notificacaoService } from '../services/NotificacaoService';
import { painelService } from '../services/PainelService';

const VAZIO = { hoje: [], proximos: [], porPet: {} };

/** Lembretes do painel do dia. Recarrega sempre que a tela volta ao foco. */
export function usePainel() {
  const [painel, setPainel] = useState(VAZIO);
  const recarregar = useCallback(() => {
    setPainel(painelService.montar());
    // Os dados podem ter mudado (novo lembrete, dose registrada...): atualiza as notificações.
    notificacaoService.reagendarEmBreve();
  }, []);
  useFocusEffect(recarregar);
  return { painel, recarregar };
}
