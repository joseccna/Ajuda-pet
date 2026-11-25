import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Lora_500Medium } from '@expo-google-fonts/lora';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Database } from '../database/Database';
import { DeviceIdentity } from '../database/DeviceIdentity';
import { mudancas } from '../database/mudancas';
import { notificacaoService } from '../services/NotificacaoService';
import { preferenciasService } from '../services/PreferenciasService';
import { ThemeProvider, useTheme } from '../theme';
import { Texto } from '../components/ui/Texto';
SplashScreen.preventAutoHideAsync();
/** Ao tocar em uma notificação, abre a tela do lembrete. */
function useAbrirNotificacoes() {
  const router = useRouter();
  useEffect(() => notificacaoService.ouvirToques((rota) => router.push(rota)), [router]);
}

function Navegacao() {
  const { paleta, escuro } = useTheme();
  useAbrirNotificacoes();
  return (
    <>
      <StatusBar style={escuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: paleta.fundo } }} />
    </>
  );
}
export default function RaizLayout() {
  const [fontesProntas, erroFontes] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Lora_500Medium,
  });
  // O banco abre de forma síncrona, uma vez, antes da primeira renderização.
  const [{ bancoPronto, erroBanco }] = useState(() => {
    try {
      Database.iniciar();
      DeviceIdentity.iniciar();
      return { bancoPronto: true, erroBanco: null };
    } catch (e) {
      return { bancoPronto: false, erroBanco: e instanceof Error ? e.message : String(e) };
    }
  });
  // Notificações: configura ao abrir e agenda de novo ao abrir e ao voltar para o app.
  useEffect(() => {
    if (!bancoPronto) return undefined;
    notificacaoService
      .configurar()
      .then(() => notificacaoService.pedirNaPrimeiraVez())
      .then(() => notificacaoService.reagendar())
      // Depois de agendar, para os avisos não esperarem a resposta da janela.
      .then(() => notificacaoService.pedirBateriaNaPrimeiraVez());
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') notificacaoService.reagendarEmBreve();
      else if (estado === 'background') notificacaoService.reagendarSePendente();
    });
    // Mudou o horário ou a antecedência dos avisos: agenda de novo.
    const parar = preferenciasService.assinar(() => notificacaoService.reagendarEmBreve());
    // Qualquer gravação no banco (lembrete, dose, cuidado, consulta...): agenda de novo.
    const pararDados = mudancas.assinar(() => notificacaoService.reagendarEmBreve());
    return () => {
      assinatura.remove();
      parar();
      pararDados();
    };
  }, [bancoPronto]);

  const pronto = (fontesProntas || erroFontes !== null) && (bancoPronto || erroBanco !== null);
  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);
  if (!pronto) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {erroBanco ? (
          <View style={styles.erro}>
            <Texto variante="subtitulo">Não foi possível abrir seus dados</Texto>
            <Texto variante="legenda">{erroBanco}</Texto>
          </View>
        ) : (
          <Navegacao />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  erro: { flex: 1, justifyContent: 'center', padding: 24, gap: 8 },
});
