"""
Reusable bulk-upload machinery for the Django admin.

This module mirrors the pattern already used by the exams app
(``exams/admin.py`` + ``exams/bulk_upload_utils.py``) but packages the
generic parts once so the Interview (pasApp), Quiz and Untimed-Quiz admins
can share them:

  * ``read_tabular``  - read an uploaded .xlsx / .xls / .csv into a DataFrame
  * ``cell``         - read a value by any of several accepted column aliases
  * ``to_bool`` / ``to_int`` - forgiving scalar parsers
  * ``BulkUploadAdminMixin`` - drops "Bulk Upload" + "Download Template"
    buttons onto a model's changelist and wires the two custom admin views.

A concrete admin subclasses ``BulkUploadAdminMixin``, sets a handful of
attributes, and implements two hooks:

    process_bulk_upload(self, df, request) -> results dict
    get_bulk_template_rows(self)           -> (list[dict] sample rows,
                                               list[(field, required, help)] )

Everything else (URL wiring, file validation, temp-file handling, success/
error messaging, CSV template download) is handled here.
"""

import csv
import os
import tempfile
from io import StringIO

import pandas as pd
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import path, reverse


# --------------------------------------------------------------------------
# Scalar / tabular helpers
# --------------------------------------------------------------------------
def read_tabular(file_path):
    """Read a bulk-upload file (.xlsx/.xls/.csv) into a normalised DataFrame."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(file_path, dtype=str)
    else:
        df = pd.read_excel(file_path)
    df.columns = df.columns.str.lower().str.strip()
    return df


def cell(row, df, *names):
    """
    First non-empty value among the given column aliases, or ``None``.

    Empty strings and NaN are treated as "not provided", so optional columns
    never break a row.
    """
    for name in names:
        if name in df.columns:
            value = row.get(name)
            if not pd.isna(value):
                text = str(value).strip()
                if text:
                    return text
    return None


def to_bool(value, default=False):
    """Forgiving truthy parser for spreadsheet cells."""
    if value is None:
        return default
    return str(value).strip().lower() in {'1', 'true', 'yes', 'y', 't', 'x', '✓', 'checked'}


def to_int(value, default=0):
    """Forgiving integer parser; falls back to ``default`` on bad/blank input."""
    if value is None:
        return default
    try:
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return default


def blank_results():
    """A fresh results accumulator shared by every uploader."""
    return {
        'total_rows': 0,
        'success_count': 0,
        'error_count': 0,
        'errors': [],
        'created': [],
        'notes': [],
    }


# --------------------------------------------------------------------------
# Admin mixin
# --------------------------------------------------------------------------
class BulkUploadAdminMixin:
    """
    Adds ``bulk-upload/`` and ``download-template/`` admin views to a
    ModelAdmin, plus the changelist buttons that link to them.

    Concrete admins must define:
        bulk_upload_form_template   - path to the upload form template
        change_list_template        - changelist template with the buttons
        bulk_template_filename      - downloaded CSV filename
    and implement ``process_bulk_upload`` and ``get_bulk_template_rows``.
    """

    bulk_upload_form_template = None
    bulk_template_filename = 'bulk_upload_template.csv'
    max_upload_bytes = 10 * 1024 * 1024  # 10 MB

    # ---- URL naming -------------------------------------------------------
    def _url_name(self, suffix):
        opts = self.model._meta
        return f'{opts.app_label}_{opts.model_name}_{suffix}'

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path('bulk-upload/',
                 self.admin_site.admin_view(self.bulk_upload_view),
                 name=self._url_name('bulk_upload')),
            path('download-template/',
                 self.admin_site.admin_view(self.download_template_view),
                 name=self._url_name('download_template')),
        ]
        return custom + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['bulk_upload_url'] = reverse(
            f'admin:{self._url_name("bulk_upload")}')
        extra_context['download_template_url'] = reverse(
            f'admin:{self._url_name("download_template")}')
        return super().changelist_view(request, extra_context=extra_context)

    # ---- Views ------------------------------------------------------------
    def bulk_upload_view(self, request):
        context = dict(
            self.admin_site.each_context(request),
            title=f'Bulk Upload {self.model._meta.verbose_name_plural.title()}',
            opts=self.model._meta,
            download_template_url=reverse(
                f'admin:{self._url_name("download_template")}'),
            template_fields=self.get_bulk_template_rows()[1],
            result=None,
        )

        if request.method == 'POST' and request.FILES.get('data_file'):
            upload = request.FILES['data_file']

            if not upload.name.lower().endswith(('.xlsx', '.xls', '.csv')):
                messages.error(request, 'Please upload an Excel (.xlsx/.xls) or CSV (.csv) file.')
                return render(request, self.bulk_upload_form_template, context)

            if upload.size > self.max_upload_bytes:
                messages.error(request, 'File too large. Maximum size is 10MB.')
                return render(request, self.bulk_upload_form_template, context)

            suffix = '.csv' if upload.name.lower().endswith('.csv') else '.xlsx'
            tmp_path = None
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    for chunk in upload.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name

                df = read_tabular(tmp_path)
                results = self.process_bulk_upload(df, request)
                context['result'] = results

                messages.success(
                    request,
                    f"Upload complete: {results['success_count']} created, "
                    f"{results['error_count']} error(s).")

                for note in results.get('notes', []):
                    messages.info(request, note)

                for error in results.get('errors', [])[:5]:
                    messages.warning(request, f"Row {error['row']}: {error['error']}")
                if len(results.get('errors', [])) > 5:
                    messages.warning(
                        request,
                        f"...and {len(results['errors']) - 5} more error(s).")

            except Exception as exc:  # noqa: BLE001 - surface any parse failure
                messages.error(request, f'Error processing file: {exc}')
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    try:
                        os.unlink(tmp_path)
                    except OSError:
                        pass

            return render(request, self.bulk_upload_form_template, context)

        return render(request, self.bulk_upload_form_template, context)

    def download_template_view(self, request):
        """Return a CSV template (headers + a couple of sample rows)."""
        sample_rows, field_specs = self.get_bulk_template_rows()
        fieldnames = [f[0] for f in field_specs]

        buffer = StringIO()
        writer = csv.DictWriter(buffer, fieldnames=fieldnames)
        writer.writeheader()
        for sample in sample_rows:
            writer.writerow({k: sample.get(k, '') for k in fieldnames})

        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = (
            f'attachment; filename="{self.bulk_template_filename}"')
        return response

    # ---- Hooks (override in concrete admin) -------------------------------
    def process_bulk_upload(self, df, request):  # pragma: no cover - abstract
        raise NotImplementedError

    def get_bulk_template_rows(self):  # pragma: no cover - abstract
        """
        Return ``(sample_rows, field_specs)`` where:
          sample_rows  = list[dict] example rows keyed by column name
          field_specs  = list[(column, required_label, description)]
        """
        raise NotImplementedError
