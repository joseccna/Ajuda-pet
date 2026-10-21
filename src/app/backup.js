import React, { useState } from 'react';
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
  const { fase, arquivo, erro, compartilhado, gerar, compartilhar } = useBackup();
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
    if (gerado) await compartilhar(gerado);
  }

  return (
    <Screen>
      <Cabecalho titulo="Fazer backup" aoVoltar={() => router.back()} />
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

      {erro ? (
        <Texto variante="corpo" cor="erro" accessibilityLiveRegion="polite" style={{ marginTop: espaco.lg }}>
          {erro}
        </Texto>
      ) : null}

      {fase === 'pronto' && arquivo ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            marginTop: espaco.xl,
            padding: espaco.lg,
            borderRadius: raio.lg,
            backgroundColor: paleta.destaqueSuave,
            gap: espaco.sm,
          }}
        >
          <Texto variante="corpoMedio" cor="destaque">
            {compartilhado ? 'Backup enviado' : 'Backup pronto'}
          </Texto>
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
            Guarde o arquivo fora do celular (Drive, e-mail ou outro aparelho). Para restaurar, use “Abrir um
            arquivo recebido”.
          </Texto>
          <Button
            titulo="Enviar de novo"
            variante="secundario"
            icone="share-outline"
            aoPressionar={() => compartilhar()}
          />
        </View>
      ) : null}
    </Screen>
  );
}
