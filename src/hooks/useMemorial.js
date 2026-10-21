import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { memorialService } from '../services/MemorialService';

/** Tudo da página do memorial de um pet (pet, homenagem, linha do tempo e fotos). Recarrega ao voltar à tela. */
export function useMemorial(petId) {
  const [dados, setDados] = useState(null);
  const recarregar = useCallback(() => setDados(petId ? memorialService.resumo(petId) : null), [petId]);
  useFocusEffect(recarregar);
  return { dados, recarregar };
}

/** Pets em memorial, para a lista. */
export function useMemorialLista() {
  const [pets, setPets] = useState([]);
  const recarregar = useCallback(() => setPets(memorialService.listar()), []);
  useFocusEffect(recarregar);
  return { pets, recarregar };
}
