import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useCuidados } from '../../hooks/useRotina';
import { cuidadoService } from '../../services/CuidadoService';
import { espaco } from '../../theme';
import { paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Texto } from '../ui/Texto';
import { CuidadoItem } from './CuidadoItem';

const VISIVEIS = 4;

/** Cuidados: banho, tosa, antipulgas, vermífugo... com o que precisa de atenção primeiro. */
export function CartaoCuidados({ pet, irPara }) {
  const { cartoes, recarregar } = useCuidados(pet.id);
  const hojeISO = paraISO(new Date());

  if (cartoes.length === 0) {
    return (
      <Card>
        <Texto variante="subtitulo" style={{ marginBottom: 4 }}>
          Cuidados
        </Texto>
        <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
          Banho, tosa, antipulgas e vermífugo: cadastre e o app calcula quando é a próxima vez.
        </Texto>
        <Button
          titulo="Adicionar cuidado"
          icone="add"
          aoPressionar={() => irPara('/pet/[id]/cuidado-novo')}
        />
      </Card>
    );
  }

  function marcarFeito(tipoId) {
    try {
      cuidadoService.marcarFeitoHoje(tipoId);
      recarregar();
    } catch {
      Alert.alert('Não foi possível registrar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  return (
    <Card>
      <View style={styles.topo}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Cuidados
        </Texto>
        <Button
          titulo="Ver todos"
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => irPara('/pet/[id]/cuidados')}
        />
      </View>
      {cartoes.slice(0, VISIVEIS).map((item, i) => (
        <CuidadoItem
          key={item.tipo.id}
          item={item}
          primeiro={i === 0}
          feitoHoje={item.registros.some((r) => r.data === hojeISO)}
          aoAbrir={() => irPara('/pet/[id]/cuidados')}
          aoMarcarFeito={() => marcarFeito(item.tipo.id)}
        />
      ))}
      <Button
        titulo="Registrar cuidado"
        icone="add"
        variante="secundario"
        aoPressionar={() => irPara('/pet/[id]/cuidado-registro')}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
