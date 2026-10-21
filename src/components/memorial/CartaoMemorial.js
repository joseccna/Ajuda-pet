import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { descreverVida } from '../../models/regrasMemorial';
import { espaco, fontes, useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Texto } from '../ui/Texto';

/** Cartão de um pet em memorial, para a lista: foto, nome e os anos de vida. Use dentro de TemaMemorial. */
export function CartaoMemorial({ pet, aoPressionar }) {
  const { paleta } = useTheme();
  const vida = descreverVida(pet);
  return (
    <Card
      aoPressionar={aoPressionar}
      rotuloAcessibilidade={`${pet.nome}, em memória${vida ? `, ${vida}` : ''}`}
      dicaAcessibilidade="Abre o memorial"
      style={styles.card}
    >
      <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={64} />
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }} numberOfLines={1}>
          {pet.nome}
        </Texto>
        {vida ? <Texto variante="legenda">{vida}</Texto> : null}
      </View>
      <Ionicons name="heart-outline" size={22} color={paleta.primario} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: 88 },
});
