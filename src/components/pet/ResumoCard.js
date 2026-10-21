import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, fontes, useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Texto } from '../ui/Texto';

/** Cartão do Resumo do pet: ícone, o que é, o valor principal e um detalhe opcional. */
export function ResumoCard({ icone, titulo, valor, detalhe, aoPressionar }) {
  const { paleta } = useTheme();
  return (
    <Card aoPressionar={aoPressionar} rotuloAcessibilidade={`${titulo}: ${valor}`} style={styles.card}>
      <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
        <Ionicons name={icone} size={22} color={paleta.primarioTexto} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="legenda">{titulo}</Texto>
        <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }}>
          {valor}
        </Texto>
        {detalhe}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, marginBottom: espaco.sm },
  icone: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
