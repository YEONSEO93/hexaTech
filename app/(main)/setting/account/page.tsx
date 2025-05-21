"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { SettingsLayout } from "@/components/layouts/SettingsLayout";

export default function AccountSetting() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsLayout currentPath="account">
        <>
          <h2 className="text-xl font-semibold mb-6">Account Details</h2>
          <div className="space-y-6">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email address"
            />

            <Input
              id="currentPassword"
              type="password"
              label="Current Password"
              placeholder="Enter your current password"
            />

            <Input
              id="newPassword"
              type="password"
              label="New Password"
              placeholder="Enter new password"
              helperText="It must be a combination of minimum 8 letters, numbers, and symbols."
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              placeholder="Confirm new password"
            />

            <div className="flex justify-end">
              <Button type="submit">Update Account</Button>
            </div>
          </div>
        </>
      </SettingsLayout>
    </>
  );
}
