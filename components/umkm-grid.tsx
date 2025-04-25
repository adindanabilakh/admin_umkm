"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coffee,
  Shirt,
  Palette,
  Leaf,
  Sofa,
  Scissors,
  Star,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function UMKMGrid() {
  const [umkmData, setUmkmData] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    async function fetchUMKMs() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/umkms`);
        if (!res.ok) throw new Error("Failed to fetch UMKMs");

        const data = await res.json();
        console.log("Fetched UMKM Data:", data); // ✅ Debugging

        // ✅ Tambahkan rating & phone secara random karena tidak ada di database
        const updatedData = data.map((umkm: any) => ({
          ...umkm,
          icon: getIconForType(umkm.type),
          rating: (Math.random() * 2 + 3).toFixed(1), // Rating antara 3.0 - 5.0
          phone: "+62 812-XXXX-XXXX", // Dummy phone
        }));

        setUmkmData(updatedData);
      } catch (err) {
        console.error("Error fetching UMKMs:", err);
        setError("Failed to load UMKMs. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchUMKMs();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">UMKM Listings</h2>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading UMKMs...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {umkmData.map((umkm, index) => (
            <motion.div
              key={umkm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className={`h-2 ${getColorForType(umkm.type)}`} />
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <umkm.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{umkm.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{umkm.type}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge
                      variant={
                        umkm.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {umkm.status}
                    </Badge>
                    {/* <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span>{umkm.rating}</span>
                    </div> */}
                  </div>
                  <AnimatePresence>
                    {expandedId === umkm.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 mt-2"
                      >
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2" />
                          {umkm.address || "Location not available"}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2" />
                          {umkm.phone_number}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        setExpandedId(expandedId === umkm.id ? null : umkm.id)
                      }
                    >
                      {expandedId === umkm.id ? "Less Info" : "More Info"}
                    </Button>
                    <Link href={`/umkms/${umkm.id}`} passHref>
                      <Button variant="default" className="flex-1">
                        Lihat Detail
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case "Food & Beverage":
      return Coffee;
    case "Textile":
      return Shirt;
    case "Handicraft":
      return Palette;
    case "Agriculture":
      return Leaf;
    case "Furniture":
      return Sofa;
    case "Fashion":
      return Scissors;
    default:
      return Star;
  }
}

function getColorForType(type: string) {
  switch (type) {
    case "Food & Beverage":
      return "bg-red-500";
    case "Textile":
      return "bg-blue-500";
    case "Handicraft":
      return "bg-yellow-500";
    case "Agriculture":
      return "bg-green-500";
    case "Furniture":
      return "bg-purple-500";
    case "Fashion":
      return "bg-pink-500";
    default:
      return "bg-gray-500";
  }
}
