import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import BlogContent from '@/components/blog/BlogContent';
import { normalizeBlogSlug } from '@/lib/blog';

describe('Blog CMS helpers', () => {
  test('creates stable URL slugs from German titles', () => {
    expect(normalizeBlogSlug('  Qualität & Prüfsiegel: Häufige Fragen!  ')).toBe(
      'qualitat-prufsiegel-haufige-fragen',
    );
    expect(normalizeBlogSlug('Straße und Maßstab')).toBe('strasse-und-massstab');
  });

  test('renders supported article formatting and escapes user content', () => {
    const html = renderToStaticMarkup(
      <BlogContent
        content={'Einleitung\n\n## Übersicht\n\n- Erster Punkt\n- <script>alert("x")</script>\n\n1. Schritt eins'}
      />,
    );

    expect(html).toContain('<h2');
    expect(html).toContain('<ul');
    expect(html).toContain('<ol');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
