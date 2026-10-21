import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { preferenciasService } from '../services/PreferenciasService';
import { claro, escuro, memorialClaro, memorialEscuro } from './colors';
const Contexto = createContext(null);
export function ThemeProvider({ children }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferencia] = useState(() => preferenciasService.obter().tema);
  const definirPreferencia = useCallback((tema) => {
    preferenciasService.salvar({ tema });
    setPreferencia(tema);
  }, []);
  const valor = useMemo(() => {
    const usaEscuro = preferencia === 'escuro' || (preferencia === 'automatico' && sistema === 'dark');
    return {
      paleta: usaEscuro ? escuro : claro,
      escuro: usaEscuro,
      preferencia,
      definirPreferencia,
    };
  }, [preferencia, sistema, definirPreferencia]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
export function useTheme() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useTheme precisa estar dentro de ThemeProvider');
  return ctx;
}

/**
 * Dentro dele, o app usa a paleta do Memorial (lilás), no modo claro ou escuro conforme o tema atual.
 * Envolva as telas do memorial com este componente.
 */
export function TemaMemorial({ children }) {
  const base = useTheme();
  const valor = useMemo(() => ({ ...base, paleta: base.escuro ? memorialEscuro : memorialClaro }), [base]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
