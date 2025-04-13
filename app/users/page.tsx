<<<<<<< HEAD
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
=======
import { Button } from "@/components/ui/button";
>>>>>>> origin/dev

export default function Users() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    ProductService.getProductsMini().then((d) => setProducts(d));
  }, []);
  return (
<<<<<<< HEAD
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
          <DataTable
            value={products}
            sortMode="multiple"
            tableStyle={{ minWidth: "50rem" }}
          >
            <Column
              field="code"
              header="Code"
              sortable
              style={{ width: "25%" }}
            ></Column>
            <Column
              field="name"
              header="Name"
              sortable
              style={{ width: "25%" }}
            ></Column>
            <Column
              field="category"
              header="Category"
              sortable
              style={{ width: "25%" }}
            ></Column>
            <Column
              field="quantity"
              header="Quantity"
              sortable
              style={{ width: "25%" }}
            ></Column>
          </DataTable>
        </div>
      </MainLayout>
    </>
=======
    <div>
      <h1>Users Page</h1>
      <Button type="button" className="w-full">
        Create New User
      </Button>
    </div>
>>>>>>> origin/dev
  );
}
