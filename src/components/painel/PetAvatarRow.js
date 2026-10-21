import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Texto } from '../ui/Texto';

/** Fileira de pets do painel. O contador no canto mostra quantos lembretes estão atrasados. */
export function PetAvatarRow({ pets, porPet, aoAbrirPet, aoAdicionar }) {
  const { paleta } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linha}>
      {pets.map((pet) => {
        const atrasados = porPet[pet.id]?.atrasados ?? 0;
        return (
          <Pressable
            key={pet.id}
            onPress={() => aoAbrirPet(pet)}
            accessibilityRole="button"
            accessibilityLabel={
              atrasados > 0 ? `${pet.nome}, ${atrasados} atrasado${atrasados > 1 ? 's' : ''}` : pet.nome
            }
            style={styles.item}
          >
            <View>
              <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={64} />
              {atrasados > 0 ? (
                <View
                  style={[styles.contador, { backgroundColor: paleta.primario, borderColor: paleta.fundo }]}
                >
                  <Texto
                    style={{ color: paleta.sobrePrimario, fontSize: 12, lineHeight: 16 }}
                    importantForAccessibility="no"
                  >
                    {atrasados}
                  </Texto>
                </View>
              ) : null}
            </View>
            <Texto variante="corpoMedio" style={{ fontSize: 14 }} numberOfLines={1}>
              {pet.nome}
            </Texto>
          </Pressable>
        );
      })}
      <Pressable
        onPress={aoAdicionar}
        accessibilityRole="button"
        accessibilityLabel="Adicionar pet"
        style={styles.item}
      >
        <View style={[styles.novo, { borderColor: paleta.campo }]}>
          <Ionicons name="add" size={26} color={paleta.textoSuave} />
        </View>
        <Texto variante="legenda">Novo</Texto>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  linha: { gap: espaco.lg, paddingVertical: espaco.xs },
  item: { alignItems: 'center', gap: espaco.xs, minWidth: 64, maxWidth: 80 },
  contador: {
    position: 'absolute',
    right: -6,
    top: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  novo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
