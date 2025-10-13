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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

      {/* Deals Table */}
      {deals.length === 0 ? (
        <div className="text-gray-600">No deals found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Probability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Close
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/deals/${deal.id}`} className="block">
                      <div className="text-sm font-medium text-gray-900 hover:text-blue-600">{deal.name}</div>
                      <div className="text-sm text-gray-500">{deal.customer.name}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{deal.company.name}</div>
                    {deal.company.industry && (
                      <div className="text-xs text-gray-500">{deal.company.industry}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(deal.value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(
                        deal.stage
                      )}`}
                    >
                      {deal.stage.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{deal.probability}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {deal.owner.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString("de-DE")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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