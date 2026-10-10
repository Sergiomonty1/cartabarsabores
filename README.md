# Carta Bar Sabores

Carta digital multiidioma para el bar **Sabores**, con panel de administración en tiempo real
(precios, platos, vinos, alérgenos y traducciones) sobre **Next.js 14 + Firebase Firestore**.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** para el diseño
- **Firebase / Firestore** como base de datos en tiempo real

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena tus credenciales de Firebase
npm run dev                  # http://localhost:3000
```

La home redirige a `/menu/tapas`. El panel de administración está en `/menu/admin`
(código de acceso: `2010`; contraseña de la carta de fábrica: `7954`; ambos en
`app/menu/admin/page.tsx`).

## Variables de entorno

Todas las claves de Firebase van en `.env.local` (ver `.env.example`). Son `NEXT_PUBLIC_*`
porque el SDK de Firebase corre en el cliente.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/menu/tapas` | Carta de tapas |
| `/menu/medias` | Carta de medias raciones |
| `/menu/alergenos` | Carta con iconos de alérgenos |
| `/menu/vinos` | Carta de vinos |
| `/menu/admin` | Panel de administración (protegido por código) |

## Estructura de datos (Firestore)

Colección `menu`:

- **`data`** — la carta publicada que ven los clientes.
- **`initial`** — la **carta de fábrica**, guardada desde el admin (*Opciones avanzadas →
  Guardar carta de fábrica*). **Restablecer** la vuelve a poner y la publica al momento.
  Las dos acciones piden la contraseña `7954`.
- **`visits`** — contador de visitas a la carta (una por sesión), visible solo en el admin.

### Actualizaciones de contenido

`lib/menuUpdates.ts` contiene cambios de carta preparados en código (platos nuevos, ocultos,
renombrados y traducciones revisadas). Se aplican al **leer** la carta cuando el documento
tiene una `contentVersion` menor que `CONTENT_VERSION`, así que se ven nada más desplegar;
al guardar desde el admin quedan grabados y no se vuelven a aplicar. Cada cambio comprueba
el nombre en español para no pisar ediciones hechas a mano.

El modelo de datos está en [`types/menu.ts`](types/menu.ts). Cada categoría, plato y vino admite
traducciones manuales por idioma (`nameI18n`: EN/DE/PT/FR; el español es el campo base `name`).

## Idiomas

Español (base), inglés, alemán, portugués y francés. Las cadenas de interfaz están en
[`lib/translations.ts`](lib/translations.ts); los nombres de platos/categorías/vinos se traducen
desde los propios datos y son editables en el panel de administración.

## Administración

En `/menu/admin` puedes:

- Editar nombre del bar, platos, precios (tapa/media), orden y alérgenos.
- Gestionar la carta de **vinos** (secciones, vinos, precios copa/botella, año).
- Añadir traducciones por idioma para platos, categorías y vinos.
- **Ocultar** (👁) o **borrar** platos, vinos y secciones.
- Por sección: etiqueta bajo el título, explicación, mínimo de personas y precio «por persona»
  (lo usan los Arroces: solo fines de semana, mínimo 2 personas).
- Activar el modo **Día Importante** (solo media ración) y mostrar/ocultar la carta de vinos.
- **Guardar carta** (botón grande, siempre abajo): guarda y publica la carta tal como está.
- En *Opciones avanzadas* (con contraseña): **Guardar carta de fábrica** (la carta guardada pasa a
  ser la de fábrica) y **Restablecer** (vuelve a poner la carta de fábrica y la publica).
- Ver las **visitas** de la carta (hoy y total).

> ⚠️ La seguridad real depende de las **reglas de Firestore**. El código de admin (`2010`) y la
> contraseña de restablecer (`7954`) son solo barreras de cliente: protege el acceso a la base de
> datos con reglas adecuadas.
