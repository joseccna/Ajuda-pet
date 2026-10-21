import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { descreverIntervalo } from '../../models/catalogoVacinas';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { formatarDataCurta, paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { SituacaoBadge } from '../ui/SituacaoBadge';
import { Texto } from '../ui/Texto';

/** Cartão de um tipo de cuidado, com o histórico de registros dentro (mesmo desenho da carteirinha). */
export function CuidadoCard({ item, abertoInicialmente = false, aoRegistrar, aoEditar, aoExcluirTipo }) {
  const { paleta } = useTheme();
  const [aberto, setAberto] = useState(abertoInicialmente);
  const { tipo, registros, proxima, situacao, texto } = item;
  const detalhe = proxima
    ? `Próxima: ${formatarDataCurta(proxima)}`
    : descreverIntervalo(tipo.intervaloDias).replace('Reforço', 'Repete');

  return (
    <View style={[styles.cartao, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${tipo.nome}, ${texto}`}
        accessibilityHint={aberto ? 'Esconde o histórico' : 'Mostra o histórico'}
        accessibilityState={{ expanded: aberto }}
        style={styles.cabecalho}
      >
        <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
          <Ionicons name={tipo.icone} size={24} color={paleta.primarioTexto} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }}>
            {tipo.nome}
          </Texto>
          <Texto variante="legenda">{detalhe}</Texto>
          <SituacaoBadge estado={situacao.estado} texto={texto} />
        </View>
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color={paleta.textoSuave} />
      </Pressable>

      {aberto ? (
        <View>
          {registros.length === 0 ? (
            <Texto variante="legenda" style={styles.vazio}>
              Nenhum registro ainda.
            </Texto>
          ) : (
            registros.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => aoEditar(r)}
                accessibilityRole="button"
                accessibilityLabel={`${formatarDataCurta(r.data)}${r.local ? `, ${r.local}` : ''}`}
                accessibilityHint="Abre o registro para editar"
                style={[styles.registro, { borderTopColor: paleta.linha }]}
              >
                <View style={{ flex: 1 }}>
                  <Texto variante="corpoMedio">{formatarDataCurta(r.data)}</Texto>
                  {r.local ? <Texto variante="legenda">{r.local}</Texto> : null}
                </View>
                <Texto variante="legenda">{r.data > paraISO(new Date()) ? 'Agendado' : 'Feito'}</Texto>
              </Pressable>
            ))
          )}
          <View style={[styles.rodape, { borderTopColor: paleta.linha }]}>
            <Button titulo="Registrar" icone="add" aoPressionar={aoRegistrar} />
            <Button
              titulo="Excluir este cuidado"
              variante="texto"
              larguraTotal={false}
              aoPressionar={aoExcluirTipo}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { borderWidth: 1, borderRadius: raio.lg, marginBottom: espaco.md, overflow: 'hidden' },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.lg,
    minHeight: 88,
  },
  icone: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  vazio: { paddingHorizontal: espaco.lg, paddingBottom: espaco.md },
  registro: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
    borderTopWidth: 1,
  },
  rodape: { padding: espaco.md, borderTopWidth: 1, gap: espaco.xs, alignItems: 'stretch' },
});
