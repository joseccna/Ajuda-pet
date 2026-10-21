import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { galeriaService } from '../services/GaleriaService';

/** Fotos do pet e qual é a capa. Recarrega ao voltar à tela (depois de ver ou apagar uma foto). */
export function useGaleria(petId) {
  const [dados, setDados] = useState({ fotos: [], capaUri: null });
  const recarregar = useCallback(() => {
    if (!petId) return setDados({ fotos: [], capaUri: null });
    const fotos = galeriaService.listar(petId);
    return setDados({ fotos, capaUri: galeriaService.capaUri(petId) });
  }, [petId]);
  useFocusEffect(recarregar);
  return { ...dados, recarregar };
}
