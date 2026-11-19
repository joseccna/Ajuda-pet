import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, raio, useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Texto } from '../ui/Texto';

const TEXTOS = {
  notificacoes: {
    icone: 'notifications-off-outline',
    titulo: 'Os avisos estão desligados',
    texto: 'Sem a permissão de notificação, você não recebe os lembretes de refeições, vacinas e consultas.',
    botao: 'Ativar avisos',
  },
  bateria: {
    icone: 'battery-charging-outline',
    titulo: 'Os avisos podem atrasar',
    texto: 'O app está na economia de bateria, e o celular pode segurar os avisos até você abrir o app.',
    botao: 'Liberar da economia de bateria',
  },
};

/** Faixa no painel quando algo impede os avisos de chegarem na hora. */
export function AvisoNotificacoes({ problema, aoResolver }) {
  const { paleta } = useTheme();
  const t = TEXTOS[problema];
  if (!t) return null;
  return (
    <View
      style={[styles.caixa, { backgroundColor: paleta.avisoSuave }]}
      accessible
      accessibilityLabel={`Atenção. ${t.titulo}. ${t.texto}`}
    >
      <View style={styles.topo}>
        <Ionicons name={t.icone} size={26} color={paleta.aviso} />
        <View style={{ flex: 1 }}>
          <Texto variante="corpoMedio" style={{ color: paleta.aviso }}>
            {t.titulo}
          </Texto>
          <Texto variante="legenda" style={{ color: paleta.aviso }}>
            {t.texto}
          </Texto>
        </View>
      </View>
      <Button titulo={t.botao} icone={t.icone} aoPressionar={aoResolver} />
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { borderRadius: raio.lg, padding: espaco.lg, gap: espaco.md, marginBottom: espaco.xl },
  topo: { flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' },
});
