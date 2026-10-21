import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { novoId } from '../utils/id';
const LARGURA_MAXIMA = 1024;
const LARGURA_ANEXO = 1600;
const QUALIDADE = 0.8;
const PASTA = 'fotos';
const PASTA_ANEXOS = 'anexos';
const PASTA_GALERIA = 'galeria';
const PASTA_MINIATURAS = 'miniaturas';
const LARGURA_GALERIA = 1280;
const LARGURA_MINIATURA = 360;
const LIMITE_SELECAO = 10;
/**
 * Escolher, reduzir e guardar fotos.
 * As fotos ficam na pasta de documentos do app. O banco guarda só o caminho.
 */
export class FotoService {
  /** Abre a câmera ou a galeria e devolve uma foto quadrada e reduzida (ainda temporária). */
  static async escolher(origem) {
    return FotoService.abrir(origem, {
      opcoes: { allowsEditing: true, aspect: [1, 1] },
      larguraMaxima: LARGURA_MAXIMA,
    });
  }

  /** Foto de um documento (receita, exame, laudo): sem recorte e com mais resolução, para ler o texto. */
  static async escolherAnexo(origem) {
    return FotoService.abrir(origem, { opcoes: {}, larguraMaxima: LARGURA_ANEXO });
  }

  /**
   * Fotos para a galeria: pela câmera (uma) ou pela galeria do celular (até 10 de uma vez),
   * sem recorte. Cada foto vem reduzida e com uma miniatura para a grade (ambas ainda temporárias).
   */
  static async escolherParaGaleria(origem) {
    if (origem === 'camera') {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissao.granted) return { tipo: 'sem-permissao' };
    }
    const opcoes = {
      mediaTypes: ['images'],
      quality: 1,
      ...(origem === 'camera'
        ? {}
        : { allowsMultipleSelection: true, selectionLimit: LIMITE_SELECAO, orderedSelection: true }),
    };
    const resultado =
      origem === 'camera'
        ? await ImagePicker.launchCameraAsync(opcoes)
        : await ImagePicker.launchImageLibraryAsync(opcoes);
    if (resultado.canceled || resultado.assets.length === 0) return { tipo: 'cancelado' };

    const itens = [];
    for (const foto of resultado.assets) {
      itens.push({
        uri: await FotoService.reduzir(foto, LARGURA_GALERIA),
        thumbUri: await FotoService.reduzir(foto, LARGURA_MINIATURA),
      });
    }
    return { tipo: 'ok', itens };
  }

  static async reduzir(foto, larguraMaxima) {
    const contexto = ImageManipulator.manipulate(foto.uri);
    if (foto.width > larguraMaxima) contexto.resize({ width: larguraMaxima });
    const imagem = await contexto.renderAsync();
    const resultado = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: QUALIDADE });
    return resultado.uri;
  }

  static async abrir(origem, { opcoes: extras, larguraMaxima }) {
    const opcoes = { mediaTypes: ['images'], quality: 1, ...extras };
    if (origem === 'camera') {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissao.granted) return { tipo: 'sem-permissao' };
    }
    const resultado =
      origem === 'camera'
        ? await ImagePicker.launchCameraAsync(opcoes)
        : await ImagePicker.launchImageLibraryAsync(opcoes);
    if (resultado.canceled || resultado.assets.length === 0) return { tipo: 'cancelado' };
    const foto = resultado.assets[0];
    const contexto = ImageManipulator.manipulate(foto.uri);
    if (foto.width > larguraMaxima) contexto.resize({ width: larguraMaxima });
    const imagem = await contexto.renderAsync();
    const reduzida = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: QUALIDADE });
    return { tipo: 'ok', uri: reduzida.uri };
  }
  /** A foto ainda está em pasta temporária (precisa ser guardada)? */
  static ehTemporaria(uri) {
    return !uri.startsWith(Paths.document.uri);
  }
  /** Copia a foto temporária para a pasta de documentos e devolve o novo caminho. */
  static guardar(uriTemporaria, petId) {
    return FotoService.copiarPara(PASTA, uriTemporaria, petId);
  }

  /** Guarda o anexo de uma consulta. */
  static guardarAnexo(uriTemporaria, consultaId) {
    return FotoService.copiarPara(PASTA_ANEXOS, uriTemporaria, consultaId);
  }

  /** Guarda a foto da galeria. */
  static guardarGaleria(uriTemporaria, petId) {
    return FotoService.copiarPara(PASTA_GALERIA, uriTemporaria, petId);
  }

  /** Guarda a miniatura da foto da galeria. */
  static guardarMiniatura(uriTemporaria, petId) {
    return FotoService.copiarPara(PASTA_MINIATURAS, uriTemporaria, petId);
  }

  static copiarPara(nomePasta, uriTemporaria, prefixo) {
    const pasta = new Directory(Paths.document, nomePasta);
    pasta.create({ intermediates: true, idempotent: true });
    const destino = new File(pasta, `${prefixo}-${novoId().slice(0, 8)}.jpg`);
    new File(uriTemporaria).copy(destino);
    return destino.uri;
  }
  /** Apaga uma foto guardada. Ignora se o arquivo já não existe. */
  static apagar(uri) {
    if (!uri || FotoService.ehTemporaria(uri)) return;
    try {
      const arquivo = new File(uri);
      if (arquivo.exists) arquivo.delete();
    } catch {
      // Foto já removida ou inacessível: não é motivo para falhar.
    }
  }
}
