import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConsultas } from '../../hooks/useConsultas';
import { textoQuando } from '../../models/regrasConsulta';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { formatarDataCurta, paraISO } from '../../utils/datas';
import { formatarReais } from '../../utils/dinheiro';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EstadoVazio } from '../ui/EstadoVazio';
import { Texto } from '../ui/Texto';

function Item({ consulta, anexos, aoPressionar, primeiro }) {
  const { paleta } = useTheme();
  const detalhe = [formatarDataCurta(consulta.data), consulta.veterinario].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`${consulta.motivo}, ${detalhe}`}
      accessibilityHint="Abre os detalhes da consulta"
      style={[styles.linha, !primeiro && { borderTopWidth: 1, borderTopColor: paleta.linha }]}
    >
      <View style={{ flex: 1 }}>
        <Texto variante="corpoMedio">{consulta.motivo}</Texto>
        <Texto variante="legenda">{detalhe}</Texto>
      </View>
      {anexos ? (
        <View style={styles.anexos} accessibilityLabel={`${anexos} anexo${anexos > 1 ? 's' : ''}`}>
          <Ionicons name="attach" size={16} color={paleta.textoSuave} />
          <Texto variante="legenda">{anexos}</Texto>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={paleta.textoSuave} />
    </Pressable>
  );
}

/** Consultas do pet: próxima, gasto do ano (privado) e histórico. */
export function SecaoConsultas({ pet, irPara }) {
  const { paleta } = useTheme();
  const { resumo } = useConsultas(pet.id);
  const { proxima, agendadas, historico, anexosPorConsulta, ano, gastoAnoCentavos } = resumo;
  const hojeISO = paraISO(new Date());
  const abrir = (c) => irPara('/pet/[id]/consulta', { consultaId: c.id });
  const novaConsulta = () => irPara('/pet/[id]/consulta');

  if (!proxima && historico.length === 0) {
    return (
      <EstadoVazio
        icone="medkit-outline"
        titulo="Nenhuma consulta registrada"
        texto="Registre as consultas, com diagnóstico e receitas, ou agende a próxima."
      >
        <Button titulo="Registrar consulta" icone="add" aoPressionar={novaConsulta} />
      </EstadoVazio>
    );
  }

  const outras = agendadas.slice(1);

  return (
    <View>
      <Texto variante="rotulo" style={styles.titulo}>
        Próxima consulta
      </Texto>
      {proxima ? (
        <Card
          aoPressionar={() => abrir(proxima)}
          rotuloAcessibilidade={`${proxima.motivo}, ${textoQuando(proxima, hojeISO)}`}
          dicaAcessibilidade="Abre os detalhes da consulta"
          style={{ backgroundColor: paleta.destaqueSuave, borderColor: paleta.destaqueSuave }}
        >
          <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }} cor="destaque">
            {proxima.motivo}
          </Texto>
          <Texto variante="corpoMedio" cor="destaque">
            {textoQuando(proxima, hojeISO)}
          </Texto>
          {proxima.veterinario ? (
            <Texto variante="legenda" cor="destaque">
              {proxima.veterinario}
              {proxima.clinica ? `, ${proxima.clinica}` : ''}
            </Texto>
          ) : null}
        </Card>
      ) : (
        <Card>
          <Texto variante="subtitulo" style={{ marginBottom: 4 }}>
            Nenhuma consulta agendada
          </Texto>
          <Button
            titulo="Agendar consulta"
            variante="secundario"
            icone="calendar-outline"
            aoPressionar={novaConsulta}
          />
        </Card>
      )}

      {outras.length > 0 ? (
        <>
          <Texto variante="rotulo" style={styles.titulo}>
            Outras agendadas
          </Texto>
          <View style={[styles.lista, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
            {outras.map((c, i) => (
              <Item
                key={c.id}
                consulta={c}
                anexos={anexosPorConsulta[c.id]}
                aoPressionar={() => abrir(c)}
                primeiro={i === 0}
              />
            ))}
          </View>
        </>
      ) : null}

      {gastoAnoCentavos > 0 ? (
        <View style={[styles.gasto, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
          <View>
            <Texto variante="legenda">Gasto em {ano}</Texto>
            <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }}>
              {formatarReais(gastoAnoCentavos)}
            </Texto>
          </View>
          <View style={styles.privado}>
            <Ionicons name="lock-closed-outline" size={16} color={paleta.textoSuave} />
            <Texto variante="legenda">Só você vê</Texto>
          </View>
        </View>
      ) : null}

      <Texto variante="rotulo" style={styles.titulo}>
        Histórico
      </Texto>
      {historico.length === 0 ? (
        <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
          Ainda não há consultas passadas.
        </Texto>
      ) : (
        <View style={[styles.lista, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
          {historico.map((c, i) => (
            <Item
              key={c.id}
              consulta={c}
              anexos={anexosPorConsulta[c.id]}
              aoPressionar={() => abrir(c)}
              primeiro={i === 0}
            />
          ))}
        </View>
      )}

      <View style={{ marginTop: espaco.lg }}>
        <Button titulo="Registrar consulta" icone="add" aoPressionar={novaConsulta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { marginTop: espaco.sm, marginBottom: espaco.sm },
  lista: { borderWidth: 1, borderRadius: raio.lg, overflow: 'hidden', marginBottom: espaco.lg },
  linha: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
  },
  anexos: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  gasto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espaco.md,
    marginBottom: espaco.lg,
  },
  privado: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
