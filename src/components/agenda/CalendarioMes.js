import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pontosDoDia } from '../../models/regrasAgenda';
import { ALVO_MINIMO, espaco, fontes, raio, useTheme } from '../../theme';
import { NOMES_MESES, tituloDoDia } from '../../utils/datas';
import { Texto } from '../ui/Texto';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function Legenda({ cor, rotulo }) {
  return (
    <View style={styles.legendaItem}>
      <View style={[styles.ponto, { backgroundColor: cor }]} />
      <Texto variante="legenda" style={{ fontSize: 13 }}>
        {rotulo}
      </Texto>
    </View>
  );
}

/**
 * Calendário do mês. Os pontos coloridos mostram o que há em cada dia:
 * coral (atrasado), verde (hoje), âmbar (em breve) e cinza (já aconteceu).
 * Cada dia tem um nome completo para leitores de tela, com a quantidade de lembretes.
 */
export function CalendarioMes({
  ano,
  mes,
  grade,
  eventosPorDia,
  selecionado,
  hojeISO,
  aoSelecionar,
  aoMudarMes,
}) {
  const { paleta } = useTheme();
  const cores = { coral: paleta.primario, verde: paleta.destaque, ambar: paleta.aviso, neutro: paleta.campo };
  const semanas = [];
  for (let i = 0; i < grade.length; i += 7) semanas.push(grade.slice(i, i + 7));
  const nomeMes = NOMES_MESES[mes];

  return (
    <View style={[styles.caixa, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
      <View style={styles.topo}>
        <Pressable
          onPress={() => aoMudarMes(-1)}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={styles.seta}
        >
          <Ionicons name="chevron-back" size={22} color={paleta.texto} />
        </Pressable>
        <Texto variante="subtitulo" accessibilityRole="header" style={{ fontFamily: fontes.titulo }}>
          {`${nomeMes.charAt(0).toUpperCase()}${nomeMes.slice(1)} de ${ano}`}
        </Texto>
        <Pressable
          onPress={() => aoMudarMes(1)}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={styles.seta}
        >
          <Ionicons name="chevron-forward" size={22} color={paleta.texto} />
        </Pressable>
      </View>

      <View style={styles.linha} importantForAccessibility="no-hide-descendants">
        {DIAS.map((d) => (
          <Texto key={d} variante="legenda" style={styles.diaSemana}>
            {d}
          </Texto>
        ))}
      </View>

      {semanas.map((semana) => (
        <View key={semana[0].data} style={styles.linha}>
          {semana.map((dia) => {
            const eventos = eventosPorDia[dia.data] ?? [];
            const marcado = dia.data === selecionado;
            const ehHoje = dia.data === hojeISO;
            const pontos = pontosDoDia(eventos).slice(0, 3);
            const rotulo = `${tituloDoDia(dia.data)}${ehHoje ? ', hoje' : ''}${
              eventos.length > 0 ? `, ${eventos.length} lembrete${eventos.length > 1 ? 's' : ''}` : ''
            }`;
            return (
              <Pressable
                key={dia.data}
                onPress={() => aoSelecionar(dia.data)}
                accessibilityRole="button"
                accessibilityLabel={rotulo}
                accessibilityState={{ selected: marcado }}
                style={[
                  styles.dia,
                  marcado && { backgroundColor: paleta.primario },
                  !marcado && ehHoje && { borderWidth: 2, borderColor: paleta.primario },
                ]}
              >
                <Texto
                  style={{
                    fontSize: 15,
                    lineHeight: 20,
                    fontFamily: marcado || ehHoje ? fontes.corpoNegrito : fontes.corpoMedio,
                    color: marcado ? paleta.sobrePrimario : dia.doMes ? paleta.texto : paleta.textoSuave,
                  }}
                  importantForAccessibility="no"
                >
                  {dia.numero}
                </Texto>
                <View style={styles.pontos}>
                  {pontos.map((p) => (
                    <View
                      key={p}
                      style={[styles.ponto, { backgroundColor: marcado ? paleta.sobrePrimario : cores[p] }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.legenda}>
        <Legenda cor={cores.coral} rotulo="Atrasado" />
        <Legenda cor={cores.verde} rotulo="Hoje" />
        <Legenda cor={cores.ambar} rotulo="Em breve" />
        <Legenda cor={cores.neutro} rotulo="Já passou" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { borderWidth: 1, borderRadius: raio.lg, padding: espaco.sm, marginBottom: espaco.lg },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.xs,
  },
  seta: { width: ALVO_MINIMO, height: ALVO_MINIMO, alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row' },
  diaSemana: { flex: 1, textAlign: 'center', fontSize: 12, paddingVertical: 4 },
  dia: { flex: 1, height: 50, borderRadius: raio.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pontos: { flexDirection: 'row', gap: 3, height: 6 },
  ponto: { width: 6, height: 6, borderRadius: 3 },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.md,
    paddingHorizontal: espaco.sm,
    paddingTop: espaco.sm,
  },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
