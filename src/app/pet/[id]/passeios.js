import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { Texto } from '../../../components/ui/Texto';
import { usePet } from '../../../hooks/usePet';
import { formatarDuracao } from '../../../models/regrasPasseio';
import { passeioService } from '../../../services/PasseioService';
import { espaco, raio, useTheme } from '../../../theme';
import { formatarDataCurta, paraISO } from '../../../utils/datas';

/** Histórico de passeios do pet. Toque em um para editar. */
export default function HistoricoDePasseios() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { id } = useLocalSearchParams();
  const { pet } = usePet(id);
  const [lista, setLista] = useState([]);
  useFocusEffect(
    useCallback(() => {
      setLista(passeioService.listar(id).filter((p) => !p.emAndamento));
    }, [id]),
  );

  const novo = () => router.push({ pathname: '/pet/[id]/passeio-registro', params: { id } });

  return (
    <Screen>
      <Cabecalho titulo={pet ? `Passeios ${pet.deNome}` : 'Passeios'} aoVoltar={() => router.back()} />
      {lista.length === 0 ? (
        <EstadoVazio
          icone="walk-outline"
          titulo="Nenhum passeio registrado"
          texto="Inicie um passeio com cronômetro ou registre um que já fez."
        >
          <Button titulo="Registrar passeio" icone="add" aoPressionar={novo} />
        </EstadoVazio>
      ) : (
        <>
          <View style={[styles.lista, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
            {lista.map((p, i) => {
              const data = formatarDataCurta(paraISO(new Date(p.inicio)));
              const detalhe = [
                p.distanciaKm !== null ? `${String(p.distanciaKm).replace('.', ',')} km` : '',
                p.observacao,
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    router.push({ pathname: '/pet/[id]/passeio-registro', params: { id, passeioId: p.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${data}, ${formatarDuracao(p.duracaoMin)}${detalhe ? `, ${detalhe}` : ''}`}
                  accessibilityHint="Abre o passeio para editar"
                  style={[styles.linha, i > 0 && { borderTopWidth: 1, borderTopColor: paleta.linha }]}
                >
                  <View style={{ flex: 1 }}>
                    <Texto variante="corpoMedio">{data}</Texto>
                    {detalhe ? <Texto variante="legenda">{detalhe}</Texto> : null}
                  </View>
                  <Texto variante="corpoMedio">{formatarDuracao(p.duracaoMin)}</Texto>
                  <Ionicons name="chevron-forward" size={18} color={paleta.textoSuave} />
                </Pressable>
              );
            })}
          </View>
          <View style={{ marginTop: espaco.lg }}>
            <Button titulo="Registrar passeio" icone="add" aoPressionar={novo} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lista: { borderWidth: 1, borderRadius: raio.lg, overflow: 'hidden' },
  linha: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
  },
});
