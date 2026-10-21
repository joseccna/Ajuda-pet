import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeviceIdentity } from '../../database/DeviceIdentity';
import { useAlimentacao } from '../../hooks/useRotina';
import { textoEstoque } from '../../models/regrasAlimentacao';
import { alimentacaoService } from '../../services/AlimentacaoService';
import { espaco, fontes, useTheme } from '../../theme';
import { paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Texto } from '../ui/Texto';
import { RefeicaoItem } from './RefeicaoItem';

/** Alimentação: plano em vigor, refeições de hoje (marcar como feita) e estimativa do saco de ração. */
export function CartaoAlimentacao({ pet, irPara }) {
  const { paleta } = useTheme();
  const { plano, refeicoes, recarregar } = useAlimentacao(pet.id);

  if (!plano) {
    return (
      <Card>
        <Texto variante="subtitulo" style={{ marginBottom: 4 }}>
          Alimentação
        </Texto>
        <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
          Defina o plano de alimentação {pet.deNome}: ração, quantidade e horários.
        </Texto>
        <Button titulo="Criar plano" icone="add" aoPressionar={() => irPara('/pet/[id]/plano')} />
      </Card>
    );
  }

  const estoque = textoEstoque(plano, paraISO(new Date()));
  const alternar = (horario) => {
    alimentacaoService.alternarRefeicao(plano, horario);
    recarregar();
  };

  return (
    <Card>
      <View style={styles.topo}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Alimentação
        </Texto>
        <Button
          titulo="Editar plano"
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => irPara('/pet/[id]/plano')}
        />
      </View>
      <Texto variante="legenda" style={{ marginBottom: espaco.sm }}>
        {plano.tipoRacao}, {plano.horarios.length} {plano.horarios.length === 1 ? 'refeição' : 'refeições'} de{' '}
        {plano.quantidadeG} g
      </Texto>

      {refeicoes.map((r) => (
        <RefeicaoItem
          key={r.horario}
          refeicao={r}
          feitaPorVoce={r.registro?.autorDispositivoId === DeviceIdentity.id}
          aoAlternar={() => alternar(r.horario)}
        />
      ))}

      {estoque ? (
        <View style={styles.estoque}>
          <Ionicons name="cube-outline" size={18} color={paleta.textoSuave} />
          <Texto variante="legenda" style={{ flex: 1, fontFamily: fontes.corpo }}>
            {estoque}
          </Texto>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  estoque: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginTop: espaco.sm },
});
