import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: { syntaxHighlight: false },
  security: {
    csp: {
      directives: [
        "default-src 'none'",
        "base-uri 'none'",
        "object-src 'none'",
        "form-action 'none'",
        "connect-src 'none'",
        "frame-src 'none'",
        "img-src 'self'",
        "font-src 'self'",
      ],
      scriptDirective: {
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'none'", kind: 'attribute' },
        ],
      },
      styleDirective: {
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'none'", kind: 'attribute' },
        ],
      },
    },
  },
});
