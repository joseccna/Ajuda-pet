import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { EstadoVazio } from '../../components/ui/EstadoVazio';
import { Screen } from '../../components/ui/Screen';
import { Texto } from '../../components/ui/Texto';
import { useTutor } from '../../hooks/useTutor';
import { iniciais } from '../../models/regrasTutor';
import { ALVO_MINIMO, espaco, fontes, raio, useTheme } from '../../theme';

function Contato({ icone, titulo, valor, aoPressionar }) {
  const { paleta } = useTheme();
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}: ${valor || 'não informado'}`}
      accessibilityHint="Abre para editar"
      style={styles.contato}
    >
      <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
        <Ionicons name={icone} size={22} color={paleta.primarioTexto} />
      </View>
      <View style={{ flex: 1 }}>
        <Texto variante="legenda">{titulo}</Texto>
        <Texto variante="corpoMedio" cor={valor ? 'texto' : 'primarioTexto'}>
          {valor || 'Adicionar'}
        </Texto>
      </View>
      <Ionicons name="chevron-forward" size={20} color={paleta.textoSuave} />
    </Pressable>
  );
}

/** Aba Tutor: perfil e contatos de confiança. Preferências e segurança chegam nas próximas etapas. */
export default function AbaTutor() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { tutor } = useTutor();
  const editar = () => router.push('/tutor-perfil');

  return (
    <Screen bordas={['top', 'left', 'right']}>
      <Texto variante="titulo" accessibilityRole="header" style={{ marginBottom: espaco.lg }}>
        Tutor
      </Texto>

      {!tutor ? (
        <EstadoVazio
          icone="person-outline"
          titulo="Conte quem você é"
          texto="Seu nome aparece na saudação, e os contatos de confiança entram no cartão de emergência dos pets."
        >
          <Button titulo="Preencher perfil" icone="add" aoPressionar={editar} />
        </EstadoVazio>
      ) : (
        <>
          <View style={[styles.perfil, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
            <View style={[styles.avatar, { backgroundColor: paleta.primarioSuave }]}>
              <Texto
                style={{ fontFamily: fontes.titulo, fontSize: 24, color: paleta.primarioTexto }}
                importantForAccessibility="no"
              >
                {iniciais(tutor.nome)}
              </Texto>
            </View>
            <View style={{ flex: 1 }}>
              <Texto variante="subtitulo" style={{ fontFamily: fontes.titulo }}>
                {tutor.nome}
              </Texto>
              {tutor.telefone ? <Texto variante="legenda">{tutor.telefone}</Texto> : null}
              {tutor.email ? <Texto variante="legenda">{tutor.email}</Texto> : null}
            </View>
            <Button titulo="Editar" variante="secundario" larguraTotal={false} aoPressionar={editar} />
          </View>

          <Texto variante="rotulo" style={styles.titulo}>
            Contatos de confiança
          </Texto>
          <View style={[styles.lista, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
            <Contato
              icone="medkit-outline"
              titulo="Veterinário"
              valor={[tutor.vetNome, tutor.vetClinica].filter(Boolean).join(', ')}
              aoPressionar={editar}
            />
            <View style={{ height: 1, backgroundColor: paleta.linha }} />
            <Contato icone="cut-outline" titulo="Pet shop" valor={tutor.petshopNome} aoPressionar={editar} />
            <View style={{ height: 1, backgroundColor: paleta.linha }} />
            <Contato
              icone="call-outline"
              titulo="Contato de emergência"
              valor={[tutor.emergenciaNome, tutor.emergenciaRelacao].filter(Boolean).join(', ')}
              aoPressionar={editar}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  titulo: { marginTop: espaco.xl, marginBottom: espaco.sm },
  lista: { borderWidth: 1, borderRadius: raio.lg, overflow: 'hidden' },
  contato: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
  },
  icone: {
    width: ALVO_MINIMO,
    height: ALVO_MINIMO,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
