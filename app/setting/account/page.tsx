"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/PageHeader";

export default function AccountSetting() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-[260px] p-8 bg-[#F8F9FA] min-h-screen">
        <PageHeader title="Settings" />

        <div className="flex gap-8">
          {/* Navigation */}
          <div className="w-48">
            <nav className="flex flex-col space-y-1 bg-white rounded-lg shadow-sm">
              <Link
                href="/setting"
                className="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md"
              >
                Edit Profile
              </Link>
              <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md font-medium">
                Account
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
            <div className="bg-white rounded-lg p-6 shadow-sm">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
