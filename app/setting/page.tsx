"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconUser } from "@/components/icon/IconUser";
import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/PageHeader";

export default function Setting() {
  return (
    <>
      <Sidebar />
      <div className="min-h-screen pl-[260px] p-8 bg-[#F8F9FA] min-h-screen">
        <PageHeader title="Settings" />

        <div className="mt-8 flex gap-12">
          {/* Navigation */}
          <div className="w-56 pl-8">
            <nav className="flex flex-col space-y-1 bg-white rounded-lg shadow-sm">
              <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md font-medium">
                Edit Profile
              </div>
              <Link
                href="/setting/account"
                className="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md"
              >
                Account
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
            <div className="bg-white rounded-lg p-6 shadow-sm">
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
