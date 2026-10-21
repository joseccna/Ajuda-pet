import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ALVO_MINIMO, espaco, fontes, useTheme } from '../../theme';
import { Texto } from '../ui/Texto';

/** Abas do perfil do pet (Resumo, Saúde...). As abas novas entram na lista conforme o app cresce. */
export function TabsPet({ abas, atual, aoMudar }) {
  const { paleta } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.barra, { borderBottomColor: paleta.linha }]}>
      {abas.map((a) => {
        const ativa = a.chave === atual;
        return (
          <Pressable
            key={a.chave}
            onPress={() => aoMudar(a.chave)}
            accessibilityRole="tab"
            accessibilityLabel={a.rotulo}
            accessibilityState={{ selected: ativa }}
            style={[styles.aba, { borderBottomColor: ativa ? paleta.primario : 'transparent' }]}
          >
            <Texto
              style={{
                fontFamily: ativa ? fontes.corpoNegrito : fontes.corpoMedio,
                color: ativa ? paleta.primarioTexto : paleta.textoSuave,
              }}
            >
              {a.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: espaco.lg },
  aba: {
    flex: 1,
    minHeight: ALVO_MINIMO + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    marginBottom: -1,
  },
});
