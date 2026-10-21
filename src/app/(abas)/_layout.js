import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fontes, useTheme } from '../../theme';
const ABAS = [
  { nome: 'index', titulo: 'Pets', ativo: 'paw', inativo: 'paw-outline' },
  { nome: 'agenda', titulo: 'Agenda', ativo: 'calendar', inativo: 'calendar-outline' },
  { nome: 'compartilhar', titulo: 'Compartilhar', ativo: 'share-social', inativo: 'share-social-outline' },
  { nome: 'tutor', titulo: 'Tutor', ativo: 'person', inativo: 'person-outline' },
];
/** Barra inferior com as quatro abas do app. */
export default function AbasLayout() {
  const { paleta } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: paleta.primarioTexto,
        tabBarInactiveTintColor: paleta.textoSuave,
        tabBarLabelStyle: { fontFamily: fontes.corpoMedio, fontSize: 12 },
        tabBarStyle: { backgroundColor: paleta.cartao, borderTopColor: paleta.linha, minHeight: 60 },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      {ABAS.map((a) => (
        <Tabs.Screen
          key={a.nome}
          name={a.nome}
          options={{
            title: a.titulo,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? a.ativo : a.inativo} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
