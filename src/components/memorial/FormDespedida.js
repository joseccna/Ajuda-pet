import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { LIMITE_HOMENAGEM } from '../../models/regrasMemorial';
import { ErroValidacaoMemorial, memorialService } from '../../services/MemorialService';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { Texto } from '../ui/Texto';

/**
 * Registrar a despedida. Só a data é essencial; a mensagem de homenagem é opcional e pode ser escrita depois.
 * O tom é calmo: sem pressa, sem frases feitas, e com a certeza de que dá para desfazer.
 */
export function FormDespedida({ pet, aoSalvar, aoAgoraNao }) {
  const { paleta } = useTheme();
  const editando = pet.falecido;

  const inicial = useMemo(
    () => ({
      data: formatarDataBR(pet.dataFalecimento ?? paraISO(new Date())),
      mensagem: memorialService.homenagem(pet.id),
    }),
    [pet],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  function salvar() {
    const data = lerDataBR(e.data);
    if ('erro' in data) {
      setErros({ data: data.erro });
      return;
    }
    try {
      memorialService.registrarDespedida(pet.id, { dataISO: data.iso, mensagem: e.mensagem });
      // Se a pessoa apagou o texto de uma homenagem que já existia, apaga também.
      if (editando && e.mensagem.trim() === '') memorialService.salvarHomenagem(pet.id, '');
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoMemorial)
        setErros({ data: erro.erros.data, mensagem: erro.erros.texto });
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  return (
    <View>
      <View style={[styles.acolhimento, { backgroundColor: paleta.primarioSuave }]}>
        <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={84} />
        <Texto
          variante="subtitulo"
          style={{ fontFamily: fontes.titulo, textAlign: 'center' }}
          cor="primarioTexto"
          accessibilityRole="header"
        >
          {editando ? `Memorial ${pet.deNome}` : `Sentimos muito por ${pet.nome}`}
        </Texto>
        <Texto style={{ textAlign: 'center' }}>
          Quando você quiser, vamos guardar as lembranças com carinho. Sem pressa.
        </Texto>
      </View>

      <Campo
        rotulo="Data da despedida"
        obrigatorio
        placeholder="14/03/2025"
        keyboardType="number-pad"
        maxLength={10}
        value={e.data}
        onChangeText={(t) => {
          setE((a) => ({ ...a, data: mascararDataBR(t) }));
          setErros((a) => ({ ...a, data: undefined }));
        }}
        erro={erros.data}
      />
      <Campo
        rotulo="Mensagem de homenagem"
        multilinha
        placeholder={`Escreva algumas palavras sobre ${pet.nome}`}
        maxLength={LIMITE_HOMENAGEM}
        value={e.mensagem}
        onChangeText={(t) => {
          setE((a) => ({ ...a, mensagem: t }));
          setErros((a) => ({ ...a, mensagem: undefined }));
        }}
        erro={erros.mensagem}
        dica="Opcional. Você pode escrever ou mudar depois."
      />

      <View style={[styles.nota, { backgroundColor: paleta.destaqueSuave }]}>
        <Texto variante="legenda" cor="destaque">
          Os lembretes {pet.deNome} ficam pausados e ele(a) sai da lista de pets. Nada é apagado: as fotos, a
          carteirinha e o histórico continuam guardados, e você pode desfazer isso quando quiser.
        </Texto>
      </View>

      <View style={{ gap: espaco.sm }}>
        <Button titulo="Guardar no memorial" aoPressionar={salvar} />
        <Button titulo="Agora não" variante="texto" larguraTotal={false} aoPressionar={aoAgoraNao} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  acolhimento: {
    borderRadius: raio.lg,
    padding: espaco.xl,
    alignItems: 'center',
    gap: espaco.sm,
    marginBottom: espaco.xl,
  },
  nota: { padding: espaco.md, borderRadius: raio.md, marginBottom: espaco.xl },
});
