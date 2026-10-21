import { useEffect, useState } from 'react';
import { preferenciasService } from '../services/PreferenciasService';

/** Preferências atuais do tutor. A tela se atualiza sozinha quando alguma mudar. */
export function usePreferencias() {
  const [prefs, setPrefs] = useState(() => preferenciasService.obter());
  useEffect(() => preferenciasService.assinar(setPrefs), []);
  return prefs;
}
