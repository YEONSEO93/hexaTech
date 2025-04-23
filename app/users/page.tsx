"use client";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import MainLayout from "@/components/layouts/MainLayout";
import BaseTable from "@/components/ui/base-table/base-table";

export default function Users() {
  const router = useRouter();

  return (
    <>
      <Sidebar />
      <MainLayout>
        <div className="flex items-center justify-between">
          <PageHeader title="User Management" />
          <div className="px-8 py-4">
            <Button
              size="sm"
              className="px-6 py-2.5"
              onClick={() => router.push("/users/create")}
            >
              CREATE USER
            </Button>
          </div>
        </div>
        <div className="p-8">
          <BaseTable
            value={[
              {
                id: 1,
                name: "Admin User",
                role: "Admin",
                createdAt: "2024-12-09",
                updatedAt: "2024-12-10",
                company: "BEDA",
                verified: true,
                number: 200,
              },
              {
                id: 2,
                name: "Collab User",
                role: "Collaborator",
                createdAt: "2024-10-09",
                updatedAt: "2024-10-10",
                company: "Suncorp",
                verified: false,
                number: 400,
              },
            ]}
            columns={[
              {
                field: "name",
                header: "Name",
                filter: true,
              },
              {
                field: "role",
                header: "Role",
                filter: true,
                filterType: "dropdown",
              },
              {
                field: "company",
                header: "Company",
                filter: true,
                filterType: "dropdown",
              },
              {
                field: "createdAt",
                header: "Created At",
                filter: true,
                filterType: "date",
              },
              {
                field: "updatedAt",
                header: "Updated At",
                filter: true,
                filterType: "date",
              },
              {
                field: "verified",
                header: "Verified",
                filter: true,
                filterType: "boolean",
              },
              {
                field: "number",
                header: "Test Number Filter",
                filter: true,
                filterType: "number",
              },
            ]}
          ></BaseTable>
        </div>
      </MainLayout>
    </>
  );
}
