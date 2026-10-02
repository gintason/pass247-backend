import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import api from '../../api/client';

/* ------------------------------------------------------------------
   Callout map — the panel types admins can use. Each type has its own
   colour (see study-notes.css) and an icon shown in the panel label.
   Two ways to write one in the admin "content" box:
     > [!WORKED EXAMPLE] optional title        (what .docx uploads produce)
     > ✍️ **WORKED EXAMPLE — optional title**  (emoji + bold label)
   ------------------------------------------------------------------ */
const CALLOUT_TYPES = {
  definition: { label: 'Key Definition', icon: '💡' },
  keyfact:    { label: 'Key Fact',       icon: '⭐' },
  rule:       { label: 'Key Rule',       icon: '📌' },
  formula:    { label: 'Formula Box',    icon: '📐' },
  worked:     { label: 'Worked Example', icon: '✍️' },
  tip:        { label: 'Exam Tip',       icon: '🎯' },
  warning:    { label: 'Common Pitfall', icon: '⚠️' },
  check:      { label: 'Check',          icon: '✅' },
  note:       { label: 'Note',           icon: '📝' },
  important:  { label: 'Important',      icon: '❗' },
  summary:    { label: 'Summary',        icon: '🧾' },
};

/* Ordered: the first pattern that matches the label wins. */
const CALLOUT_PATTERNS = [
  [/^(KEY\s+)?DEFINITIONS?$/,                         'definition'],
  [/^KEY\s+FACTS?$/,                                  'keyfact'],
  [/^(KEY\s+)?RULES?$/,                               'rule'],
  [/^(FORMULA|FORMULAE|FORMULAS)(\s+BOX)?$/,          'formula'],
  [/^(WORKED\s+)?EXAMPLES?$|^WORKED$/,                'worked'],
  [/^(EXAM\s+TIPS?|TIPS?|MEMORY\s+HOOK|HINT)$/,       'tip'],
  [/^(COMMON\s+)?(PITFALL|MISTAKE|TRAP)S?$|^WARNING$|^CAUTION$/, 'warning'],
  [/^EXAM\s+TIP\s*\/\s*COMMON\s+PITFALL$/,            'warning'],
  [/^CHECK$/,                                         'check'],
  [/^NOTE$/,                                          'note'],
  [/^IMPORTANT$/,                                     'important'],
  [/^(SUMMARY|FINAL\s+EXAM\s+TIPS|QUICK\s+RECAP)$/,   'summary'],
];

function calloutTypeFor(label) {
  const key = label.toUpperCase().replace(/\s+/g, ' ').trim();
  const hit = CALLOUT_PATTERNS.find(([re]) => re.test(key));
  return hit ? hit[1] : null;
}

// Leading emoji / pictographs (with variation selectors and ZWJs)
const LEADING_EMOJI_RE = /^(?:\s|\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|\u{20E3})+/u;
// "LABEL" optionally followed by a separator and a title
const LABEL_RE = /^([A-Za-z][A-Za-z /]*?)\s*(?:[:—–-]\s*([\s\S]*))?$/;

function mdText(node) {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  return (node.children || []).map(mdText).join('');
}

/* Build the mdast callout node. `titleNodes` (optional) are inline
   nodes rendered as the panel's title line. */
function makeCallout(type, children, titleNodes) {
  const cfg = CALLOUT_TYPES[type];
  const body = [...children];
  if (titleNodes && titleNodes.length && mdText({ children: titleNodes }).trim()) {
    body.unshift({
      type: 'paragraph',
      data: { hProperties: { className: ['sn-callout__title'] } },
      children: titleNodes,
    });
  }
  return {
    type: 'callout',
    data: {
      hName: 'div',
      hProperties: {
        className: ['sn-callout', `sn-callout--${type}`],
        'data-callout-label': `${cfg.icon} ${cfg.label}`,
      },
    },
    children: body,
  };
}

/* `> [!TYPE] optional title` */
function convertBracketCallout(node) {
  const first = node.children?.[0];
  if (!first || first.type !== 'paragraph') return null;
  const firstText = first.children?.[0];
  if (!firstText || firstText.type !== 'text') return null;

  const m = firstText.value.match(/^\s*\[!([^\]\n]+)\]([^\n]*)\n?([\s\S]*)$/);
  if (!m) return null;
  const type = calloutTypeFor(m[1]);
  if (!type) return null;

  const title = m[2].trim();
  const rest = node.children.slice(1);
  const remainingInline = [];
  if (m[3]) remainingInline.push({ ...firstText, value: m[3] });
  remainingInline.push(...first.children.slice(1));

  // Everything on the marker line becomes the title, the rest stays body
  let titleNodes = title ? [{ type: 'text', value: title }] : null;
  let body = rest;
  if (remainingInline.length && mdText({ children: remainingInline }).trim()) {
    if (!titleNodes && !m[3]) {
      // `> [!FORMULA] **Laws of Indices**` style — inline nodes are the title
      titleNodes = remainingInline;
    } else {
      body = [{ ...first, children: remainingInline }, ...rest];
    }
  }
  return makeCallout(type, body, titleNodes);
}

/* `> 💡 **KEY DEFINITION — title**` or `> ⚠️ **EXAM TIP:** text` */
function convertEmojiCallout(node) {
  const first = node.children?.[0];
  if (!first || first.type !== 'paragraph') return null;
  const kids = [...(first.children || [])];

  let i = 0;
  if (kids[i]?.type === 'text') {
    const stripped = kids[i].value.replace(LEADING_EMOJI_RE, '');
    if (stripped !== '') return null; // text before the bold label
    i += 1;
  }
  const strong = kids[i];
  if (!strong || strong.type !== 'strong') return null;
  const lead = strong.children?.[0];
  if (!lead || lead.type !== 'text') return null;

  const m = lead.value.match(LABEL_RE);
  if (!m) return null;
  const type = calloutTypeFor(m[1]);
  if (!type) return null;

  // Title = remainder of the bold run after the label
  const titleNodes = [];
  if (m[2] && m[2].trim()) titleNodes.push({ ...lead, value: m[2].trimStart() });
  titleNodes.push(...strong.children.slice(1));

  // Inline content after the bold label stays as the first body paragraph
  const after = kids.slice(i + 1);
  if (after[0]?.type === 'text') {
    after[0] = { ...after[0], value: after[0].value.replace(/^[\s:—–-]+/, '') };
  }
  const body = node.children.slice(1);
  if (mdText({ children: after }).trim()) {
    body.unshift({ ...first, children: after });
  }
  return makeCallout(type, body, titleNodes);
}

/* ------------------------------------------------------------------
   Remark plugin: blockquotes -> <div class="sn-callout sn-callout--TYPE">.
   Uses mdast's hName/hProperties API — no rehype-raw needed, no XSS.
   Plain blockquotes (no recognised label) become soft info panels.
   ------------------------------------------------------------------ */
function remarkCallouts() {
  return (tree) => {
    const walk = (node) => {
      if (!node || !Array.isArray(node.children)) return;
      node.children = node.children.map((child) => {
        if (child.type === 'blockquote') {
          const converted = convertBracketCallout(child) || convertEmojiCallout(child);
          if (converted) {
            walk(converted);
            return converted;
          }
          child.data = {
            ...(child.data || {}),
            hProperties: { className: ['sn-quote'] },
          };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}

/* ------------------------------------------------------------------
   Remark plugin: heading ids (for the table of contents links) and
   colour-coded banners for "TOPIC n" headings, the table of contents
   and the quick-reference sheet.
   Slugs follow GitHub's rules so `[x](#-topic-1--number--numeration)`
   links written for GitHub also work here.
   ------------------------------------------------------------------ */
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

function remarkHeadings() {
  return (tree) => {
    const used = new Map();
    let topicIndex = 0;
    (tree.children || []).forEach((node) => {
      if (node.type !== 'heading') return;
      const text = mdText(node);
      const base = slugify(text) || 'section';
      const count = used.get(base) || 0;
      used.set(base, count + 1);
      const id = count ? `${base}-${count}` : base;

      const className = [];
      const topic = text.match(/\b(?:topic|unit|chapter)\s+(\d+)/i);
      if (node.depth <= 2 && topic) {
        topicIndex += 1;
        const n = parseInt(topic[1], 10) || topicIndex;
        className.push('sn-topic-banner', `sn-topic-banner--${(n - 1) % 4}`);
      } else if (node.depth <= 2 && /table of contents|contents/i.test(text)) {
        className.push('sn-section-banner', 'sn-section-banner--toc');
      } else if (node.depth <= 2 && /quick reference|cheat ?sheet|formula sheet/i.test(text)) {
        className.push('sn-section-banner', 'sn-section-banner--quickref');
      } else if (node.depth <= 2 && /final exam tips|exam strategy/i.test(text)) {
        className.push('sn-section-banner', 'sn-section-banner--tips');
      }

      node.data = {
        ...(node.data || {}),
        hProperties: {
          ...(node.data?.hProperties || {}),
          id,
          ...(className.length ? { className } : {}),
        },
      };
    });
  };
}

/* ------------------------------------------------------------------
   Normalise maths so KaTeX renders it:
   - `\( ... \)` and `\[ ... \]` -> $...$ and $$...$$ (Word documents
     use these delimiters).
   - A line that is ONLY `$$ ... $$` (also inside `>` panels) becomes a
     proper display block. Otherwise consecutive formula lines merge into
     one paragraph and render as a single run-on inline line.
   ------------------------------------------------------------------ */
const ONE_LINE_DISPLAY_MATH_RE = /^((?:[ \t]*>)*[ \t]*)\$\$(.+?)\$\$[ \t]*$/;

function normalizeMathDelimiters(text) {
  if (!text) return '';
  const converted = text
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math.trim()}$$`);

  let inCode = false;
  return converted
    .split('\n')
    .flatMap((line) => {
      if (/^(?:[ \t]*>)*[ \t]*(```|~~~)/.test(line)) inCode = !inCode;
      const m = !inCode && line.match(ONE_LINE_DISPLAY_MATH_RE);
      if (!m) return [line];
      const prefix = m[1];
      const blank = prefix.trimEnd();
      return [blank, `${prefix}$$`, `${prefix}${m[2].trim()}`, `${prefix}$$`, blank];
    })
    .join('\n');
}

/* ------------------------------------------------------------------
   Custom markdown components. `node` is the AST node react-markdown
   passes in; it is destructured out (as `_node`) so it never hits the
   DOM. The leading underscore is exempt from `no-unused-vars` via
   varsIgnorePattern '^[A-Z_]' in eslint.config.js. (The previous
   `({ node: props })` spread the AST node onto <table>, dropping every
   row, so Markdown tables rendered empty.)
   ------------------------------------------------------------------ */
const scrollToAnchor = (event, href) => {
  const id = decodeURIComponent(href.slice(1));
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const markdownComponents = {
  table: (allProps) => {
    const { node: _node, ...props } = allProps;
    return (
      <div className="sn-table-wrap">
        <table {...props} />
      </div>
    );
  },
  a: (allProps) => {
    const { node: _node, href = '', ...props } = allProps;
    if (href.startsWith('#')) {
      return <a href={href} onClick={(e) => scrollToAnchor(e, href)} {...props} />;
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
  },
};

/* ------------------------------------------------------------------
   Structured-topic card renderer (topics JSON field).
   ------------------------------------------------------------------ */
const TopicsBlock = ({ topics }) => {
  if (!Array.isArray(topics) || topics.length === 0) return null;
  return (
    <div className="sn-block">
      <h3 className="sn-block__title">
        <i className="fas fa-list-ul"></i> Topics Covered
      </h3>
      <div className="sn-topic-grid">
        {topics.map((topic, i) => (
          <div className="sn-topic" key={i}>
            <div className="sn-topic__title">
              {topic.title || topic.name || `Topic ${i + 1}`}
            </div>
            {topic.description && (
              <p className="sn-topic__desc">{topic.description}</p>
            )}
            {Array.isArray(topic.key_points) && topic.key_points.length > 0 && (
              <ul className="sn-topic__points">
                {topic.key_points.map((point, j) => (
                  <li key={j}>{point}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
   Structured formulas renderer (formulas JSON field).
   ------------------------------------------------------------------ */
const FormulasBlock = ({ formulas }) => {
  if (!Array.isArray(formulas) || formulas.length === 0) return null;
  return (
    <div className="sn-block">
      <h3 className="sn-block__title">
        <i className="fas fa-superscript"></i> Important Formulas
      </h3>
      <div className="sn-table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Formula</th>
              <th style={{ width: '35%' }}>Description</th>
              <th>Application</th>
            </tr>
          </thead>
          <tbody>
            {formulas.map((f, i) => (
              <tr key={i}>
                <td>
                  <code>{f.formula || f.name || ''}</code>
                </td>
                <td>{f.description || ''}</td>
                <td className="text-muted">{f.application || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
   References block.
   ------------------------------------------------------------------ */
const ReferencesBlock = ({ references }) => {
  if (!Array.isArray(references) || references.length === 0) return null;
  return (
    <div className="sn-block">
      <h3 className="sn-block__title">
        <i className="fas fa-book"></i> Recommended References
      </h3>
      <ul className="sn-ref-list">
        {references.map((ref, i) => (
          <li className="sn-ref" key={i}>
            <i className="fas fa-link"></i>
            <span>
              <strong>{ref.title || ref.name || 'Reference'}</strong>
              {ref.author && <span className="sn-ref__author"> — {ref.author}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ------------------------------------------------------------------
   Reusable renderer for any admin-authored Markdown (syllabuses etc.):
   same colour-coded panels, tables and maths as the study notes.
   ------------------------------------------------------------------ */
export const MarkdownContent = ({ content }) => {
  const rendered = useMemo(() => normalizeMathDelimiters(content || ''), [content]);
  if (!rendered.trim()) return null;
  return (
    <div className="sn-doc">
      <div className="sn-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath, remarkCallouts, remarkHeadings]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {rendered}
        </ReactMarkdown>
      </div>
    </div>
  );
};

/* ==================================================================
   Main viewer
   ================================================================== */
const StudyNotesViewer = ({ subjectName, subjectId }) => {
  // Derived from props on every render — NOT stored in state, so no
  // setState-in-effect is required for the "no id" case.
  const invalidId =
    !subjectId || subjectId === 'null' || subjectId === 'undefined';

  const [notes, setNotes]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (invalidId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await api.get(`/api/exams/study-notes/${subjectId}/`);
        if (cancelled) return;
        setNotes(res.data);
        setError(null);
      } catch (err) {
        console.error('Study notes fetch failed:', err);
        if (cancelled) return;
        setError('Failed to load study notes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [subjectId, invalidId]);

  // Normalise math delimiters once per content change
  const renderedContent = useMemo(
    () => normalizeMathDelimiters(notes?.content || ''),
    [notes?.content]
  );

  /* ---------- No subject id ---------- */
  if (invalidId) {
    return (
      <div className="sn-empty">
        <i className="fas fa-book-open"></i>
        <h5>Study Notes Unavailable</h5>
        <p>Please access this section from a valid subject page.</p>
      </div>
    );
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">
          Loading study notes for {subjectName || 'this subject'}…
        </p>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div className="sn-empty">
        <i className="fas fa-book-open"></i>
        <h5>Study Notes Unavailable</h5>
        <p>
          Study notes for {subjectName || 'this subject'} are not yet available.
        </p>
      </div>
    );
  }

  /* ---------- Empty ---------- */
  const hasAnything =
    notes && (
      (Array.isArray(notes.topics) && notes.topics.length > 0) ||
      (Array.isArray(notes.formulas) && notes.formulas.length > 0) ||
      (notes.content && notes.content.trim().length > 0)
    );

  if (!hasAnything) {
    return (
      <div className="sn-empty">
        <i className="fas fa-book-open"></i>
        <h5>No Study Notes Available</h5>
        <p>Study notes for {subjectName || 'this subject'} are not yet available.</p>
      </div>
    );
  }

  return (
    <div className="sn-doc">
      {/* ---- Hero banner ---- */}
      <div className="sn-hero">
        <span className="sn-hero__eyebrow">Pass 24/7 · Study Notes</span>
        <h1 className="sn-hero__title">
          {subjectName || notes?.subject_name || 'Study Notes'}
        </h1>
        <p className="sn-hero__subtitle">
          Comprehensive study material — key facts, worked examples, and exam tips.
        </p>
        <div className="sn-hero__chips">
          {notes?.notes_count > 1 && (
            <span className="sn-hero__chip">
              <i className="fas fa-layer-group"></i>
              {notes.notes_count} note {notes.notes_count === 1 ? 'unit' : 'units'}
            </span>
          )}
          {Array.isArray(notes?.topics) && notes.topics.length > 0 && (
            <span className="sn-hero__chip">
              <i className="fas fa-list-ul"></i>
              {notes.topics.length} topics
            </span>
          )}
          {Array.isArray(notes?.formulas) && notes.formulas.length > 0 && (
            <span className="sn-hero__chip">
              <i className="fas fa-superscript"></i>
              {notes.formulas.length} formulas
            </span>
          )}
        </div>
      </div>

      {/* ---- Structured topics ---- */}
      <TopicsBlock topics={notes?.topics} />

      {/* ---- Main markdown body ---- */}
      {renderedContent && (
        <div className="sn-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkCallouts, remarkHeadings]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {renderedContent}
          </ReactMarkdown>
        </div>
      )}

      {/* ---- Structured formulas ---- */}
      <FormulasBlock formulas={notes?.formulas} />

      {/* ---- References ---- */}
      <ReferencesBlock references={notes?.references} />
    </div>
  );
};

export default StudyNotesViewer;