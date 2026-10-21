import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Cabecalho } from '../components/ui/Cabecalho';
import { Campo } from '../components/ui/Campo';
import { ChipSelector } from '../components/ui/ChipSelector';
import { LinhaSwitch } from '../components/ui/LinhaSwitch';
import { Screen } from '../components/ui/Screen';
import { Texto } from '../components/ui/Texto';
import { useNotificacoes } from '../hooks/useAgenda';
import { usePreferencias } from '../hooks/usePreferencias';
import { mascararHora } from '../models/regrasConsulta';
import {
  ANTECEDENCIAS_DIAS,
  ATALHOS_INFO,
  INTERVALOS_LEMBRETE_BACKUP,
  alternarAtalho,
  lerHorarioPadrao,
  lerMeta,
  listaCompletaDeAtalhos,
  moverAtalho,
} from '../models/regrasPreferencias';
import { preferenciasService } from '../services/PreferenciasService';
import { ALVO_MINIMO, espaco, raio, useTheme } from '../theme';

function Grupo({ titulo, children }) {
  return (
    <View style={{ marginBottom: espaco.xl }}>
      <Texto variante="subtitulo" accessibilityRole="header" style={{ marginBottom: espaco.md }}>
        {titulo}
      </Texto>
      {children}
    </View>
  );
}

/**
 * Preferências do tutor. Tudo é salvo na hora, sem botão de salvar:
 * as opções de escolha ao tocar, e o horário e a meta ao sair do campo (se estiverem corretos).
 */
export default function Preferencias() {
  const router = useRouter();
  const { paleta, preferencia: tema, definirPreferencia } = useTheme();
  const prefs = usePreferencias();
  const { estado, pedir } = useNotificacoes();

  const [horario, setHorario] = useState(prefs.horarioPadrao);
  const [meta, setMeta] = useState(String(prefs.metaPasseioMin));
  const [erros, setErros] = useState({});

  const salvar = (parcial) => preferenciasService.salvar(parcial);

  function salvarHorario() {
    const r = lerHorarioPadrao(horario);
    if ('erro' in r) {
      setErros((e) => ({ ...e, horario: r.erro }));
      return;
    }
    setErros((e) => ({ ...e, horario: undefined }));
    salvar({ horarioPadrao: r.horario });
  }

  function salvarMeta() {
    const r = lerMeta(meta);
    if ('erro' in r) {
      setErros((e) => ({ ...e, meta: r.erro }));
      return;
    }
    setErros((e) => ({ ...e, meta: undefined }));
    salvar({ metaPasseioMin: r.minutos });
  }

  async function ativarNotificacoes() {
    if (!estado.podePedir) {
      await Linking.openSettings();
      return;
    }
    await pedir();
  }

  const lista = listaCompletaDeAtalhos(prefs.atalhos);

  return (
    <Screen>
      <Cabecalho titulo="Preferências" aoVoltar={() => router.back()} />
      <Texto variante="legenda" style={{ marginBottom: espaco.xl }}>
        As mudanças são salvas na hora.
      </Texto>

      <Grupo titulo="Aparência e unidades">
        <ChipSelector
          rotulo="Tema"
          valor={tema}
          aoMudar={definirPreferencia}
          opcoes={[
            { valor: 'automatico', rotulo: 'Automático' },
            { valor: 'claro', rotulo: 'Claro' },
            { valor: 'escuro', rotulo: 'Escuro' },
          ]}
        />
        <Texto variante="legenda" style={{ marginTop: -8, marginBottom: espaco.lg }}>
          Automático segue o tema do celular.
        </Texto>

        <ChipSelector
          rotulo="Unidade de peso"
          valor={prefs.unidadePeso}
          aoMudar={(v) => salvar({ unidadePeso: v })}
          opcoes={[
            { valor: 'automatica', rotulo: 'Automática' },
            { valor: 'kg', rotulo: 'Quilos' },
            { valor: 'g', rotulo: 'Gramas' },
          ]}
        />
        <Texto variante="legenda" style={{ marginTop: -8 }}>
          Automática usa gramas para pets pequenos (abaixo de 1 kg) e quilos para os demais.
        </Texto>
      </Grupo>

      <Grupo titulo="Lembretes e notificações">
        <Campo
          rotulo="Horário padrão dos avisos"
          placeholder="09:00"
          keyboardType="number-pad"
          maxLength={5}
          value={horario}
          onChangeText={(t) => {
            setHorario(mascararHora(t));
            setErros((e) => ({ ...e, horario: undefined }));
          }}
          onEndEditing={salvarHorario}
          erro={erros.horario}
          dica="Para lembretes sem hora definida."
        />

        <ChipSelector
          rotulo="Avisar vacinas, cuidados e consultas com"
          valor={String(prefs.antecedenciaDias)}
          aoMudar={(v) => salvar({ antecedenciaDias: Number(v) })}
          opcoes={ANTECEDENCIAS_DIAS.map((d) => ({
            valor: String(d),
            rotulo: d === 0 ? 'Na hora' : d === 1 ? '1 dia' : `${d} dias`,
          }))}
        />

        <LinhaSwitch
          titulo="Sugerir nova pesagem"
          detalhe="Mostra no painel se passar de 30 dias sem registrar o peso."
          valor={prefs.sugerirPesagem}
          aoMudar={(v) => salvar({ sugerirPesagem: v })}
        />

        <View
          style={[
            styles.notificacoes,
            {
              backgroundColor: estado.permitido ? paleta.destaqueSuave : paleta.cartao,
              borderColor: paleta.linha,
            },
          ]}
        >
          <Ionicons
            name={estado.permitido ? 'notifications' : 'notifications-off-outline'}
            size={24}
            color={estado.permitido ? paleta.destaque : paleta.textoSuave}
          />
          <View style={{ flex: 1 }}>
            <Texto variante="corpoMedio" cor={estado.permitido ? 'destaque' : 'texto'}>
              {!estado.disponivel
                ? 'Notificações indisponíveis aqui'
                : estado.permitido
                  ? 'Notificações ativadas'
                  : 'Notificações desligadas'}
            </Texto>
            <Texto variante="legenda" cor={estado.permitido ? 'destaque' : 'textoSuave'}>
              {!estado.disponivel
                ? 'Este ambiente não permite avisos. Veja a ajuda abaixo.'
                : estado.permitido
                  ? 'Os lembretes chegam mesmo com o app fechado.'
                  : 'Ative para receber os lembretes mesmo com o app fechado.'}
            </Texto>
          </View>
        </View>
        {estado.disponivel && !estado.permitido ? (
          <View style={{ marginTop: espaco.sm }}>
            <Button
              titulo={estado.podePedir ? 'Ativar notificações' : 'Abrir configurações do celular'}
              aoPressionar={ativarNotificacoes}
            />
          </View>
        ) : null}
        <View style={{ marginTop: espaco.sm, alignItems: 'flex-start' }}>
          <Button
            titulo="Lembretes não chegam?"
            variante="texto"
            larguraTotal={false}
            aoPressionar={() => router.push('/ajuda-lembretes')}
          />
        </View>
      </Grupo>

      <Grupo titulo="Rotina">
        <Campo
          rotulo="Meta diária de passeio (minutos)"
          placeholder="30"
          keyboardType="number-pad"
          maxLength={3}
          value={meta}
          onChangeText={(t) => {
            setMeta(t.replace(/\D/g, ''));
            setErros((e) => ({ ...e, meta: undefined }));
          }}
          onEndEditing={salvarMeta}
          erro={erros.meta}
          dica="É só um incentivo: o app nunca cobra a meta."
        />
      </Grupo>

      <Grupo titulo="Backup">
        <ChipSelector
          rotulo="Lembrar de fazer backup"
          valor={String(prefs.lembreteBackupDias)}
          aoMudar={(v) => salvar({ lembreteBackupDias: Number(v) })}
          opcoes={INTERVALOS_LEMBRETE_BACKUP.map((d) => ({
            valor: String(d),
            rotulo: d === 0 ? 'Nunca' : `A cada ${d} dias`,
          }))}
        />
        <Texto variante="legenda" style={{ marginTop: -8 }}>
          O aviso chega no horário padrão. Depois de cada backup, a contagem recomeça.
        </Texto>
      </Grupo>

      <Grupo titulo="Atalhos do painel">
        <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
          Escolha quais aparecem e a ordem. Pelo menos um fica sempre ligado.
        </Texto>
        <View style={[styles.lista, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
          {lista.map(({ chave, ativo }, i) => {
            const info = ATALHOS_INFO[chave];
            const posicao = prefs.atalhos.indexOf(chave);
            const ultimo = posicao === prefs.atalhos.length - 1;
            return (
              <View
                key={chave}
                style={[styles.atalho, i > 0 && { borderTopWidth: 1, borderTopColor: paleta.linha }]}
              >
                <Switch
                  value={ativo}
                  onValueChange={() => salvar({ atalhos: alternarAtalho(prefs.atalhos, chave) })}
                  accessibilityLabel={`Mostrar o atalho ${info.rotulo}`}
                  trackColor={{ false: paleta.campo, true: paleta.primario }}
                  thumbColor={paleta.cartao}
                />
                <Ionicons
                  name={info.icone}
                  size={20}
                  color={ativo ? paleta.primarioTexto : paleta.textoSuave}
                />
                <Texto variante="corpoMedio" style={{ flex: 1 }} cor={ativo ? 'texto' : 'textoSuave'}>
                  {info.rotulo}
                </Texto>
                {ativo ? (
                  <>
                    <Pressable
                      onPress={() => salvar({ atalhos: moverAtalho(prefs.atalhos, chave, -1) })}
                      disabled={posicao === 0}
                      accessibilityRole="button"
                      accessibilityLabel={`Subir ${info.rotulo}`}
                      accessibilityState={{ disabled: posicao === 0 }}
                      style={[styles.seta, posicao === 0 && { opacity: 0.35 }]}
                    >
                      <Ionicons name="arrow-up" size={20} color={paleta.texto} />
                    </Pressable>
                    <Pressable
                      onPress={() => salvar({ atalhos: moverAtalho(prefs.atalhos, chave, 1) })}
                      disabled={ultimo}
                      accessibilityRole="button"
                      accessibilityLabel={`Descer ${info.rotulo}`}
                      accessibilityState={{ disabled: ultimo }}
                      style={[styles.seta, ultimo && { opacity: 0.35 }]}
                    >
                      <Ionicons name="arrow-down" size={20} color={paleta.texto} />
                    </Pressable>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      </Grupo>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notificacoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.md,
  },
  lista: { borderWidth: 1, borderRadius: raio.lg, overflow: 'hidden' },
  atalho: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.xs,
  },
  seta: { width: ALVO_MINIMO, height: ALVO_MINIMO, alignItems: 'center', justifyContent: 'center' },
});
