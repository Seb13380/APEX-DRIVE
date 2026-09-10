import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";

const FUSEAU_FRANCE = "Europe/Paris";

// Formate une date (UTC en base) dans le fuseau horaire de la France, quel que soit le fuseau du serveur.
export function formatParis(date: Date | string, motif: string): string {
  return formatInTimeZone(date, FUSEAU_FRANCE, motif, { locale: fr });
}
