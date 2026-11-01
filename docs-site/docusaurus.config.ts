import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { PrismTheme } from 'prism-react-renderer';
import type { Config, Plugin } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const baseUrl = '/docs/';

/**
 * Syntax theme on the ink ramp. Every hue marks one token class and nothing else:
 * periwinkle for structure, teal for calls, peach for strings, amber for constants,
 * sage for types. Comments and punctuation stay in the neutral steps.
 * All colours reach 4.5 to 1 on the code surface (#11141c).
 */
const smallchatPrism: PrismTheme = {
  plain: {
    color: '#dfe3ec',
    backgroundColor: '#11141c',
  },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#7b84a0' } },
    { types: ['punctuation'], style: { color: '#8d95ab' } },
    { types: ['operator', 'entity', 'url'], style: { color: '#a3a9b8' } },
    {
      types: ['keyword', 'atrule', 'selector', 'tag', 'important', 'rule'],
      style: { color: '#9db4ee' },
    },
    {
      types: ['function', 'function-variable', 'method', 'attr-name', 'builtin'],
      style: { color: '#7fc4d4' },
    },
    { types: ['string', 'char', 'attr-value', 'template-string', 'regex'], style: { color: '#e8b08f' } },
    {
      types: ['number', 'boolean', 'constant', 'symbol', 'null', 'nil'],
      style: { color: '#d9b25c' },
    },
    { types: ['class-name', 'maybe-class-name', 'namespace'], style: { color: '#9ccfae' } },
    { types: ['property', 'variable', 'parameter'], style: { color: '#dfe3ec' } },
    { types: ['inserted'], style: { color: '#4cc38a' } },
    { types: ['deleted'], style: { color: '#e5484d' } },
    { types: ['changed'], style: { color: '#d9b25c' } },
    { types: ['bold'], style: { fontWeight: '500' } },
  ],
};

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return htmlFiles(full);
      return entry.name.endsWith('.html') ? [full] : [];
    }),
  );
  return nested.flat();
}

/**
 * React 18.3's server renderer writes its output in 2048-byte chunks. When a multi-byte
 * character (a box-drawing glyph, an em dash) straddles a chunk boundary it flushes the
 * chunk with unused zero bytes at the end and starts the character in the next chunk, so
 * the file carries NUL bytes between two complete characters. They are padding, nothing
 * else: removing them restores the text, and the file becomes valid HTML again. Which
 * pages are hit depends on markup lengths, so this runs on every build and then fails the
 * build if a NUL byte or invalid UTF-8 is left in any page.
 */
function stripNulBytes(): Plugin {
  return {
    name: 'smallchat-strip-nul-bytes',
    async postBuild({ outDir }) {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      for (const file of await htmlFiles(outDir)) {
        const raw = await fs.readFile(file);
        if (raw.includes(0)) {
          await fs.writeFile(file, Buffer.from(raw.filter((byte) => byte !== 0)));
        }
        const clean = await fs.readFile(file);
        if (clean.includes(0)) throw new Error(`NUL byte left in ${file}`);
        try {
          decoder.decode(clean);
        } catch {
          throw new Error(`Invalid UTF-8 in ${file}`);
        }
      }
    },
  };
}

const config: Config = {
  title: 'smallchat',
  tagline: 'object oriented inference',
  favicon: 'img/favicon.ico',

  url: 'https://smallchat.dev',
  baseUrl,

  organizationName: 'johnnyclem',
  projectName: 'smallchat',

  trailingSlash: false,
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Same families, loaded the same way, as the site root (a Google Fonts stylesheet link).
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
  ],

  headTags: [
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'icon', type: 'image/svg+xml', href: `${baseUrl}img/favicon.svg` },
    },
  ],

  plugins: [stripNulBytes],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/johnnyclem/smallchat/tree/main/packages/docs/',
        },
        blog: false,
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },

    image: 'img/smallchat-og.png',

    metadata: [
      { name: 'color-scheme', content: 'dark' },
      { name: 'theme-color', content: '#0b0d14' },
      {
        property: 'og:image:alt',
        content:
          'smallchat docs. "Resolve an intent to at most one tool" above the resolve command output, where the intent "search for code" resolves to github/search_code, ranked first of two candidates',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
    ],

    navbar: {
      title: 'smallchat',
      logo: {
        alt: 'smallchat logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo.svg',
        href: '/docs/intro',
      },
      style: 'dark',
      items: [
        {
          to: '/what-it-does',
          label: 'What it does',
          position: 'left',
        },
        {
          to: '/why-it-matters',
          label: 'Why it matters',
          position: 'left',
        },
        {
          to: '/concepts',
          label: 'Deep dive',
          position: 'left',
        },
        {
          to: '/integrations',
          label: 'Integrations',
          position: 'left',
        },
        {
          to: '/getting-started',
          label: 'Get started',
          position: 'right',
          className: 'navbar-cta-button',
        },
        {
          href: 'https://github.com/johnnyclem/smallchat',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/intro' },
            { label: 'Getting started', to: '/getting-started' },
            { label: 'What it does', to: '/what-it-does' },
            { label: 'Why it matters', to: '/why-it-matters' },
          ],
        },
        {
          title: 'Deep dive',
          items: [
            { label: 'Concepts', to: '/concepts' },
            { label: 'CLI reference', to: '/cli' },
            { label: 'API reference', to: '/api/runtime' },
            { label: 'Architecture', to: '/architecture' },
          ],
        },
        {
          title: 'Integrations',
          items: [
            { label: 'Overview', to: '/integrations' },
            { label: 'LoomMCP', to: '/integrations/loom-mcp' },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Source code',
              href: 'https://github.com/johnnyclem/smallchat',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@smallchat/core',
            },
          ],
        },
      ],
      copyright: `Built by Johnny Clem · MIT License`,
    },

    prism: {
      theme: smallchatPrism,
      darkTheme: smallchatPrism,
      additionalLanguages: ['bash', 'json', 'typescript', 'swift'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
