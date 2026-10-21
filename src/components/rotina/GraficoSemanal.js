import React from 'react';
import { StyleSheet, View } from 'react-native';
import { formatarDuracao } from '../../models/regrasPasseio';
import { espaco, fontes, useTheme } from '../../theme';
import { Texto } from '../ui/Texto';

const ALTURA = 72;
const NOMES = {
  Seg: 'Segunda',
  Ter: 'Terça',
  Qua: 'Quarta',
  Qui: 'Quinta',
  Sex: 'Sexta',
  Sáb: 'Sábado',
  Dom: 'Domingo',
};

/**
 * Minutos de passeio por dia, de segunda a domingo. O dia de hoje fica em destaque e os dias
 * futuros ficam vazios. Traz uma descrição em texto para leitores de tela.
 */
export function GraficoSemanal({ dias, metaMin }) {
  const { paleta } = useTheme();
  const maximo = Math.max(metaMin, ...dias.map((d) => d.minutos)) * 1.1;

  const descricao = dias
    .filter((d) => !d.futuro)
    .map((d) => `${NOMES[d.rotulo]}: ${d.minutos === 0 ? 'sem passeio' : formatarDuracao(d.minutos)}`)
    .join('. ');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Passeios da semana. ${descricao}`}>
      <View style={styles.barras}>
        {dias.map((d) => {
          const altura = d.minutos > 0 ? Math.max(6, (d.minutos / maximo) * ALTURA) : 4;
          const cor = d.futuro
            ? paleta.linha
            : d.hoje
              ? paleta.destaque
              : d.minutos > 0
                ? paleta.decorVerde
                : paleta.campo;
          return (
            <View key={d.data} style={styles.coluna}>
              <View style={styles.area}>
                <View
                  style={[
                    styles.barra,
                    { height: altura, backgroundColor: cor, opacity: d.futuro ? 0.6 : 1 },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.rotulos}>
        {dias.map((d) => (
          <Texto
            key={d.data}
            variante="legenda"
            style={[styles.rotulo, d.hoje && { fontFamily: fontes.corpoNegrito, color: paleta.destaque }]}
            importantForAccessibility="no"
          >
            {d.rotulo}
          </Texto>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barras: { flexDirection: 'row', gap: espaco.sm, height: ALTURA },
  coluna: { flex: 1 },
  area: { flex: 1, justifyContent: 'flex-end' },
  barra: { width: '100%', borderRadius: 6 },
  rotulos: { flexDirection: 'row', gap: espaco.sm, marginTop: espaco.xs },
  rotulo: { flex: 1, textAlign: 'center', fontSize: 12 },
});
