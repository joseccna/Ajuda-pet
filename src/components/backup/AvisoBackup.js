import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { textoDaSituacao } from '../../models/regrasBackup';
import { espaco, raio, useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Texto } from '../ui/Texto';

/** Faixa com a situação do backup e o botão para fazer agora. Cor de aviso quando está atrasado. */
export function AvisoBackup({ situacao, aoFazer, compacto = false }) {
  const { paleta } = useTheme();
  const atencao = situacao.devido;
  const cor = atencao ? paleta.aviso : paleta.destaque;
  return (
    <View
      style={[styles.caixa, { backgroundColor: atencao ? paleta.avisoSuave : paleta.destaqueSuave }]}
      accessible
      accessibilityLabel={`${atencao ? 'Atenção. ' : ''}${textoDaSituacao(situacao)}`}
    >
      <View style={styles.topo}>
        <Ionicons
          name={atencao ? 'cloud-upload-outline' : 'shield-checkmark-outline'}
          size={26}
          color={cor}
        />
        <View style={{ flex: 1 }}>
          <Texto variante="corpoMedio" style={{ color: cor }}>
            {atencao ? 'Hora de fazer o backup' : textoDaSituacao(situacao)}
          </Texto>
          <Texto variante="legenda" style={{ color: cor }}>
            {atencao
              ? `${textoDaSituacao(situacao)}. Guarde uma cópia fora do celular.`
              : 'Seus dados estão guardados só neste celular. Mantenha uma cópia por segurança.'}
          </Texto>
        </View>
      </View>
      {aoFazer && (atencao || !compacto) ? (
        <Button
          titulo="Fazer backup agora"
          variante={atencao ? 'primario' : 'secundario'}
          icone="save-outline"
          aoPressionar={aoFazer}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { borderRadius: raio.lg, padding: espaco.lg, gap: espaco.md, marginBottom: espaco.xl },
  topo: { flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' },
});
