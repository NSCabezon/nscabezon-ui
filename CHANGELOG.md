# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
el proyecto sigue [semver](https://semver.org/lang/es/).

## [0.9.10] - 2026-10-25

### Corregido

- **A11Y-4 — filas con `onRowClick` sin controles anidados.** El `<tr>` (y la
  tarjeta móvil) era `role="button" tabindex=0` con enlaces y botones dentro:
  axe `nested-interactive` (serious). Ahora:
  - El `<tr>`/tarjeta **no** lleva `role` ni `tabindex`; lleva
    `data-list-row-click` (gancho para tests). El clic de ratón en cualquier
    parte de la fila sigue abriendo.
  - El teclado entra por un `<button type="button" data-list-row-open>`
    **sr-only** al principio de la celda `primary` (o de la primera columna no
    `action`; en móvil, junto al título de la tarjeta). Su nombre es
    `labels.openRow` (nuevo, «Abrir») + el contenido de la celda principal
    (`aria-labelledby`; el contenido va en un `<div class="contents">`, sin
    cambio de maquetación). Tab llega a él; Enter/Espacio son los del botón.
    Con su foco visible la fila pinta un anillo (`has-[…:focus-visible]:ring-2
    ring-ring ring-inset`).
  - El clic de ratón en la fila le da el foco a ese botón (`preventScroll`)
    salvo que el clic ya lo dejara en algo de la fila: un diálogo que devuelva
    el foco al cerrar (Radix) vuelve a la fila, con ratón o con teclado.
  - Se eligió el control hermano y no envolver la celda principal en un
    `<button>`: en el Buzón de Gesmoto la celda principal ya trae un `<a>` (el
    fichero), y un botón que lo envuelva vuelve a ser `nested-interactive`.
    Un `<tr tabindex=0>` sin rol tampoco vale: es un foco sin nombre ni rol
    (los lectores no lo anuncian como accionable).
- **UI-RESIZE-1 — nada se sale de su columna en su suelo.** En
  `/work-orders/history` (Gesmoto, 1440) con las columnas en su suelo
  (64 px) el contenedor scrolleaba 28 px de más: el texto de la celda
  `action` «Estado» («Entregada») asomaba por la derecha (las `action` no se
  recortaban), y el botón de ordenar de la cabecera (`-mx-4`) medía su texto
  y quedaba bajo el botón de columnas. Con `resizable`: las celdas `action`
  llevan `overflow-x-clip` (sin elipsis; no recorta en vertical, los anillos
  de foco siguen enteros), el botón de ordenar lleva
  `min-w-0 max-w-[calc(100%+2rem)] overflow-hidden` y su texto va en un
  `<span>` que se corta con el `text-overflow` de la `<th>` (elipsis o el
  `text-clip` del consumidor); en la última cabecera con menú de columnas,
  `max-w-[calc(100%+1rem)]` (no entra en el `pr-10` del menú). Sin
  `resizable`, sin cambios.
- **UI-RESIZE-2 — anchos guardados antes de 0.9.9: con techo, solo esos.**
  Con 0.9.6-0.9.8 un ancho guardado era fijo (y uno grande daba scroll) o,
  en el relleno, un tope; leído con el reparto proporcional de 0.9.9, un
  `client: 566` de entonces apretaba a las demás (Apertura a 100 px, fechas
  cortadas). Ahora:
  - **Marca de versión en las prefs:** `ListPrefs.widthsV` (opcional,
    `LIST_WIDTHS_VERSION = 2`). `useListPrefs.setWidths` la escribe con
    cualquier ancho no vacío; viaja en el mismo objeto que ya se guarda en
    `user_list_prefs.prefs` (y en la caché local). `normalizeListPrefs` solo
    la deja con anchos no vacíos: unos `widths` leídos sin ella son
    **viejos** (`hasLegacyWidths(prefs)`); los de `defaults` de la página, no.
    `listPrefsEqual` la compara.
  - `useListView` pasa `listProps.columnWidthsLegacy` (y `useListColumns`, `columnWidthsLegacy`); `ResponsiveList`
    (`columnWidthsLegacy`) y `useColumnResize` (`legacyWidths`) leen entonces
    cada ancho guardado como mucho a `máx(1,5 × su ancho de serie,
    contenedor − selección − las demás a su ancho de serie (o a su base, si es
    menor))`, nunca bajo su suelo (`STORED_WIDTH_MAX_FACTOR = 1.5`). En una
    pantalla ancha el techo es el sobrante (se respeta lo guardado). Sin
    contenedor medido, sin techo.
  - **La primera escritura** (arrastre, teclado, doble clic, Escape/Supr)
    guarda los anchos viejos ya LIMITADOS (lo que se ve) y con la marca:
    desde ahí no hay techo.
  - **Arrastre y teclado sin techo nunca** (el modelo de 0.9.9 intacto: una
    columna puede crecer mucho y las demás encogen hasta su suelo). Tests
    PROP-1…7 sin cambios.

> **Consumidores (Gesmoto):** nada obligatorio en el código de las listas.
> Tests que buscaban `tr[role="button"]` deben pasar a
> `tr[data-list-row-click]` y abrir con un clic en la fila o en
> `[data-list-row-open]`; `keyDown(Enter)` sobre el `<tr>` ya no abre (en el
> navegador, Enter/Espacio sobre el botón hacen clic; en jsdom, `click()`).
> Traducir `labels.openRow` («Open» en inglés) en el `UiProvider`.
> UI-RESIZE-2: con `{...view.listProps}` no hay nada que hacer. Donde se
> pasen los anchos a mano desde un `useListView` (un subconjunto de
> `listProps`, `embeddedWidthProps`…), añadir
> `columnWidthsLegacy: view.listProps.columnWidthsLegacy`; si no, los anchos
> viejos se leen sin techo (como en 0.9.9). Tests que comprueben lo que se
> guarda al cambiar anchos verán además `widthsV: 2`.

## [0.9.9] - 2026-10-24

### Cambiado

- **Modelo proporcional: agrandar una columna encoge a las demás en
  proporción, y el último borde controla la última columna** (PROP, decisión
  del dueño 24/10/2026). Hasta la 0.9.8 no se podía agrandar bien la última
  columna («Acciones»): no tenía asa propia, y su borde izquierdo era el asa
  de la penúltima, que solo la estrechaba hasta su suelo. Ahora:
  - **Qué controla cada asa:** la columna de la izquierda del borde, salvo el
    último borde (penúltima | última), que controla la ÚLTIMA: a la izquierda
    la agranda, a la derecha la estrecha. Su `aria-label` y su
    `aria-valuenow/min` son los de la última; ←/→ igual (← la agranda);
    doble clic / Escape / Supr borran el guardado de la última.
    `ResponsiveList` le pone el nombre de la última; en tablas a mano,
    `resizeHandle(penúltima)` y `resizeHandle(penúltima, 'start')` ya lo hacen
    (el `name` es el de la columna que controla).
  - **Agrandar = subir SU base:** las demás encogen en proporción
    (conservando sus proporciones entre sí) y ninguna baja de su suelo
    (`columnFloor`) EN PANTALLA: las que llegan se quedan ahí y el resto sigue
    encogiendo; con todas en su suelo, la arrastrada deja de crecer.
    Estrecharla para en su propio suelo. El borde (o el ancho de la última)
    va exactamente con el ratón.
  - **Se guarda solo la base de esa columna**, calculada para que en ESE
    contenedor se vea exactamente lo que se soltó; las demás no se congelan
    en px (en Gesmoto siguen en rem y escalan con la fuente).
  - **La tabla ocupa siempre el contenedor y redimensionar nunca trae
    scroll.** Con el ancho del contenedor (`containerWidth`, que
    `ResponsiveList` mide), si las columnas no caben encogen en proporción
    hasta su suelo (cada `<col>` lleva su ancho calculado) y el `min-width` de
    la tabla es como mucho el de serie: la suma de bases o la de serie, la
    menor (nunca menos que los suelos). Así unos anchos guardados en 1920
    caben en 1440 sin scroll (el problema de LIST-6, ahora para todas las
    columnas). Sin contenedor (tablas a mano que no lo pasan, jsdom), como
    antes: cada `<col>` a su base y scroll si no caben.
  - **Relleno (`fill`):** sin ancho guardado se queda el sobrante; agrandar
    otra columna le quita primero ese sobrante (las demás no se mueven) y,
    cuando ya está a su base, encogen todas en proporción. Arrastrar el
    propio relleno parte de su ancho pintado (sin saltos) y lo deja como
    columna normal con su base guardada (como en la 0.9.6); doble clic,
    Escape o Supr lo vuelven a hacer relleno. **Desaparece el «tope» de
    LIST-6** (0.9.8): un relleno guardado es una base más, y ya no da scroll
    en pantallas menores porque las columnas encogen.
  - Tras un relleno libre, una columna sigue su ANCHO (su borde derecho no se
    mueve mientras el relleno absorbe).
  - El teclado acumula lo que se movió de verdad: en el suelo o el techo, la
    tecla contraria responde a la primera.
  - Sin `columns` (tablas a mano antiguas, p. ej. las líneas de presupuesto
    de Gesmoto): sin cambios, la arrastrada 1:1.

> **Consumidores:** nada que cambiar con `ResponsiveList`. Los anchos ya
> guardados se leen igual; uno guardado en la columna de relleno (tope en
> 0.9.8) vuelve a ser su base, sin scroll en pantallas menores. Una tabla a
> mano con `columns` debe pasar `containerWidth` (y `leadingWidth`) para que
> las columnas encojan sin scroll.

## [0.9.8] - 2026-10-22

### Cambiado

- **El ancho guardado de la columna de relleno es ahora su TOPE: «como mucho
  X»** (LIST-6, decisión del dueño 22/10/2026). Hasta la 0.9.7, arrastrar el
  relleno guardaba su ancho pintado (base + todo el sobrante de ESA pantalla)
  como ancho fijo, y como los anchos viajan entre dispositivos rompía las
  pantallas pequeñas: en `/work-orders` a 1920, estrechar Descripción 40 px
  guardaba `{description: 566}` y a 1440 la tabla medía 1592 px en 1152 (440 px
  de scroll lateral). Ahora:
  - **Pantallas menores:** el relleno con tope encoge hasta lo que quepa,
    nunca por debajo de su base (`width`/160) ni de su suelo; si lo de serie
    cabía, sigue cabiendo. El `min-width` de la tabla cuenta el relleno con
    `min(tope, base)`.
  - **Pantallas grandes:** se ve a su tope, sin crecer más; lo que sobre va al
    resto en proporción (como cuando todas las columnas tienen ancho).
  - **Arrastrarlo no salta:** el borde sigue al ratón desde su ancho pintado y
    al soltar se guarda el ancho pintado como tope.
  - **Doble clic, Escape o Supr** quitan el tope (relleno libre otra vez), y
    también ensancharlo hasta que el tope no limite nada en esa pantalla: no se
    guarda un tope que no limita.
  - Con tope, el relleno no puede ser más ancho que el hueco libre: para darle
    más sitio, se estrechan otras columnas.

  Para aplicar el tope hace falta el ancho del contenedor: `ResponsiveList` lo
  mide (padre de la `<table>`, `ResizeObserver`) y lo pasa a
  `useColumnResize({ containerWidth, leadingWidth })` (opciones nuevas). Con
  tope y contenedor conocido, cada `<col>` lleva su ancho en pantalla
  calculado (table-fixed no sabe poner un máximo a una columna). Sin
  contenedor (tablas a mano que no lo pasen, o jsdom, que mide 0), el tope se
  pinta como el ancho fijo de la 0.9.6.

### Corregido

- **Con el sobrante repartido en proporción, el borde no seguía al ratón**
  (UI-9): 60 px de arrastre movían el borde 48 (y el relleno, 40 → 26), porque
  se sumaba el delta a la base y la tabla la pintaba escalada (y reescalaba las
  demás). Ahora se resuelve, con el mismo modelo con el que se pinta, la base
  que deja el borde exactamente bajo el ratón (con escala `C / suma`, la base
  cambia más que `dx / escala` porque las demás se reescalan). Si el borde no
  puede ir ahí (la última columna, cuyo borde es el del contenedor, o una tras
  un relleno libre) se sigue su ancho en pantalla. Sin `containerWidth`, el
  ancho del contenedor se lee de la propia `<table>` cuando mide más que su
  `min-width`. El teclado (LIST-4) mueve el borde 16 / 64 px **en pantalla**;
  en el suelo o el techo el paso no se acumula. Sin `columns` (tablas a mano
  antiguas), sin cambios.
- Comentarios desfasados que decían «sin relleno queda hueco a la derecha»
  (falso desde la 0.9.6) en `responsive-list.tsx` y `columnWidth.ts` (UI-10).

> **Consumidores:** nada que cambiar con `ResponsiveList`. Quien ya tenga
> guardado un ancho de relleno inflado (p. ej. 566) pasa a verlo como tope:
> deja de desbordar las pantallas pequeñas sin hacer nada. Una tabla a mano con
> `useColumnResize({ columns })` y columna `fill` debe pasar `containerWidth`
> (y `leadingWidth` si tiene columna de selección) para que el tope se aplique.

## [0.9.7] - 2026-10-22

### Añadido

- **Redimensionar columnas con el teclado** (LIST-4). El asa de cada columna
  era `role="presentation"` sin `tabindex`: solo se podía con ratón. Ahora es
  un `role="separator"` enfocable (`aria-orientation="vertical"`,
  `aria-valuenow/min/max` en px) con nombre propio: `labels.columnResize`
  (nuevo, `(columna) => string`, por defecto «Ajustar ancho de {columna}»;
  `useColumnResize({ labels })` y `resizeHandle(key, edge, name?)` para tablas
  a mano). **←/→** cambian 16 px (1 rem), **Mayús+←/→** 64 px, con el mismo
  suelo que el arrastre; se ve en vivo y se guarda **una vez** al soltar la
  tecla (o al perder el foco) por `onColumnWidthsChange`, la misma
  persistencia que el ratón. **Escape / Supr / Retroceso** devuelven el ancho
  de serie, como el doble clic. Foco visible (zona teñida y línea de 2 px
  con el color del anillo). Las teclas no ordenan ni reordenan; la mitad
  `start` de la zona de agarre sigue sin foco (sería la misma columna dos
  veces). Exporta `RESIZE_KEY_STEP`, `RESIZE_KEY_STEP_LARGE` y
  `RESIZE_KEY_MAX` (1600, techo del teclado y `aria-valuemax`).

### Corregido

- **Con `stickyHeader`, el botón del menú de columnas se salía por la derecha
  en cuanto la tabla scrolleaba a lo ancho** (LIST-3). Vivía dentro de la
  última `<th>`, que con cabecera fija es sticky (posicionada) y con
  `overflow-hidden`: se iba con ella. Ahora va en un ancla `sticky` (arriba y
  a la derecha, `data-list-columns-menu-sticky`, alto 0, `z-20`, fondo de
  cabecera fija) justo antes de la `<table>`, y el envoltorio de la tabla
  mide lo mismo que ella (`min-width` = suma con `resizable`; `min-w-fit`
  sin él) para que el ancla recorra todo su ancho: el botón queda pegado al
  borde derecho del contenedor de scroll del consumidor y fijo con la
  cabecera al bajar. Anchos y reparto, sin cambios (la columna de relleno y
  `tableSizing` igual que en 0.9.6). En el Tab va ahora justo **antes** de
  las cabeceras (detrás en el DOM quedaría tras todas las filas). Sin
  `stickyHeader` no cambia (ya iba fuera del scroll).

> **Consumidores:** pasad `columnResize` en los `labels` del `UiProvider` si
> la app no está en español. Un test que busque el botón del menú dentro de
> la última `<th>` con `stickyHeader` debe buscarlo en
> `[data-list-columns-menu-head]` de la lista.

## [0.9.6] - 2026-10-21

### Cambiado

- **La tabla siempre ocupa el 100 % del ancho, y estrechar la columna de relleno
  se queda.** En la 0.9.5 el ancho guardado del relleno era solo su mínimo:
  al arrastrarla para estrecharla parecía cambiar y al soltar volvía. Ahora
  `tableSizing` devuelve siempre `width: 100%` + `min-width: suma`. Si la columna
  de relleno tiene ancho guardado, manda ese ancho (vuelve la regla de la 0.9.3
  en `resolveFillColumnKey`). Cuando todas las columnas tienen ancho y sobra
  sitio, table-fixed reparte el sobrante entre ellas en proporción: nunca hay
  hueco a la derecha. Doble clic en su asa la vuelve a hacer relleno.

## [0.9.5] - 2026-10-21

### Cambiado

- **La columna de relleno siempre rellena, también con ancho guardado.** En la
  v0.9.3, redimensionar a mano la columna `fill` la fijaba y la tabla dejaba un
  hueco a la derecha (como Excel); no gustaba. Ahora el ancho guardado es su
  MÍNIMO: la tabla mide `width: 100%` con la suma (relleno incluido) de
  `min-width`, así que se ensancha y, si sobra sitio, sigue estirándose. No se
  puede estrechar por debajo del hueco disponible. `resolveFillColumnKey`
  ignora ya `widths` (se acepta por compatibilidad).

## [0.9.4] - 2026-10-20

### Corregido

- **Un clic en el asa de una columna guardaba un ancho** (LIST-1). Al soltar,
  `useColumnResize` llamaba siempre a `onColumnWidthsChange`, aunque el
  puntero no se hubiera movido. Con la zona de agarre más ancha de v0.9.3, un
  clic que apuntaba a ordenar y caía en el asa guardaba el ancho estirado de la
  columna de relleno (que dejaba de rellenar, y en ventanas más pequeñas
  aparecía scroll horizontal) o fijaba en px una columna que nadie había
  tocado. Ahora solo cuenta como arrastre si el puntero se aleja **3 px** o
  más del `pointerdown`, y solo se guarda si el ancho cambia de verdad. Un
  clic sin mover no toca los anchos ni ordena, y el doble clic sigue
  restaurando la columna (dos clics sin mover llegan al `dblclick`). El estado
  de arrastre en vivo empieza al superar ese umbral, no en el `pointerdown`.
- **En listas sin `stickyHeader` (menú de columnas fuera del scroll), agarrar
  justo a la derecha de la línea anterior a la última columna la movía**
  (LIST-2). Esa última `<th>` va sin posicionar (`staticHead`) y se quedaba
  sin la mitad derecha de la zona de agarre (`resizeHandle(prev, 'start')`).
  Ahora la lleva dentro de un ancla `relative` propia
  (`data-column-resize-anchor`): de ancho 0, pegada al borde izquierdo y
  recortada a la altura de la cabecera por su `overflow-hidden`. La `<th>`
  sigue sin posicionar y el botón del menú sigue saliendo al envoltorio.

## [0.9.3] - 2026-10-20

### Corregido

- **Arrastrar el borde de una columna la movía en vez de redimensionarla.** La
  zona de agarre del asa (6 px) quedaba entera a la IZQUIERDA de la línea,
  dentro de la `<th>` (que lleva `overflow-hidden`, así que no podía salir);
  justo a la derecha empezaba la cabecera vecina, arrastrable desde v0.9.0
  para reordenar, y fallar por 1 px la agarraba y la movía (o, con un clic,
  ordenaba). Ahora cada cabecera salvo la primera lleva también la otra mitad
  de la zona en su borde izquierdo (`data-column-resize-handle="start"`), que
  redimensiona la columna ANTERIOR: la zona (~12 px) queda centrada en la
  línea. No se pinta en la última `<th>` cuando va sin posicionar (menú de
  columnas fuera del scroll, sin `stickyHeader`). `useColumnResize`:
  `resizeHandle(key, edge?: 'end' | 'start')` (por defecto `'end'`, como
  antes).
- **La columna de relleno no se podía estrechar** mientras la tabla cabía: se
  guardaba el ancho pero seguía estirada. Ahora, en cuanto el usuario la
  arrastra deja de rellenar: su ancho guardado manda (más ancho o más
  estrecho, en vivo durante el arrastre) y la tabla mide la suma exacta, con
  hueco a la derecha como en Excel; las demás columnas no se mueven y, si
  cabe, no hay scroll. Doble clic en su asa (cualquiera de las dos mitades) o
  «Restablecer columnas» borran ese ancho y vuelve a ser el relleno.
  `resolveFillColumnKey(columns, widths?)`: con ancho guardado en la columna
  `fill`, `undefined`. El relleno **no** pasa a otra columna marcada `fill`
  (empezaría a estirarse sola sin que nadie la tocara).

> **Consumidores:** quien ya tuviera guardado un ancho de la columna de
> relleno (se guardaba al arrastrarla desde v0.9.0) la verá fija con hueco a
> la derecha; doble clic en su asa la devuelve a relleno.

## [0.9.2] - 2026-10-20

### Corregido

- «Restablecer columnas» (`reset()` de `useListPrefs`, `onColumnsReset` /
  `onReset` de `useListView`) vuelve a los **defaults del listado**: las
  columnas ocultas de serie (`defaults.hidden`) se ocultan otra vez, en vez de
  quedar `hidden: []` y mostrarlas todas. Anchos y orden de columnas vuelven a
  `defaults.widths`/`defaults.order` (sin ellos, `{}` y `[]`). Orden de filas,
  tamaño de página y modo compacto se conservan, como antes.

## [0.9.1] - 2026-10-20

### Cambiado

- El recuento del pie («N resultados») lleva 2 pt de margen vertical.

## [0.9.0] - 2026-10-20

Nuevo modelo de anchos de `resizable`: **«como Excel + relleno»**. El de
v0.5.0 («solo cambia la arrastrada y la flexible absorbe para mantener el
100 %») se rompía: con dos columnas sin `width`, con la flexible en su mínimo
(no podías ensanchar otra) y con anchos guardados del modelo anterior. Incluye
lo que iba a ser 0.8.1 (suelo `minWidth` en cualquier columna), que no se
publica por separado.

> **Consumidores: marcad `fill: true` en la columna de texto principal de
> cada listado `resizable`** (descripción, cliente, nombre…). **Nunca en el
> Nº** ni en importes/fechas. Sin ninguna marcada no hay relleno y queda hueco
> a la derecha; la `primary` ya no se elige sola. Revisad también las
> columnas sin `width`: ahora miden 160 px por defecto (antes repartían el
> sobrante); dadles `width` si 160 no les va.

### Cambiado

- Arrastrar el borde de una columna cambia **solo esa columna**: ninguna
  otra se mueve ni encoge, y no hay tope por «otra columna en su mínimo».
- La tabla mide máx(contenedor, suma de anchos): si la suma no cabe, scroll
  horizontal (también con `stickyHeader`, en el contenedor de scroll del
  consumidor; el botón del menú sigue anclado a la última cabecera).
- Todas las columnas tienen ancho efectivo: guardado, `width` o
  `DEFAULT_COLUMN_WIDTH` (160 px; las `action` sin cabecera, 56).
  `resolveColumnWidth` devuelve siempre un número.
- Técnica: `<col>` con ancho en px en todas salvo la de relleno; la tabla,
  `width: 100%; min-width: <suma>` con relleno o `width: <suma>` sin él
  (`tableSizing`).
- `useColumnResize`: con `columns`, el arrastre solo guarda la arrastrada
  (ya no fija en px las columnas sin ancho ni guarda la «que compensa»).
  Devuelve `fillKey`, `totalWidth` y `tableStyle(extraPx)`.
- Botón del menú de columnas (v0.6.0): sin `bg-background` fijo. Hereda
  (`bg-inherit`, igual que `<th>`, `<tr>` y `<thead>`) el fondo real de su
  cabecera: tarjeta `bg-card`, `headClassName` con `bg-*`, modo oscuro…; si la
  cabecera es transparente, el botón también. La cabecera fija
  (`stickyHeader`) usa `var(--list-head-bg)` → `--color-card` dentro de un
  `.bg-card` (automático) → `--color-background`. Un `bg-*` en
  `headClassName` gana ahora también a la cabecera fija.

### Añadido

- `fill?: boolean` en `ResponsiveColumn` / `SizedColumn`: la columna de
  relleno (una por tabla; si hay varias, la primera).
- `minWidth` vale para **cualquier** columna (antes solo para la flexible):
  suelo del arrastre y del ancho pintado, también del guardado en
  `columnWidths` (una fecha guardada a 105 px cortaba «19/10/2…»). Sin
  `minWidth`, suelo de 64 px (o el propio ancho por defecto si es menor).
- Exports: `DEFAULT_COLUMN_WIDTH`, `columnFloor`, `isFillColumn`,
  `resolveFillColumnKey`, `tableSizing`; `MIN_COLUMN_WIDTH` también desde
  `@nscabezon/ui/storage`.

### Deprecado

- `flex` en las columnas: alias de `fill` (misma semántica nueva: relleno,
  no «absorbe al arrastrar»). `flexKey` del hook: alias de `fillKey`.

### Eliminado

- `resolveFlexColumnKey`, `flexAbsorberKey` y `FLEX_MIN_COLUMN_WIDTH` (la
  lógica de absorber ya no existe).

## [0.8.0] - 2026-10-20

Los listados «bailaban»: las preferencias del servidor (anchos, orden de
columnas, compacto, ocultas, orden, filas por página) se aplicaban después del
primer pintado, y la caché local no era por usuario.

> **Consumidores: pasad `enabled: view.ready` a la consulta del listado.**
> Mientras `view.ready` es `false`, `sort`/`from`/`to` son los por defecto.

### Añadido

- `useListView`: `ready: boolean` (y `isLoaded` se queda como alias). También
  en `listProps.ready`.
- `ResponsiveList`: prop `ready?: boolean` (por defecto `true`). Con `false`
  pinta un esqueleto (`aria-busy`, `data-list-pending`) en vez de la tabla con
  anchos/orden/columnas por defecto.
- `listPrefsStorageKey(userId, listKey)`: la clave local que usa `useListPrefs`.
- `ListPrefsStore.userId` admite `undefined` = usuario aún desconocido.

### Cambiado

- `useListPrefs`: caché local por usuario, `list-prefs:<userId>:<listKey>`
  (sin sesión, `list-prefs:<listKey>` como antes; usuario desconocido, ninguna).
  La caché en memoria se vacía al cambiar de usuario en la misma pestaña.
- `useListPrefs.isLoaded`: `true` solo con caché local de ESTE usuario, con la
  consulta al servidor terminada (con o sin fila, o error) o sin sesión
  (`userId === null`). Antes era `true` también con el usuario sin resolver.
- Migración de la clave vieja `list-prefs:<listKey>`: con usuario no se usa
  para pintar ni se sube a su cuenta (pudo dejarla otro usuario); se borra
  cuando el servidor responde.
- `useSupabaseListPrefsStore`: `userId` es `undefined` mientras `getSession`
  no responde y `null` sin sesión (o si `getSession` falla). Antes, `null`
  desde el principio.
- `ListFooter`/`Pagination`: el recuento «N resultados» y el rango van con
  `tabular-nums` y ancho mínimo fijo en `ch` (texto sin dígitos + 6 / 12
  huecos de dígito): cambiar de dígitos ya no desplaza los botones (~5 px).

## [0.7.0] - 2026-10-20

### Añadido

- `ColumnsMenu`: submenú «Filas por página» › 10 · 25 · 50 · 100
  (`DropdownMenuSub` + `DropdownMenuRadioGroup`, el actual marcado) entre
  «Modo compacto» y «Restablecer columnas», con separadores. Opt-in con las
  props nuevas `pageSize?: number` y `onPageSizeChange?: (n) => void`. El
  submenú va en portal con `collisionPadding` (a 390 px se voltea a la
  izquierda) y abre con toque, hover, →, Enter o Espacio.
- `ResponsiveList`: props `pageSize`/`onPageSizeChange`, que pasan al menú de
  columnas de la cabecera.
- `useListView` (paginado): `listProps` lleva `pageSize` + `onPageSizeChange`;
  `footerProps` los pasa también al menú del pie. Cambiar el tamaño vuelve a
  la página 1, como antes. Con `paginated: false`, nada.
- Label `pageSizeMenu` en `UiProvider` (por defecto «Filas por página»).

### Cambiado

- `ListFooter`: con menú de columnas (`onHiddenChange` + `onReset`) **ya no
  pinta el selector de filas por página**: el tamaño se cambia en el submenú
  del menú de columnas. Sin menú de columnas el selector se queda en el pie.
  `hidden`, `onHiddenChange`, `onReset` y `columns` pasan a ser opcionales en
  `ListFooterProps` (sin los dos callbacks no se pinta el menú). Con 0
  resultados el menú del pie no ofrece el submenú (como antes el selector).
- Pie del listado más bajo: la fila pasa de `pt-2` a `pt-1` (y `gap-y-1` al
  envolver), las flechas de `Pagination` de `size="sm"` a `icon-sm` (28×28
  px) y el botón del menú de columnas del pie a `size-7`. En táctil siguen a
  44 px (`pointer-coarse:min-h-11 min-w-11` de `buttonVariants`). Recuento y
  botones siguen centrados en vertical.

## [0.6.0] - 2026-10-20

### Cambiado

- `ResponsiveList`: el botón del menú de columnas ya **no es una columna**.
  Antes era una columna fija a la derecha (`<col>` de 44 px, `<th>` sticky y
  una celda vacía en cada fila) que reservaba ancho en toda la tabla y se lo
  quitaba a las de datos (en tablas justas se cortaban los estados). Ahora:
  - Sin `<col>` propio ni `<td>` vacíos; el colgroup, la columna flexible y
    las mediciones (`data-column-width-key`) solo cuentan columnas de datos.
  - El botón va dentro de la última `<th>` visible, posicionado `absolute`
    en el borde derecho de la cabecera, con fondo opaco. Esa `<th>` (solo
    la cabecera, nunca las celdas) lleva `pr-10` para que el botón no tape
    el texto ni la flecha de orden, salvo que sea una `action` sin cabecera.
  - Con `stickyHeader` viaja con la cabecera fija. Sin ella, la última `<th>`
    y el contenedor de scroll quedan sin posicionar y el botón se ancla al
    envoltorio de fuera del scroll: se queda en la esquina derecha visible
    aunque la tabla scrollee a lo ancho. El indicador de arrastre de esa
    `<th>` pasa a ser una sombra interior.
  - Mantiene su `aria-label` y en el Tab va detrás de las cabeceras
    ordenables. No arrastra la cabecera ni es zona de soltar.
  - Se quita el `<span class="sr-only">` de la antigua columna (el botón ya
    se nombra con su `aria-label`).
  - Móvil (tarjetas) y `ListFooter`, sin cambios.

## [0.5.0] - 2026-10-20

### Cambiado

- Redimensionar columnas (`resizable`): al arrastrar el borde de una columna
  ya no se reparten el cambio las demás. Solo cambian la arrastrada y la
  **columna flexible**; el resto se queda con el ancho que tenía (las que iban
  sin ancho se fijan en px al empezar y se guardan así al soltar). La tabla
  sigue llenando el ancho, sin scroll lateral, y al cambiar el ancho de la
  ventana solo cambia la flexible.
  - Flexible = la marcada con `flex: true`; si ninguna, la `primary` sin
    `width`; si no, la primera columna no-`action` sin `width`; si todas
    tienen `width`, ninguna (comportamiento anterior).
  - No baja de su `minWidth` (por defecto 96 px): llegado ahí, la arrastrada
    deja de crecer.
  - Arrastrar la propia flexible: compensa la última columna no-`action` sin
    `width` o, si no hay, su vecina de la derecha.
  - La flexible nunca se guarda en `ListPrefs.widths` (un ancho antiguo para
    ella se ignora y se limpia al guardar). Doble clic en el asa,
    «Restablecer columnas», modo compacto y reordenar, igual que antes.

### Añadido

- `ResponsiveColumn.flex` y `ResponsiveColumn.minWidth`.
- `useColumnResize`: opción `columns` (columnas visibles, en orden) que activa
  el modo de columna flexible; devuelve además `colWidth(key)` (ancho resuelto
  para el `<col>`) y `flexKey`. Los `<th>` se miden por
  `data-column-width-key` (`COLUMN_WIDTH_KEY_ATTR`). Sin `columns`, igual que
  antes.
- `resolveFlexColumnKey`, `flexAbsorberKey`, `FLEX_MIN_COLUMN_WIDTH` y el tipo
  `SizedColumn` exportados (también desde `@nscabezon/ui/storage`).

## [0.4.0] - 2026-10-20

### Añadido

- Columnas reordenables por usuario, en todos los listados de `useListView`
  (sin opt-in).
  - `ListPrefs.order: string[]` (claves; `[]` = orden de serie; también en
    `ListPrefsDefaults`, `EMPTY_LIST_PREFS` y `listPrefsEqual`).
    `normalizeListPrefs` quita claves desconocidas y repetidas y añade al
    final las columnas conocidas que falten (columnas nuevas); si no es un
    array, `[]`. Viaja en el jsonb de `user_list_prefs`: sin migración.
  - `useListPrefs`: `setOrder(keys)`, al instante (sin debounce). `reset()`
    («Restablecer columnas») ahora también vacía `order`; sigue sin tocar
    orden de filas, tamaño de página ni compacto.
  - `ResponsiveList`: props `columnOrder` / `onColumnOrderChange`. El orden se
    aplica a cabeceras, celdas, `<colgroup>` y al `<dl>` de la tarjeta móvil
    (el título sigue siendo la `primary`, que en la tabla puede ir en
    cualquier posición). Las columnas `action` y la del menú no se mueven.
    Con el callback, en escritorio la cabecera se arrastra (HTML5 drag and
    drop nativo, sin dependencias): `cursor-grab`, la columna arrastrada al
    50 % y una línea `bg-primary` en el borde donde cae (detrás del destino si
    venía de la izquierda, delante si venía de la derecha). Un clic sin mover
    sigue ordenando y el asa de redimensión no inicia arrastre.
  - `ColumnsMenu`: props `columnOrder` / `onColumnOrderChange`; la lista sale
    en el orden actual y, con el callback, cada columna no-`action` lleva
    «Subir»/«Bajar» (items del menú: la vía de teclado), deshabilitados en los
    extremos y sin cerrar el menú. `ColumnsMenuColumn.action` opcional.
    Textos nuevos `Labels.columnMoveUp` / `columnMoveDown`
    (`(column) => string`; por defecto «Subir X» / «Bajar X»).
  - `ListFooter`: props `columnOrder` / `onColumnOrderChange` para su menú.
  - `useListView`: `listProps` y `footerProps` llevan `columnOrder` +
    `onColumnOrderChange`; el resultado expone `order`. `useListColumns`
    también los devuelve.
  - `orderColumns(columns, order)` y `moveColumn(columns, order, from, to)`
    exportados (para tablas hechas a mano).
  - El asa de `useColumnResize` lleva `data-column-resize-handle`.

## [0.3.0] - 2026-10-20

### Añadido

- Modo compacto de listado (opt-in por listado): cada fila en una línea.
  - `ListPrefs.compact` (booleano, por defecto `false`; también en
    `ListPrefsDefaults`, `EMPTY_LIST_PREFS` y `listPrefsEqual`).
    `normalizeListPrefs` descarta lo que no sea booleano. Viaja en el jsonb de
    `user_list_prefs`: sin migración.
  - `useListPrefs`: `setCompact(v)`, al instante (sin debounce). `reset()`
    («Restablecer columnas») no lo toca.
  - `ColumnsMenu`: props `compact` / `onCompactChange`; con el callback pinta
    la casilla «Modo compacto» encima de «Restablecer columnas», sin cerrar el
    menú. Texto nuevo `Labels.compactMode` («Modo compacto»).
  - `ResponsiveList`: props `compact` / `onCompactChange` (llegan al menú de
    la cabecera y al de móvil). Con `compact`, `data-compact` en la tabla y en
    cada tarjeta; en escritorio las celdas no-`action` van `whitespace-nowrap
    overflow-hidden text-ellipsis` y las cabeceras `whitespace-nowrap` (ganan a
    un `cellClassName`/`headClassName` con `whitespace-normal`); en móvil los
    `<dd>` van con `truncate` y las acciones de la tarjeta sin `flex-wrap`.
  - `useListCompact()`: hook para que una `cell` sepa si su lista va en
    compacto (lo provee `ResponsiveList`).
  - `ListFooter`: props `compact` / `onCompactChange` para su menú de columnas.
  - `useListView`: opción `compactable` (por defecto `false`). Solo con ella
    `listProps` y `footerProps` llevan `compact` + `onCompactChange`; el
    resultado expone `compact` (`false` si el listado no es compactable).

## [0.2.2] - 2026-10-20

### Añadido

- `LIST_PAGE_SIZES` incluye 100: el selector «Filas por página» ofrece 10 · 25 · 50 · 100.

## [0.2.1] - 2026-10-08

### Corregido

- A11Y-7: `ResponsiveList` ya no pinta `<th>` vacíos. La columna `leading`
  lleva un `sr-only` con `labels.selectColumn` y las columnas `action` sin
  `header` uno con `labels.actionsColumn`.
- A11Y-7b: el selector «Filas por página» de `ListFooter` mide 44 px en
  puntero táctil (`pointer-coarse:min-h-11 min-w-11`).

### Añadido

- `Labels`: `actionsColumn` («Acciones») y `selectColumn` («Seleccionar»).

## [0.2.0] - 2026-09-27

### Añadido

- Subruta `@nscabezon/ui/auth` (cliente, `"use client"`): `OAuthButtons`, los
  botones «Continuar con Google / Apple» que vivían duplicados en las apps.
  Recibe el cliente de Supabase tipado a mano (`OAuthSignInClient`, sin
  importar `@supabase/supabase-js`), `redirectTo` (cadena o función evaluada
  al click), `providers`, `lastMethod` (etiqueta «Última vez»),
  `rememberLastMethod`, `onBeforeRedirect`, `onError` (por defecto
  `toast.error` de sonner), `divider`, `providerOptions` y `labels`.
- `GoogleIcon` y `AppleIcon`.
- `getLastAuthMethod` / `setLastAuthMethod` (sobre `safeStorage`, clave
  `ui.lastAuthMethod` configurable), tipos `AuthMethod` y `OAuthProvider`.
  También en `@nscabezon/ui/storage`.
- `Labels`: `oauthDivider`, `oauthGoogle`, `oauthApple`, `lastUsed`.

## [0.1.1] - 2026-09-25

### Añadido

- `useSupabaseListPrefsStore(client, options?)`: hook que sigue al usuario con
  sesión (`getSession` al montar + `onAuthStateChange`, con baja al desmontar)
  y devuelve el almacén de Supabase memoizado (`userId` `null` sin sesión).
  Cliente tipado a mano (`SupabaseLikeAuthClient`): sin import de
  `@supabase/supabase-js` en tiempo de ejecución y sin TanStack Query.
  `createSupabaseListPrefsStore` se mantiene.
- `CHANGELOG.md`.

### Cambiado

- `ResponsiveList.mobileColumnsMenu` pasa a estar **activo por defecto** cuando
  la lista permite ocultar columnas (`onHiddenColumnsChange` +
  `onColumnsReset`); `mobileColumnsMenu={false}` lo quita.
- `useListView` incluye `mobileColumnsMenu` en `listProps`: `false` en modo
  paginado (el `ListFooter` ya pinta el menú en móvil) y `true` con
  `paginated: false`.
- `UiProvider`: el valor del contexto solo cambia con `Link`,
  `listPrefsStore` o el contenido de `labels`. `navigate` y las
  etiquetas-función se exponen como delegados estables, así que se pueden
  pasar en línea sin memoizar.
- Textos por defecto de paginación: «Página anterior» / «Página siguiente»
  (antes «Anterior» / «Siguiente»).
- README: instalación con `git+https://github.com/NSCabezon/nscabezon-ui.git#vX.Y.Z`
  y nota sobre el `resolved` del lock (`git+ssh` → `git+https`).

## [0.1.0] - 2026-09-25

Primera versión, extraída de Gesmoto con aportes de TusExámenes.

- `UiProvider` (Link, navigate, textos, almacén de preferencias), `useUi`,
  `useLabels`, `defaultLabels`.
- `ResponsiveList` (tabla en escritorio / tarjetas en móvil, orden servidor,
  anchos arrastrables, columnas ocultas con menú incrustado, cabecera fija,
  filas teñidas, `rowHref`), `ColumnsMenu`, `useColumnResize` y helpers de
  columnas.
- `Pagination`, `usePagination`, `ListFooter`.
- `useListView`, `useListColumns`, `useListPrefs` (caché local con
  `useSyncExternalStore` + sincronización remota), `createSupabaseListPrefsStore`,
  `localOnlyListPrefsStore`.
- `useVersionCheck`, `fetchVersionJson`.
- Subruta `@nscabezon/ui/storage` sin `"use client"` para código de servidor.
