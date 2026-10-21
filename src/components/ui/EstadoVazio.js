import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, useTheme } from '../../theme';
import { Texto } from './Texto';
/** Tela sem conteúdo ainda: explica o que fazer, sempre com uma ação clara. */
export function EstadoVazio({ icone, titulo, texto, children }) {
  const { paleta } = useTheme();
  return (
    <View style={styles.caixa}>
      <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
        <Ionicons name={icone} size={34} color={paleta.primarioTexto} />
      </View>
      <Texto variante="subtitulo" style={styles.centro}>
        {titulo}
      </Texto>
      <Texto variante="legenda" style={styles.centro}>
        {texto}
      </Texto>
      {children ? <View style={styles.acao}>{children}</View> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  caixa: { alignItems: 'center', gap: espaco.sm, paddingVertical: espaco.xxl, paddingHorizontal: espaco.lg },
  icone: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  centro: { textAlign: 'center' },
  acao: { alignSelf: 'stretch', marginTop: espaco.md },
});
