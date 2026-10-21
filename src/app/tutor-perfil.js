import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { FormTutor } from '../components/tutor/FormTutor';
import { Cabecalho } from '../components/ui/Cabecalho';
import { Screen } from '../components/ui/Screen';
import { tutorService } from '../services/TutorService';

/** Edita o perfil do tutor e os contatos de confiança. */
export default function TutorPerfil() {
  const router = useRouter();
  const tutor = useMemo(() => tutorService.obter(), []);

  return (
    <Screen>
      <Cabecalho titulo="Meu perfil" icone="fechar" aoVoltar={() => router.back()} />
      <FormTutor tutor={tutor} aoSalvar={() => router.back()} />
    </Screen>
  );
}
