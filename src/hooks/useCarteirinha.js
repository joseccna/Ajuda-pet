import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { vacinaService } from '../services/VacinaService';

/** Cartões de vacina de um pet. Recarrega ao voltar à tela (depois de registrar uma dose, por exemplo). */
export function useCarteirinha(petId) {
  const [cartoes, setCartoes] = useState([]);
  const recarregar = useCallback(() => setCartoes(petId ? vacinaService.carteirinha(petId) : []), [petId]);
  useFocusEffect(recarregar);
  return { cartoes, recarregar };
}
