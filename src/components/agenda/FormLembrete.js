import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LembreteAvulso } from '../../models/LembreteAvulso';
import { dicaDoTipo, registroDoLembrete } from '../../models/regrasLembrete';
import { ANTECEDENCIAS, REPETICOES, TIPOS_LEMBRETE } from '../../models/regrasAgenda';
import { lerHora, mascararHora } from '../../models/regrasConsulta';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { cuidadoService } from '../../services/CuidadoService';
import { ErroValidacaoLembrete, lembreteAvulsoService } from '../../services/LembreteAvulsoService';
import { vacinaService } from '../../services/VacinaService';
import { espaco, raio, useTheme } from '../../theme';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { Texto } from '../ui/Texto';

/**
 * Cria ou edita um lembrete avulso. Só pet, tipo e título são necessários: a data começa no dia
 * escolhido na agenda e o aviso com 3 dias de antecedência já vem marcado.
 */
export function FormLembrete({ pets, lembrete, petIdInicial, dataInicial, aoSalvar, aoExcluir }) {
  const editando = Boolean(lembrete);
  const router = useRouter();
  const { paleta } = useTheme();

  const inicial = useMemo(
    () => ({
      petId: lembrete?.petId ?? petIdInicial ?? pets[0]?.id ?? '',
      tipo: lembrete?.tipo ?? 'medicacao',
      titulo: lembrete?.titulo ?? '',
      data: formatarDataBR(lembrete?.data ?? dataInicial ?? paraISO(new Date())),
      hora: lembrete?.hora ?? '',
      repetir: lembrete?.repetir ?? 'nao',
      antecedencia: String(lembrete?.antecedenciaDias ?? 3),
      observacao: lembrete?.observacao ?? '',
    }),
    [lembrete, petIdInicial, dataInicial, pets],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };

  function escolherTipo(valor) {
    const rotulo = TIPOS_LEMBRETE.find((t) => t.valor === valor)?.rotulo ?? '';
    setE((a) => ({ ...a, tipo: valor, titulo: a.titulo.trim() === '' ? rotulo : a.titulo }));
    // O título pode ter acabado de ser preenchido com o tipo: tira o aviso de título vazio.
    setErros((a) => ({ ...a, titulo: undefined }));
  }

  function salvar() {
    const novosErros = {};
    const data = lerDataBR(e.data, new Date(), true);
    if ('erro' in data) novosErros.data = data.erro;
    const hora = lerHora(e.hora);
    if ('erro' in hora) novosErros.hora = hora.erro;
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const item = lembrete?.copia() ?? new LembreteAvulso();
    item.petId = e.petId;
    item.tipo = e.tipo;
    item.titulo = e.titulo;
    item.data = data.iso;
    item.hora = hora.hora;
    item.repetir = e.repetir;
    item.antecedenciaDias = Number(e.antecedencia);
    item.observacao = e.observacao;

    try {
      lembreteAvulsoService.salvar(item);
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoLembrete) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  /**
   * Vacina, cuidado e consulta têm registro próprio no pet: pergunta se quer registrar lá também,
   * para o histórico ficar completo e a próxima data ser calculada.
   */
  function marcarFeito() {
    const concluir = () => {
      lembreteAvulsoService.concluir(lembrete.id);
      liberarSaida();
    };
    const destino = registroDoLembrete(
      { petId: e.petId, tipo: e.tipo, titulo: e.titulo },
      { vacinas: vacinaService.tiposDoPet(e.petId), cuidados: cuidadoService.tiposDoPet(e.petId) },
    );
    if (!destino) {
      concluir();
      aoSalvar();
      return;
    }
    Alert.alert(
      'Marcar como feito',
      `Quer registrar também ${destino.onde}? Assim o histórico do pet fica completo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Só marcar',
          onPress: () => {
            concluir();
            aoSalvar();
          },
        },
        {
          text: destino.rotulo,
          onPress: () => {
            concluir();
            router.replace({ pathname: destino.pathname, params: destino.params });
          },
        },
      ],
    );
  }

  const dica = editando ? null : dicaDoTipo(e.tipo, e.petId);
  function irParaDica() {
    liberarSaida();
    router.replace(dica.rota);
  }

  function confirmarExclusao() {
    Alert.alert(
      'Excluir este lembrete?',
      e.repetir !== 'nao' ? 'Ele deixa de se repetir.' : 'Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            lembreteAvulsoService.excluir(lembrete.id);
            liberarSaida();
            aoExcluir();
          },
        },
      ],
    );
  }

  return (
    <View>
      {pets.length > 1 ? (
        <ChipSelector
          rotulo="Para qual pet"
          valor={e.petId}
          aoMudar={(v) => mudar('petId', v)}
          opcoes={pets.map((p) => ({ valor: p.id, rotulo: p.nome }))}
          erro={erros.petId}
        />
      ) : null}

      <ChipSelector
        rotulo="O que é"
        valor={e.tipo}
        aoMudar={escolherTipo}
        opcoes={TIPOS_LEMBRETE.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))}
      />
      {dica ? (
        <View style={[styles.dica, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
          <View style={styles.dicaTopo}>
            <Ionicons name="information-circle-outline" size={22} color={paleta.primarioTexto} />
            <Texto variante="legenda" style={{ flex: 1 }}>
              {dica.texto}
            </Texto>
          </View>
          <Button titulo={dica.botao} variante="secundario" aoPressionar={irParaDica} />
        </View>
      ) : null}
      <Campo
        rotulo="Título"
        obrigatorio
        placeholder="Vermífugo"
        value={e.titulo}
        onChangeText={(t) => mudar('titulo', t)}
        maxLength={60}
        erro={erros.titulo}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 3 }}>
          <Campo
            rotulo="Data"
            obrigatorio
            placeholder="18/10/2026"
            keyboardType="number-pad"
            maxLength={10}
            value={e.data}
            onChangeText={(t) => mudar('data', mascararDataBR(t))}
            erro={erros.data}
          />
        </View>
        <View style={{ flex: 2 }}>
          <Campo
            rotulo="Hora"
            placeholder="09:00"
            keyboardType="number-pad"
            maxLength={5}
            value={e.hora}
            onChangeText={(t) => mudar('hora', mascararHora(t))}
            erro={erros.hora}
          />
        </View>
      </View>

      <ChipSelector
        rotulo="Repetir"
        valor={e.repetir}
        aoMudar={(v) => mudar('repetir', v)}
        opcoes={REPETICOES}
      />
      <ChipSelector
        rotulo="Avisar com antecedência"
        valor={e.antecedencia}
        aoMudar={(v) => mudar('antecedencia', v)}
        opcoes={ANTECEDENCIAS.map((a) => ({ valor: String(a.valor), rotulo: a.rotulo }))}
      />
      <Texto variante="legenda" style={{ marginTop: -8, marginBottom: 16 }}>
        Você também recebe um aviso no dia{e.hora ? ', 1 hora antes' : ', às 9h'}.
      </Texto>

      <Campo
        rotulo="Observação"
        multilinha
        placeholder="Comprar o comprimido antes"
        value={e.observacao}
        onChangeText={(t) => mudar('observacao', t)}
      />

      <View style={{ gap: 12 }}>
        <Button titulo={editando ? 'Salvar alterações' : 'Salvar lembrete'} aoPressionar={salvar} />
        {editando ? (
          <>
            <Button
              titulo={e.repetir !== 'nao' ? 'Marcar como feito e ir para a próxima' : 'Marcar como feito'}
              variante="secundario"
              icone="checkmark"
              aoPressionar={marcarFeito}
            />
            <Button titulo="Excluir lembrete" variante="perigo" aoPressionar={confirmarExclusao} />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dica: {
    gap: espaco.md,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.md,
    marginTop: -espaco.sm,
    marginBottom: espaco.lg,
  },
  dicaTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.sm },
});
