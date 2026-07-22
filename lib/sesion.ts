// Borra todo el trabajo que la app guarda en el navegador.
//
// Los modulos guardan campana activa, copys, landings, anuncios y biblioteca en
// sessionStorage (y los guardados de Copy en localStorage). Nada de eso estaba
// atado al usuario, asi que al cerrar sesion e iniciar con otra cuenta en el mismo
// navegador, la persona nueva veia el trabajo de la anterior.
//
// Se llama en todos los puntos de cierre de sesion. Tambien limpia la marca del
// splash, por eso este vuelve a salir antes del login.
export function limpiarSesionLocal() {
  try { sessionStorage.clear(); } catch {}
  try { localStorage.removeItem("landcopy_guardados"); } catch {}
}

const CLAVE_UID = "landcopy_uid";

// Red de seguridad: si entra un usuario distinto al ultimo que uso este navegador,
// borra lo que quedo. Cubre el caso de una sesion que expiro o que no se cerro bien,
// donde limpiarSesionLocal() nunca llego a ejecutarse.
export function sincronizarUsuario(uid: string) {
  try {
    const anterior = localStorage.getItem(CLAVE_UID);
    if (anterior && anterior !== uid) limpiarSesionLocal();
    localStorage.setItem(CLAVE_UID, uid);
  } catch {}
}
