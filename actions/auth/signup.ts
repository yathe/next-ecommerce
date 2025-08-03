'use server'; // Ensures that this module runs on the server only (Next.js server actions).

// Import required types and utilities
import { IAttributes } from "oneentry/dist/base/utils"; // Interface for form attributes (e.g., email, password fields).
import { fetchApiClient } from "@/lib/oneentry"; // Custom utility to return an instance of the authenticated API client.
import { ISignUpData } from "oneentry/dist/auth-provider/authProvidersInterfaces"; // Interface for expected sign-up data.

// ===============================================
// Function: getSignupFormData
// Purpose: Fetches the signup form fields dynamically using a CMS/remote form system.
// Returns: A promise resolving to an array of form field attributes.
// ===============================================
export const getSignupFormData = async (): Promise<IAttributes[]> => {
  try {
    // 1. Initialize the API client to communicate with backend/form service
    const apiClient = await fetchApiClient();

    // 2. Fetch form data using the 'sign_up' marker and language locale
    const response = await apiClient?.Forms.getFormByMarker("sign_up", "en_US");

    // 3. Return the array of form attributes for rendering input fields dynamically
    return response?.attributes as unknown as IAttributes[];
  } catch (error: any) {
    // 4. Log any unexpected issues for debugging
    console.error(error);

    // 5. Throw a new error to be caught by calling components/pages
    throw new Error("Fetching form data failed.");
  }
};

// ===============================================
// Function: handleSignupSubmit
// Purpose: Sends sign-up data to the backend to create a new user account.
// Input: An object containing email, password, and name entered by the user.
// Returns: The API's response if successful, or an error message.
// ===============================================
export const handleSignupSubmit = async (inputValues: {
  email: string;
  password: string;
  name: string;
}) => {
  try {
    // 1. Get the API client instance to interact with authentication services
    const apiClient = await fetchApiClient();

    // 2. Construct the sign-up payload according to the expected schema
    const data: ISignUpData = {
      formIdentifier: "sign_up", // Identifier that links this submission to the form template
      authData: [
        { marker: "email", value: inputValues.email },     // Credential marker: email
        { marker: "password", value: inputValues.password } // Credential marker: password
      ],
      formData: [
        { marker: "name", type: "string", value: inputValues.name } // Extra form field, typically used for display or profile
      ],
      notificationData: {
        email: inputValues.email,      // Will be used to send sign-up confirmation or welcome emails
        phonePush: ["+1234567890"],    // Placeholder push number (if push notifications enabled)
        phoneSMS: "+1234567890",       // Placeholder SMS number (used for text-based notifications)
      },
    };

    // 3. Make the API call to perform user registration via the "email" provider
    const value = await apiClient?.AuthProvider.signUp("email", data);

    // 4. Return response (e.g., userId, confirmation status, etc.)
    return value;
  } catch (error: any) {
    // 5. Log error for monitoring and debugging purposes
    console.error(error);

    // 6. If the error is due to bad input (like email already taken), return a specific message
    if (error?.statusCode === 400) {
      return { message: error?.message };
    }

    // 7. For other types of failures, throw a general-purpose error
    throw new Error("Account Creation Failed. Please try again later.");
  }
};
