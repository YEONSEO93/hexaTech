"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconUser } from "@/components/icon/IconUser";
import { PageHeader } from "@/components/PageHeader";
import { SettingsLayout } from "@/components/layouts/SettingsLayout";

export default function Setting() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsLayout currentPath="profile">
        <>
          <h2 className="text-xl font-semibold mb-6">Profile Photo</h2>
          <div className="flex items-start gap-8 mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                <IconUser className="w-16 h-16 text-gray-400" />
              </div>
            </div>

            <div>
              <Button>Upload Photo</Button>
              <button className="text-blue-500 px-4 py-2 hover:text-blue-600 ml-2">
                remove
              </button>
              <div className="mt-2 text-sm text-gray-600">
                <p>Image requirments:</p>
                <ul className="list-disc ml-4 mt-1">
                  <li>Min. 400 x 400px</li>
                  <li>Max. 2MB</li>
                  <li>Your face or company logo</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-6">User Details</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                id="firstName"
                label="First Name"
                placeholder="Enter your first name"
              />
              <Input
                id="lastName"
                label="Last Name"
                placeholder="Enter your last name"
              />
            </div>

            <Input
              id="company"
              label="Company"
              placeholder="Enter your company name"
            />

            <div className="flex justify-end">
              <Button type="submit">Submit</Button>
            </div>
          </div>
        </>
      </SettingsLayout>
    </>
  );
}
