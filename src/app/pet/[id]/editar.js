import React from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormPet } from '../../../components/pet/FormPet';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { Texto } from '../../../components/ui/Texto';
import { usePet } from '../../../hooks/usePet';
import { petService } from '../../../services/PetService';
import { espaco } from '../../../theme';

/** Edita os dados do pet. As ações raras (despedida e exclusão) ficam aqui, longe do perfil. */
export default function EditarPet() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);

  function confirmarExclusao() {
    Alert.alert(
      `Excluir ${pet.nome}?`,
      'O cadastro some da lista. Esta ação não pode ser desfeita pelo app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            petService.excluir(pet.id);
            // Fecha esta tela e o perfil do pet, que não existe mais.
            router.dismiss(2);
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Cabecalho titulo="Editar pet" icone="fechar" aoVoltar={() => router.back()} />
      {pet ? (
        <>
          <FormPet petInicial={pet} aoSalvar={() => router.back()} />
          <View style={{ marginTop: espaco.xl, gap: espaco.sm }}>
            <Texto variante="rotulo">Outras ações</Texto>
            {!pet.falecido ? (
              <Button
                titulo="Registrar despedida"
                icone="heart-outline"
                variante="secundario"
                aoPressionar={() => router.replace({ pathname: '/pet/[id]/despedida', params: { id: pet.id } })}
                dicaAcessibilidade="Move o pet para o memorial, com calma. Dá para desfazer"
              />
            ) : null}
            <Button titulo="Excluir pet" variante="perigo" aoPressionar={confirmarExclusao} />
          </View>
        </>
      ) : carregando ? null : (
        <EstadoVazio
          icone="help-circle-outline"
          titulo="Pet não encontrado"
          texto="Ele pode ter sido excluído."
        />
      )}
    </Screen>
  );
}
