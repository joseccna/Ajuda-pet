/**
 * Versão instalada, lida do próprio APK: "1.1.0 (compilação 12)".
 * version (app.json) é a que o usuário vê; versionCode é o número da compilação, que o EAS
 * aumenta sozinho a cada APK. Sem o módulo nativo (build de desenvolvimento antiga), usa o app.json.
 */
export function textoVersao() {
  try {
    const Application = require('expo-application');
    const versao = Application.nativeApplicationVersion;
    const compilacao = Application.nativeBuildVersion;
    if (versao) return compilacao ? `${versao} (compilação ${compilacao})` : versao;
  } catch {
    // segue para o app.json
  }
  try {
    return require('expo-constants').default.expoConfig?.version ?? '';
  } catch {
    return '';
  }
}
