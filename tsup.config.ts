import { defineConfig } from 'tsup'

// Dos builds:
// - Cliente (".", "./list", "./version"): hooks y componentes. Llevan el banner
//   `"use client"` para que Next (App Router) los trate como módulos de cliente;
//   en Vite es una cadena suelta sin efecto. `splitting` comparte los chunks
//   entre entradas, así el estado de módulo (caché de preferencias, versión ya
//   avisada) es UNO aunque se importe por "." y por "./list" a la vez.
// - Servidor-seguro ("./storage"): funciones puras sin React ni "use client",
//   importables desde un Server Component o un route handler.
//
// Sin minificar: Tailwind escanea dist/ (`@source`) buscando las clases, que
// viven como literales de cadena.
const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'radix-ui',
  'lucide-react',
  '@tanstack/react-query',
  'sonner',
  '@supabase/supabase-js',
]

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      list: 'src/list.ts',
      version: 'src/version.ts',
    },
    format: ['esm'],
    target: 'es2022',
    dts: true,
    splitting: true,
    sourcemap: false,
    clean: false,
    minify: false,
    external,
    banner: { js: '"use client";' },
    outDir: 'dist',
  },
  {
    entry: { storage: 'src/storage.ts' },
    format: ['esm'],
    target: 'es2022',
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: false,
    minify: false,
    external,
    outDir: 'dist',
  },
])
