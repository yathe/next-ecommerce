"use client";
import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSignupFormData,
  handleSignupSubmit,
} from "@/actions/auth/signup";
import {
  getLoginFormData,
  handleLoginSubmit,
} from "@/actions/auth/login";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { IAttributes } from "oneentry/dist/base/utils";

interface SignUpFormData {
  email: string;
  password: string;
  name: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<IAttributes[]>([]);
  const [inputValues, setInputValues] = useState<
    Partial<SignUpFormData & LoginFormData>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>("Not valid");

  useEffect(() => {
    const type = searchParams.get("type");
    setIsSignUp(type !== "login");
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchData = isSignUp ? getSignupFormData : getLoginFormData;
    fetchData()
      .then((data) => setFormData(data))
      .catch((err) =>
        setError(`Failed to fetch form data: ${err}`)
      )
      .finally(() => setIsLoading(false));
  }, [isSignUp]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setInputValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isSignUp) {
        if (
          inputValues.email &&
          inputValues.password &&
          inputValues.name
        ) {
          const response = await handleSignupSubmit(
            inputValues as SignUpFormData
          );
          if ("identifier" in response) {
            setInputValues({});
            setIsSignUp(false);
            toast("User has been created", {
              description:
                "Please enter your credentials to log in.",
              duration: 5000,
            });
          } else {
            setError(response.message);
          }
        } else {
          setError("Please fill out all required fields.");
        }
      } else {
        if (inputValues.email && inputValues.password) {
          const response = await handleLoginSubmit(
            inputValues as LoginFormData
          );
          if (response.message) {
            setError(response.message);
          }
        } else {
          setError("Please fill out all required fields.");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setInputValues({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 px-4 py-10">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-8 sm:p-10 space-y-6 border border-white/20 transition-all">
        {/* Back Button */}
        <div
          className="cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={() => router.push("/")}
        >
          <ChevronLeft className="text-white h-6 w-6 sm:h-8 border border-white rounded-full p-1" />
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-md sm:text-lg text-white/80 mt-2">
            {isSignUp
              ? "Join Cillage Foundation and unlock exclusive offers!"
              : "Log in to continue your shopping journey."}
          </p>
        </div>

        {/* Form */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-6 text-white"
          >
            {formData.map((field) => (
              <div key={field.marker}>
                <Label
                  htmlFor={field.marker}
                  className="text-white/80 mb-1 block"
                >
                  {field.localizeInfos.title}
                </Label>
                <Input
                  id={field.marker}
                  type={
                    field.marker === "password" ? "password" : "text"
                  }
                  name={field.marker}
                  className="text-black rounded-xl bg-white/90 border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none p-4 w-full"
                  placeholder={field.localizeInfos.title}
                  value={
                    inputValues[
                      field.marker as keyof (SignUpFormData &
                        LoginFormData)
                    ] || ""
                  }
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
            ))}

            {error && (
              <div className="text-red-400 text-center font-medium">
                {error}
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg p-4 rounded-xl shadow-lg transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}

        {/* Toggle Form */}
        <div className="text-center text-white/80 mt-4">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                onClick={toggleForm}
                className="underline hover:text-white font-semibold"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <button
                onClick={toggleForm}
                className="underline hover:text-white font-semibold"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
