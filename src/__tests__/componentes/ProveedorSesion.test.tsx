/**
 * @jest-environment jsdom
 */

// Mock del módulo auth/client antes de cualquier import
jest.mock('../../lib/auth/client', () => ({
  authClient: {
    useSession: jest.fn().mockReturnValue({ data: null, isPending: false }),
    $Infer: { Session: {} },
  },
}));

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock de NeonAuthUIProvider para inspeccionar las props que recibe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockNeonAuthUIProvider = jest.fn((props: any) => <div data-testid="provider">{props.children}</div>);

jest.mock('@neondatabase/auth-ui', () => ({
  NeonAuthUIProvider: mockNeonAuthUIProvider,
}));

import React from 'react';

import { render } from '@testing-library/react';
import ProveedorSesion from '../../componentes/ProveedorSesion';

describe('ProveedorSesion', () => {
  beforeEach(() => {
    mockNeonAuthUIProvider.mockClear();
  });

  it('pasa emailVerification=true al provider', () => {
    render(
      <ProveedorSesion>
        <div>test</div>
      </ProveedorSesion>
    );

    const props = mockNeonAuthUIProvider.mock.calls[0][0];
    expect(props.emailVerification).toBe(true);
  });

  it('pasa credentials con forgotPassword=true al provider', () => {
    render(
      <ProveedorSesion>
        <div>test</div>
      </ProveedorSesion>
    );

    const props = mockNeonAuthUIProvider.mock.calls[0][0];
    expect(props.credentials).toEqual(
      expect.objectContaining({ forgotPassword: true })
    );
  });

  it('pasa basePath="/auth" al provider', () => {
    render(
      <ProveedorSesion>
        <div>test</div>
      </ProveedorSesion>
    );

    const props = mockNeonAuthUIProvider.mock.calls[0][0];
    expect(props.basePath).toBe('/auth');
  });

  it('pasa navigate como función al provider', () => {
    render(
      <ProveedorSesion>
        <div>test</div>
      </ProveedorSesion>
    );

    const props = mockNeonAuthUIProvider.mock.calls[0][0];
    expect(typeof props.navigate).toBe('function');
  });

  it('pasa onSessionChange como función al provider', () => {
    render(
      <ProveedorSesion>
        <div>test</div>
      </ProveedorSesion>
    );

    const props = mockNeonAuthUIProvider.mock.calls[0][0];
    expect(typeof props.onSessionChange).toBe('function');
  });
});
