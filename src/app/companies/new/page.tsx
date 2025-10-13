"use client";

import CompanyCreateForm from "@/components/CompanyCreateForm";

export default function NewCompanyPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New Company</h2>
      <CompanyCreateForm />
    </div>
  );
}
