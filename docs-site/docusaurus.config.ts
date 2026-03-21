import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'smallchat',
  tagline: 'object oriented inference',
  favicon: 'img/favicon.ico',

  url: 'https://smallchat.dev',
  baseUrl: '/docs/',

  organizationName: 'johnnyclem',
  projectName: 'smallchat',

  trailingSlash: false,
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

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
          to: '/getting-started',
          label: 'Get Started',
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
            { label: 'Getting Started', to: '/getting-started' },
            { label: 'What it does', to: '/what-it-does' },
            { label: 'Why it matters', to: '/why-it-matters' },
          ],
        },
        {
          title: 'Deep Dive',
          items: [
            { label: 'Concepts', to: '/concepts' },
            { label: 'CLI Reference', to: '/cli' },
            { label: 'API Reference', to: '/api/runtime' },
            { label: 'Architecture', to: '/architecture' },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Source Code',
              href: 'https://github.com/johnnyclem/smallchat',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@smallchat/core',
            },
          ],
        },
      ],
      copyright: `Built by Johnny Clem. MIT License.`,
    },

    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
