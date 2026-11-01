import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { PageMetadata } from '@docusaurus/theme-common';
import Heading from '@theme/Heading';
import type { Props } from '@theme/NotFound/Content';

// The 404 speaks the product's vocabulary: a request that resolved to nothing has the
// outcome "unresolved" (the same outcome name the runtime and the resolve command use).
//
// The docs sit at the site root, so the docs route catches every unknown address and renders
// only this component inside the docs layout (a NotFound page component is never reached).
// The tab title is therefore set here, in sentence case.
export default function NotFoundContent({ className }: Props): React.JSX.Element {
  const [path, setPath] = useState('');

  // The static 404.html is served for every missing address, so the path is read on the client.
  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  return (
    <>
      <PageMetadata title="Page not found" />
      <main className={clsx('not-found', className)}>
        <Heading as="h1" className="not-found__title">
          Page not found
        </Heading>
        <p className="not-found__lead">
          No page matches this address. It may have moved, or the link that brought you here is wrong.
        </p>
        <dl className="not-found__trace">
          <dt>Requested</dt>
          <dd>{path || ' '}</dd>
          <dt>Outcome</dt>
          <dd>unresolved</dd>
        </dl>
        <div className="not-found__actions">
          <Link className="sc-button sc-button--primary" to="/intro">
            Go to the introduction
          </Link>
          <Link className="sc-button sc-button--secondary" to="/getting-started">
            Getting started
          </Link>
        </div>
      </main>
    </>
  );
}
