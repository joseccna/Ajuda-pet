import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { fontes, useTheme } from '../../theme';
import { Texto } from './Texto';
/** Foto redonda do pet. Sem foto, mostra a inicial do nome. */
export function Avatar({ uri, nome, tamanho = 64 }) {
  const { paleta } = useTheme();
  const base = {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    borderColor: paleta.cartao,
  };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityRole="image"
        accessibilityLabel={`Foto de ${nome}`}
        style={[styles.borda, base, { backgroundColor: paleta.linha }]}
      />
    );
  }
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${nome}, sem foto`}
      style={[styles.borda, styles.centro, base, { backgroundColor: paleta.primarioSuave }]}
    >
      <Texto
        style={{ fontFamily: fontes.titulo, fontSize: tamanho * 0.42, color: paleta.primarioTexto }}
        importantForAccessibility="no"
      >
        {nome.trim().charAt(0).toUpperCase() || '?'}
      </Texto>
    </View>
  );
}
const styles = StyleSheet.create({
  borda: { borderWidth: 3 },
  centro: { alignItems: 'center', justifyContent: 'center' },
});
