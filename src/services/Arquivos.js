import { Directory, File, Paths } from 'expo-file-system';

/**
 * Único ponto do backup que mexe em arquivos do aparelho. Os serviços recebem uma instância,
 * então nos testes basta passar uma versão em memória.
 */
export class Arquivos {
  /** Bytes do arquivo, ou null se não existe ou não pode ser lido. */
  ler(uri) {
    try {
      const arquivo = new File(uri);
      return arquivo.exists ? arquivo.bytesSync() : null;
    } catch {
      return null;
    }
  }

  tamanho(uri) {
    try {
      const arquivo = new File(uri);
      return arquivo.exists ? arquivo.size : 0;
    } catch {
      return 0;
    }
  }

  /** Grava em uma pasta do app (cria a pasta). Devolve { uri, criado }. Não regrava se já existe com esse nome. */
  gravar(pasta, nome, bytes, { baseCache = false } = {}) {
    const dir = new Directory(baseCache ? Paths.cache : Paths.document, pasta);
    dir.create({ intermediates: true, idempotent: true });
    const arquivo = new File(dir, nome);
    const criado = !arquivo.exists;
    if (criado) {
      arquivo.create();
      arquivo.write(bytes);
    }
    return { uri: arquivo.uri, criado };
  }

  /** Grava sempre por cima (arquivo temporário para compartilhar). */
  gravarTemporario(nome, bytes) {
    const arquivo = new File(Paths.cache, nome);
    if (arquivo.exists) arquivo.delete();
    arquivo.create();
    arquivo.write(bytes);
    return arquivo.uri;
  }

  base64(uri) {
    return new File(uri).base64Sync();
  }

  apagar(uri) {
    try {
      const arquivo = new File(uri);
      if (arquivo.exists) arquivo.delete();
    } catch {
      // já não existe
    }
  }

  /** Nomes dos arquivos de uma pasta do app. */
  listar(pasta) {
    try {
      const dir = new Directory(Paths.document, pasta);
      if (!dir.exists) return [];
      return dir
        .list()
        .filter((i) => i instanceof File)
        .map((f) => ({ nome: f.name, uri: f.uri }));
    } catch {
      return [];
    }
  }

  espacoLivre() {
    try {
      return Paths.availableDiskSpace;
    } catch {
      return Number.MAX_SAFE_INTEGER; // não dá para saber: não bloqueia
    }
  }

  /** Pasta onde ficam os arquivos importados. */
  get pastaImportados() {
    return 'importados';
  }
}
