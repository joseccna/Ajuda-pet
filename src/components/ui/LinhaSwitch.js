import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { espaco, raio, useTheme } from '../../theme';
import { Texto } from './Texto';

/** Linha com título, explicação e um interruptor. O leitor de tela anuncia o título e o estado. */
export function LinhaSwitch({ titulo, detalhe, valor, aoMudar, desabilitado = false }) {
  const { paleta } = useTheme();
  return (
    <View style={[styles.linha, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
      <View style={{ flex: 1 }}>
        <Texto variante="corpoMedio">{titulo}</Texto>
        {detalhe ? <Texto variante="legenda">{detalhe}</Texto> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={aoMudar}
        disabled={desabilitado}
        accessibilityLabel={titulo}
        trackColor={{ false: paleta.campo, true: paleta.primario }}
        thumbColor={paleta.cartao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.md,
    marginBottom: espaco.lg,
  },
});
