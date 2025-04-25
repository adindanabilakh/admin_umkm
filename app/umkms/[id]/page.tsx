"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Fetch CSRF Token before API request
const fetchCSRFToken = async () => {
  try {
    await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
  }
};

// Get CSRF Token from cookies
const getCSRFToken = () => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
};

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

export default function UMKMDetailPage() {
  const params = useParams();
  const [umkm, setUMKM] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [income, setIncome] = useState<any[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    imageFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUMKMDetails() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/umkms/${params.id}`, {
          headers: { Accept: "application/json" },
          withCredentials: true,
        });
        setUMKM(res.data);
      } catch (error) {
        console.error("Error fetching UMKM details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch UMKM details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchUMKMDetails();
  }, [params.id, toast]);

  useEffect(() => {
    async function fetchIncome() {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Unauthorized",
          description: "Login required",
          variant: "destructive",
        });
        return;
      }

      try {
        await fetchCSRFToken(); // Pastikan CSRF token di-fetch

        const res = await axios.get(
          `${API_BASE_URL}/api/umkms/${params.id}/income`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              "X-XSRF-TOKEN": decodeURIComponent(getCSRFToken() || ""),
            },
            withCredentials: true,
          }
        );
        setIncome(res.data.income);
      } catch (error) {
        console.error("Error fetching income:", error);
        toast({
          title: "Error",
          description: "Failed to fetch income data",
          variant: "destructive",
        });
      }
    }

    fetchIncome();
  }, [params.id, toast]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      toast({
        title: "Error",
        description: "All fields must be filled",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Unauthorized",
        description: "Login required",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await fetchCSRFToken();

      let imageUrl = newProduct.imageUrl;

      if (newProduct.imageFile) {
        const formData = new FormData();
        formData.append("image", newProduct.imageFile);

        const uploadRes = await axios.post(
          `${API_BASE_URL}/api/upload-image`,
          formData,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
              "X-XSRF-TOKEN": decodeURIComponent(getCSRFToken() || ""),
              "Content-Type": "multipart/form-data",
            },
          }
        );

        imageUrl = uploadRes.data.imageUrl;
      }
      

      const res = await axios.post(
        `${API_BASE_URL}/api/umkms/${params.id}/products`,
        {
          name: newProduct.name,
          description: newProduct.description,
          price: Number.parseFloat(newProduct.price),
          image: imageUrl || null,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
            "X-XSRF-TOKEN": decodeURIComponent(getCSRFToken() || ""),
            Accept: "application/json",
          },
        }
      );

      setUMKM({ ...umkm, products: [...umkm.products, res.data.product] });

      setNewProduct({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        imageFile: null,
      });
      setIsDialogOpen(false);
      toast({
        title: "Product Added",
        description: "New product has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Unauthorized",
        description: "Login required",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await fetchCSRFToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/products/${selectedProduct.id}`,
        {
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: Number.parseFloat(selectedProduct.price.toString()),
          image: selectedProduct.image || null,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
            "X-XSRF-TOKEN": decodeURIComponent(getCSRFToken() || ""),
            Accept: "application/json",
          },
        }
      );

      setUMKM({
        ...umkm,
        products: umkm.products.map((p: Product) =>
          p.id === selectedProduct.id ? res.data.product : p
        ),
      });

      setIsEditDialogOpen(false);
      toast({
        title: "Product Updated",
        description: "Product has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    setIsDeleting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Unauthorized",
        description: "Login required",
        variant: "destructive",
      });
      setIsDeleting(false);
      return;
    }

    try {
      await fetchCSRFToken();
      await axios.delete(`${API_BASE_URL}/api/products/${productId}`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-XSRF-TOKEN": decodeURIComponent(getCSRFToken() || ""),
          Accept: "application/json",
        },
      });

      setUMKM({
        ...umkm,
        products: umkm.products.filter((p: Product) => p.id !== productId),
      });

      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    await handleStatusChange("approve", "Active", "UMKM has been approved.");
  };

  const handleReject = async () => {
    await handleStatusChange("reject", "Rejected", "UMKM has been rejected.");
  };

  const handleStatusChange = async (
    action: string,
    newStatus: string,
    successMessage: string
  ) => {
    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Unauthorized",
        description: "Login required",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await fetchCSRFToken();
      await axios.post(
        `${API_BASE_URL}/api/umkms/${params.id}/${action}`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
            "X-XSRF-TOKEN": decodeURIComponent(getCSRFToken() || ""),
            Accept: "application/json",
          },
        }
      );

      setUMKM({ ...umkm, status: newStatus });
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error) {
      console.error(`Error ${action}ing UMKM:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} UMKM`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!umkm) {
    return <div className="text-center p-6 text-red-500">UMKM Not Found</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <CardTitle className="text-2xl mb-2">{umkm.name}</CardTitle>
                <p className="text-muted-foreground">{umkm.type}</p>
              </div>
              {umkm.status === "Pending" && (
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button
                    variant="default"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p>{umkm.description || "No description available."}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsDocumentDialogOpen(true)}
                      disabled={!umkm.document} // Disable jika tidak ada dokumen
                    >
                      View Document
                    </Button>
                    <Dialog
                      open={isDocumentDialogOpen}
                      onOpenChange={setIsDocumentDialogOpen}
                    >
                      <DialogContent className="sm:max-w-2xl">
                        <DialogTitle>UMKM Document</DialogTitle>
                        <div className="max-h-[500px] overflow-y-auto rounded-lg border">
                          {umkm.document?.endsWith(".pdf") ? (
                            <iframe
                              src={`${API_BASE_URL}/storage/${umkm.document}`}
                              className="w-full h-96 rounded-lg"
                            />
                          ) : (
                            <img
                              src={`${API_BASE_URL}/storage/${umkm.document}`}
                              alt="UMKM Document"
                              className="w-full rounded-lg"
                            />
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => setIsDocumentDialogOpen(false)}
                          >
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <p>Email: {umkm.email || "N/A"}</p>
                    <p>Phone: {umkm.phone_number || "N/A"}</p>
                    <p>Address: {umkm.address || "N/A"}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="products">
                <div className="space-y-4">
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="mb-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                      <DialogTitle>Add Product</DialogTitle>
                      <DialogDescription>
                        Enter new product details.
                      </DialogDescription>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                name: e.target.value,
                              })
                            }
                            placeholder="Enter product name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newProduct.price}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                price: e.target.value,
                              })
                            }
                            placeholder="Enter product price"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={newProduct.description}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                description: e.target.value,
                              })
                            }
                            placeholder="Enter product description"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="imageUrl">Image URL</Label>
                          <Input
                            id="imageUrl"
                            value={newProduct.imageUrl}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                imageUrl: e.target.value,
                              })
                            }
                            placeholder="Enter image URL"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="imageFile">Or Upload Image</Label>
                          <Input
                            id="imageFile"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                imageFile: e.target.files?.[0] || null,
                              })
                            }
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={handleAddProduct}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Adding..." : "Add Product"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {umkm.products?.map((product: Product) => (
                      <Card key={product.id} className="flex flex-col">
                        <CardContent className="p-4 flex-grow">
                          {product.image && (
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-40 object-cover rounded-lg mb-4"
                            />
                          )}
                          <h3 className="text-lg font-semibold mb-2">
                            {product.name}
                          </h3>
                          <p className="text-sm mb-2 flex-grow">
                            {product.description}
                          </p>
                          <p className="font-semibold">
                            Rp {product.price.toLocaleString()}
                          </p>

                          <div className="flex justify-between mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="income">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Income Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : income.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {income
                            .slice() // Buat salinan array agar tidak mengubah state asli
                            .sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime()
                            ) // Urutkan dari terbaru
                            .map((entry, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {new Intl.DateTimeFormat("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                  }).format(new Date(entry.date))}
                                </TableCell>
                                <TableCell>{entry.notes}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="outline">
                                    Rp {entry.amount.toLocaleString()}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-500 text-center">
                        No income records available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
      <Toaster />
      {/* Dialog Edit Produk */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details below.
          </DialogDescription>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={selectedProduct?.name || ""}
                onChange={(e) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                value={selectedProduct?.price || ""}
                onChange={(e) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, price: Number(e.target.value) } : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={selectedProduct?.description || ""}
                onChange={(e) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={selectedProduct?.image || ""}
                onChange={(e) =>
                  setSelectedProduct((prev) =>
                    prev ? { ...prev, image: e.target.value } : null
                  )
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleEditProduct} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
