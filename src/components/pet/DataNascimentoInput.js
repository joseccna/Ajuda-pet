import React from 'react';
import { StyleSheet, View } from 'react-native';
import { espaco } from '../../theme';
import { mascararDataBR } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
/**
 * Nascimento: data exata (dd/mm/aaaa) ou idade aproximada em anos e meses.
 * Muita gente adota sem saber a data, então o app aceita as duas.
 */
export function DataNascimentoInput({ valor, aoMudar, erro }) {
  if (valor.modo === 'exata') {
    return (
      <View>
        <Campo
          rotulo="Nascimento"
          placeholder="12/03/2022"
          keyboardType="number-pad"
          maxLength={10}
          value={valor.texto}
          onChangeText={(t) => aoMudar({ ...valor, texto: mascararDataBR(t) })}
          erro={erro}
          dica="Dia, mês e ano."
        />
        <Button
          titulo="Não sei a data exata"
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => aoMudar({ ...valor, modo: 'aproximada' })}
          style={styles.link}
        />
      </View>
    );
  }
  return (
    <View>
      <View style={styles.linha}>
        <View style={styles.metade}>
          <Campo
            rotulo="Anos"
            placeholder="4"
            keyboardType="number-pad"
            maxLength={2}
            value={valor.anos}
            onChangeText={(t) => aoMudar({ ...valor, anos: t.replace(/\D/g, '') })}
          />
        </View>
        <View style={styles.metade}>
          <Campo
            rotulo="Meses"
            placeholder="0"
            keyboardType="number-pad"
            maxLength={2}
            value={valor.meses}
            onChangeText={(t) => aoMudar({ ...valor, meses: t.replace(/\D/g, '') })}
          />
        </View>
      </View>
      {erro ? null : <View />}
      <Button
        titulo="Prefiro informar a data exata"
        variante="texto"
        larguraTotal={false}
        aoPressionar={() => aoMudar({ ...valor, modo: 'exata' })}
        style={styles.link}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espaco.md },
  metade: { flex: 1 },
  link: { alignSelf: 'flex-start', marginTop: -espaco.sm, marginBottom: espaco.md, paddingHorizontal: 0 },
});
