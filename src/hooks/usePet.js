import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { petService } from '../services/PetService';
/** Carrega um pet pelo id e recarrega ao voltar à tela (por exemplo, depois de editar). */
export function usePet(id) {
  const [pet, setPet] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(() => {
    setPet(id ? petService.buscar(id) : null);
    setCarregando(false);
  }, [id]);
  useFocusEffect(recarregar);
  return { pet, carregando, recarregar };
}
