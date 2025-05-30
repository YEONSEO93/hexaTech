"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { SettingsLayout } from "@/components/layouts/SettingsLayout";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useState } from "react";
import FeedbackMessage from "@/components/ui/feedback-message";
import { validateEmail, validatePassword, validatePasswordMatch } from "@/lib/utils/input-validation";

export default function AccountSetting() {
  const { userProfile } = useUserProfile();
  const { email } = userProfile || {};
  console.log("User Profile:", userProfile?.email);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");


  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error message
    setSuccessMessage(""); // Reset success message

    // Check if any changes were made
    const emailChanged = newEmail && newEmail !== email;
    const passwordChanged = !!newPassword || !!confirmPassword;

    if (!emailChanged && !passwordChanged) {
      setError("No changes to update.");
      return;
    }

    // Email validation
    if (emailChanged) {
      const emailError = validateEmail(newEmail);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    // Password validation
    if (passwordChanged) {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      const matchError = validatePasswordMatch(newPassword, confirmPassword);
      if (matchError) {
        setError(matchError);
        return;
      }
    }

    const formData = new FormData();
    if (emailChanged) formData.append("email", newEmail);
    if (passwordChanged) {
      formData.append("password", newPassword);
    }

    try {
      const response = await fetch("/api/settings/account", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update account details");
      }

      setSuccessMessage("Account details updated successfully. Please check your email for confirmation.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating account:", error);
      setError("Failed to update account details. Please try again.");
    }
  };
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsLayout currentPath="account">
        <>
          <h2 className="text-xl font-semibold mb-6">Account Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email address"
                onChange={(e) => { clearMessages(); setNewEmail(e.target.value) }}
                value={newEmail || email || ""} // Use existing email if newEmail is empty
              />

              <Input
                id="newPassword"
                type="password"
                label="New Password"
                placeholder="Enter new password"
                helperText="It must be a combination of minimum 8 letters, numbers, and symbols."
                onChange={(e) => { clearMessages(); setNewPassword(e.target.value) }}
                value={newPassword}
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm New Password"
                placeholder="Confirm new password"
                onChange={(e) => { clearMessages(); setConfirmPassword(e.target.value) }}
                value={confirmPassword}
              />

              <div className="flex justify-end">
                <Button type="submit">Update Account</Button>
              </div>
            </div>
          </form>
          {successMessage && (
            <FeedbackMessage type="success" message={successMessage} />
          )}
          {error && <FeedbackMessage type="error" message={error} />}
        </>
      </SettingsLayout>
    </>
  );
};



