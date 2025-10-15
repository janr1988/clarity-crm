"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreateCompanyInput, createCompanySchema } from "@/lib/validation";
import { ZodError } from "zod";

export default function CompanyCreateForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: "",
    industry: undefined,
    size: undefined,
    revenue: undefined,
    employees: undefined,
    website: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    description: "",
    status: "ACTIVE",
    foundedYear: undefined,
    assignedTo: undefined,
  });
  const [errors, setErrors] = useState<ZodError["errors"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : parseInt(value, 10),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const validatedData = createCompanySchema.parse(formData);

      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create company");
      }

      setSuccessMessage("Company created successfully!");
      setFormData({
        name: "",
        industry: undefined,
        size: undefined,
        revenue: undefined,
        employees: undefined,
        website: "",
        address: "",
        city: "",
        country: "",
        phone: "",
        email: "",
        description: "",
        status: "ACTIVE",
        foundedYear: undefined,
        assignedTo: undefined,
      });
      router.push("/companies");
    } catch (error: any) {
      if (error instanceof ZodError) {
        setErrors(error.errors);
      } else {
        setErrors([{ path: [], code: "custom", message: error.message || "An unexpected error occurred." } as any]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return <div className="text-red-600">You must be logged in to create a company.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      {/* Company Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          required
        />
        {errors?.find((e) => e.path && e.path[0] === "name") && (
          <p className="mt-2 text-sm text-red-600">
            {errors.find((e) => e.path && e.path[0] === "name")?.message}
          </p>
        )}
      </div>

      {/* Industry and Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
            Industry
          </label>
          <select
            name="industry"
            id="industry"
            value={formData.industry || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Select Industry</option>
            <option value="TECHNOLOGY">Technology</option>
            <option value="FINANCE">Finance</option>
            <option value="HEALTHCARE">Healthcare</option>
            <option value="MANUFACTURING">Manufacturing</option>
            <option value="RETAIL">Retail</option>
            <option value="EDUCATION">Education</option>
            <option value="ENERGY">Energy</option>
            <option value="AUTOMOTIVE">Automotive</option>
            <option value="AEROSPACE">Aerospace</option>
            <option value="CONSTRUCTION">Construction</option>
            <option value="FOOD_BEVERAGE">Food & Beverage</option>
            <option value="PHARMACEUTICALS">Pharmaceuticals</option>
            <option value="TELECOMMUNICATIONS">Telecommunications</option>
            <option value="MEDIA">Media</option>
            <option value="TRANSPORTATION">Transportation</option>
          </select>
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700">
            Company Size
          </label>
          <select
            name="size"
            id="size"
            value={formData.size || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Select Size</option>
            <option value="STARTUP">Startup</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Revenue and Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="revenue" className="block text-sm font-medium text-gray-700">
            Annual Revenue (EUR)
          </label>
          <input
            type="number"
            name="revenue"
            id="revenue"
            value={formData.revenue ?? ""}
            onChange={handleNumberChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            step="1000"
          />
        </div>

        <div>
          <label htmlFor="employees" className="block text-sm font-medium text-gray-700">
            Number of Employees
          </label>
          <input
            type="number"
            name="employees"
            id="employees"
            value={formData.employees ?? ""}
            onChange={handleNumberChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            min="1"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website
        </label>
        <input
          type="url"
          name="website"
          id="website"
          value={formData.website}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          placeholder="https://example.com"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* City and Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            name="city"
            id="city"
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            name="country"
            id="country"
            value={formData.country}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      {/* Status and Founded Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="PROSPECT">Prospect</option>
            <option value="PARTNER">Partner</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div>
          <label htmlFor="foundedYear" className="block text-sm font-medium text-gray-700">
            Founded Year
          </label>
          <input
            type="number"
            name="foundedYear"
            id="foundedYear"
            value={formData.foundedYear ?? ""}
            onChange={handleNumberChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            min="1800"
            max={new Date().getFullYear()}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          placeholder="Brief description of the company..."
        ></textarea>
      </div>

      {successMessage && (
        <div className="mt-4 text-sm text-green-600">{successMessage}</div>
      )}

      {errors && !successMessage && (
        <div className="mt-4 text-sm text-red-600">
          <p>Please correct the following errors:</p>
          <ul className="list-disc pl-5">
            {errors.map((e, index) => (
              <li key={index}>{e.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Company"}
        </button>
      </div>
    </form>
  );
}
