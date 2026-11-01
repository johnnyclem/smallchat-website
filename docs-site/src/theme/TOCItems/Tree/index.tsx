import React from 'react';
import Link from '@docusaurus/Link';
import type { Props } from '@theme/TOCItems/Tree';

// Swizzled from the classic theme for one reason: the table-of-contents column is narrow, and
// a heading that is a code signature, like runtime.dispatchById(toolId, args, options?), used
// to break inside the name. Here the visible text keeps the name (runtime.dispatchById) and
// drops what only repeats detail: an argument list, or a trailing "(src/core/file.ts)". The
// link carries the whole heading as its title, and the heading on the page is unchanged.
// A name still wider than the column is cut with an ellipsis (custom.css).

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|nbsp|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity)
    .trim();
}

// <code>name(args)</code> becomes <code>name</code>, and a trailing "(<code>path</code>)" goes.
// Code without an argument list, and every heading without code, is untouched.
function shorten(html: string): string {
  const withoutArguments = html.replace(/(<code[^>]*>)([^<(]*)\([^<]*(<\/code>)/g, '$1$2$3');
  const withoutPath = withoutArguments.replace(/\s*\(<code[^>]*>[^<]*<\/code>\)\s*$/, '');
  return withoutPath.trim() ? withoutPath : withoutArguments;
}

function TOCItemTree({ toc, className, linkClassName, isChild }: Props): React.JSX.Element | null {
  if (!toc.length) {
    return null;
  }
  return (
    <ul className={isChild ? undefined : className}>
      {toc.map((heading) => (
        <li key={heading.id}>
          <Link
            to={`#${heading.id}`}
            className={linkClassName ?? undefined}
            title={heading.value.includes('<code') ? plainText(heading.value) : undefined}
            // Developer provided the HTML, so assume it's safe.
            dangerouslySetInnerHTML={{ __html: shorten(heading.value) }}
          />
          <TOCItemTree
            isChild
            toc={heading.children}
            className={className}
            linkClassName={linkClassName}
          />
        </li>
      ))}
    </ul>
  );
}

// Memo only the tree root is enough
export default React.memo(TOCItemTree);
