"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import {
  Border,
  getShopItems,
  purchaseBorder,
  equipBorder,
} from "@/services/shopService";
import { BorderPreview } from "@/components/borders";
import { Check } from "lucide-react";

export default function ShopPage() {
  const { user, isLoggedIn, isLoading: authLoading, refreshPoints } = useAuth();
  const router = useRouter();
  const [borders, setBorders] = useState<Border[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [purchasedBorderId, setPurchasedBorderId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchShopItems();
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchShopItems = async () => {
    setLoading(true);
    try {
      const data = await getShopItems();
      if (data?.success) {
        setBorders(data.data.borders);
        setUserPoints(data.data.userPoints);
      }
    } catch (error) {
      console.error("Error fetching shop items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (borderId: string) => {
    setPurchasing(borderId);
    setMessage(null);

    try {
      const result = await purchaseBorder(borderId);
      if (result?.success) {
        setMessage({ type: "success", text: result.message });
        setUserPoints(result.data?.newPoints || userPoints);
        setBorders((prev) =>
          prev.map((b) => (b.id === borderId ? { ...b, owned: true } : b))
        );
        // Trigger purchase animation
        setPurchasedBorderId(borderId);
        setTimeout(() => {
          setPurchasedBorderId(null);
        }, 2000);
        await refreshPoints();
      } else {
        setMessage({
          type: "error",
          text: result?.message || "Purchase failed",
        });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setPurchasing(null);
    }
  };

  const handleEquip = async (borderId: string) => {
    setEquipping(borderId);
    setMessage(null);

    try {
      const result = await equipBorder(borderId);
      if (result?.success) {
        setMessage({ type: "success", text: "Border equipped!" });
        setBorders((prev) =>
          prev.map((b) => ({
            ...b,
            equipped: b.id === borderId,
          }))
        );
        await refreshPoints();
        // Navigate to profile page after equipping
        router.push("/profile");
      } else {
        setMessage({ type: "error", text: result?.message || "Equip failed" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setEquipping(null);
    }
  };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Shop"
        subtitle="Preparing your shopping experience..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="mt-2 mb-8 md:mb-12 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="space-y-2 md:space-y-0">
          <div className="flex flex-row items-center justify-between gap-4">
            <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
              Shop
            </h1>
            <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm md:text-lg font-semibold text-black dark:text-white">
                {userPoints.toLocaleString()}
              </span>
              <span className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400">
                points
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customize your profile with unique borders
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-2 md:p-3 text-xs md:text-sm ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          /* Borders Grid */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {borders.map((border) => (
              <div
                key={border.id}
                className={`relative border rounded-none p-4 md:p-8 bg-white dark:bg-gray-800 flex flex-col min-h-[260px] md:min-h-[420px] ${
                  purchasedBorderId === border.id
                    ? "animate-purchase-success"
                    : "transition-all hover:shadow-lg hover:scale-[1.02]"
                } ${
                  border.equipped
                    ? "border-green-500 dark:border-green-400 shadow-md shadow-green-500/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Points - Top Right (Mobile) */}
                <div className="absolute top-2 right-2 md:hidden flex items-center gap-0.5">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {border.price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-500">
                    pts
                  </span>
                </div>

                {/* Status Badge */}
                {border.owned && (
                  <div
                    className={`absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-none sm:rounded-md bg-green-50 dark:bg-green-900/20 text-xs font-medium text-green-600 dark:text-green-400 ${
                      border.equipped ? "hidden md:flex" : ""
                    }`}
                  >
                    {border.equipped && (
                      <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    )}
                    <span>{border.equipped ? "Equipped" : "Owned"}</span>
                  </div>
                )}

                {/* Preview */}
                <div className="flex justify-center mb-3 md:mb-6 mt-6 md:mt-8">
                  <BorderPreview
                    border={border}
                    profilePicture={user.profilePicture}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="sm"
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36"
                  />
                </div>

                {/* Info */}
                <div className="text-center flex-grow">
                  <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-1 md:mb-3">
                    {border.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 px-2">
                    {border.description}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Points - Desktop only */}
                  <div className="hidden md:flex items-center gap-1">
                    <span className="text-sm md:text-base font-medium text-black dark:text-white">
                      {border.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      points
                    </span>
                  </div>
                  {/* Action button */}
                  <div className="w-full md:w-auto flex justify-center md:justify-end">
                    {border.owned ? (
                      <>
                        {border.equipped ? (
                          <span className="text-xs md:text-sm text-green-600 dark:text-green-400">
                            <span className="md:inline hidden">✓ </span>Equipped
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquip(border.id)}
                            disabled={equipping === border.id}
                            className="px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 w-full md:w-auto"
                          >
                            {equipping === border.id ? "..." : "Equip"}
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handlePurchase(border.id)}
                        disabled={
                          purchasing === border.id || userPoints < border.price
                        }
                        className={`px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm transition-colors disabled:opacity-50 w-full md:w-auto ${
                          userPoints >= border.price
                            ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {purchasing === border.id
                          ? "..."
                          : userPoints < border.price
                          ? "Insufficient"
                          : "Purchase"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
