export { claro, escuro, memorialClaro, memorialEscuro } from './colors';
export { ThemeProvider, TemaMemorial, useTheme } from './ThemeProvider';
export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const raio = { sm: 10, md: 14, lg: 18, pill: 999 };
/** Menor área de toque aceitável (em pontos). */
export const ALVO_MINIMO = 44;
export const fontes = {
  titulo: 'Nunito_800ExtraBold',
  subtitulo: 'Nunito_700Bold',
  corpo: 'DMSans_400Regular',
  corpoMedio: 'DMSans_500Medium',
  corpoNegrito: 'DMSans_700Bold',
  /** Fonte com serifa, usada só na homenagem do memorial. */
  serifa: 'Lora_500Medium',
};
