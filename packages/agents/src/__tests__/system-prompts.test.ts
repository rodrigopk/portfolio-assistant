import { describe, it, expect } from 'vitest';
import { CHAT_SYSTEM_PROMPT } from '../prompts/system';

describe('system prompts', () => {
  describe('CHAT_SYSTEM_PROMPT', () => {
    it('should contain key information about Rodrigo', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('Rodrigo Vasconcelos de Barros');
      expect(CHAT_SYSTEM_PROMPT).toContain('Senior Software Engineer');
      expect(CHAT_SYSTEM_PROMPT).toContain('8+ years of experience');
    });

    it('should mention technical expertise', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('Ruby');
      expect(CHAT_SYSTEM_PROMPT).toContain('Rails');
      expect(CHAT_SYSTEM_PROMPT).toContain('JavaScript');
      expect(CHAT_SYSTEM_PROMPT).toContain('Full-stack development');
    });

    it('should include location and languages', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('Toronto, Ontario, Canada');
      expect(CHAT_SYSTEM_PROMPT).toContain('English');
      expect(CHAT_SYSTEM_PROMPT).toContain('Portuguese');
      expect(CHAT_SYSTEM_PROMPT).toContain('German');
    });

    it('should mention current role and availability', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('Lillio');
      expect(CHAT_SYSTEM_PROMPT).toContain('part-time freelance');
    });

    it('should define key roles and guidelines', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('Answer questions about Rodrigo');
      expect(CHAT_SYSTEM_PROMPT).toContain('Suggest relevant portfolio projects');
      expect(CHAT_SYSTEM_PROMPT).toContain('Provide technical insights');
      expect(CHAT_SYSTEM_PROMPT).toContain('professional but conversational');
    });

    it('should be a non-empty string', () => {
      expect(typeof CHAT_SYSTEM_PROMPT).toBe('string');
      expect(CHAT_SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });
  });
});