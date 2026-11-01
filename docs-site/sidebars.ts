import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// Category labels live here and are set in sentence case. Page labels come from each
// doc's `sidebar_label` front matter, which takes precedence over anything set here, and
// those are in sentence case too.
const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'getting-started',
    'what-it-does',
    'why-it-matters',
    {
      type: 'category',
      label: 'Deep dive',
      items: [
        'concepts/index',
        'concepts/selector-table',
        'concepts/dispatch',
        'concepts/tool-class',
        'concepts/resolution-cache',
        'concepts/sc-object',
        'concepts/overloading',
        'concepts/streaming',
        'concepts/swizzling',
        'concepts/truth-ledger',
      ],
    },
    {
      type: 'category',
      label: 'CLI reference',
      items: ['cli/index', 'cli/compile', 'cli/inspect', 'cli/resolve', 'cli/explain', 'cli/replay', 'cli/serve'],
    },
    {
      type: 'category',
      label: 'API reference',
      items: ['api/runtime', 'api/dispatch', 'api/compiler', 'api/mcp-server'],
    },
    {
      type: 'category',
      label: 'Manifests',
      items: ['manifests/format', 'manifests/examples'],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: ['integrations/index', 'integrations/loom-mcp'],
    },
    'architecture',
  ],
};

export default sidebars;
