import {
  buildDocumentKeyFromRut,
  cleanRut,
  formatRut,
  validateRut,
} from '@cisus-shared/identity/identity-document';

describe('identity document', () => {
  it('normalizes, validates and formats a Chilean RUT', () => {
    expect(cleanRut('12.345.678-5')).toBe('123456785');
    expect(validateRut('12.345.678-5')).toBe(true);
    expect(formatRut('123456785')).toBe('12.345.678-5');
  });

  it('uses RUT only as a document registry key', () => {
    expect(buildDocumentKeyFromRut('12.345.678-5')).toBe('cl_rut:123456785');
    expect(validateRut('12.345.678-9')).toBe(false);
  });
});
