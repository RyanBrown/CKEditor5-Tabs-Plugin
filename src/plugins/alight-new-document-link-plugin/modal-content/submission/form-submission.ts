// src/plugins/alight-new-document-link-plugin/submission/form-submission-handler.ts

export interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class FormSubmissionHandler {
  private isSubmitting = false;
  private submitTimeout: number | null = null;

  constructor(private readonly debounceTime: number = 1000) { }

  private async mockApiCall(formData: any): Promise<SubmissionResult> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock success response
    return {
      success: true,
      data: {
        id: `doc-${Date.now()}`,
        ...formData
      }
    };
  }

  private resetSubmitState(): void {
    this.isSubmitting = false;
    if (this.submitTimeout) {
      window.clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
  }

  public async submitForm(formData: any): Promise<SubmissionResult> {
    // Prevent duplicate submissions
    if (this.isSubmitting) {
      return {
        success: false,
        error: 'Form submission already in progress'
      };
    }

    try {
      this.isSubmitting = true;

      // Create FormData instance for file upload
      const submission = new FormData();

      // Append all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          submission.append(key, value);
        } else if (Array.isArray(value)) {
          submission.append(key, JSON.stringify(value));
        } else {
          submission.append(key, String(value));
        }
      });

      // Submit the form data
      const result = await this.mockApiCall(submission);

      // Set a timeout to prevent rapid resubmission
      this.submitTimeout = window.setTimeout(() => {
        this.resetSubmitState();
      }, this.debounceTime);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      // Reset submission state after debounce time
      setTimeout(() => {
        this.resetSubmitState();
      }, this.debounceTime);
    }
  }

  public cancelSubmission(): void {
    this.resetSubmitState();
  }
}