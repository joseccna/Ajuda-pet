import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Cabecalho } from '../components/ui/Cabecalho';
import { Campo } from '../components/ui/Campo';
import { Card } from '../components/ui/Card';
import { EstadoVazio } from '../components/ui/EstadoVazio';
import { Screen } from '../components/ui/Screen';
import { Texto } from '../components/ui/Texto';
import { useImportacao } from '../hooks/useImportacao';
import { textoDoItem } from '../models/regrasBackup';
import { formatarDataBR } from '../utils/datas';
import { espaco, raio, useTheme } from '../theme';

const ACAO_PET = {
  inserir: 'Novo',
  atualizar: 'Será atualizado',
  igual: 'Já está aqui',
  manter: 'Seu registro é mais recente',
};

function Previa({ previa, aoConfirmar, aoCancelar }) {
  const { paleta } = useTheme();
  const ficha = previa.tipo === 'ficha';
  const data = formatarDataBR(previa.geradoEm.slice(0, 10));
  return (
    <View>
      <Texto variante="subtitulo" accessibilityRole="header">
        {ficha ? 'Ficha de pet' : 'Backup'} de {data}
      </Texto>
      <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
        {ficha
          ? 'Será adicionada como cópia à parte, sem misturar com os seus pets.'
          : previa.mesmoAparelho
            ? 'Criado neste aparelho.'
            : 'Criado em outro aparelho.'}
      </Texto>

      {previa.nadaDeNovo ? (
        <View
          style={{
            backgroundColor: paleta.destaqueSuave,
            borderRadius: raio.lg,
            padding: espaco.lg,
            marginBottom: espaco.lg,
          }}
        >
          <Texto variante="corpoMedio" cor="destaque">
            Nada de novo
          </Texto>
          <Texto variante="legenda" cor="destaque">
            Tudo o que está neste arquivo já está no seu celular.
          </Texto>
        </View>
      ) : (
        <>
          {previa.pets.length > 0 ? (
            <Card>
              <Texto variante="rotulo" style={{ marginBottom: espaco.sm }}>
                Pets neste arquivo
              </Texto>
              {previa.pets.map((p) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: espaco.md,
                    paddingVertical: 2,
                  }}
                >
                  <Texto variante="corpoMedio" style={{ flex: 1 }}>
                    {p.nome}
                  </Texto>
                  <Texto variante="legenda">{ACAO_PET[p.acao]}</Texto>
                </View>
              ))}
            </Card>
          ) : null}
          <Card>
            <Texto variante="rotulo" style={{ marginBottom: espaco.sm }}>
              O que muda
            </Texto>
            {previa.itens.map((i) => (
              <View key={i.tabela} style={{ paddingVertical: 3 }}>
                <Texto variante="corpoMedio">
                  {i.rotulo[1].charAt(0).toUpperCase() + i.rotulo[1].slice(1)}
                </Texto>
                <Texto variante="legenda">{textoDoItem(i)}</Texto>
              </View>
            ))}
          </Card>
        </>
      )}

      {previa.total.rejeitados > 0 ? (
        <View
          style={{
            backgroundColor: paleta.avisoSuave,
            borderRadius: raio.md,
            padding: espaco.md,
            marginBottom: espaco.lg,
          }}
        >
          <Texto variante="legenda" style={{ color: paleta.aviso }}>
            {previa.total.rejeitados}{' '}
            {previa.total.rejeitados === 1 ? 'registro será recusado' : 'registros serão recusados'} por
            estarem incompletos ou inválidos. O resto é importado normalmente.
          </Texto>
        </View>
      ) : null}
      {previa.total.mantidos > 0 ? (
        <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
          Onde o seu celular tem a versão mais recente, ela é mantida. Nada é apagado.
        </Texto>
      ) : null}

      {previa.nadaDeNovo ? (
        <Button titulo="Fechar" aoPressionar={aoCancelar} />
      ) : (
        <>
          <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
            Antes de importar, o app guarda uma cópia de segurança dos seus dados atuais.
          </Texto>
          <Button titulo="Importar" icone="download-outline" aoPressionar={aoConfirmar} />
          <Button titulo="Cancelar" variante="texto" aoPressionar={aoCancelar} />
        </>
      )}
    </View>
  );
}

/** Abrir um arquivo .ajudapet: escolher, senha (se houver), prévia, confirmar, resultado. */
export default function TelaImportar() {
  const router = useRouter();
  const { paleta } = useTheme();
  const i = useImportacao();
  const [senha, setSenha] = useState('');

  return (
    <Screen>
      <Cabecalho titulo="Abrir arquivo" icone="fechar" aoVoltar={() => router.back()} />

      {i.fase === 'inicio' ? (
        <EstadoVazio
          icone="download-outline"
          titulo="Escolha um arquivo do Ajuda Pet"
          texto="Pode ser um backup seu ou a ficha de um pet recebida de outra pessoa. Você vê uma prévia antes de importar. Nada muda até você confirmar."
        >
          <Button titulo="Escolher arquivo" icone="folder-open-outline" aoPressionar={i.escolherArquivo} />
        </EstadoVazio>
      ) : null}

      {i.fase === 'lendo' || i.fase === 'aplicando' ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ paddingVertical: espaco.xxl, alignItems: 'center', gap: espaco.md }}
        >
          <Ionicons name="hourglass-outline" size={36} color={paleta.textoSuave} />
          <Texto variante="corpoMedio">{i.fase === 'lendo' ? 'Lendo o arquivo...' : 'Importando...'}</Texto>
          <Texto variante="legenda">Não feche o app.</Texto>
        </View>
      ) : null}

      {i.fase === 'senha' ? (
        <View>
          <Texto variante="subtitulo" accessibilityRole="header" style={{ marginBottom: espaco.sm }}>
            Arquivo protegido por senha
          </Texto>
          <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
            {i.nomeArquivo}
          </Texto>
          <Campo
            rotulo="Senha do backup"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            erro={i.senhaErrada ? 'Senha incorreta. Confira e tente de novo.' : undefined}
          />
          <Button
            titulo="Abrir"
            aoPressionar={() => i.enviarSenha(senha)}
            desabilitado={senha.length === 0}
          />
          <Button titulo="Cancelar" variante="texto" aoPressionar={i.recomecar} />
        </View>
      ) : null}

      {i.fase === 'previa' && i.previa ? (
        <Previa previa={i.previa} aoConfirmar={i.confirmar} aoCancelar={() => router.back()} />
      ) : null}

      {i.fase === 'feito' && i.resultado ? (
        <View accessibilityLiveRegion="polite" style={{ gap: espaco.md }}>
          <Texto variante="subtitulo" accessibilityRole="header">
            Importação concluída
          </Texto>
          <Texto variante="corpo">
            {i.resultado.aplicadas}{' '}
            {i.resultado.aplicadas === 1 ? 'registro foi gravado' : 'registros foram gravados'}.
          </Texto>
          {i.resultado.falhas.length > 0 ? (
            <Texto variante="corpo" cor="erro">
              {i.resultado.falhas.length}{' '}
              {i.resultado.falhas.length === 1
                ? 'registro não pôde ser gravado'
                : 'registros não puderam ser gravados'}{' '}
              e foi pulado.
            </Texto>
          ) : null}
          {i.resultado.copiaDeSeguranca ? (
            <Texto variante="legenda">Uma cópia de segurança dos dados de antes foi guardada no app.</Texto>
          ) : null}
          <Button titulo="Ver meus pets" icone="paw" aoPressionar={() => router.replace('/pets')} />
        </View>
      ) : null}

      {i.fase === 'erro' ? (
        <View accessibilityLiveRegion="polite" style={{ gap: espaco.md }}>
          <Texto variante="subtitulo" accessibilityRole="header">
            Não foi possível continuar
          </Texto>
          <Texto variante="corpo" cor="erro">
            {i.erro}
          </Texto>
          <Texto variante="legenda">Nada foi alterado nos seus dados.</Texto>
          <Button titulo="Tentar outro arquivo" variante="secundario" aoPressionar={i.recomecar} />
        </View>
      ) : null}
    </Screen>
  );
}
