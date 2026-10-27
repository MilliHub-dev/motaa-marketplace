// Business verification by uploaded documents (GET/POST /accounts/verify-business/documents/).

export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const DOCUMENT_ACCEPT = DOCUMENT_TYPES.join(',');
const EXTENSIONS = /\.(pdf|jpe?g|png|webp)$/i;

/** "1.2 MB", "340 KB", "900 bytes" */
export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return '';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} bytes`;
}

/** Why a picked file can't be uploaded, or ''. Some browsers leave `type` empty, so the extension counts too. */
export function documentFileProblem(file, { maxMb = 10, accepts = 'PDF, JPG, PNG or WebP' } = {}) {
  if (!file) return 'Choose a file to upload.';
  const typeOk = DOCUMENT_TYPES.includes(String(file.type || '').toLowerCase()) || (!file.type && EXTENSIONS.test(file.name || ''));
  if (!typeOk) return `This file type isn't accepted. Upload a ${accepts} file.`;
  if (Number(file.size) > maxMb * 1024 * 1024) return `This file is too large. The limit is ${maxMb} MB.`;
  if (!Number(file.size)) return 'This file is empty. Choose another one.';
  return '';
}

/** Badge colour and wording for a document's review status. */
export function documentStatus(doc) {
  const status = String(doc?.status || '');
  const fallback = { pending: 'Waiting for review', approved: 'Approved', rejected: 'Rejected' }[status] || 'Waiting for review';
  return {
    label: doc?.status_label || fallback,
    color: status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'yellow',
  };
}

/** A file_url from the API ("/api/v1/accounts/…/file/" or absolute) → the path for the API client (relative to /api/v1). */
export function apiPath(url) {
  let path = String(url || '');
  try { path = new URL(path, 'http://x').pathname + new URL(path, 'http://x').search; } catch { /* keep as is */ }
  return path.replace(/^\/api\/v1(?=\/)/, '');
}
