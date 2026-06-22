/**
 * Test que verifica que globals.css define los tokens CSS necesarios
 * para que los componentes de @neondatabase/auth-ui sean visibles.
 *
 * Este test valida que el archivo CSS contiene las variables OKLCH 
 * requeridas para contraste adecuado en links y botones secundarios.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Auth CSS Tokens', () => {
  let cssContent: string;

  beforeAll(() => {
    cssContent = readFileSync(
      resolve(__dirname, '../../src/app/globals.css'),
      'utf-8'
    );
  });

  it('define --primary en formato OKLCH', () => {
    expect(cssContent).toMatch(/--primary:\s*oklch\(/);
  });

  it('define --primary-foreground en formato OKLCH', () => {
    expect(cssContent).toMatch(/--primary-foreground:\s*oklch\(/);
  });

  it('define --secondary en formato OKLCH', () => {
    expect(cssContent).toMatch(/--secondary:\s*oklch\(/);
  });

  it('define --secondary-foreground en formato OKLCH', () => {
    expect(cssContent).toMatch(/--secondary-foreground:\s*oklch\(/);
  });

  it('define --muted-foreground en formato OKLCH', () => {
    expect(cssContent).toMatch(/--muted-foreground:\s*oklch\(/);
  });

  it('define --accent en formato OKLCH', () => {
    expect(cssContent).toMatch(/--accent:\s*oklch\(/);
  });

  it('define --accent-foreground en formato OKLCH', () => {
    expect(cssContent).toMatch(/--accent-foreground:\s*oklch\(/);
  });
});
