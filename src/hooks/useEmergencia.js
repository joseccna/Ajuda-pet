import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { emergenciaService } from '../services/EmergenciaService';

/** Dados do cartão de emergência do pet. Recarrega ao voltar à tela (depois de editar contatos, por exemplo). */
export function useEmergencia(petId) {
  const [dados, setDados] = useState(null);
  const recarregar = useCallback(() => setDados(petId ? emergenciaService.cartao(petId) : null), [petId]);
  useFocusEffect(recarregar);
  return { dados, recarregar };
}
