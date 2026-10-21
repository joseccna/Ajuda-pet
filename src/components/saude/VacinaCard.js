import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { descreverIntervalo } from '../../models/catalogoVacinas';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { formatarDataCurta } from '../../utils/datas';
import { Button } from '../ui/Button';
import { SituacaoBadge } from '../ui/SituacaoBadge';
import { Texto } from '../ui/Texto';
import { DoseItem } from './DoseItem';

/**
 * Cartão da carteirinha: um tipo de vacina, sua situação e o histórico de doses.
 * "item" vem de VacinaService.carteirinha().
 */
export function VacinaCard({ item, abertoInicialmente = false, aoRegistrarDose, aoEditarDose }) {
  const { paleta } = useTheme();
  const [aberto, setAberto] = useState(abertoInicialmente);
  const { tipo, doses, proxima, situacao, texto } = item;

  const proximaTexto = proxima
    ? `Próxima dose: ${formatarDataCurta(proxima)}`
    : descreverIntervalo(tipo.intervaloDias);

  return (
    <View style={[styles.cartao, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${tipo.nome}, ${texto}`}
        accessibilityHint={aberto ? 'Esconde as doses' : 'Mostra as doses'}
        accessibilityState={{ expanded: aberto }}
        style={styles.cabecalho}
      >
        <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={paleta.primarioTexto} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }}>
            {tipo.nome}
          </Texto>
          <Texto variante="legenda">{proximaTexto}</Texto>
          <SituacaoBadge estado={situacao.estado} texto={texto} />
        </View>
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color={paleta.textoSuave} />
      </Pressable>

      {aberto ? (
        <View>
          {doses.length === 0 ? (
            <Texto variante="legenda" style={styles.vazio}>
              Nenhuma dose registrada ainda.
            </Texto>
          ) : (
            doses.map((d) => <DoseItem key={d.id} dose={d} aoPressionar={() => aoEditarDose(d)} />)
          )}
          <View style={[styles.rodape, { borderTopColor: paleta.linha }]}>
            <Button titulo="Registrar dose" icone="add" aoPressionar={aoRegistrarDose} />
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
  rodape: { padding: espaco.md, borderTopWidth: 1 },
});
