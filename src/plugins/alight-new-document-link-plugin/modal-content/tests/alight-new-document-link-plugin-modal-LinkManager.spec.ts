// src/plugins/alight-new-document-link-plugin/modal-content/tests/alight-new-document-link-plugin-modal-LinkManager.spec.ts
import { LinkManager } from '../interfaces/alight-new-document-link-plugin-modal-LinkManager';

describe('LinkManager', () => {
  let linkManager: LinkManager;
  let containerElement: HTMLElement;

  beforeEach(() => {
    // Create a mock implementation of LinkManager
    linkManager = {
      getLinkContent: jasmine.createSpy('getLinkContent'),
      renderContent: jasmine.createSpy('renderContent'),
      resetSearch: jasmine.createSpy('resetSearch'),
      getSelectedLink: jasmine.createSpy('getSelectedLink'),
      validateForm: jasmine.createSpy('validateForm'),
      getFormData: jasmine.createSpy('getFormData')
    };

    // Create a fresh container element for each test
    containerElement = document.createElement('div');
    document.body.appendChild(containerElement);
  });

  afterEach(() => {
    // Clean up DOM after each test
    document.body.removeChild(containerElement);
  });

  describe('getLinkContent', () => {
    it('should return HTML string for a given page', () => {
      const mockHtml = '<div>Page 1 content</div>';
      (linkManager.getLinkContent as jasmine.Spy).and.returnValue(mockHtml);

      const result = linkManager.getLinkContent(1);

      expect(result).toBe(mockHtml);
      expect(linkManager.getLinkContent).toHaveBeenCalledWith(1);
    });

    it('should handle different page numbers', () => {
      linkManager.getLinkContent(1);
      linkManager.getLinkContent(2);

      expect(linkManager.getLinkContent).toHaveBeenCalledTimes(2);
      expect(linkManager.getLinkContent).toHaveBeenCalledWith(1);
      expect(linkManager.getLinkContent).toHaveBeenCalledWith(2);
    });
  });

  describe('renderContent', () => {
    it('should render content into the provided container', () => {
      linkManager.renderContent(containerElement);

      expect(linkManager.renderContent).toHaveBeenCalledWith(containerElement);
    });
  });

  describe('resetSearch', () => {
    it('should reset search state', () => {
      linkManager.resetSearch();

      expect(linkManager.resetSearch).toHaveBeenCalled();
    });
  });

  describe('getSelectedLink', () => {
    it('should return null when no link is selected', () => {
      (linkManager.getSelectedLink as jasmine.Spy).and.returnValue(null);

      const result = linkManager.getSelectedLink();

      expect(result).toBeNull();
    });

    it('should return selected link data when a link is selected', () => {
      const mockLink = {
        destination: 'https://example.com',
        title: 'Example Link'
      };
      (linkManager.getSelectedLink as jasmine.Spy).and.returnValue(mockLink);

      const result = linkManager.getSelectedLink();

      expect(result).toEqual(mockLink);
      expect(result?.destination).toBe('https://example.com');
      expect(result?.title).toBe('Example Link');
    });
  });

  describe('validateForm', () => {
    it('should return valid state when form is valid', () => {
      const mockValidation = { isValid: true };
      (linkManager.validateForm as jasmine.Spy).and.returnValue(mockValidation);

      const result = linkManager.validateForm();

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return invalid state with message when form is invalid', () => {
      const mockValidation = {
        isValid: false,
        message: 'Required fields are missing'
      };
      (linkManager.validateForm as jasmine.Spy).and.returnValue(mockValidation);

      const result = linkManager.validateForm();

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Required fields are missing');
    });
  });

  describe('getFormData', () => {
    it('should return form data', () => {
      const mockFormData = {
        title: 'Test Link',
        url: 'https://test.com'
      };
      (linkManager.getFormData as jasmine.Spy).and.returnValue(mockFormData);

      const result = linkManager.getFormData();

      expect(result).toEqual(mockFormData);
    });
  });
});