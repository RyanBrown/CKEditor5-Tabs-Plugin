// src/plugins/alight-email-link-plugin/tests/alight-email-link-plugin.spec.ts
import AlightEmailLinkPlugin from '../link';
import AlightEmailLinkPluginEditing from '../linkediting';
import AlightEmailLinkPluginUI from '../linkui';
import AlightEmailAutoLink from '../autolink';
import EmailLinkHandler from '../emaillinkhandler';
import AlightEmailLinkPluginCommand from '../linkcommand';
import AlightEmailUnlinkCommand from '../unlinkcommand';
import * as utils from '../utils';

// Import the augmentation to properly extend EditorConfig
import '../augmentation';

// These tests focus on the plugin features without actually instantiating the real plugins
describe('AlightEmailLinkPlugin', () => {
  describe('plugin definition', () => {
    it('should have proper name', () => {
      expect(AlightEmailLinkPlugin.pluginName).toEqual('AlightEmailLinkPlugin');
    });

    it('should require proper plugins', () => {
      expect(AlightEmailLinkPlugin.requires).toEqual([
        AlightEmailLinkPluginEditing,
        AlightEmailLinkPluginUI,
        AlightEmailAutoLink,
        EmailLinkHandler
      ]);
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailLinkPlugin.isOfficialPlugin).toBe(true);
    });
  });

  describe('AlightEmailLinkPluginEditing', () => {
    it('should have proper name', () => {
      expect(AlightEmailLinkPluginEditing.pluginName).toEqual('AlightEmailLinkPluginEditing');
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailLinkPluginEditing.isOfficialPlugin).toBe(true);
    });

    // it('should have proper required plugins', () => {
    //   expect(AlightEmailLinkPluginEditing.requires).toContain('TwoStepCaretMovement');
    //   expect(AlightEmailLinkPluginEditing.requires).toContain('Input');
    //   expect(AlightEmailLinkPluginEditing.requires).toContain('ClipboardPipeline');
    // });
  });

  describe('AlightEmailAutoLink', () => {
    it('should have proper name', () => {
      expect(AlightEmailAutoLink.pluginName).toEqual('AlightEmailAutoLink');
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailAutoLink.isOfficialPlugin).toBe(true);
    });

    // it('should require appropriate plugins', () => {
    //   expect(AlightEmailAutoLink.requires).toContain('Delete');
    //   expect(AlightEmailAutoLink.requires).toContain(AlightEmailLinkPluginEditing);
    // });
  });

  describe('EmailLinkHandler', () => {
    it('should have proper name', () => {
      expect(EmailLinkHandler.pluginName).toEqual('EmailLinkHandler');
    });

    it('should require AlightEmailLinkPluginEditing plugin', () => {
      expect(EmailLinkHandler.requires).toContain(AlightEmailLinkPluginEditing);
    });
  });

  describe('AlightEmailLinkPluginUI', () => {
    it('should have proper name', () => {
      expect(AlightEmailLinkPluginUI.pluginName).toEqual('AlightEmailLinkPluginUI');
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailLinkPluginUI.isOfficialPlugin).toBe(true);
    });

    it('should require proper plugins', () => {
      expect(AlightEmailLinkPluginUI.requires).toContain(AlightEmailLinkPluginEditing);
      expect(AlightEmailLinkPluginUI.requires[1].toString()).toContain('ContextualBalloon');
    });
  });

  describe('Email Address Detection', () => {
    it('should detect email addresses with isEmail util', () => {
      expect(utils.isEmail('test@example.com')).toBe(true);
      expect(utils.isEmail('invalid')).toBe(false);
      expect(utils.isEmail('test@example')).toBe(false);
      expect(utils.isEmail('mailto:test@example.com')).toBe(true);
    });

    it('should add mailto protocol when needed', () => {
      expect(utils.addLinkProtocolIfApplicable('test@example.com', 'mailto:')).toBe('mailto:test@example.com');
      expect(utils.addLinkProtocolIfApplicable('mailto:test@example.com', 'mailto:')).toBe('mailto:test@example.com');
      expect(utils.addLinkProtocolIfApplicable('https://example.com', 'mailto:')).toBe('https://example.com');
    });

    it('should ensure safe URLs', () => {
      expect(utils.ensureSafeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(utils.ensureSafeUrl('javascript:alert(1)')).toBe('#'); // Should sanitize unsafe protocols
    });

    it('should check if link has protocol', () => {
      expect(utils.linkHasProtocol('https://example.com')).toBe(true);
      expect(utils.linkHasProtocol('mailto:test@example.com')).toBe(true);
      expect(utils.linkHasProtocol('example.com')).toBe(false);
    });
  });

  describe('Link Creation and Formatting', () => {
    it('should create proper link elements with createLinkElement util', () => {
      // Create a mock writer and conversion API
      const mockWriter = {
        createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({
          name: 'a',
          getAttribute: (name: string) => name === 'href' ? 'mailto:test@example.com' : null
        }),
        setCustomProperty: jasmine.createSpy('setCustomProperty')
      };

      const mockConversionApi = {
        writer: mockWriter,
        attrs: {
          orgnameattr: 'Test Org'
        }
      };

      // Call createLinkElement
      const element = utils.createLinkElement('mailto:test@example.com', mockConversionApi as any);

      // Verify the writer methods were called with right parameters
      expect(mockWriter.createAttributeElement).toHaveBeenCalledWith('a', {
        href: 'mailto:test@example.com',
        'data-id': 'email_link',
        orgnameattr: 'Test Org'
      }, { priority: 5 });

      expect(mockWriter.setCustomProperty).toHaveBeenCalledWith('alight-email-link', true, jasmine.any(Object));
    });

    it('should handle organization name extraction in email links', () => {
      // Test extractOrganization util
      expect(utils.extractOrganization('test@example.com (Test Org)')).toBe('Test Org');
      expect(utils.extractOrganization('test@example.com')).toBe(null);
    });

    it('should format links with organization name', () => {
      // Test formatEmailWithOrganization util
      expect(utils.formatEmailWithOrganization('test@example.com', 'Test Org')).toBe('test@example.com (Test Org)');
      expect(utils.formatEmailWithOrganization('test@example.com', null)).toBe('test@example.com');
    });

    it('should extract emails from mailto links', () => {
      expect(utils.extractEmail('mailto:test@example.com')).toBe('test@example.com');
      expect(utils.extractEmail('test@example.com')).toBe('test@example.com');
    });

    it('should ensure mailto: prefix for email links', () => {
      expect(utils.ensureMailtoLink('test@example.com')).toBe('mailto:test@example.com');
      expect(utils.ensureMailtoLink('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(utils.ensureMailtoLink('https://example.com')).toBe('https://example.com');
    });

    it('should detect mailto links', () => {
      expect(utils.isMailtoLink('mailto:test@example.com')).toBe(true);
      expect(utils.isMailtoLink('test@example.com')).toBe(false);
    });

    it('should extract organization name from links', () => {
      expect(utils.extractOrganizationName('test@example.com (Test Org)')).toBe('Test Org');
      expect(utils.extractOrganizationName('test@example.com')).toBe(null);
    });

    it('should add organization to text', () => {
      expect(utils.addOrganizationToText('test@example.com', 'Test Org')).toBe('test@example.com (Test Org)');
      expect(utils.addOrganizationToText('test@example.com', null)).toBe('test@example.com');
    });

    it('should remove organization from text', () => {
      expect(utils.removeOrganizationFromText('test@example.com (Test Org)')).toBe('test@example.com');
      expect(utils.removeOrganizationFromText('test@example.com')).toBe('test@example.com');
    });

    it('should get domain for display', () => {
      expect(utils.getDomainForDisplay('https://www.example.com/path')).toBe('example.com');
      expect(utils.getDomainForDisplay('https://example.com')).toBe('example.com');
    });

    it('should create link display text with organization', () => {
      expect(utils.createLinkDisplayText('https://example.com', 'Test Org')).toBe('example.com (Test Org)');
      expect(utils.createLinkDisplayText('https://example.com')).toBe('example.com');
    });

    // it('should extract and apply organization name', () => {
    //   const mockTextNode = {
    //     is: (type: string) => type === '$text',
    //     hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
    //     data: 'test@example.com (Test Org)',
    //     getAttributes: () => []
    //   };

    //   const mockWriter = {
    //     setAttribute: jasmine.createSpy('setAttribute')
    //   };

    //   const result = utils.extractAndApplyOrganizationName(mockTextNode, mockWriter);

    //   expect(result).toBe('Test Org');
    //   expect(mockWriter.setAttribute).toHaveBeenCalledWith('alightEmailLinkPluginOrgName', 'Test Org', mockTextNode);
    // });

    it('should collect formatting attributes', () => {
      const mockNodes = [{
        getAttributes: () => [['bold', true], ['italic', false], ['alightEmailLinkPluginHref', 'mailto:test@example.com']]
      }];

      const result = utils.collectFormattingAttributes(mockNodes, ['alightEmailLinkPluginHref']);

      expect(result).toEqual({ bold: true, italic: false });
    });
  });

  describe('Decorator handling', () => {
    it('should normalize decorators', () => {
      const decoratorsConfig = {
        openInNewTab: {
          mode: 'manual' as const,
          label: 'Open in a new tab',
          attributes: {
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        }
      };

      const normalized = utils.normalizeDecorators(decoratorsConfig);

      expect(normalized[0].id).toBe('linkOpenInNewTab');
      expect(normalized[0].mode).toBe('manual');
      expect(normalized[0].attributes).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
    });

    it('should get localized decorators', () => {
      const t = (text: string) => text === 'Open in a new tab' ? 'Abrir en nueva pestaña' : text;

      const decorators = [
        { id: 'linkOpenInNewTab', mode: 'manual' as const, label: 'Open in a new tab' },
        { id: 'linkDownloadable', mode: 'manual' as const, label: 'Downloadable' }
      ];

      const localized = utils.getLocalizedDecorators(t, decorators);

      // We can use specific decorator properties like label in tests
      expect((localized[0] as any).label).toBe('Abrir en nueva pestaña');
      expect((localized[1] as any).label).toBe('Downloadable'); // Not translated in this test
    });

    it('should check if element is linkable', () => {
      const mockSchema = {
        checkAttribute: jasmine.createSpy('checkAttribute').and.returnValue(true)
      };

      const mockElement = { name: 'paragraph' };

      expect(utils.isLinkableElement(mockElement as any, mockSchema as any)).toBe(true);
      expect(utils.isLinkableElement(null, mockSchema as any)).toBe(false);

      expect(mockSchema.checkAttribute).toHaveBeenCalledWith('paragraph', 'alightEmailLinkPluginHref');
    });
  });
});
