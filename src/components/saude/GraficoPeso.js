import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { calcularPontos, escolherRotulos, formatarPeso } from '../../models/regrasPeso';
import { usePreferencias } from '../../hooks/usePreferencias';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { formatarDataCurta } from '../../utils/datas';
import { Texto } from '../ui/Texto';

const ALTURA = 170;

function diaMes(iso) {
  return formatarDataCurta(iso).split(' ').slice(0, 2).join(' ');
}

/**
 * Gráfico de linha do peso. Mostra o valor do primeiro e do último ponto (e dos do meio
 * quando há espaço) e as datas das pontas. Traz uma descrição em texto para leitores de tela.
 */
export function GraficoPeso({ serie }) {
  const { paleta } = useTheme();
  const { unidadePeso } = usePreferencias();
  const [largura, setLargura] = useState(0);

  if (serie.length === 0) return null;

  const { pontos, linha } = calcularPontos(serie, Math.max(largura, 200), ALTURA);
  const primeiro = serie[0];
  const ultimo = serie[serie.length - 1];
  const descricao =
    serie.length === 1
      ? `Gráfico de peso: ${formatarPeso(ultimo.pesoG, unidadePeso)} em ${formatarDataCurta(ultimo.data)}`
      : `Gráfico de peso: de ${formatarPeso(primeiro.pesoG, unidadePeso)} em ${formatarDataCurta(primeiro.data)} a ${formatarPeso(ultimo.pesoG, unidadePeso)} em ${formatarDataCurta(ultimo.data)}`;

  const rotulados = escolherRotulos(pontos);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={descricao}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      style={[styles.caixa, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}
    >
      {largura > 0 ? (
        <Svg width={largura} height={ALTURA}>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line
              key={f}
              x1={16}
              x2={largura - 16}
              y1={28 + (ALTURA - 56) * f}
              y2={28 + (ALTURA - 56) * f}
              stroke={paleta.linha}
              strokeWidth={1}
            />
          ))}
          {pontos.length > 1 ? (
            <Polyline
              points={linha}
              fill="none"
              stroke={paleta.destaque}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {pontos.map((p, i) => {
            const ultimoPonto = i === pontos.length - 1;
            return (
              <React.Fragment key={`${p.data}-${i}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={ultimoPonto ? 7 : 5}
                  fill={ultimoPonto ? paleta.destaque : paleta.cartao}
                  stroke={paleta.destaque}
                  strokeWidth={3}
                />
                {rotulados[i] ? (
                  <SvgText
                    x={p.x}
                    y={p.y - 14}
                    fontSize={13}
                    fontFamily={fontes.corpoNegrito}
                    fill={paleta.texto}
                    textAnchor="middle"
                  >
                    {formatarPeso(p.pesoG, unidadePeso)}
                  </SvgText>
                ) : null}
              </React.Fragment>
            );
          })}
          <SvgText
            x={pontos[0].x}
            y={ALTURA - 8}
            fontSize={12}
            fontFamily={fontes.corpo}
            fill={paleta.textoSuave}
            textAnchor="start"
          >
            {diaMes(primeiro.data)}
          </SvgText>
          {serie.length > 1 ? (
            <SvgText
              x={pontos[pontos.length - 1].x}
              y={ALTURA - 8}
              fontSize={12}
              fontFamily={fontes.corpo}
              fill={paleta.textoSuave}
              textAnchor="end"
            >
              {diaMes(ultimo.data)}
            </SvgText>
          ) : null}
        </Svg>
      ) : null}
      {serie.length === 1 ? (
        <Texto variante="legenda" style={styles.dica}>
          Registre mais uma pesagem para ver a tendência.
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { borderWidth: 1, borderRadius: raio.lg, marginBottom: espaco.lg, minHeight: ALTURA },
  dica: { paddingHorizontal: espaco.lg, paddingBottom: espaco.md, textAlign: 'center' },
});
