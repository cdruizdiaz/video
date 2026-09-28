// Kit de marca: todo lo que una plantilla necesita para vestirse con la identidad de un cliente.
export type Marca = {
  id: string;
  firma: string; // p. ej. "RASTRO®", va en los pies de escena
  fuente: string; // fontFamily ya cargada
  colores: {
    fondo: string; // fondo claro principal
    tinta: string; // texto sobre fondo claro
    tintaSuave: string; // texto secundario
    oscuro: string; // fondo de escenas oscuras
    claro: string; // texto sobre fondo oscuro
  };
  ease: (t: number) => number;
  margen: number; // margen lateral en px (lienzo 1080 de ancho)
  logo: string; // ruta dentro de public/
  logoFiltroSobreClaro: string; // filtro CSS para el logo sobre fondo claro
  logoFiltroSobreOscuro: string; // filtro CSS para el logo sobre fondo oscuro
};

// "#rrggbb" + alfa -> "rgba(r,g,b,a)"
export const conAlfa = (hex: string, alfa: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
};
