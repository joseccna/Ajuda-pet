import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Cabecalho } from '../components/ui/Cabecalho';
import { Campo } from '../components/ui/Campo';
import { LinhaSwitch } from '../components/ui/LinhaSwitch';
import { Screen } from '../components/ui/Screen';
import { Texto } from '../components/ui/Texto';
import { useBackup, useSituacaoBackup } from '../hooks/useBackup';
import { formatarTamanho, textoDaSituacao } from '../models/regrasBackup';
import { espaco, raio, useTheme } from '../theme';
import { validarSenha } from '../utils/pacote/criptografia';

const INCLUI = [
  'Todos os pets, com fotos',
  'Vacinas, peso, consultas, alimentação, passeios e cuidados',
  'Valores e anotações pessoais (só neste backup, nunca na ficha)',
  'Memorial e seu perfil de tutor',
];

/** Gera o arquivo de backup e abre o compartilhamento do sistema. */
export default function TelaBackup() {
  const router = useRouter();
  const { paleta } = useTheme();
  const situacao = useSituacaoBackup();
  const { fase, arquivo, erro, compartilhado, gerar, compartilhar, reiniciar } = useBackup();
  const rolagem = useRef(null);
  const [comSenha, setComSenha] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erroSenha, setErroSenha] = useState(null);

  async function fazer() {
    if (comSenha) {
      const e = validarSenha(senha, confirmacao);
      setErroSenha(e);
      if (e) return;
    }
    const gerado = await gerar(comSenha ? senha : undefined);
    if (gerado) await enviar(gerado);
  }

  // Ao voltar do compartilhamento, a tela sobe até o aviso do topo: com a senha ligada,
  // o botão fica embaixo e o resultado passaria despercebido.
  async function enviar(alvo) {
    const ok = await compartilhar(alvo);
    if (!ok) return;
    // Enviado: o formulário some e a senha deixa de ficar guardada na tela.
    setSenha('');
    setConfirmacao('');
    rolagem.current?.scrollTo({ y: 0, animated: true });
  }

  function fazerOutro() {
    reiniciar();
    setComSenha(false);
    setErroSenha(null);
  }

  const enviado = fase === 'pronto' && compartilhado;

  return (
    <Screen rolagemRef={rolagem}>
      <Cabecalho titulo="Fazer backup" aoVoltar={() => router.back()} />

      {fase === 'pronto' && arquivo ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            marginBottom: espaco.lg,
            padding: espaco.lg,
            borderRadius: raio.lg,
            backgroundColor: paleta.destaqueSuave,
            gap: espaco.sm,
          }}
        >
          <View style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'flex-start' }}>
            <Ionicons name="checkmark-circle" size={22} color={paleta.destaque} />
            <Texto variante="corpoMedio" cor="destaque" style={{ flex: 1 }}>
              {compartilhado ? 'Backup gerado e enviado para o compartilhamento' : 'Backup gerado'}
            </Texto>
          </View>
          <Texto variante="legenda" cor="destaque">
            {arquivo.nome} · {formatarTamanho(arquivo.tamanho)} · {arquivo.resumo.pets}{' '}
            {arquivo.resumo.pets === 1 ? 'pet' : 'pets'}
            {arquivo.criptografado ? ' · com senha' : ''}
          </Texto>
          {arquivo.semArquivo > 0 ? (
            <Texto variante="legenda" cor="destaque">
              {arquivo.semArquivo}{' '}
              {arquivo.semArquivo === 1 ? 'foto não foi encontrada' : 'fotos não foram encontradas'} e ficou
              de fora.
            </Texto>
          ) : null}
          <Texto variante="legenda" cor="destaque">
            Confira se ele foi salvo no Drive ou onde você escolheu. Para restaurar, use “Abrir um arquivo
            recebido”.
          </Texto>
          <Button
            titulo="Enviar de novo"
            variante="secundario"
            icone="share-outline"
            aoPressionar={() => enviar(arquivo)}
          />
        </View>
      ) : null}
      {enviado ? (
        <View style={{ alignItems: 'center', marginTop: -espaco.sm, marginBottom: espaco.md }}>
          <Button titulo="Fazer outro backup" variante="texto" larguraTotal={false} aoPressionar={fazerOutro} />
        </View>
      ) : null}

      <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
        {textoDaSituacao(situacao)}
      </Texto>

      <View style={{ marginBottom: espaco.xl, gap: espaco.sm }}>
        <Texto variante="rotulo">O arquivo leva</Texto>
        {INCLUI.map((t) => (
          <View key={t} style={{ flexDirection: 'row', gap: espaco.sm }}>
            <Ionicons name="checkmark-circle" size={20} color={paleta.destaque} />
            <Texto variante="corpo" style={{ flex: 1 }}>
              {t}
            </Texto>
          </View>
        ))}
        <Texto variante="legenda">Não leva: preferências do app (tema, atalhos).</Texto>
      </View>

      {enviado ? null : (
        <>
          <LinhaSwitch
            titulo="Proteger com senha"
            detalhe="Recomendado se for enviar por e-mail ou aplicativo de mensagens."
            valor={comSenha}
            aoMudar={(v) => {
              setComSenha(v);
              setErroSenha(null);
            }}
          />
          {comSenha ? (
            <View>
              <Campo
                rotulo="Senha do backup"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                dica="Pelo menos 6 caracteres."
              />
              <Campo
                rotulo="Repita a senha"
                value={confirmacao}
                onChangeText={setConfirmacao}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                erro={erroSenha}
              />
              <View
                style={{
                  backgroundColor: paleta.avisoSuave,
                  borderRadius: raio.md,
                  padding: espaco.md,
                  marginBottom: espaco.lg,
                }}
              >
                <Texto variante="legenda" style={{ color: paleta.aviso }}>
                  Anote a senha em um lugar seguro. Não há como recuperar o backup se ela for esquecida.
                </Texto>
              </View>
            </View>
          ) : null}

          <Button
            titulo={fase === 'gerando' ? 'Gerando o backup...' : 'Gerar e enviar backup'}
            icone="share-outline"
            carregando={fase === 'gerando'}
            aoPressionar={fazer}
            dicaAcessibilidade="Abre as opções de envio do celular, como Bluetooth, Quick Share, WhatsApp, Drive ou e-mail"
          />
          {fase === 'gerando' ? (
            <Texto variante="legenda" accessibilityLiveRegion="polite" style={{ marginTop: espaco.sm }}>
              Com muitas fotos, pode levar alguns segundos.
            </Texto>
          ) : null}

        </>
      )}

      {erro ? (
        <Texto variante="corpo" cor="erro" accessibilityLiveRegion="polite" style={{ marginTop: espaco.lg }}>
          {erro}
        </Texto>
      ) : null}
    </Screen>
  );
}
