'use server'; // Enforces that this file is executed in a server environment (Next.js 13+ server actions).

// Import types and utilities needed throughout the file
import { IAttributes } from 'oneentry/dist/base/utils'; // Type for form attributes (e.g., fields like email/password).
import { fetchApiClient } from '@/lib/oneentry'; // Custom utility to initialize and return the API client instance.
import { cookies } from 'next/headers'; // Used to manage HTTP cookies on the server side.
import { redirect } from 'next/navigation'; // Utility to programmatically redirect user in server actions.

// Interface representing the structure of an error response object.
interface IErroredResponse {
  statusCode: number;
  message: string;
}

// =============================
// Function: getLoginFormData
// Purpose: Fetch dynamic login form fields from the backend CMS/form engine.
// Returns: A promise that resolves to an array of form field attributes.
// =============================
export const getLoginFormData = async (): Promise<IAttributes[]> => {
  try {
    // 1. Get an authenticated API client instance
    const apiClient = await fetchApiClient();

    // 2. Fetch the login form by marker (e.g., CMS identifier for a "sign_in" form in English)
    const response = await apiClient?.Forms.getFormByMarker('sign_in', 'en_US');

    // 3. Return the form attributes, cast to the expected type
    return response?.attributes as unknown as IAttributes[];
  } catch (error: any) {
    // Log error for debugging
    console.error(error);

    // Throw a custom error message to surface the failure in the UI or logs
    throw new Error('Fetching form data failed.');
  }
};

// =============================
// Function: handleLoginSubmit
// Purpose: Authenticates the user with email and password.
// Input: An object containing email and password entered by the user.
// Side Effects: Sets cookies and redirects on success.
// =============================
export const handleLoginSubmit = async (inputValues: {
  email: string;
  password: string;
}) => {
  try {
    // 1. Get an authenticated API client instance
    const apiClient = await fetchApiClient();

    // 2. Format login data using marker-based identification for the CMS/auth system
    const data = {
      authData: [
        { marker: 'email', value: inputValues.email },     // Attach email with correct marker
        { marker: 'password', value: inputValues.password } // Attach password with correct marker
      ],
    };

    // 3. Attempt to authenticate the user using the 'email' provider
    const response = await apiClient?.AuthProvider.auth('email', data);

    // 4. If no userIdentifier is returned, treat as failed login and return the error message
    if (!response?.userIdentifier) {
      const error = response as unknown as IErroredResponse;
      return {
        message: error.message,
      };
    }

    // 5. Store access token in cookies for session management (valid for 1 day)
    (await cookies()).set('access_token', response.accessToken, {
      maxAge: 60 * 60 * 24, // 24 hours in seconds
    });

    // 6. Store refresh token in cookies for token renewal (valid for 7 days)
    (await cookies()).set('refresh_token', response.refreshToken, {
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

  } catch (error: any) {
    // 7. Log unexpected errors for debugging
    console.error(error);

    // 8. If unauthorized, return the specific error message (usually wrong credentials)
    if (error?.statusCode === 401) {
      return { message: error?.message };
    }

    // 9. Otherwise, throw a generic error to prevent leaking sensitive details
    throw new Error('Failed to login. Please try again.');
  }

  // 10. Redirect user to the home page on successful login
  redirect('/');
};
