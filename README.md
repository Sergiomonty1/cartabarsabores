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
(código de acceso por defecto: `2010`, definido en `app/menu/admin/page.tsx`).

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
- **`initial`** — la "carta inicial / de fábrica" guardada desde el admin; es la que restaura
  el botón **Resetear**.

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
- **Ocultar** o **borrar** secciones.
- Activar el modo **Día Importante** (solo media ración) y mostrar/ocultar la carta de vinos.
- **Guardar la carta actual como inicial** y **Resetear** a ese estado guardado.

> ⚠️ La seguridad real depende de las **reglas de Firestore**. El código de admin (`2010`) es
> solo una barrera de cliente: protege el acceso a la base de datos con reglas adecuadas.
