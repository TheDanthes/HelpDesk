/**
 * Etiquetas en español para los valores que viajan a la API.
 *
 * La prioridad, el tipo y el estado de un ticket se guardan y se comparan en
 * ingles ("High", "needs_support", ...). Traducirlos en el lugar romperia el
 * guardado y los filtros, asi que el valor queda intacto y lo unico que se
 * traduce es lo que se muestra.
 *
 * La busqueda es sin distinguir mayusculas porque los mismos valores aparecen
 * escritos de las dos formas segun la pantalla ("Low" en la creacion, "low" en
 * los filtros). Si un valor no esta en la tabla se devuelve tal cual: es
 * preferible mostrar el original en ingles a mostrar un hueco.
 */

const PRIORIDAD: Record<string, string> = {
  low: "Baja",
  normal: "Normal",
  medium: "Media",
  high: "Alta",
};

const TIPO: Record<string, string> = {
  incident: "Incidente",
  service: "Servicio",
  feature: "Mejora",
  bug: "Error",
  maintenance: "Mantenimiento",
  access: "Acceso",
  feedback: "Sugerencia",
  support: "Soporte",
};

const ESTADO: Record<string, string> = {
  hold: "En espera",
  needs_support: "Necesita soporte",
  in_progress: "En curso",
  in_review: "En revision",
  done: "Resuelto",
};

function traducir(tabla: Record<string, string>, valor?: string | null) {
  if (!valor) return "";
  return tabla[String(valor).toLowerCase()] ?? valor;
}

export const etiquetaPrioridad = (v?: string | null) => traducir(PRIORIDAD, v);
export const etiquetaTipo = (v?: string | null) => traducir(TIPO, v);
export const etiquetaEstado = (v?: string | null) => traducir(ESTADO, v);
