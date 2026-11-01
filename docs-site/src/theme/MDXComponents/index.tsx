import React, { useEffect, useRef, useState } from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import ResolveCard from '@site/src/components/ResolveCard';

// Every markdown table sits in a wrapper that owns the border and the radius and scrolls
// sideways when the table is wider than the column. Words in cells are never broken.
// A wrapper that scrolls must be reachable from the keyboard, so it joins the tab order
// (as a labelled group, not a landmark, so several tables on a page need no unique names)
// only while its table is wider than the column. A table that fits adds no tab stop.
function Table(props: React.ComponentProps<'table'>): React.JSX.Element {
  const wrapper = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const node = wrapper.current;
    if (!node) return undefined;
    const measure = () => setScrolls(node.scrollWidth > node.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapper}
      className="sc-table"
      {...(scrolls ? { tabIndex: 0, role: 'group', 'aria-label': 'Scrollable table' } : {})}>
      <table {...props} />
    </div>
  );
}

export default {
  ...MDXComponents,
  table: Table,
  ResolveCard,
};
