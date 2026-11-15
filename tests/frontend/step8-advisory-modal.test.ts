import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { advisoryInquirySchema, submitAdvisoryEnquiryAction } from '@/app/actions/advisory';

describe('Step 8: Academic Advisory Desk Redesign & Validation Tests', () => {
  describe('Zod Validation & Security Sanitization', () => {
    it('accepts valid advisory inquiry payload', () => {
      const valid = {
        name: 'Anand Kumar',
        phone: '+91 94426 05096',
        email: 'anand.kumar@example.com',
        profile: 'College Student',
        course: 'Web & Full Stack Development',
        message: 'Interested in weekend batch timings.',
        honeypot: '',
      };

      const result = advisoryInquirySchema.safeParse(valid);
      assert.ok(result.success, 'Valid payload must succeed parsing');
      if (result.success) {
        assert.equal(result.data.name, 'Anand Kumar');
        assert.equal(result.data.email, 'anand.kumar@example.com');
      }
    });

    it('rejects names shorter than 2 characters or longer than 100 characters', () => {
      const short = advisoryInquirySchema.safeParse({
        name: 'A',
        phone: '9442605096',
        email: 'test@example.com',
      });
      assert.ok(!short.success, 'Single character name must fail');

      const long = advisoryInquirySchema.safeParse({
        name: 'A'.repeat(101),
        phone: '9442605096',
        email: 'test@example.com',
      });
      assert.ok(!long.success, 'Name > 100 chars must fail');
    });

    it('rejects HTML and script tags in all text fields (Anti-XSS)', () => {
      const htmlInName = advisoryInquirySchema.safeParse({
        name: '<script>alert(1)</script>',
        phone: '9442605096',
        email: 'test@example.com',
      });
      assert.ok(!htmlInName.success, 'HTML in name must be rejected');

      const htmlInMessage = advisoryInquirySchema.safeParse({
        name: 'Valid Name',
        phone: '9442605096',
        email: 'test@example.com',
        message: '<img src=x onerror=alert(1)>',
      });
      assert.ok(!htmlInMessage.success, 'HTML in message must be rejected');
    });

    it('validates phone numbers (10 to 15 digits allowing spaces and country code)', () => {
      const validPhones = [
        '9442605096',
        '+91 94426 05096',
        '+919442605096',
        '0431 245 6789',
      ];

      for (const phone of validPhones) {
        const res = advisoryInquirySchema.safeParse({
          name: 'Valid Name',
          phone,
          email: 'test@example.com',
        });
        assert.ok(res.success, `Phone ${phone} should be valid`);
      }

      const invalidPhones = ['12345', 'abc9442605096', '1234567890123456'];
      for (const phone of invalidPhones) {
        const res = advisoryInquirySchema.safeParse({
          name: 'Valid Name',
          phone,
          email: 'test@example.com',
        });
        assert.ok(!res.success, `Phone ${phone} should be invalid`);
      }
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = ['plainaddress', '@missingusername.com', 'user@domain'];
      for (const email of invalidEmails) {
        const res = advisoryInquirySchema.safeParse({
          name: 'Valid Name',
          phone: '9442605096',
          email,
        });
        assert.ok(!res.success, `Email ${email} should be invalid`);
      }
    });

    it('honeypot triggers silent success without executing backend', async () => {
      const botPayload = {
        name: 'Spam Bot',
        phone: '9442605096',
        email: 'bot@spam.com',
        honeypot: 'http://spam-link.ru',
      };

      const result = await submitAdvisoryEnquiryAction(botPayload);
      assert.equal(result.success, true, 'Honeypot trap must silently return success');
    });
  });

  describe('Component Architecture & Design Tokens', () => {
    it('AdvisorModal.tsx implements accessible dialog with required ARIA attributes', () => {
      const componentPath = path.resolve(process.cwd(), 'src/components/ui/AdvisorModal.tsx');
      assert.ok(fs.existsSync(componentPath), 'AdvisorModal.tsx must exist');

      const content = fs.readFileSync(componentPath, 'utf-8');
      assert.ok(content.includes('role="dialog"'), 'Must have role="dialog"');
      assert.ok(content.includes('aria-modal="true"'), 'Must have aria-modal="true"');
      assert.ok(content.includes('aria-labelledby'), 'Must have aria-labelledby');
      assert.ok(content.includes('closeModal'), 'Must handle closeModal');
      assert.ok(content.includes('Escape'), 'Must support Escape key dismissal');
      assert.ok(content.includes('openModal'), 'Must preserve openModal trigger signature');
    });

    it('AdvisorModal.module.css enforces 880px width, deep navy left panel, and warm paper right panel', () => {
      const cssPath = path.resolve(process.cwd(), 'src/components/ui/AdvisorModal.module.css');
      assert.ok(fs.existsSync(cssPath), 'AdvisorModal.module.css must exist');

      const css = fs.readFileSync(cssPath, 'utf-8');
      assert.ok(css.includes('max-width: 880px'), 'Desktop dialog must be max 880px wide');
      assert.ok(css.includes('#0a1628'), 'Left panel must use #0a1628 deep navy');
      assert.ok(css.includes('#f6f4ef'), 'Right panel must use #f6f4ef warm paper');
      assert.ok(css.includes('#f5a50a'), 'Submit button must use #f5a50a amber');
      assert.ok(css.includes('#a63a2e'), 'Error state must use #a63a2e muted red');
      assert.ok(css.includes('#d9d5ca'), 'Bottom border must use #d9d5ca hairline');
      assert.ok(css.includes('prefers-reduced-motion'), 'Must support prefers-reduced-motion');
      assert.ok(css.includes('@media (max-width: 899px)'), 'Must define mobile bottom sheet layout');
    });

    it('layout.tsx configures Newsreader font for the advisory headline', () => {
      const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
      const content = fs.readFileSync(layoutPath, 'utf-8');
      assert.ok(content.includes('Newsreader'), 'Must import Newsreader from next/font/google');
      assert.ok(content.includes('--font-newsreader'), 'Must define --font-newsreader variable');
    });
  });
});
