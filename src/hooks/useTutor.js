import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { tutorService } from '../services/TutorService';

/** Perfil do tutor (ou null se ainda não foi preenchido). Recarrega ao voltar à tela. */
export function useTutor() {
  const [tutor, setTutor] = useState(null);
  const recarregar = useCallback(() => setTutor(tutorService.atual()), []);
  useFocusEffect(recarregar);
  return { tutor, recarregar };
}
