import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { espaco, fontes, useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Texto } from '../ui/Texto';
import { descreverPendencias } from '../../services/painelRegras';
/** Cartão do pet na lista: foto, nome e "Cachorra • 4 anos". */
export function PetCard({ pet, aoPressionar, pendencias }) {
  const { paleta } = useTheme();
  return (
    <Card
      aoPressionar={aoPressionar}
      rotuloAcessibilidade={`${pet.nome}, ${pet.resumo}`}
      dicaAcessibilidade="Abre o perfil do pet"
      style={styles.card}
    >
      <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={72} />
      <View style={styles.texto}>
        <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }} numberOfLines={1}>
          {pet.nome}
        </Texto>
        <View style={[styles.chip, { backgroundColor: paleta.destaqueSuave }]}>
          <Texto variante="rotulo" cor="destaque">
            {pet.resumo}
          </Texto>
        </View>
        {pet.origem === 'ficha' ? <Texto variante="legenda">Ficha recebida de outra pessoa</Texto> : null}
        {pendencias ? (
          <View style={styles.pendencia}>
            <Ionicons
              name={pendencias.atrasados > 0 ? 'alert-circle' : 'time-outline'}
              size={16}
              color={pendencias.atrasados > 0 ? paleta.primarioTexto : paleta.textoSuave}
            />
            <Texto
              variante="legenda"
              style={
                pendencias.atrasados > 0
                  ? { color: paleta.primarioTexto, fontFamily: fontes.corpoNegrito }
                  : null
              }
            >
              {descreverPendencias(pendencias)}
            </Texto>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={22} color={paleta.textoSuave} />
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: 96 },
  texto: { flex: 1, gap: espaco.xs },
  pendencia: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  chip: { alignSelf: 'flex-start', paddingHorizontal: espaco.md, paddingVertical: 3, borderRadius: 999 },
});
