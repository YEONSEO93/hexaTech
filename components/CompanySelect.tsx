import { useState, useEffect, useRef } from "react";

interface Company {
  id: number;
  name: string;
}

interface CompanySelectProps {
  value?: number;
  onChange: (companyId: number) => void;
}

export function CompanySelect({ value, onChange }: CompanySelectProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCompany = companies?.find((c) => c.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowAddNew(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      setCompanies(data.companies);
    } catch (err) {
      setError("Failed to load companies");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.existingCompany) {
          onChange(data.existingCompany.id);
          setShowAddNew(false);
          setNewCompanyName("");
          setError("Company already exists. Selected existing company.");
          return;
        }
        throw new Error(data.error || "Failed to create company");
      }

      setCompanies([...companies, data.company]);
      onChange(data.company.id);
      setShowAddNew(false);
      setNewCompanyName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading companies...</div>;

  return (
    <div className="relative" ref={dropdownRef}>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedCompany ? selectedCompany.name : "Select company"}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="max-h-60 overflow-auto">
            {companies?.map((company) => (
              <div
                key={company.id}
                onClick={() => {
                  onChange(company.id);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  value === company.id ? "bg-blue-50" : ""
                }`}
              >
                {company.name}
              </div>
            ))}
          </div>

          {/* Add New Company Button */}
          <div className="border-t">
            <button
              type="button"
              onClick={() => setShowAddNew(true)}
              className="w-full px-4 py-2 text-left text-blue-600 hover:bg-gray-100"
            >
              + Add New Company
            </button>
          </div>
        </div>
      )}

      {/* Add New Company Modal */}
      {showAddNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add New Company</h3>
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddNew(false);
                  setNewCompanyName("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCompany}
                disabled={creating || !newCompanyName.trim()}
                className={`px-4 py-2 text-white bg-blue-600 rounded-md ${
                  creating || !newCompanyName.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
