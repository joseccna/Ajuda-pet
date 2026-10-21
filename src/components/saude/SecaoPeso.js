import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PERIODOS, formatarDiferenca, formatarPeso } from '../../models/regrasPeso';
import { usePeso } from '../../hooks/usePeso';
import { usePreferencias } from '../../hooks/usePreferencias';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { formatarDataCurta } from '../../utils/datas';
import { Button } from '../ui/Button';
import { ChipSelector } from '../ui/ChipSelector';
import { EstadoVazio } from '../ui/EstadoVazio';
import { Texto } from '../ui/Texto';
import { GraficoPeso } from './GraficoPeso';

const VISIVEIS = 5;

/** Peso do pet: peso atual, variação no período, gráfico e histórico. */
export function SecaoPeso({ pet, irPara }) {
  const { paleta } = useTheme();
  const { unidadePeso } = usePreferencias();
  const [periodo, setPeriodo] = useState('6m');
  const [todas, setTodas] = useState(false);
  const { resumo } = usePeso(pet.id, periodo);
  const { registros, serie, atual, variacao, avisoVariacao } = resumo;

  if (registros.length === 0) {
    return (
      <EstadoVazio
        icone="scale-outline"
        titulo="Nenhuma pesagem ainda"
        texto={`Registre o peso ${pet.deNome} para acompanhar a evolução em um gráfico.`}
      >
        <Button titulo="Registrar primeiro peso" icone="add" aoPressionar={() => irPara('/pet/[id]/peso')} />
      </EstadoVazio>
    );
  }

  const periodoRotulo = PERIODOS.find((p) => p.valor === periodo)?.rotulo.toLowerCase();
  const lista = todas ? registros : registros.slice(0, VISIVEIS);

  return (
    <View>
      {atual ? (
        <View style={styles.atual}>
          <View>
            <Texto variante="legenda">Peso atual</Texto>
            <Texto variante="titulo" style={{ fontFamily: fontes.titulo }}>
              {formatarPeso(atual.pesoG, unidadePeso)}
            </Texto>
          </View>
          {variacao !== null ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Texto variante="legenda">Em {periodoRotulo}</Texto>
              <Texto variante="subtitulo" cor="destaque">
                {formatarDiferenca(variacao, unidadePeso)}
              </Texto>
            </View>
          ) : null}
        </View>
      ) : null}

      <ChipSelector
        rotulo="Período"
        valor={periodo}
        aoMudar={setPeriodo}
        opcoes={PERIODOS.map((p) => ({ valor: p.valor, rotulo: p.rotulo }))}
      />

      {serie.length === 0 ? (
        <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
          Nenhuma pesagem nesse período.
        </Texto>
      ) : (
        <GraficoPeso serie={serie} />
      )}

      {avisoVariacao ? (
        <View style={[styles.aviso, { backgroundColor: paleta.avisoSuave }]}>
          <Texto variante="corpoMedio" cor="aviso">
            O peso {pet.deNome} variou bastante nos últimos 2 meses.
          </Texto>
          <Texto variante="legenda" cor="aviso">
            Vale comentar com o veterinário.
          </Texto>
        </View>
      ) : null}

      <Button titulo="Registrar peso" icone="add" aoPressionar={() => irPara('/pet/[id]/peso')} />

      <Texto variante="rotulo" style={styles.titulo}>
        Histórico
      </Texto>
      <View style={[styles.lista, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
        {lista.map((r, i) => {
          const anterior = registros[registros.indexOf(r) + 1];
          const diferenca = anterior ? r.pesoG - anterior.pesoG : null;
          return (
            <Pressable
              key={r.id}
              onPress={() => irPara('/pet/[id]/peso', { registroId: r.id })}
              accessibilityRole="button"
              accessibilityLabel={`${formatarPeso(r.pesoG, unidadePeso)}, ${formatarDataCurta(r.data)}`}
              accessibilityHint="Abre a pesagem para editar"
              style={[styles.linha, i > 0 && { borderTopWidth: 1, borderTopColor: paleta.linha }]}
            >
              <View style={{ flex: 1 }}>
                <Texto variante="corpoMedio">{formatarPeso(r.pesoG, unidadePeso)}</Texto>
                <Texto variante="legenda">
                  {formatarDataCurta(r.data)}
                  {r.observacao ? `, ${r.observacao}` : ''}
                </Texto>
              </View>
              {diferenca !== null ? (
                <Texto variante="legenda">{formatarDiferenca(diferenca, unidadePeso)}</Texto>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {registros.length > VISIVEIS ? (
        <Button
          titulo={todas ? 'Ver menos' : `Ver todas as ${registros.length} pesagens`}
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => setTodas((v) => !v)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  atual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: espaco.lg,
  },
  aviso: { padding: espaco.md, borderRadius: raio.md, marginBottom: espaco.lg, gap: 2 },
  titulo: { marginTop: espaco.xl, marginBottom: espaco.sm },
  lista: { borderWidth: 1, borderRadius: raio.lg, overflow: 'hidden' },
  linha: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
  },
});
