import { useCallback, useMemo, useState } from 'react';
import { SECOES_PADRAO } from '../models/regrasBackup';
import { fichaService } from '../services/FichaService';

/** Ficha do pet: escolher pets, seções e formato (PDF ou arquivo do Ajuda Pet), gerar e compartilhar. */
export function useFicha(petIdInicial) {
  const pets = useMemo(() => fichaService.petsDisponiveis(), []);
  const [escolhidos, setEscolhidos] = useState(() =>
    petIdInicial ? [petIdInicial] : pets.length === 1 ? [pets[0].id] : [],
  );
  const [secoes, setSecoes] = useState(SECOES_PADRAO);
  const [formato, setFormato] = useState('pdf');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviado, setEnviado] = useState(false);

  const alternarPet = useCallback(
    (id) => setEscolhidos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])),
    [],
  );
  const alternarSecao = useCallback(
    (chave) => setSecoes((l) => (l.includes(chave) ? l.filter((x) => x !== chave) : [...l, chave])),
    [],
  );

  const gerarECompartilhar = useCallback(async () => {
    setGerando(true);
    setErro(null);
    setEnviado(false);
    try {
      const params = { petIds: escolhidos, secoes };
      const arquivo =
        formato === 'pdf' ? await fichaService.gerarPdf(params) : await fichaService.gerarPacote(params);
      await fichaService.compartilhar(arquivo);
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar a ficha.');
    } finally {
      setGerando(false);
    }
  }, [escolhidos, secoes, formato]);

  return {
    pets,
    escolhidos,
    alternarPet,
    secoes,
    alternarSecao,
    formato,
    setFormato,
    gerando,
    erro,
    enviado,
    gerarECompartilhar,
  };
}
