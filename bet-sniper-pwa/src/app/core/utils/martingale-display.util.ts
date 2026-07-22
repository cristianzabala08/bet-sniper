/**
 * Formatea el paso de martingala mostrado en la UI (1-indexado) a partir
 * de las distintas formas en que puede llegar el dato según el origen
 * (resultado de socket, item de la lista de señales, etc).
 *
 * Compartido por ActiveSignalsComponent y AutomaticModeComponent para
 * evitar dos fuentes de verdad sobre el mismo cálculo.
 */
export function getMartingaleDisplayStep(item: any): string {
  let step = item?.winStep;
  if (step === undefined) step = item?.martingalaData?.contador_martingala;
  if (step === undefined) step = item?.data?.results?.numero_martingala;

  if (step !== undefined && step !== null) {
    return (Number(step) + 1).toString();
  }
  return '1';
}
