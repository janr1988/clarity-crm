import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Deal {
  id: string;
  name: string;
  value: number;
  probability: number;
  stage: string;
  expectedCloseDate: Date | null;
  customer: {
    id: string;
    name: string;
  };
  company: {
    id: string;
    name: string;
    industry: string | null;
  };
  owner: {
    id: string;
    name: string;
  };
  _count: {
    notes: number;
  };
}

async function getDeals(userId?: string, isLead?: boolean) {
  let whereClause: any = {};

  // Sales Agents can only see their own deals
  if (userId && !isLead) {
    whereClause.ownerId = userId;
  }

  const deals = await prisma.deal.findMany({
    where: whereClause,
    include: {
      customer: {
        select: { id: true, name: true },
      },
      company: {
        select: { id: true, name: true, industry: true },
      },
      owner: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          notes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return deals;
}

export default async function DealsPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  const isLead = isSalesLead(session);
  const deals = await getDeals(session?.user?.id, isLead);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "PROSPECTING":
        return "bg-blue-100 text-blue-800";
      case "QUALIFICATION":
        return "bg-indigo-100 text-indigo-800";
      case "PROPOSAL":
        return "bg-purple-100 text-purple-800";
      case "NEGOTIATION":
        return "bg-pink-100 text-pink-800";
      case "CLOSED_WON":
        return "bg-green-100 text-green-800";
      case "CLOSED_LOST":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stageCounts = deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedValue = deals.reduce(
    (sum, deal) => sum + deal.value * (deal.probability / 100),
    0
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Deals & Opportunities</h2>
        <Link
          href="/deals/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <span className="mr-2">➕</span>
          New Deal
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Deals</div>
          <div className="text-2xl font-bold text-gray-900">{deals.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Pipeline Value</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Weighted Value</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(weightedValue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Won Deals</div>
          <div className="text-2xl font-bold text-green-600">
            {stageCounts.CLOSED_WON || 0}
          </div>
        </div>
      </div>

      {/* Stage Distribution */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Deal Distribution by Stage</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stageCounts).map(([stage, count]) => (
            <div key={stage} className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStageColor(stage)}`}>
                {stage.replace("_", " ")}
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Deals Table */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-500">Get started by creating your first deal.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-semibold text-gray-900">All Deals</h2>
              <p className="text-sm text-gray-600 mt-1">{deals.length} deals in pipeline</p>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Deal Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Expected Close
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-l-4 border-transparent hover:border-blue-500"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <Link href={`/deals/${deal.id}`} className="block group-hover:translate-x-1 transition-transform">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {deal.name}
                            </div>
                            <div className="text-sm text-gray-500">{deal.customer.name}</div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {deal.company.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{deal.company.name}</div>
                          {deal.company.industry && (
                            <div className="text-xs text-gray-500">{deal.company.industry}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStageColor(
                          deal.stage
                        )}`}
                      >
                        {deal.stage.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">{deal.probability}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {deal.owner.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{deal.owner.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {deal.expectedCloseDate
                          ? new Date(deal.expectedCloseDate).toLocaleDateString("de-DE")
                          : "-"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            <div className="px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">All Deals</h2>
              <p className="text-sm text-gray-600">{deals.length} deals in pipeline</p>
            </div>
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{deal.name}</h3>
                    <p className="text-sm text-gray-600">{deal.customer.name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStageColor(
                      deal.stage
                    )}`}
                  >
                    {deal.stage.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Company:</span>
                    <div className="font-medium text-gray-900 mt-1">
                      {deal.company.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Value:</span>
                    <div className="font-semibold text-gray-900 mt-1">
                      {formatCurrency(deal.value)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Probability:</span>
                    <div className="flex items-center mt-1">
                      <span className="font-medium text-gray-900 mr-2">
                        {deal.probability}%
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Owner:</span>
                    <div className="font-medium text-gray-900 mt-1">
                      {deal.owner.name}
                    </div>
                  </div>
                  {deal.expectedCloseDate && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Expected Close:</span>
                      <div className="font-medium text-gray-900 mt-1">
                        {new Date(deal.expectedCloseDate).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Summary */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600">
          Showing {deals.length} deals
          {!isLead && " (your deals only)"}
          {isLead && " (all team deals)"}
        </div>
      </div>
    </div>
  );
}