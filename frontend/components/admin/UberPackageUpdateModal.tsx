import React, { useState, useEffect, useMemo, useRef } from 'react';

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  price: number;
  duration?: number;
  maxDuties?: number;
  maxLeads?: number;
  category?: string;
  type?: string;
  description?: string;
  advancePayment?: number;
}

interface UberPackageUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityIdentifier?: string;
  currentPackageName?: string;
  subscriptionPlans: SubscriptionPlanItem[];
  onSubmit: (data: { planId: string; paidAmount: number; paymentMethod: string }) => Promise<void>;
  isLoading?: boolean;
}

export const UberPackageUpdateModal: React.FC<UberPackageUpdateModalProps> = ({
  isOpen,
  onClose,
  entityName,
  entityIdentifier,
  currentPackageName,
  subscriptionPlans,
  onSubmit,
  isLoading = false
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [formError, setFormError] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Deduplicate plans by name so the list is clean and concise
  const uniquePlans = useMemo(() => {
    const seen = new Set<string>();
    const result: SubscriptionPlanItem[] = [];

    for (const plan of subscriptionPlans) {
      const cleanName = (plan.name || '').trim();
      if (!cleanName || seen.has(cleanName)) continue;
      seen.add(cleanName);
      result.push(plan);
    }

    // Sort by type then price
    return result.sort((a, b) => {
      const typeA = (a.type || '').toUpperCase();
      const typeB = (b.type || '').toUpperCase();
      if (typeA !== typeB) return typeA.localeCompare(typeB);
      return (a.price || 0) - (b.price || 0);
    });
  }, [subscriptionPlans]);

  // Find currently selected plan object
  const selectedPlan = useMemo(() => {
    return uniquePlans.find(p => p.id === selectedPlanId) || null;
  }, [uniquePlans, selectedPlanId]);

  // Filter plans based on search input
  const filteredUniquePlans = useMemo(() => {
    if (!searchQuery.trim()) return uniquePlans;
    const q = searchQuery.toLowerCase().trim();
    return uniquePlans.filter(p => {
      const name = (p.name || '').toLowerCase();
      const type = (p.type || '').toLowerCase();
      const price = `${p.price}`;
      const duties = `${p.maxDuties || p.maxLeads || ''}`;
      return name.includes(q) || type.includes(q) || price.includes(q) || duties.includes(q);
    });
  }, [uniquePlans, searchQuery]);

  // Group filtered plans into Local, Outstation, and Other
  const { localPlans, outstationPlans, otherPlans } = useMemo(() => {
    const local: SubscriptionPlanItem[] = [];
    const outstation: SubscriptionPlanItem[] = [];
    const other: SubscriptionPlanItem[] = [];

    for (const p of filteredUniquePlans) {
      const name = (p.name || '').toLowerCase();
      const type = (p.type || '').toLowerCase();
      if (type.includes('outstation') || name.includes('outstation')) {
        outstation.push(p);
      } else if (type.includes('local') || name.includes('local')) {
        local.push(p);
      } else {
        other.push(p);
      }
    }
    return { localPlans: local, outstationPlans: outstation, otherPlans: other };
  }, [filteredUniquePlans]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId('');
      setPaidAmount('');
      setPaymentMethod('CASH');
      setFormError('');
      setIsDropdownOpen(false);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Focus search input whenever dropdown is opened
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isDropdownOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When user chooses a package from dropdown
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    setFormError('');
    const plan = uniquePlans.find(p => p.id === planId);
    if (plan) {
      setPaidAmount(plan.price.toString());
    } else {
      setPaidAmount('');
    }
  };

  if (!isOpen) return null;

  const paidNum = parseFloat(paidAmount) || 0;
  const planPrice = selectedPlan?.price || 0;
  const remainingBalance = Math.max(0, planPrice - paidNum);
  const isOverpaid = selectedPlan && paidNum > planPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPlanId) {
      setFormError('Please select a package.');
      return;
    }

    if (paidNum <= 0) {
      setFormError('Paid amount must be greater than ₹0.');
      return;
    }

    if (isOverpaid) {
      setFormError(`Amount cannot exceed ₹${planPrice.toLocaleString('en-IN')}`);
      return;
    }

    try {
      await onSubmit({
        planId: selectedPlanId,
        paidAmount: paidNum,
        paymentMethod
      });
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err?.message || 'Failed to update package');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-gray-900">Update Package</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {entityName} {entityIdentifier && <span className="font-mono text-gray-400">({entityIdentifier})</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Package */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Current Package:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 truncate max-w-[200px]">
              {currentPackageName || 'No Active Package'}
            </span>
          </div>

          {/* Searchable Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Select Package <span className="text-red-500">*</span>
            </label>

            {/* Dropdown Trigger Box */}
            <div
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer transition select-none ${
                isDropdownOpen ? 'border-black ring-2 ring-black/10 bg-white' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {selectedPlan ? (
                  <>
                    <span className="font-bold text-gray-900 truncate">{selectedPlan.name}</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex-shrink-0">
                      ₹{selectedPlan.price.toLocaleString('en-IN')}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 font-normal">-- Choose Package --</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {selectedPlan && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanChange('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-md transition"
                    title="Clear selection"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-black' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Dropdown Menu Popover */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search Input inside Dropdown */}
                <div className="p-2.5 border-b border-gray-100 bg-gray-50/90">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type to search (e.g. 21, Local, 1999)..."
                      className="w-full pl-8 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black transition"
                    />
                    <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items List grouped by Type */}
                <div className="max-h-60 overflow-y-auto p-1.5 text-xs divide-y divide-gray-50">
                  {filteredUniquePlans.length === 0 ? (
                    <div className="py-6 text-center text-gray-400">
                      No packages found matching "<span className="font-semibold text-gray-600">{searchQuery}</span>"
                    </div>
                  ) : (
                    <>
                      {localPlans.length > 0 && (
                        <div className="pb-1">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 rounded-md my-0.5">
                            📍 Local Packages ({localPlans.length})
                          </div>
                          {localPlans.map(plan => {
                            const isSelected = plan.id === selectedPlanId;
                            return (
                              <div
                                key={plan.id}
                                onClick={() => {
                                  handlePlanChange(plan.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`px-3 py-2 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 my-0.5 ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                                    : 'hover:bg-gray-100 text-gray-800'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-xs">{plan.name}</div>
                                  <div className="text-[10px] text-gray-400 font-normal">
                                    {plan.maxDuties ? `${plan.maxDuties} Duties · ` : ''}
                                    {plan.duration ? `${plan.duration} Days` : ''}
                                  </div>
                                </div>
                                <span className={`text-xs font-black flex-shrink-0 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                  ₹{plan.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {outstationPlans.length > 0 && (
                        <div className="py-1">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 rounded-md my-0.5">
                            🚗 Outstation Packages ({outstationPlans.length})
                          </div>
                          {outstationPlans.map(plan => {
                            const isSelected = plan.id === selectedPlanId;
                            return (
                              <div
                                key={plan.id}
                                onClick={() => {
                                  handlePlanChange(plan.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`px-3 py-2 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 my-0.5 ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                                    : 'hover:bg-gray-100 text-gray-800'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-xs">{plan.name}</div>
                                  <div className="text-[10px] text-gray-400 font-normal">
                                    {plan.maxDuties ? `${plan.maxDuties} Duties · ` : ''}
                                    {plan.duration ? `${plan.duration} Days` : ''}
                                  </div>
                                </div>
                                <span className={`text-xs font-black flex-shrink-0 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                  ₹{plan.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {otherPlans.length > 0 && (
                        <div className="pt-1">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 rounded-md my-0.5">
                            📦 Other Packages ({otherPlans.length})
                          </div>
                          {otherPlans.map(plan => {
                            const isSelected = plan.id === selectedPlanId;
                            return (
                              <div
                                key={plan.id}
                                onClick={() => {
                                  handlePlanChange(plan.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`px-3 py-2 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 my-0.5 ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                                    : 'hover:bg-gray-100 text-gray-800'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-xs">{plan.name}</div>
                                  <div className="text-[10px] text-gray-400 font-normal">
                                    {plan.maxDuties ? `${plan.maxDuties} Duties · ` : ''}
                                    {plan.duration ? `${plan.duration} Days` : ''}
                                  </div>
                                </div>
                                <span className={`text-xs font-black flex-shrink-0 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                  ₹{plan.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Package Details Banner */}
          {selectedPlan && (
            <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl space-y-1.5 shadow-2xs animate-in fade-in duration-150">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900 truncate max-w-[220px]">{selectedPlan.name}</span>
                <span className="text-sm font-black text-blue-700">₹{selectedPlan.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-600">
                {(selectedPlan.maxDuties || selectedPlan.maxLeads) ? (
                  <span>Duties: <strong className="text-gray-900 font-semibold">{selectedPlan.maxDuties || selectedPlan.maxLeads}</strong></span>
                ) : null}
                {selectedPlan.duration ? (
                  <span>Validity: <strong className="text-gray-900 font-semibold">{selectedPlan.duration} Days</strong></span>
                ) : null}
              </div>
            </div>
          )}

          {/* Paid Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-800">
                Paid Amount (₹) <span className="text-red-500">*</span>
              </label>
              {selectedPlan && (
                <span className="text-[11px] text-gray-400 font-medium">
                  Plan price: ₹{selectedPlan.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="1"
                max={selectedPlan?.price}
                step="any"
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  setFormError('');
                }}
                placeholder="e.g. 500"
                className={`w-full pl-8 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:bg-white transition ${
                  isOverpaid ? 'border-red-400 text-red-600 focus:ring-red-400' : 'border-gray-200 text-gray-900 focus:ring-black'
                }`}
                required
              />
            </div>

            {/* Quick Helper Buttons */}
            {selectedPlan && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaidAmount(selectedPlan.price.toString())}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                  >
                    Full (₹{selectedPlan.price.toLocaleString('en-IN')})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount('')}
                    className="px-2 py-1 text-gray-400 hover:text-gray-700 text-xs transition"
                  >
                    Clear
                  </button>
                </div>

                {/* Remaining Balance Note */}
                <span className={`text-xs font-semibold ${remainingBalance === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {remainingBalance === 0 ? '✓ Paid in full' : `Balance due: ₹${remainingBalance.toLocaleString('en-IN')}`}
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {formError && (
            <div className="p-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedPlanId || !paidAmount || isOverpaid || paidNum <= 0}
              className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm Update</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UberPackageUpdateModal;
