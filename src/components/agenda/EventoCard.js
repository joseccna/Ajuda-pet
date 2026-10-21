import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { Texto } from '../ui/Texto';

/**
 * Evento da agenda: faixa colorida, ícone, título, quando e a hora (se tiver).
 * A cor reforça o estado, mas o texto sempre diz o mesmo.
 */
export function EventoCard({ evento, aoPressionar }) {
  const { paleta } = useTheme();
  const cores = {
    atrasado: { faixa: paleta.primario, fundo: paleta.primarioSuave, texto: paleta.primarioTexto },
    hoje: { faixa: paleta.destaque, fundo: paleta.destaqueSuave, texto: paleta.destaque },
    futuro: { faixa: paleta.aviso, fundo: paleta.avisoSuave, texto: paleta.aviso },
    passado: { faixa: paleta.campo, fundo: paleta.linha, texto: paleta.textoSuave },
  }[evento.estado];

  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`${evento.titulo}, ${evento.texto}`}
      accessibilityHint="Abre os detalhes"
      style={({ pressed }) => [
        styles.cartao,
        { backgroundColor: paleta.cartao, borderColor: paleta.linha },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.faixa, { backgroundColor: cores.faixa }]} />
      <View style={[styles.icone, { backgroundColor: cores.fundo }]}>
        <Ionicons name={evento.icone} size={22} color={cores.texto} />
      </View>
      <View style={{ flex: 1 }}>
        <Texto variante="corpoMedio" style={{ fontFamily: fontes.corpoNegrito }} numberOfLines={1}>
          {evento.titulo}
        </Texto>
        <Texto variante="rotulo" style={{ color: cores.texto }}>
          {evento.texto}
        </Texto>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={paleta.textoSuave}
        style={{ marginRight: espaco.md }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 68,
    borderWidth: 1,
    borderRadius: raio.md,
    marginBottom: espaco.sm,
    overflow: 'hidden',
  },
  faixa: { alignSelf: 'stretch', width: 6 },
  icone: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
