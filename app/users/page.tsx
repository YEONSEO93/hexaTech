"use client";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProductService } from "./data";
import MainLayout from "@/components/layouts/MainLayout";
import BaseTable from "@/components/ui/base-table";

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  image: string;
  price: number;
  category: string;
  quantity: number;
  inventoryStatus: string;
  rating: number;
}

export default function Users() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    ProductService.getProductsMini().then((d) => setProducts(d));
  }, []);
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
            value={products}
            columns={[
              { field: "code", header: "Code", sortable: true },
              { field: "name", header: "Name", sortable: true },
              { field: "category", header: "Category", sortable: true },
              { field: "quantity", header: "Quantity", sortable: true },
            ]}
          ></BaseTable>
        </div>
      </MainLayout>
    </>
  );
}
