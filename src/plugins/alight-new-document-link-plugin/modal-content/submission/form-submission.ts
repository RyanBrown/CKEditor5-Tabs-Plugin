// src/plugins/alight-new-document-link-plugin/modal-content/submission/form-submission.ts

export interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class FormSubmissionHandler {
  private isSubmitting = false;
  private submitTimeout: number | null = null;

  constructor(private readonly debounceTime: number = 1000) { }

  private async mockApiCall(formData: FormData): Promise<SubmissionResult> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert FormData to a plain object for response
    const responseData: { [key: string]: any } = {
      id: `doc-${Date.now()}`
    };

    // Extract all form data
    formData.forEach((value, key) => {
      if (value instanceof File) {
        responseData[key] = {
          name: value.name,
          size: value.size,
          type: value.type
        };
      } else if (key === 'searchTags' || key === 'categories') {
        // Parse JSON strings back to arrays
        try {
          responseData[key] = JSON.parse(value as string);
        } catch {
          responseData[key] = [];
        }
      } else {
        responseData[key] = value;
      }
    });

    // Mock success response with all form data
    return {
      success: true,
      data: responseData
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
        } else if (value !== null && value !== undefined) {
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