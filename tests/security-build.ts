import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const outputDirectory = fileURLToPath(new URL('../dist/', import.meta.url));

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return files.flat().sort();
}

function decodeAttribute(value: string): string {
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (entity: string, name: string) => {
    if (!name.startsWith('#')) return entities[name.toLowerCase()] ?? entity;
    return String.fromCodePoint(parseInt(name.slice(name[1]?.toLowerCase() === 'x' ? 2 : 1), name[1]?.toLowerCase() === 'x' ? 16 : 10));
  });
}

interface Tag {
  name: string;
  attributes: Map<string, string>;
  content?: string;
  index: number;
}

// This tokenizer targets generated Astro HTML, not arbitrary untrusted HTML.
function tagsFrom(html: string): Tag[] {
  const markup = html.replace(/<!--[\s\S]*?-->/g, comment => ' '.repeat(comment.length));
  const tags: Tag[] = [];
  const pattern = /<(script|style)\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/\1\s*>|<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi;
  for (const match of markup.matchAll(pattern)) {
    const attributes = new Map<string, string>();
    const source = match[2] ?? match[5] ?? '';
    for (const attribute of source.matchAll(/(?:^|\s)([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      attributes.set(attribute[1]!.toLowerCase(), decodeAttribute(attribute[2] ?? attribute[3] ?? attribute[4] ?? ''));
    }
    tags.push({
      name: (match[1] ?? match[4])!.toLowerCase(),
      attributes,
      content: match[3],
      index: match.index,
    });
  }
  return tags;
}

function directivesFrom(policy: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const directive of policy.split(';').map(value => value.trim()).filter(Boolean)) {
    const [name, ...values] = directive.split(/\s+/);
    assert.ok(name && !directives.has(name), `Duplicate CSP directive: ${name}`);
    directives.set(name, values);
  }
  return directives;
}

test('built pages enforce the static-site privacy policy', async context => {
  let files: string[];
  try {
    files = await listFiles(outputDirectory);
  } catch (error) {
    throw new Error('Build the site with npm run build before running the security checks.', { cause: error });
  }
  const pages = files.filter(path => path.endsWith('.html'));
  assert.ok(pages.length >= 5, 'The home, contact and destination pages must be generated.');
  assert.ok(!files.some(path => path.endsWith('.map')), 'Source maps must not be published.');
  for (const path of files.filter(path => /\.(?:html|m?js|css|json|txt|xml)$/i.test(path))) {
    const content = await readFile(path, 'utf8');
    assert.doesNotMatch(content, /sourceMappingURL|figma\.com\/(?:design|file)\//i, `Private design references and source maps must not enter ${relative(outputDirectory, path)}.`);
    assert.doesNotMatch(content, /[a-z]:[\\/](?:Users|Dev|Mate)[\\/]/i, `Local machine paths must not enter ${relative(outputDirectory, path)}.`);
  }

  for (const path of pages) {
    await context.test(relative(outputDirectory, path), async () => {
      const html = await readFile(path, 'utf8');
      const tags = tagsFrom(html);
      const policies = tags.filter(tag => tag.name === 'meta' && tag.attributes.get('http-equiv')?.toLowerCase() === 'content-security-policy');
      assert.equal(policies.length, 1, 'Each page must have one CSP meta element.');
      const policy = policies[0]!;
      const directives = directivesFrom(policy.attributes.get('content') ?? '');
      for (const name of ['default-src', 'base-uri', 'form-action', 'connect-src', 'object-src', 'frame-src', 'script-src-attr', 'style-src-attr']) {
        assert.deepEqual(directives.get(name), ["'none'"], `${name} must deny unused capabilities.`);
      }
      for (const name of ['img-src', 'font-src']) {
        assert.deepEqual(directives.get(name), ["'self'"], `${name} must allow only local resources.`);
      }
      for (const name of ['script-src', 'style-src']) {
        assert.ok((directives.get(`${name}-elem`) ?? directives.get(name))?.length, `${name} must have an explicit effective element policy.`);
        for (const directive of [name, `${name}-elem`]) {
          for (const value of directives.get(directive) ?? []) {
            assert.ok(value === "'self'" || /^'sha256-[A-Za-z\d+/]+={0,2}'$/.test(value), `${directive} permits an unexpected source: ${value}`);
          }
        }
      }

      const resources = tags.filter(tag => tag.name === 'script' || tag.name === 'style' || (tag.name === 'link' && tag.attributes.get('rel')?.split(/\s+/).includes('stylesheet')));
      for (const resource of resources) {
        assert.ok(policy.index < resource.index, 'CSP must precede executable scripts and styles.');
        if (resource.content !== undefined && !resource.attributes.has('src') && resource.content.trim()) {
          const hash = `'sha256-${createHash('sha256').update(resource.content).digest('base64')}'`;
          const name = resource.name === 'script' ? 'script-src' : 'style-src';
          const allowed = directives.get(`${name}-elem`) ?? directives.get(name) ?? [];
          assert.ok(allowed.includes(hash), `The emitted inline ${resource.name} must match an allowed CSP hash.`);
        }
      }

      const referrers = tags.filter(tag => tag.name === 'meta' && tag.attributes.get('name')?.toLowerCase() === 'referrer');
      assert.equal(referrers.length, 1, 'Referrer policy must be explicit.');
      assert.equal(referrers[0]!.attributes.get('content'), 'no-referrer');
      for (const tag of tags) {
        assert.ok(![...tag.attributes.keys()].some(name => /^on[a-z]+$/.test(name)), 'Inline event handlers must not be emitted.');
        for (const name of ['src', 'poster', ...(tag.name === 'link' ? ['href'] : [])]) {
          const value = tag.attributes.get(name);
          if (value !== undefined) assert.ok(value.startsWith('/') && !value.startsWith('//'), `Resource must be same-origin: ${tag.name}[${name}]=${value}`);
        }
        const srcset = tag.attributes.get('srcset');
        if (srcset) {
          for (const candidate of srcset.split(',')) {
            assert.match(candidate.trim(), /^\/(?!\/)/, 'Responsive images must use local resources.');
          }
        }
      }
    });
  }

  await context.test('contact preserves destination context without collecting or submitting data', async () => {
    const html = await readFile(join(outputDirectory, 'contacto', 'index.html'), 'utf8');
    const tags = tagsFrom(html);
    assert.ok(!tags.some(tag => ['form', 'input', 'textarea'].includes(tag.name)), 'Contact must not collect personal data or provide native submission.');
    assert.ok(!tags.some(tag => tag.attributes.get('type') === 'submit' || tag.attributes.has('formaction')), 'Submit controls must not be emitted.');
    assert.ok(tags.some(tag => tag.attributes.get('id') === 'contact-status'), 'The unconfirmed channel must stay explicitly pending.');
    assert.ok(tags.find(tag => tag.attributes.get('id') === 'selected-destination')?.attributes.has('hidden'), 'Unknown destination queries must start without a selected destination.');
    const catalogue = JSON.parse(tags.find(tag => tag.attributes.has('data-destinations'))?.attributes.get('data-destinations') ?? '[]') as { slug: string; name: string }[];
    assert.equal(catalogue.length, 8, 'Every editorial destination must be available to the contact flow.');
    assert.equal(new Set(catalogue.map(item => item.slug)).size, catalogue.length);
    for (const { slug, name } of catalogue) {
      assert.match(slug, /^[a-z]+$/);
      assert.ok(name.length > 0);
      const destinationHtml = await readFile(join(outputDirectory, 'destinos', slug, 'index.html'), 'utf8');
      const destinationTags = tagsFrom(destinationHtml);
      assert.ok(destinationTags.some(tag => tag.name === 'a' && tag.attributes.get('href') === `/contacto/?destino=${slug}`), `${slug} must retain its destination when starting an inquiry.`);
    }
  });
});
