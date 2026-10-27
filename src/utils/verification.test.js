import { describe, expect, it } from 'vitest';
import { apiPath, documentFileProblem, documentStatus, formatFileSize } from './verification';

const file = (name, type, size) => ({ name, type, size });

describe('verification documents', () => {
  it('accepts PDF and images up to the limit', () => {
    expect(documentFileProblem(file('cac.pdf', 'application/pdf', 2_000_000))).toBe('');
    expect(documentFileProblem(file('id.JPG', '', 300_000))).toBe('');
    expect(documentFileProblem(file('id.png', 'image/png', 11 * 1024 * 1024), { maxMb: 10 })).toBe('This file is too large. The limit is 10 MB.');
    expect(documentFileProblem(file('cac.docx', 'application/msword', 1000))).toMatch(/isn't accepted/);
    expect(documentFileProblem(file('a.pdf', 'application/pdf', 0))).toMatch(/empty/);
    expect(documentFileProblem(null)).toBe('Choose a file to upload.');
  });

  it('words sizes and statuses', () => {
    expect(formatFileSize(1_258_291)).toBe('1.2 MB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB');
    expect(formatFileSize(348_160)).toBe('340 KB');
    expect(formatFileSize(900)).toBe('900 bytes');
    expect(documentStatus({ status: 'pending' })).toEqual({ label: 'Waiting for review', color: 'yellow' });
    expect(documentStatus({ status: 'rejected', status_label: 'Rejected' })).toEqual({ label: 'Rejected', color: 'red' });
    expect(documentStatus({ status: 'approved' }).color).toBe('green');
  });

  it('turns the file link into an API client path', () => {
    expect(apiPath('/api/v1/accounts/verify-business/documents/12/file/')).toBe('/accounts/verify-business/documents/12/file/');
    expect(apiPath('https://server.motaa.net/api/v1/accounts/verify-business/documents/12/file/')).toBe('/accounts/verify-business/documents/12/file/');
  });
});
