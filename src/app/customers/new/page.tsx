"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomerCreateForm from "@/components/CustomerCreateForm";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push("/customers");
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Customer Created Successfully!
            </h1>
            <p className="text-gray-600">
              Redirecting to customers list...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
          <p className="text-gray-600 mt-1">
            Create a new customer record to track interactions and deals
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <CustomerCreateForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
