import { useCallback, useState } from 'react';
import { importacaoService } from '../services/ImportacaoService';
import { notificacaoService } from '../services/NotificacaoService';

/**
 * Importar um arquivo .ajudapet em etapas.
 * fase: inicio | lendo | senha | previa | aplicando | feito | erro
 */
export function useImportacao() {
  const [fase, setFase] = useState('inicio');
  const [uri, setUri] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [previa, setPrevia] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [senhaErrada, setSenhaErrada] = useState(false);

  const abrir = useCallback(async (caminho, senha) => {
    setFase('lendo');
    setErro(null);
    try {
      const r = await importacaoService.abrir(caminho, senha);
      setSessao(r.sessao);
      setPrevia(r.previa);
      setSenhaErrada(false);
      setFase('previa');
    } catch (e) {
      if (e?.codigo === 'SENHA_NECESSARIA') {
        setFase('senha');
      } else if (e?.codigo === 'SENHA_INCORRETA') {
        setSenhaErrada(true);
        setFase('senha');
      } else {
        setErro(e instanceof Error ? e.message : 'Não foi possível abrir o arquivo.');
        setFase('erro');
      }
    }
  }, []);

  const escolherArquivo = useCallback(async () => {
    let DocumentPicker = null;
    try {
      DocumentPicker = require('expo-document-picker');
    } catch {
      // módulo nativo ausente neste ambiente
    }
    if (!DocumentPicker) {
      setErro(
        'A escolha de arquivos não está disponível neste ambiente (por exemplo, no Expo Go). Use o app instalado (build) para abrir arquivos.',
      );
      setFase('erro');
      return;
    }
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (r.canceled || !r.assets?.[0]) return;
      const arquivo = r.assets[0];
      setUri(arquivo.uri);
      setNomeArquivo(arquivo.name ?? '');
      await abrir(arquivo.uri);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível escolher o arquivo.');
      setFase('erro');
    }
  }, [abrir]);

  const enviarSenha = useCallback((senha) => abrir(uri, senha), [abrir, uri]);

  const confirmar = useCallback(async () => {
    if (!sessao) return;
    setFase('aplicando');
    setErro(null);
    try {
      const r = await importacaoService.aplicar(sessao);
      setResultado(r);
      setFase('feito');
      notificacaoService.reagendarEmBreve();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível importar. Nada foi alterado.');
      setFase('erro');
    }
  }, [sessao]);

  const recomecar = useCallback(() => {
    setFase('inicio');
    setUri(null);
    setNomeArquivo('');
    setPrevia(null);
    setSessao(null);
    setResultado(null);
    setErro(null);
    setSenhaErrada(false);
  }, []);

  return {
    fase,
    nomeArquivo,
    previa,
    resultado,
    erro,
    senhaErrada,
    escolherArquivo,
    enviarSenha,
    confirmar,
    recomecar,
  };
}
