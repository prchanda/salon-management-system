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
 * Render a short snippet (e.g. a post excerpt) as lightweight Markdown:
 * inline formatting (bold, italics, inline code, links, images) PLUS paragraph
 * breaks. Blank lines separate paragraphs; single newlines inside a paragraph
 * collapse to spaces (standard Markdown). Each paragraph is wrapped in a <p> so
 * the multi-line excerpts authors write keep their structure instead of
 * becoming one run-on block.
 *
 * Blockquote support: if the whole excerpt is written as a Markdown blockquote
 * (every non-empty line starts with ">"), the ">" markers are stripped and the
 * content is wrapped in an elegant gold-accented callout — so authors can write
 * `> ...` for a pull-quote-style intro and have it look attractive instead of
 * rendering the ">" as literal text.
 *
 * Typography (size/colour) is inherited from the container, so this is meant to
 * sit inside a `.lead` (or similar) wrapper. All input is HTML-escaped first
 * (see renderInline), so content cannot inject markup.
 */
export function renderExcerptMarkdown(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  // A fully-quoted excerpt: every non-blank line starts with ">".
  const lines = normalized.split("\n");
  const nonBlank = lines.filter((l) => l.trim() !== "");
  const isBlockquote =
    nonBlank.length > 0 && nonBlank.every((l) => /^\s*>/.test(l));

  // When it's a blockquote, peel off one "> " level from every line.
  const body = isBlockquote
    ? lines.map((l) => l.replace(/^\s*>\s?/, "")).join("\n")
    : normalized;

  const blocks = body
    .split(/\n[ \t]*\n+/) // blank line(s) → paragraph boundary
    .map((b) => b.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  if (blocks.length === 0) return "";

  const paras = blocks
    .map((b) => `<p class="mt-3 first:mt-0">${renderInline(b)}</p>`)
    .join("");

  if (isBlockquote) {
    return (
      `<blockquote class="not-italic rounded-r-xl border-l-[3px] border-gold-600 bg-cream-100/60 py-5 pl-6 pr-5 text-ink-700">` +
      paras +
      `</blockquote>`
    );
  }
  return paras;
}

/**
 * Strip Markdown syntax from a snippet to produce clean, single-line plain text
 * — for listing-card previews, meta descriptions, etc. where formatting and
 * line breaks aren't wanted. Removes blockquote markers, heading hashes,
 * emphasis (*/_), inline code backticks, list bullets, and link/image syntax
 * (keeping the visible label), then collapses all whitespace to single spaces.
 */
export function markdownToPlainText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
    .replace(/^[ \t]*>+[ \t]?/gm, "") // blockquote markers
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "") // heading hashes
    .replace(/^[ \t]*[-*+][ \t]+/gm, "") // unordered list bullets
    .replace(/^[ \t]*\d+\.[ \t]+/gm, "") // ordered list markers
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*\n]+)\*/g, "$1") // italics
    .replace(/__([^_]+)__/g, "$1") // bold (underscore)
    .replace(/_([^_\n]+)_/g, "$1") // italics (underscore)
    .replace(/\s+/g, " ")
    .trim();
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
    // A pulsing skeleton sits BEHIND the iframe so the slot isn't a blank white
    // box while Instagram's third-party embed (its own JS bundle + post data +
    // media) loads. The iframe is allowtransparency, so the skeleton shows
    // through until Instagram paints its white card on top of it.
    return (
      `<div class="my-8 flex justify-center">` +
      `<div class="relative w-full max-w-[400px]" style="height:640px">` +
      `<div class="absolute inset-0 animate-pulse rounded-xl bg-cream-100" aria-hidden="true"></div>` +
      `<iframe src="${src}" title="Instagram embed" loading="lazy" ` +
      `scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen ` +
      `class="relative h-full w-full rounded-xl border border-ink-900/10"></iframe>` +
      `</div>` +
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
    // plugins/video.php needs explicit dimensions to render its player.
    // Facebook CAPS the reel player at ~340px wide and won't draw wider, so we
    // render the reel at that natural size (which it fills) and CSS-scale the
    // whole iframe up for desktop. Regular 16:9 videos honour the width fine.
    const REEL_W = 340;
    const REEL_H = 604; // 340 * 16/9 ≈ 604
    const fbWidth = isReel ? REEL_W : 640;
    const fbHeight = isReel ? REEL_H : 360; // 640*9/16 = 360 (16:9)
    const src =
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}` +
      `&show_text=false&width=${fbWidth}&height=${fbHeight}`;

    // Facebook's plugin iframe is unreliable on iOS Safari (renders a blank
    // box). We can't detect the device server-side, so emit BOTH: the live
    // iframe for desktop (md+ screens, where it works) and a tappable
    // "Watch on Facebook" fallback card for mobile, toggled purely by CSS.
    const playIcon =
      `<svg viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6" aria-hidden="true">` +
      `<path d="M8 5v14l11-7z"></path></svg>`;
    const fallbackCard =
      `<a href="${url}" target="_blank" rel="noreferrer" ` +
      `class="group mx-auto my-8 flex ${isReel ? "max-w-[420px]" : "max-w-[640px]"} flex-col items-center justify-center gap-3 rounded-xl border border-ink-900/10 bg-cream-100 px-6 py-10 text-center no-underline md:hidden">` +
      `<span class="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white transition group-hover:scale-105">${playIcon}</span>` +
      `<span class="font-semibold text-ink-900">Watch this video on Facebook</span>` +
      `<span class="text-sm text-ink-500">Opens in the Facebook app or a new tab</span>` +
      `</a>`;

    if (isReel) {
      // Facebook draws the reel at its natural 340x604; scale the whole iframe
      // up ~1.3x so the actual video gets bigger on desktop (not just blank
      // margins). The wrapper reserves the scaled footprint so layout is exact.
      const SCALE = 1.3;
      const boxW = Math.round(REEL_W * SCALE); // 442
      const boxH = Math.round(REEL_H * SCALE); // 785
      // A pulsing skeleton fills the reserved box so the slot isn't a blank
      // white box while Facebook's third-party plugin loads.
      const desktopFrame =
        `<div class="my-8 hidden justify-center md:flex">` +
        `<div class="relative" style="width:${boxW}px;height:${boxH}px">` +
        `<div class="absolute inset-0 animate-pulse rounded-xl bg-cream-100" aria-hidden="true"></div>` +
        `<iframe src="${src}" title="Facebook reel" frameborder="0" ` +
        `allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" ` +
        `allowfullscreen ` +
        `class="relative rounded-xl border border-ink-900/10" ` +
        `style="width:${REEL_W}px;height:${REEL_H}px;transform:scale(${SCALE});transform-origin:top left"></iframe>` +
        `</div></div>`;
      return desktopFrame + fallbackCard;
    }
    const desktopFrame =
      `<div class="my-8 hidden overflow-hidden rounded-xl border border-ink-900/10 md:block">` +
      `<div class="relative w-full" style="padding-top:56.25%">` +
      `<div class="absolute inset-0 animate-pulse bg-cream-100" aria-hidden="true"></div>` +
      `<iframe src="${src}" title="Facebook video" frameborder="0" ` +
      `allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" ` +
      `allowfullscreen class="absolute inset-0 h-full w-full"></iframe>` +
      `</div></div>`;
    return desktopFrame + fallbackCard;
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
