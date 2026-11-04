# AGENTS.md

Sitio institucional de una agencia de viajes virtual. El visitante explora destinos y consulta con un asesor. El alcance es estático, sin CMS, reservas ni pagos en línea.

- **Diseño.** Sigue la composición móvil aprobada a 390 px. En escritorio, conserva la jerarquía y el encuadre de la ventanilla. Las referencias privadas de diseño se gestionan fuera del repositorio público.
- **Stack.** Usa Astro estático, TypeScript y CSS nativo. Limita el JavaScript del navegador a las interacciones. Mantén los destinos en datos tipados y genera sus fichas con una plantilla común.
- **Ventanilla.** Usa SunCalc con la fecha actual y las coordenadas de Buenos Aires. La luz del cielo sigue el ciclo solar. Mantén fijos el marco y el ala. Con `prefers-reduced-motion`, conserva la fase solar y desactiva el movimiento decorativo.
- **Contenido y contacto.** Conserva el destino elegido al iniciar una consulta. Publica solo datos y canales confirmados por la agencia. El formulario solo debe indicar éxito tras un envío real.
- **Privacidad.** El repositorio es público. No incluyas secretos, datos personales ajenos al contenido aprobado ni conversaciones o referencias privadas del proyecto. `private: true` y `noindex` no restringen el acceso al código ni al sitio.
- **Verificación y entrega.** Comprueba los tipos y ejecuta `npm run build`. Si cambias la interfaz, prueba el recorrido hasta contacto a 390 y 1440 px y con teclado. Publicar cambios o desplegar requiere autorización explícita; la administración del alojamiento se gestiona por separado.
