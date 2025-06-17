"use client";

import { useState } from "react";
import Image from "next/image";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    className: "",
    mobile: "",
    village: "",
    district: "Firozabad"
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!form.className.trim()) {
      errors.className = "Class is required";
    }
    
    if (!form.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(form.mobile)) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }
    
    if (!form.village.trim()) {
      errors.village = "Village is required";
    }
    
    if (!image) {
      errors.image = "Profile photo is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      // Clear image error when file is selected
      if (formErrors.image) {
        setFormErrors(prev => ({ ...prev, image: "" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(image!);
        reader.onload = () => resolve(reader.result?.toString().split(",")[1] || "");
        reader.onerror = error => reject(error);
      });

      // API request
      const response = await fetch("/api/upload-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          fileBase64: base64
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Unexpected response: ${text}`);
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      // Reset form on success
      setForm({
        name: "",
        email: "",
        className: "",
        mobile: "",
        village: "",
        district: "Firozabad"
      });
      setImage(null);
      setPreview("");
      alert("Registration successful!");

    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form 
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Student Registration
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded ${
                formErrors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <input
                type="text"
                name="className"
                value={form.className}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.className ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.className && (
                <p className="text-red-500 text-xs mt-1">{formErrors.className}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile *
              </label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.mobile ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.mobile && (
                <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Village *
              </label>
              <input
                type="text"
                name="village"
                value={form.village}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  formErrors.village ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.village && (
                <p className="text-red-500 text-xs mt-1">{formErrors.village}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                name="district"
                value={form.district}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="Firozabad">Firozabad</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Photo *
            </label>
            <label className="block w-full cursor-pointer text-center bg-blue-50 text-blue-700 py-2 rounded border border-blue-200 hover:bg-blue-100 transition">
              {image ? "Change Image" : "Select Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            {formErrors.image && (
              <p className="text-red-500 text-xs mt-1">{formErrors.image}</p>
            )}
          </div>

          {preview && (
            <div className="flex justify-center">
              <div className="w-32 h-32 relative rounded-full overflow-hidden border-2 border-blue-500">
                <Image
                  src={preview}
                  alt="Profile preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded text-white font-medium ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } transition`}
          >
            {loading ? 'Processing...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
}