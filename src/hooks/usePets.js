import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { petService } from '../services/PetService';
/** Lista os pets ativos e recarrega sempre que a tela volta ao foco. */
export function usePets() {
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(() => {
    setPets(petService.listarAtivos());
    setCarregando(false);
  }, []);
  useFocusEffect(recarregar);
  return { pets, carregando, recarregar };
}
