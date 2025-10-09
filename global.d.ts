// global.d.ts
/// <reference types="vite-plugin-md-to-html/types" />

// Type definitions for the 'psl' module
declare module 'psl' {
  export function parse(domain: string): { input: string; tld: string; sld: string; domain: string; subdomain: string }
  export function isValid(domain: string): boolean
  export function get(domain: string): string | null
}
