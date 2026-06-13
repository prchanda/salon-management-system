// Tiny, dependency-free Markdown → HTML renderer.
// Supports: headings (#, ##, ###), bold (**…**), italics (*…*),
// inline code (`…`), links [text](url), images ![alt](url),
// unordered lists (- / *), ordered lists (1.), blockquotes (>),
// horizontal rules (---), code blocks (```), tables, and paragraphs.
//
// Also supports social video embeds: an Instagram or Facebook video/post URL
// on its own line becomes a responsive embed (see renderEmbed).
//
// All raw input is HTML-escaped first, so user content cannot inject markup.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  let out = escapeHtml(text);

  // Images: ![alt](url) — allow http(s) only
  out = out.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, alt, url) => `<img src="${url}" alt="${alt}" loading="lazy" class="my-6 rounded-xl" />`
  );

  // Links: [text](url) — allow http(s)/mailto/tel only
  out = out.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)/g,
    (_m, label, url) =>
      `<a href="${url}" class="text-gold-600 underline underline-offset-4 hover:text-ink-900" target="_blank" rel="noreferrer">${label}</a>`
  );

  // Inline code
  out = out.replace(
    /`([^`]+)`/g,
    (_m, code) => `<code class="rounded bg-cream-100 px-1.5 py-0.5 text-[0.9em]">${code}</code>`
  );

  // Bold then italic (order matters)
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  return out;
}

/**
 * Turn a bare Instagram or Facebook URL into a responsive embed iframe.
 *
 * Security: we only ever build an <iframe> when the whole line matches one of
 * the strict patterns below, and the src is assembled from a fixed template
 * using either an extracted, character-class-validated shortcode/id or the
 * encodeURIComponent-escaped original URL. No user input reaches the markup
 * unescaped. Hosts must also be whitelisted in the CSP `frame-src` directive
 * (see next.config.mjs).
 *
 * Returns the iframe HTML, or null when the URL isn't a supported embed.
 */
function renderEmbed(rawUrl: string): string | null {
  const url = rawUrl.trim();

  // Instagram post / reel / IGTV: .../{p|reel|reels|tv}/{shortcode}/…
  const ig =
    /^https?:\/\/(?:www\.)?instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i.exec(
      url
    );
  if (ig) {
    const code = ig[1];
    const src = `https://www.instagram.com/p/${code}/embed/captioned/`;
    return (
      `<div class="my-8 flex justify-center">` +
      `<iframe src="${src}" title="Instagram embed" loading="lazy" ` +
      `scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen ` +
      `class="w-full max-w-[400px] rounded-xl border border-ink-900/10" ` +
      `style="height:640px"></iframe>` +
      `</div>`
    );
  }

  // Facebook video / reel / watch, and fb.watch short links.
  const isFacebook =
    /^https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(?:[^/?#]+\/videos\/\d+|watch\/?\?v=\d+|reel\/\d+|video\.php\?v=\d+|share\/[vr]\/[A-Za-z0-9_-]+)/i.test(
      url
    ) || /^https?:\/\/fb\.watch\/[A-Za-z0-9_-]+/i.test(url);
  if (isFacebook) {
    // Reels (and /share/r/ short links) are vertical 9:16; regular videos are 16:9.
    const isReel =
      /\/reel\/\d+/i.test(url) || /\/share\/r\//i.test(url) || /fb\.watch\//i.test(url);
    const src =
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}` +
      `&show_text=false`;
    if (isReel) {
      return (
        `<div class="my-8 flex justify-center">` +
        `<div class="relative w-full max-w-[340px] overflow-hidden rounded-xl border border-ink-900/10" style="aspect-ratio:9/16">` +
        `<iframe src="${src}" title="Facebook reel" loading="lazy" frameborder="0" ` +
        `allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" ` +
        `allowfullscreen class="absolute inset-0 h-full w-full"></iframe>` +
        `</div></div>`
      );
    }
    return (
      `<div class="my-8 overflow-hidden rounded-xl border border-ink-900/10">` +
      `<div class="relative w-full" style="padding-top:56.25%">` +
      `<iframe src="${src}" title="Facebook video" loading="lazy" frameborder="0" ` +
      `allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" ` +
      `allowfullscreen class="absolute inset-0 h-full w-full"></iframe>` +
      `</div></div>`
    );
  }

  return null;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // closing ```
      out.push(
        `<pre class="my-6 overflow-x-auto rounded-xl bg-ink-900 p-4 text-sm text-cream-50"><code>${buf.join(
          "\n"
        )}</code></pre>`
      );
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const content = renderInline(h[2]);
      const cls =
        level === 1
          ? "mt-10 mb-4 font-serif text-3xl text-ink-900"
          : level === 2
          ? "mt-8 mb-3 font-serif text-2xl text-ink-900"
          : "mt-6 mb-2 font-serif text-xl text-ink-900";
      out.push(`<h${level} class="${cls}">${content}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      out.push('<hr class="my-8 border-ink-900/10" />');
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(
        `<blockquote class="my-6 border-l-4 border-gold-600 pl-4 italic text-ink-700">${renderInline(
          buf.join(" ")
        )}</blockquote>`
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul class="my-4 list-disc space-y-1 pl-6">${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol class="my-4 list-decimal space-y-1 pl-6">${items.join("")}</ol>`);
      continue;
    }

    // GFM-style table: header row | separator row | body rows
    if (
      /\|/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      const splitRow = (row: string): string[] =>
        row
          .replace(/^\s*\|/, "")
          .replace(/\|\s*$/, "")
          .split("|")
          .map((c) => c.trim());

      const headers = splitRow(line);
      i += 2; // skip header + separator
      const bodyRows: string[][] = [];
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== "") {
        bodyRows.push(splitRow(lines[i]));
        i++;
      }

      const thead = `<thead><tr>${headers
        .map(
          (h) =>
            `<th class="border-b border-ink-900/15 px-4 py-2 text-left font-serif text-ink-900">${renderInline(
              h
            )}</th>`
        )
        .join("")}</tr></thead>`;

      const tbody = `<tbody>${bodyRows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (c) =>
                  `<td class="border-b border-ink-900/5 px-4 py-2 align-top text-ink-700">${renderInline(
                    c
                  )}</td>`
              )
              .join("")}</tr>`
        )
        .join("")}</tbody>`;

      out.push(
        `<div class="my-6 overflow-x-auto"><table class="w-full border-collapse text-sm">${thead}${tbody}</table></div>`
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Social embed: a line that is solely a supported Instagram/Facebook URL.
    if (/^https?:\/\/\S+$/.test(line.trim())) {
      const embed = renderEmbed(line.trim());
      if (embed) {
        out.push(embed);
        i++;
        continue;
      }
    }

    // Paragraph (collect consecutive non-blank, non-special lines)
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s+|>\s?|\s*[-*]\s+|\s*\d+\.\s+|```|---|\s*\|)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      `<p class="my-4 leading-relaxed text-ink-700">${renderInline(para.join(" "))}</p>`
    );
  }

  return out.join("\n");
}
