import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartaoMemorial } from '../components/memorial/CartaoMemorial';
import { PetCard } from '../components/pet/PetCard';
import { Button } from '../components/ui/Button';
import { Cabecalho } from '../components/ui/Cabecalho';
import { EstadoVazio } from '../components/ui/EstadoVazio';
import { usePainel } from '../hooks/usePainel';
import { useMemorialLista } from '../hooks/useMemorial';
import { usePets } from '../hooks/usePets';
import { Texto } from '../components/ui/Texto';
import { espaco, TemaMemorial, useTheme } from '../theme';

/** Lista completa de pets, com os lembretes pendentes de cada um. */
export default function ListaDePets() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { pets, carregando } = usePets();
  const { painel } = usePainel();
  const { pets: memorial } = useMemorialLista();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.raiz, { backgroundColor: paleta.fundo }]}
    >
      <View style={styles.topo}>
        <Cabecalho titulo="Meus pets" aoVoltar={() => router.back()} />
      </View>
      <FlatList
        data={pets}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          pets.length > 0 ? (
            <View style={{ marginBottom: espaco.lg }}>
              <Button titulo="Adicionar pet" icone="add" aoPressionar={() => router.push('/pet/novo')} />
            </View>
          ) : null
        }
        ListFooterComponent={
          <TemaMemorial>
            <View style={{ marginTop: espaco.xl }}>
              {memorial.length > 0 ? (
                <>
                  <Texto variante="subtitulo" accessibilityRole="header" style={{ marginBottom: espaco.md }}>
                    Memorial
                  </Texto>
                  {memorial.map((p) => (
                    <CartaoMemorial
                      key={p.id}
                      pet={p}
                      aoPressionar={() =>
                        router.push({ pathname: '/pet/[id]/memorial', params: { id: p.id } })
                      }
                    />
                  ))}
                </>
              ) : null}
              <View style={{ alignItems: 'flex-start' }}>
                <Button
                  titulo="Adicionar pet em memorial"
                  variante="texto"
                  larguraTotal={false}
                  aoPressionar={() => router.push({ pathname: '/pet/novo', params: { memorial: '1' } })}
                />
              </View>
            </View>
          </TemaMemorial>
        }
        renderItem={({ item }) => (
          <PetCard
            pet={item}
            pendencias={painel.porPet[item.id]}
            aoPressionar={() => router.push({ pathname: '/pet/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          carregando ? null : (
            <EstadoVazio
              icone="paw"
              titulo="Nenhum pet por aqui ainda"
              texto="Cadastre o primeiro para começar."
            >
              <Button
                titulo="Cadastrar primeiro pet"
                icone="add"
                aoPressionar={() => router.push('/pet/novo')}
              />
            </EstadoVazio>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  topo: { paddingHorizontal: espaco.lg, paddingTop: espaco.lg },
  lista: { paddingHorizontal: espaco.lg, paddingBottom: espaco.xl, flexGrow: 1 },
});
