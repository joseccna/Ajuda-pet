import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { Texto } from './Texto';
export function Button({
  titulo,
  aoPressionar,
  variante = 'primario',
  icone,
  carregando = false,
  desabilitado = false,
  larguraTotal = true,
  dicaAcessibilidade,
  style,
}) {
  const { paleta } = useTheme();
  const inativo = desabilitado || carregando;
  const cores = {
    primario: { fundo: paleta.primario, texto: paleta.sobrePrimario, borda: paleta.primario },
    secundario: { fundo: paleta.cartao, texto: paleta.destaque, borda: paleta.destaque },
    perigo: { fundo: paleta.cartao, texto: paleta.erro, borda: paleta.erro },
    texto: { fundo: 'transparent', texto: paleta.primarioTexto, borda: 'transparent' },
  }[variante];
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dicaAcessibilidade}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: cores.fundo, borderColor: cores.borda },
        larguraTotal && styles.total,
        inativo && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <View style={styles.conteudo}>
        {carregando ? (
          <ActivityIndicator color={cores.texto} />
        ) : icone ? (
          <Ionicons name={icone} size={20} color={cores.texto} />
        ) : null}
        <Texto
          style={{
            flexShrink: 1,
            textAlign: 'center',
            color: cores.texto,
            fontFamily: fontes.corpoNegrito,
            textDecorationLine: variante === 'texto' ? 'underline' : 'none',
          }}
        >
          {titulo}
        </Texto>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  botao: {
    minHeight: 48,
    borderRadius: raio.md,
    borderWidth: 1.5,
    paddingHorizontal: espaco.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  total: { alignSelf: 'stretch' },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
});
