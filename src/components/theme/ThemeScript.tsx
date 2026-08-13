import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Roda ANTES da primeira pintura (é o primeiro filho do <body>): lê a preferência
 * salva, resolve "system" pela preferência do SO e aplica data-theme + color-scheme
 * no <html>. Evita qualquer flash de tema incorreto ao carregar/atualizar a página.
 */
export function ThemeScript() {
  const js = `(function(){try{var k=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=k==='system'?(m?'dark':'light'):k;var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=t;}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
