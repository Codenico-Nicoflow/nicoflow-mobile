import { forgotPasswordSchema, loginSchema, registerSchema } from '@nicoflow/shared/schemas';

// Mobile imports the same schema instances @nicoflow/shared exports — there is
// no mobile-specific copy to drift from web. This just proves the import wires
// up correctly and the password composition rule (AC3) rejects what it should.
describe('auth schemas (shared with web, no mobile-specific copy)', () => {
  it('registerSchema rejects a password missing an uppercase letter', () => {
    const result = registerSchema.safeParse({ username: 'nico', email: 'nico@example.com', password: 'lowercase1' });
    expect(result.success).toBe(false);
  });

  it('registerSchema accepts a password meeting the policy', () => {
    const result = registerSchema.safeParse({ username: 'nico', email: 'nico@example.com', password: 'Password1' });
    expect(result.success).toBe(true);
  });

  it('loginSchema does not enforce password composition (legacy passwords must still work)', () => {
    const result = loginSchema.safeParse({ identifier: 'nico', password: 'old', remember: false });
    expect(result.success).toBe(true);
  });

  it('forgotPasswordSchema requires a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'nico@example.com' }).success).toBe(true);
  });
});
