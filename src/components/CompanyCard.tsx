import Link from "next/link";

interface Company {
  id: string;
  name: string;
  industry?: string | null;
  size?: string | null;
  revenue?: number | null;
  employees?: number | null;
  city?: string | null;
  country?: string | null;
  status?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  _count?: {
    customers: number;
    activities: number;
    tasks: number;
  };
}

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PROSPECT":
        return "bg-blue-100 text-blue-800";
      case "PARTNER":
        return "bg-purple-100 text-purple-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSizeColor = (size: string | null | undefined) => {
    switch (size) {
      case "STARTUP":
        return "bg-yellow-100 text-yellow-800";
      case "SMALL":
        return "bg-blue-100 text-blue-800";
      case "MEDIUM":
        return "bg-indigo-100 text-indigo-800";
      case "LARGE":
        return "bg-purple-100 text-purple-800";
      case "ENTERPRISE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatRevenue = (revenue: number | null | undefined) => {
    if (!revenue) return null;
    if (revenue >= 1000000000) {
      return `€${(revenue / 1000000000).toFixed(1)}B`;
    } else if (revenue >= 1000000) {
      return `€${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `€${(revenue / 1000).toFixed(1)}K`;
    }
    return `€${revenue.toLocaleString()}`;
  };

  return (
    <Link href={`/companies/${company.id}`} className="block">
      <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {company.name}
          </h3>
          <div className="flex gap-2">
            {company.status && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  company.status
                )}`}
              >
                {company.status}
              </span>
            )}
            {company.size && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSizeColor(
                  company.size
                )}`}
              >
                {company.size}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {company.industry && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-lg">🏭</span> {company.industry}
            </p>
          )}
          
          {(company.city || company.country) && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-lg">📍</span> {[company.city, company.country].filter(Boolean).join(", ")}
            </p>
          )}

          {company.employees && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-lg">👥</span> {company.employees.toLocaleString()} employees
            </p>
          )}

          {company.revenue && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-lg">💰</span> {formatRevenue(company.revenue)} revenue
            </p>
          )}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex gap-4">
            {company._count && (
              <>
                <span>{company._count.customers} customers</span>
                <span>{company._count.activities} activities</span>
                <span>{company._count.tasks} tasks</span>
              </>
            )}
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark"
              onClick={(e) => e.stopPropagation()}
            >
              🌐 Website
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}
