import { randomUUID } from 'expo-crypto';
/** Identificador único global (UUID v4). Evita colisão entre aparelhos. */
export function novoId() {
  return randomUUID();
}
