import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { Texto } from '../../../components/ui/Texto';
import { usePet } from '../../../hooks/usePet';
import { DIAS_HISTORICO_REFEICOES } from '../../../models/regrasAlimentacao';
import { alimentacaoService } from '../../../services/AlimentacaoService';
import { espaco, raio, useTheme } from '../../../theme';
import { formatarDataCurta, paraISO, somarDias } from '../../../utils/datas';

const SITUACAO = {
  feita: { icone: 'checkmark-circle', texto: 'Feita' },
  'nao-marcada': { icone: 'close-circle', texto: 'Não marcada' },
  pendente: { icone: 'ellipse-outline', texto: 'Pendente' },
};

function nomeDoDia(dataISO, hojeISO) {
  if (dataISO === hojeISO) return 'Hoje';
  if (dataISO === somarDias(hojeISO, -1)) return 'Ontem';
  return formatarDataCurta(dataISO);
}

/** Histórico de refeições do pet: dia a dia, o que foi feito e o que ficou sem marcar. */
export default function HistoricoDeRefeicoes() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { id } = useLocalSearchParams();
  const { pet } = usePet(id);
  const [dias, setDias] = useState([]);
  useFocusEffect(
    useCallback(() => {
      setDias(alimentacaoService.historicoRefeicoes(id));
    }, [id]),
  );

  const hojeISO = paraISO(new Date());
  const feitas = dias.reduce((t, d) => t + d.feitas, 0);
  const naoMarcadas = dias.reduce((t, d) => t + d.naoMarcadas, 0);
  const cor = {
    feita: paleta.destaque,
    'nao-marcada': paleta.primarioTexto,
    pendente: paleta.textoSuave,
  };

  return (
    <Screen>
      <Cabecalho
        titulo={pet ? `Refeições ${pet.deNome}` : 'Refeições'}
        aoVoltar={() => router.back()}
      />
      {dias.length === 0 ? (
        <EstadoVazio
          icone="restaurant-outline"
          titulo="Nenhuma refeição ainda"
          texto="As refeições aparecem aqui a partir da criação do plano alimentar."
        />
      ) : (
        <>
          <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
            Últimos {DIAS_HISTORICO_REFEICOES} dias: {feitas} {feitas === 1 ? 'feita' : 'feitas'}
            {naoMarcadas > 0
              ? `, ${naoMarcadas} ${naoMarcadas === 1 ? 'não marcada' : 'não marcadas'}`
              : ''}
            .
          </Texto>
          {dias.map((d) => (
            <View
              key={d.data}
              style={[
                styles.dia,
                {
                  borderColor: d.naoMarcadas > 0 ? paleta.primario : paleta.linha,
                  backgroundColor: paleta.cartao,
                },
              ]}
            >
              <View style={styles.topo}>
                <Texto variante="corpoMedio" accessibilityRole="header">
                  {nomeDoDia(d.data, hojeISO)}
                </Texto>
                <Texto variante="legenda">
                  {d.feitas} de {d.refeicoes.length}
                </Texto>
              </View>
              {d.refeicoes.map((r) => (
                <View
                  key={r.horario}
                  style={styles.linha}
                  accessible
                  accessibilityLabel={`${r.horario}, ${SITUACAO[r.situacao].texto}`}
                >
                  <Ionicons name={SITUACAO[r.situacao].icone} size={22} color={cor[r.situacao]} />
                  <Texto variante="corpo" style={{ flex: 1 }}>
                    {r.horario}
                  </Texto>
                  <Texto variante="legenda" style={{ color: cor[r.situacao] }}>
                    {SITUACAO[r.situacao].texto}
                  </Texto>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dia: {
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    marginBottom: espaco.md,
    gap: espaco.xs,
  },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: 36 },
});
