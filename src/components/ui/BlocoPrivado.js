import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, raio, useTheme } from '../../theme';
import { Texto } from './Texto';

/**
 * Agrupa campos que ficam só neste aparelho. O cadeado e a explicação deixam claro
 * que nada daqui é enviado a outras pessoas.
 */
export function BlocoPrivado({ titulo = 'Privado', nota, children }) {
  const { paleta } = useTheme();
  return (
    <View style={[styles.caixa, { borderColor: paleta.campo }]}>
      <View style={styles.topo}>
        <Ionicons name="lock-closed-outline" size={18} color={paleta.textoSuave} />
        <Texto variante="corpoMedio" accessibilityRole="header">
          {titulo}
        </Texto>
      </View>
      {children}
      {nota ? <Texto variante="legenda">{nota}</Texto> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: raio.lg,
    padding: espaco.lg,
    marginBottom: espaco.lg,
    gap: espaco.sm,
  },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginBottom: espaco.xs },
});
