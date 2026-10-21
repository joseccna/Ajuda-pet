import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { usePasseios } from '../../hooks/useRotina';
import { formatarDuracao } from '../../models/regrasPasseio';
import { passeioService } from '../../services/PasseioService';
import { espaco, useTheme } from '../../theme';
import { formatarDataCurta } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Texto } from '../ui/Texto';
import { GraficoSemanal } from './GraficoSemanal';

/** Passeios: semana em barras, meta do dia, último passeio e o botão de iniciar (ou voltar ao que está em andamento). */
export function CartaoPasseios({ pet, irPara }) {
  const { paleta } = useTheme();
  const { resumo } = usePasseios(pet.id);
  const { semana, ativo, ultimo, total } = resumo;

  function iniciar() {
    try {
      const passeio = passeioService.iniciar(pet.id);
      irPara('/pet/[id]/passeio', { passeioId: passeio.id });
    } catch {
      Alert.alert(
        'Não foi possível iniciar o passeio',
        'Tente de novo. Se o problema continuar, reinicie o app.',
      );
    }
  }

  return (
    <Card>
      <View style={styles.topo}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Passeios
        </Texto>
        {total > 0 ? (
          <Button
            titulo="Ver histórico"
            variante="texto"
            larguraTotal={false}
            aoPressionar={() => irPara('/pet/[id]/passeios')}
          />
        ) : null}
      </View>

      <GraficoSemanal dias={semana.dias} metaMin={semana.metaMin} />

      <View style={styles.resumo}>
        <Texto variante="legenda">Nesta semana</Texto>
        <Texto variante="corpoMedio">
          {formatarDuracao(semana.totalMin)}, meta de {semana.metaMin} min por dia
        </Texto>
      </View>
      {ultimo ? (
        <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
          Último passeio: {formatarDataCurta(ultimo.inicio.slice(0, 10))},{' '}
          {formatarDuracao(ultimo.duracaoMin)}
        </Texto>
      ) : (
        <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
          Nenhum passeio registrado ainda.
        </Texto>
      )}

      {ativo ? (
        <View style={[styles.aviso, { backgroundColor: paleta.destaqueSuave }]}>
          <Texto variante="corpoMedio" cor="destaque">
            Passeio em andamento
          </Texto>
        </View>
      ) : null}
      <View style={{ gap: espaco.sm }}>
        {ativo ? (
          <Button
            titulo="Voltar ao passeio"
            icone="timer-outline"
            aoPressionar={() => irPara('/pet/[id]/passeio', { passeioId: ativo.id })}
          />
        ) : (
          <Button titulo="Iniciar passeio" icone="play" aoPressionar={iniciar} />
        )}
        <Button
          titulo="Registrar passeio que já fiz"
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => irPara('/pet/[id]/passeio-registro')}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.sm,
  },
  resumo: { marginTop: espaco.md, marginBottom: espaco.xs },
  aviso: { padding: espaco.md, borderRadius: 14, marginBottom: espaco.sm },
});
