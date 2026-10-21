import React from 'react';
import { Alert, Linking, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { linkDeTelefone } from '../../models/regrasTutor';
import { espaco, fontes, useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SituacaoBadge } from '../ui/SituacaoBadge';
import { Texto } from '../ui/Texto';

const ESTADO_BADGE = {
  atrasada: 'atrasada',
  'em-breve': 'em-breve',
  'em-dia': 'em-dia',
  'sem-registro': 'sem-previsao',
};

/**
 * Cartão de emergência: feito para ser lido de relance. Foto, nome, o que importa para a saúde e botões
 * de ligar grandes. Nunca mostra valores, anotações pessoais nem memorial.
 */
export function CartaoEmergencia({ pet, cartao }) {
  const router = useRouter();
  const { paleta } = useTheme();

  async function ligar(telefone) {
    const link = linkDeTelefone(telefone);
    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert('Não foi possível ligar', `Disque ${telefone} no seu telefone.`);
    }
  }

  async function compartilhar() {
    try {
      await Share.share({ message: cartao.textoCompartilhar });
    } catch {
      Alert.alert('Não foi possível compartilhar', 'Tente de novo.');
    }
  }

  const irTutor = () => router.push('/tutor-perfil');

  return (
    <View>
      <Card>
        <View style={styles.identidade}>
          <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={88} />
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="titulo" style={{ fontFamily: fontes.titulo }} accessibilityRole="header">
              {cartao.titulo}
            </Texto>
            <Texto variante="corpoMedio">{cartao.cabecalho}</Texto>
          </View>
        </View>

        {cartao.linhas.map((l, i) => (
          <View
            key={l.chave}
            style={[styles.linha, i > 0 && { borderTopWidth: 1, borderTopColor: paleta.linha }]}
          >
            <Texto variante="legenda" style={{ fontFamily: fontes.corpoNegrito }}>
              {l.rotulo}
            </Texto>
            {l.estado ? (
              <View style={{ gap: 4, alignItems: 'flex-start' }}>
                <SituacaoBadge estado={ESTADO_BADGE[l.estado]} texto={l.valor} />
                {l.detalhe ? <Texto variante="corpo">{l.detalhe}</Texto> : null}
              </View>
            ) : (
              <Texto variante="corpoMedio">{l.valor}</Texto>
            )}
          </View>
        ))}
      </Card>

      <Texto variante="subtitulo" accessibilityRole="header" style={styles.titulo}>
        Ligar agora
      </Texto>
      {cartao.contatos.length === 0 ? (
        <Card>
          <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
            Ainda não há telefones. Adicione os seus, o do contato de emergência e o da veterinária no seu
            perfil.
          </Texto>
          <Button titulo="Adicionar contatos" icone="add" aoPressionar={irTutor} />
        </Card>
      ) : (
        <View style={{ gap: espaco.sm }}>
          {cartao.contatos.map((c, i) => (
            <Button
              key={c.chave}
              titulo={`${c.rotulo}: ${c.nome}, ${c.telefone}`}
              icone="call-outline"
              variante={i === 0 ? 'primario' : 'secundario'}
              dicaAcessibilidade="Abre o discador do celular"
              aoPressionar={() => ligar(c.telefone)}
              style={{ minHeight: 60 }}
            />
          ))}
          <Button titulo="Completar contatos" variante="texto" larguraTotal={false} aoPressionar={irTutor} />
        </View>
      )}

      <View style={{ gap: espaco.sm, marginTop: espaco.xl }}>
        <Button
          titulo="Compartilhar como texto"
          icone="share-social-outline"
          variante="secundario"
          aoPressionar={compartilhar}
        />
        <Button
          titulo={`Editar dados ${pet.deNome}`}
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => router.push({ pathname: '/pet/[id]/editar', params: { id: pet.id } })}
        />
      </View>

      <Texto variante="legenda" style={{ marginTop: espaco.lg }}>
        Valores, anotações pessoais e memorial nunca aparecem aqui. O app não envia mensagens a ninguém: os
        botões só abrem o discador.
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  identidade: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, marginBottom: espaco.lg },
  linha: { paddingVertical: espaco.md, gap: 4 },
  titulo: { marginTop: espaco.xl, marginBottom: espaco.sm },
});
