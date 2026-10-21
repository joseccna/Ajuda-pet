import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { mascararTelefone } from '../../models/regrasTutor';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { ErroValidacaoTutor, tutorService } from '../../services/TutorService';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { Texto } from '../ui/Texto';

function Grupo({ titulo, nota, children }) {
  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      <Texto variante="subtitulo" accessibilityRole="header" style={{ marginBottom: nota ? 4 : 12 }}>
        {titulo}
      </Texto>
      {nota ? (
        <Texto variante="legenda" style={{ marginBottom: 12 }}>
          {nota}
        </Texto>
      ) : null}
      {children}
    </View>
  );
}

/**
 * Perfil do tutor e contatos de confiança. Só o nome é essencial.
 * Os contatos aparecem no cartão de emergência e preenchem sugestões (como o veterinário nas consultas).
 */
export function FormTutor({ tutor, aoSalvar }) {
  const inicial = useMemo(
    () => ({
      nome: tutor.nome,
      apelido: tutor.apelido,
      telefone: tutor.telefone,
      email: tutor.email,
      vetNome: tutor.vetNome,
      vetClinica: tutor.vetClinica,
      vetTelefone: tutor.vetTelefone,
      petshopNome: tutor.petshopNome,
      petshopTelefone: tutor.petshopTelefone,
      emergenciaNome: tutor.emergenciaNome,
      emergenciaRelacao: tutor.emergenciaRelacao,
      emergenciaTelefone: tutor.emergenciaTelefone,
    }),
    [tutor],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };
  const telefone = (campo) => (t) => mudar(campo, mascararTelefone(t));

  function salvar() {
    Object.assign(tutor, e);
    try {
      tutorService.salvar(tutor);
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoTutor) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  return (
    <View>
      <Campo
        rotulo="Nome"
        obrigatorio
        placeholder="Ana Souza"
        value={e.nome}
        onChangeText={(t) => mudar('nome', t)}
        autoCapitalize="words"
        maxLength={80}
        erro={erros.nome}
      />
      <Campo
        rotulo="Como o app deve te chamar"
        placeholder="Ana"
        value={e.apelido}
        onChangeText={(t) => mudar('apelido', t)}
        autoCapitalize="words"
        maxLength={30}
        erro={erros.apelido}
        dica="Aparece na saudação do painel. Se vazio, usamos o primeiro nome."
      />
      <Campo
        rotulo="Telefone"
        placeholder="(11) 91234-5678"
        keyboardType="phone-pad"
        maxLength={15}
        value={e.telefone}
        onChangeText={telefone('telefone')}
        erro={erros.telefone}
      />
      <Campo
        rotulo="E-mail"
        placeholder="ana@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={e.email}
        onChangeText={(t) => mudar('email', t)}
        erro={erros.email}
      />

      <Grupo titulo="Veterinário de confiança" nota="Já vem preenchido ao registrar consultas.">
        <Campo
          rotulo="Nome"
          placeholder="Dra. Paula Reis"
          value={e.vetNome}
          onChangeText={(t) => mudar('vetNome', t)}
        />
        <Campo
          rotulo="Clínica"
          placeholder="VetCare"
          value={e.vetClinica}
          onChangeText={(t) => mudar('vetClinica', t)}
        />
        <Campo
          rotulo="Telefone"
          placeholder="(11) 3000-0000"
          keyboardType="phone-pad"
          maxLength={15}
          value={e.vetTelefone}
          onChangeText={telefone('vetTelefone')}
          erro={erros.vetTelefone}
        />
      </Grupo>

      <Grupo titulo="Pet shop preferido">
        <Campo
          rotulo="Nome"
          placeholder="Banho e Cia"
          value={e.petshopNome}
          onChangeText={(t) => mudar('petshopNome', t)}
        />
        <Campo
          rotulo="Telefone"
          placeholder="(11) 3000-1111"
          keyboardType="phone-pad"
          maxLength={15}
          value={e.petshopTelefone}
          onChangeText={telefone('petshopTelefone')}
          erro={erros.petshopTelefone}
        />
      </Grupo>

      <Grupo
        titulo="Contato de emergência"
        nota="Aparece no cartão de emergência. O app não envia mensagens a essa pessoa: os botões só abrem o discador."
      >
        <Campo
          rotulo="Nome"
          placeholder="Camila"
          value={e.emergenciaNome}
          onChangeText={(t) => mudar('emergenciaNome', t)}
          autoCapitalize="words"
        />
        <Campo
          rotulo="Relação"
          placeholder="Irmã"
          value={e.emergenciaRelacao}
          onChangeText={(t) => mudar('emergenciaRelacao', t)}
        />
        <Campo
          rotulo="Telefone"
          placeholder="(11) 98765-4321"
          keyboardType="phone-pad"
          maxLength={15}
          value={e.emergenciaTelefone}
          onChangeText={telefone('emergenciaTelefone')}
          erro={erros.emergenciaTelefone}
        />
      </Grupo>

      <Button titulo="Salvar perfil" aoPressionar={salvar} />
    </View>
  );
}
