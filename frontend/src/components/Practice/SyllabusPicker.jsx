import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { MarkdownContent } from './StudyNotesViewer';

/**
 * Exam Syllabus picker: choose an exam body (WAEC, JAMB, JSSCE, ...), pick a
 * syllabus, then read it on the page (Word/Markdown uploads) or view and
 * download the PDF.
 */
const SyllabusPicker = ({ examBodies = [], examCategory, subjectId, subjectName }) => {
  const [body, setBody] = useState(examCategory || '');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      setLoading(true);
      try {
        const params = {};
        if (body) params.exam_category = body;
        if (subjectId) params.subject = subjectId;
        const res = await api.get('/api/exams/syllabuses/', { params });
        if (cancelled) return;
        // Subject-specific syllabuses first, general ones after.
        const items = [...(res.data.syllabuses || [])].sort(
          (a, b) => Number(!a.subject) - Number(!b.subject));
        setList(items);
        setSelectedId(items.length ? items[0].id : null);
        setError(null);
      } catch (err) {
        console.error('Syllabus list failed:', err);
        if (!cancelled) { setError('Could not load syllabuses.'); setList([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [body, subjectId]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      setDetailLoading(true);
      try {
        const res = await api.get(`/api/exams/syllabuses/${selectedId}/`);
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const current = selectedId ? (detail?.id === selectedId ? detail : list.find((s) => s.id === selectedId)) : null;

  return (
    <div className="syllabus-picker">
      <div className="row g-2 align-items-end mb-3">
        <div className="col-sm-5">
          <label htmlFor="syl-body" className="form-label small fw-semibold text-muted mb-1">
            <i className="fas fa-university me-1"></i>Exam body
          </label>
          <select id="syl-body" className="form-select" value={body} onChange={(e) => setBody(e.target.value)}>
            <option value="">All exam bodies</option>
            {examBodies.map((b) => <option key={b.slug} value={b.slug}>{b.display_name}</option>)}
          </select>
        </div>
        <div className="col-sm-7">
          <label htmlFor="syl-doc" className="form-label small fw-semibold text-muted mb-1">
            <i className="fas fa-file-alt me-1"></i>Syllabus{subjectName ? ` (${subjectName} + general)` : ''}
          </label>
          <select id="syl-doc" className="form-select" value={selectedId || ''} disabled={loading || !list.length}
            onChange={(e) => setSelectedId(Number(e.target.value) || null)}>
            {!list.length && <option value="">{loading ? 'Loading…' : 'No syllabus uploaded yet'}</option>}
            {list.map((s) => (
              <option key={s.id} value={s.id}>
                {s.exam_category_name} · {s.subject_name || 'General'} · {s.title}{s.edition ? ` (${s.edition})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      {!loading && !list.length && !error && (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-scroll fa-3x mb-3 d-block"></i>
          <h5 className="text-dark">No syllabus yet</h5>
          <p className="mb-0">The syllabus for this exam body{subjectName ? ` and ${subjectName}` : ''} will appear here once uploaded.</p>
        </div>
      )}

      {current && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <div>
                <h5 className="mb-1">{current.title}</h5>
                <div className="small text-muted">
                  {current.exam_category_name} · {current.subject_name || 'General syllabus'}
                  {current.edition ? ` · ${current.edition}` : ''}
                </div>
                {current.description && <p className="mt-2 mb-0">{current.description}</p>}
              </div>
              <div className="d-flex flex-wrap gap-2">
                {current.file_url && (
                  <>
                    <a className="btn btn-sm btn-outline-primary" href={current.file_url} target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-eye me-1"></i>View
                    </a>
                    <a className="btn btn-sm btn-primary" href={current.file_url} download={current.file_name || true}
                      target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-download me-1"></i>Download {current.file_type ? current.file_type.toUpperCase() : ''}
                    </a>
                  </>
                )}
                {current.external_url && (
                  <a className="btn btn-sm btn-outline-secondary" href={current.external_url} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-alt me-1"></i>Official page
                  </a>
                )}
              </div>
            </div>

            {detailLoading ? (
              <div className="text-center py-4"><span className="spinner-border text-primary"></span></div>
            ) : detail?.content ? (
              <MarkdownContent content={detail.content} />
            ) : current.file_type === 'pdf' && current.file_url ? (
              <object data={current.file_url} type="application/pdf" className="w-100 rounded border"
                style={{ height: '70vh' }} aria-label={current.title}>
                <p className="p-3 mb-0">
                  Your browser cannot preview PDFs here. <a href={current.file_url} target="_blank" rel="noopener noreferrer">Open the syllabus</a>.
                </p>
              </object>
            ) : (
              <p className="text-muted mb-0">Use the buttons above to open this syllabus.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusPicker;
