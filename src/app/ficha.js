import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Cabecalho } from '../components/ui/Cabecalho';
import { ChipSelector } from '../components/ui/ChipSelector';
import { EstadoVazio } from '../components/ui/EstadoVazio';
import { LinhaSwitch } from '../components/ui/LinhaSwitch';
import { Screen } from '../components/ui/Screen';
import { Texto } from '../components/ui/Texto';
import { useFicha } from '../hooks/useFicha';
import { SECOES_FICHA } from '../models/regrasBackup';
import { espaco, raio, useTheme } from '../theme';

/** Ficha do pet para veterinário, hotel, pet sitter ou outro tutor. */
export default function TelaFicha() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { petId } = useLocalSearchParams();
  const f = useFicha(typeof petId === 'string' ? petId : undefined);

  if (f.pets.length === 0) {
    return (
      <Screen>
        <Cabecalho titulo="Ficha do pet" aoVoltar={() => router.back()} />
        <EstadoVazio icone="paw" titulo="Nenhum pet ainda" texto="Cadastre um pet para gerar a ficha dele." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Cabecalho titulo="Ficha do pet" aoVoltar={() => router.back()} />
      <Texto variante="corpo" style={{ marginBottom: espaco.lg }}>
        Escolha o que mostrar. Valores pagos, anotações pessoais, memorial e seu perfil nunca entram na ficha.
      </Texto>

      <Texto variante="subtitulo" accessibilityRole="header" style={{ marginBottom: espaco.sm }}>
        Pets
      </Texto>
      {f.pets.map((p) => (
        <LinhaSwitch
          key={p.id}
          titulo={p.nome}
          detalhe={p.resumo}
          valor={f.escolhidos.includes(p.id)}
          aoMudar={() => f.alternarPet(p.id)}
        />
      ))}

      <Texto variante="subtitulo" accessibilityRole="header" style={{ marginVertical: espaco.sm }}>
        O que incluir
      </Texto>
      <View
        style={{
          backgroundColor: paleta.destaqueSuave,
          borderRadius: raio.md,
          padding: espaco.md,
          marginBottom: espaco.lg,
        }}
      >
        <Texto variante="legenda" cor="destaque">
          Dados básicos (nome, espécie, raça, nascimento, microchip, foto) sempre entram.
        </Texto>
      </View>
      {SECOES_FICHA.map((s) => (
        <LinhaSwitch
          key={s.chave}
          titulo={s.rotulo}
          detalhe={s.detalhe}
          valor={f.secoes.includes(s.chave)}
          aoMudar={() => f.alternarSecao(s.chave)}
        />
      ))}

      <ChipSelector
        rotulo="Formato"
        valor={f.formato}
        aoMudar={f.setFormato}
        opcoes={[
          { valor: 'pdf', rotulo: 'PDF' },
          { valor: 'arquivo', rotulo: 'Arquivo do Ajuda Pet' },
        ]}
      />
      <Texto variante="legenda" style={{ marginBottom: espaco.xl }}>
        {f.formato === 'pdf'
          ? 'Abre em qualquer celular e pode ser impresso.'
          : 'Quem usa o Ajuda Pet abre e guarda como uma cópia à parte, sem misturar com os pets dela.'}
      </Texto>

      <Button
        titulo={f.gerando ? 'Gerando...' : 'Gerar e enviar ficha'}
        icone="share-outline"
        carregando={f.gerando}
        desabilitado={f.escolhidos.length === 0}
        aoPressionar={f.gerarECompartilhar}
        dicaAcessibilidade="Abre as opções de envio do celular"
      />
      {f.escolhidos.length === 0 ? (
        <Texto variante="legenda" style={{ marginTop: espaco.sm }}>
          Escolha pelo menos um pet.
        </Texto>
      ) : null}
      {f.erro ? (
        <Texto variante="corpo" cor="erro" accessibilityLiveRegion="polite" style={{ marginTop: espaco.lg }}>
          {f.erro}
        </Texto>
      ) : null}
      {f.enviado ? (
        <Texto
          variante="corpoMedio"
          cor="destaque"
          accessibilityLiveRegion="polite"
          style={{ marginTop: espaco.lg }}
        >
          Ficha enviada para o compartilhamento do celular.
        </Texto>
      ) : null}
    </Screen>
  );
}
