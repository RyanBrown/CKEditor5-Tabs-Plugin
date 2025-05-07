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
    // Log raw FormData
    console.log('Raw FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Convert FormData to a plain object for response
      const responseData: { [key: string]: any } = {
        id: `doc-${Date.now()}`,
        url: `https://example.com/documents/doc-${Date.now()}`,
        status: 'success'
      };

      // Extract all form data
      formData.forEach((value, key) => {
        if (value instanceof File) {
          responseData[key] = {
            name: value.name,
            size: value.size,
            type: value.type,
            uploadDate: new Date().toISOString()
          };
        } else if (key === 'searchTags' || key === 'categories') {
          try {
            responseData[key] = JSON.parse(value as string);
          } catch {
            responseData[key] = [];
          }
        } else {
          responseData[key] = value;
        }
      });

      // Log the processed response data
      console.log('Processed response data:', responseData);

      return {
        success: true,
        data: responseData
      };
    } catch (error) {
      console.error('Error in mockApiCall:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process form data'
      };
    }
  }

  private resetSubmitState(): void {
    this.isSubmitting = false;
    if (this.submitTimeout) {
      window.clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
  }

  public async submitForm(formData: any): Promise<SubmissionResult> {
    // Log the incoming form data
    console.log('Submitting form data:', formData);

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

      // Log the final result
      console.log('Form submission result:', result);

      // Set a timeout to prevent rapid resubmission
      this.submitTimeout = window.setTimeout(() => {
        this.resetSubmitState();
      }, this.debounceTime);

      return result;
    } catch (error) {
      console.error('Error in submitForm:', error);
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
