"use client";

export interface WaitlistUser {
  _id?: string;
  id: string;
  name: string;
  email: string;
  createdAt: string;
  joinedAt: string;
  isNotified: boolean;
}

interface WaitlistUsersSectionProps {
  waitlistUsers: WaitlistUser[];
  waitlistLoading: boolean;
  onRefresh: () => void;
}

export default function WaitlistUsersSection({
  waitlistUsers,
  waitlistLoading,
  onRefresh,
}: WaitlistUsersSectionProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-light text-black">
          Waitlist Users ({waitlistUsers.length})
        </h3>
        <button
          onClick={onRefresh}
          className="text-black hover:text-gray-600 text-sm border border-gray-300 px-3 py-1 hover:border-black transition-colors"
          disabled={waitlistLoading}
        >
          {waitlistLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {waitlistUsers.length > 0 ? (
        <div className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waitlistUsers.map((user, index) => (
                  <tr key={user._id || index} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500 sm:hidden truncate">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                      <div className="sm:whitespace-nowrap">
                        <span className="hidden sm:inline">
                          {new Date(user.joinedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="sm:hidden">
                          {new Date(user.joinedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 sm:hidden">
                        {new Date(user.joinedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold  ${
                          user.isNotified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.isNotified ? "✓" : "○"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-lg">No waitlist users yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Users who join the waitlist will appear here
          </p>
        </div>
      )}
    </div>
  );
}
