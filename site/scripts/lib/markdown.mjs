import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import path from 'node:path';
import { isFile, toPosix } from './fs-utils.mjs';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'pre', 'code', 'kbd',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'strong', 'em', 'b', 'i', 'del', 's', 'sup', 'sub',
  'a', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'details', 'summary', 'input',
];

const marked = new Marked({ gfm: true });
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif)$/i;

const isExternal = (url) => /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
const isAnchor = (url) => url.startsWith('#');

/**
 * Renders Markdown to sanitized HTML (AC14–AC17).
 * @param {string} markdown
 * @param {object} ctx
 * @param {string} ctx.file absolute path of the Markdown file
 * @param {string} ctx.repoRoot absolute repo root
 * @param {string} ctx.pluginRoot absolute plugin root (images inside it are copied)
 * @param {string} ctx.blobBase `https://github.com/<owner>/<repo>/blob/<sha>`
 * @param {(absPath: string) => string} ctx.copyImage copies an image and returns its site-relative URL
 * @param {(alt: string) => string} ctx.externalImageLabel text for a blocked external image
 */
export function renderMarkdown(markdown, ctx) {
  const raw = marked.parse(markdown);
  const fileDir = path.dirname(ctx.file);

  const resolveRepoPath = (url) => {
    const [pathPart, hash = ''] = url.split('#');
    let decoded = pathPart.split('?')[0];
    try {
      decoded = decodeURI(decoded);
    } catch {
      // Malformed %-escape: use the raw path rather than failing the build.
    }
    return { abs: path.resolve(fileDir, decoded), hash: hash ? `#${hash}` : '' };
  };

  return sanitizeHtml(raw, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      code: ['class'],
      th: ['align'],
      td: ['align'],
      input: ['type', 'checked', 'disabled'],
      ol: ['start'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed'],
    allowedClasses: { code: [/^language-[\w-]+$/] },
    exclusiveFilter: (frame) =>
      (frame.tag === 'input' && frame.attribs.type !== 'checkbox') || (frame.tag === 'img' && !frame.attribs.src && !frame.attribs.href),
    transformTags: {
      // The page owns <h1>; Markdown headings shift one level down.
      h1: 'h2',
      h2: 'h3',
      h3: 'h4',
      h4: 'h5',
      h5: 'h6',
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        if (!href || isAnchor(href)) return { tagName, attribs };
        if (isExternal(href)) {
          return { tagName, attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' } };
        }
        const { abs, hash } = resolveRepoPath(href);
        const rel = toPosix(path.relative(ctx.repoRoot, abs));
        if (rel.startsWith('..')) return { tagName, attribs: {} };
        return {
          tagName,
          attribs: { ...attribs, href: `${ctx.blobBase}/${rel}${hash}`, rel: 'noopener noreferrer', target: '_blank' },
        };
      },
      img: (tagName, attribs) => {
        const src = attribs.src ?? '';
        const alt = attribs.alt ?? '';
        if (isExternal(src)) {
          // External images become a link so the browser never fetches them (AC17).
          return {
            tagName: 'a',
            attribs: { href: src, rel: 'noopener noreferrer', target: '_blank' },
            text: ctx.externalImageLabel(alt),
          };
        }
        const { abs } = resolveRepoPath(src);
        const inside = !path.relative(ctx.pluginRoot, abs).startsWith('..');
        // Missing, outside the plugin or not a raster image (configs, SVG with script): drop it.
        if (!inside || !IMAGE_EXT.test(abs) || !isFile(abs)) return { tagName, attribs: {} };
        return { tagName, attribs: { ...attribs, src: ctx.copyImage(abs), loading: 'lazy' } };
      },
    },
  });
}

/** Plain text of a Markdown body for search indexing. */
export function markdownToText(markdown) {
  const html = marked.parse(markdown);
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
