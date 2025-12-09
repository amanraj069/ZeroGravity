"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import {
  Border,
  getShopItems,
  purchaseBorder,
  equipBorder,
  getBorderStyle,
  getAnimationClass,
} from "@/services/shopService";
import { Check } from "lucide-react";

export default function ShopPage() {
  const { user, isLoggedIn, isLoading: authLoading, refreshPoints } = useAuth();
  const router = useRouter();
  const [borders, setBorders] = useState<Border[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
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
      <div className="mt-2 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
              Shop
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Customize your profile with unique borders
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <span className="text-lg font-semibold text-black dark:text-white">
              {userPoints.toLocaleString()}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              points
            </span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {borders.map((border) => (
              <div
                key={border.id}
                className={`relative border p-6 bg-white dark:bg-gray-800 transition-all hover:shadow-md ${
                  border.equipped
                    ? "border-green-500 dark:border-green-400"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Equipped Badge */}
                {border.equipped && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Check className="w-3 h-3" />
                    <span>Equipped</span>
                  </div>
                )}

                {/* Preview */}
                <div className="flex justify-center mb-5 mt-2">
                  <div
                    className={`w-24 h-24 overflow-hidden ${
                      border.animated ? getAnimationClass(border.id) : ""
                    }`}
                    style={getBorderStyle(border.id)}
                  >
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="text-center mb-5">
                  <h3 className="text-base font-medium text-black dark:text-white">
                    {border.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {border.description}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                  {border.owned ? (
                    <>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Owned
                      </span>
                      {!border.equipped && (
                        <button
                          onClick={() => handleEquip(border.id)}
                          disabled={equipping === border.id}
                          className="px-4 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {equipping === border.id ? "..." : "Equip"}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-black dark:text-white">
                          {border.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          points
                        </span>
                      </div>
                      <button
                        onClick={() => handlePurchase(border.id)}
                        disabled={
                          purchasing === border.id || userPoints < border.price
                        }
                        className={`px-4 py-1.5 text-sm transition-colors disabled:opacity-50 ${
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
