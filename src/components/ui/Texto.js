import React from 'react';
import { Text } from 'react-native';
import { fontes, useTheme } from '../../theme';
const ESTILOS = {
  titulo: { fontFamily: fontes.titulo, fontSize: 28, lineHeight: 34 },
  subtitulo: { fontFamily: fontes.subtitulo, fontSize: 20, lineHeight: 26 },
  corpo: { fontFamily: fontes.corpo, fontSize: 16, lineHeight: 23 },
  corpoMedio: { fontFamily: fontes.corpoMedio, fontSize: 16, lineHeight: 23 },
  rotulo: { fontFamily: fontes.corpoNegrito, fontSize: 14, lineHeight: 20 },
  legenda: { fontFamily: fontes.corpo, fontSize: 14, lineHeight: 20 },
};
/** Texto padrão do app: fonte, tamanho e cor vêm do tema. */
export function Texto({ variante = 'corpo', cor, style, ...resto }) {
  const { paleta } = useTheme();
  const corPadrao = variante === 'legenda' ? 'textoSuave' : 'texto';
  return <Text {...resto} style={[ESTILOS[variante], { color: paleta[cor ?? corPadrao] }, style]} />;
}
