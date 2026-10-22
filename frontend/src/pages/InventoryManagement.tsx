import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, ShieldCheck, Wrench, MapPin } from 'lucide-react';
import api from '../services/api';
import { SchoolAsset } from '../types';

export const InventoryManagement: React.FC = () => {
  const [assets, setAssets] = useState<SchoolAsset[]>([]);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Asset Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('COMPUTERS_ICT');
  const [quantity, setQuantity] = useState<number>(10);
  const [cost, setCost] = useState<number>(15000);
  const [location, setLocation] = useState<string>('Computer Lab 1');
  const [condition, setCondition] = useState<'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DAMAGED' | 'DISPOSED'>('GOOD');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/inventory/assets');
      setAssets(res.data.assets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/assets', {
        name,
        category,
        quantity,
        purchase_cost: cost,
        location,
        current_condition: condition
      });
      setShowModal(false);
      setName('');
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add asset');
    }
  };

  const handleUpdateCondition = async (assetId: number, newCond: string) => {
    try {
      await api.put(`/inventory/assets/${assetId}/condition`, {
        condition: newCond
      });
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update condition');
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchCat = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                        a.asset_code.toLowerCase().includes(search.toLowerCase()) ||
                        a.location.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Box className="w-5 h-5 text-amber-600" />
            <span>School Assets & Inventory Logistics</span>
          </h1>
          <p className="text-xs text-slate-500">Manage computers, classroom furniture, science lab tools, and physical property</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by code, name, or room location..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
        >
          <option value="ALL">All Categories</option>
          <option value="COMPUTERS_ICT">Computers & ICT Equipment</option>
          <option value="FURNITURE">Furniture & Desks</option>
          <option value="LABORATORY">Science Laboratory Equipment</option>
          <option value="SPORTS">Sports & Athletics Gear</option>
          <option value="PROPERTY">Physical Plant & Generators</option>
        </select>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map(a => (
          <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {a.asset_code}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{a.name}</h3>
                <span className="text-[11px] text-slate-500">{a.category.replace('_', ' ')}</span>
              </div>
              <select
                value={a.current_condition}
                onChange={(e) => handleUpdateCondition(a.id, e.target.value)}
                className={`text-[10px] font-bold px-2 py-1 rounded border ${
                  a.current_condition === 'GOOD' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  a.current_condition === 'FAIR' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                <option value="GOOD">Good Condition</option>
                <option value="FAIR">Fair Condition</option>
                <option value="NEEDS_REPAIR">Needs Repair</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>

            <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
              <p className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span><b>Location:</b> {a.location}</span>
              </p>
              <p><b>Quantity:</b> {a.quantity} units</p>
              <p><b>Asset Value:</b> <span className="font-bold text-slate-900">GH₵ {a.purchase_cost?.toLocaleString()}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add School Asset Item</h3>
            <form onSubmit={handleAddAsset} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Asset Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell Core i5 Computer Set"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="COMPUTERS_ICT">Computers & ICT</option>
                    <option value="FURNITURE">Classroom Furniture</option>
                    <option value="LABORATORY">Science Laboratory</option>
                    <option value="SPORTS">Sports Equipment</option>
                    <option value="PROPERTY">School Property / Plant</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Purchase Cost (GH₵)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg font-bold">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
