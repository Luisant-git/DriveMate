import React from 'react';

export interface UberVehicleSelectorProps {
  vehicleType: string;
  carType: string; // transmission: Manual, Automatic, Both
  estimate?: number | null;
  onSelectVehicle: (vehicle: string) => void;
  onSelectTransmission: (transmission: string) => void;
}

interface VehicleOption {
  id: string;
  name: string;
  models: string;
  image: string;
}

const VEHICLES: VehicleOption[] = [
  {
    id: 'Hatchback',
    name: 'Hatchback',
    models: 'Swift, i20',
    image: '/assets/images/cars/clean-hatchback.png?v=5'
  },
  {
    id: 'Sedan',
    name: 'Sedan',
    models: 'Dzire, City',
    image: '/assets/images/cars/clean-sedan.png?v=5'
  },
  {
    id: 'SUV',
    name: 'SUV',
    models: 'Creta, Thar',
    image: '/assets/images/cars/clean-suv.png?v=5'
  },
  {
    id: 'MPV',
    name: 'MPV',
    models: 'Innova, XL6',
    image: '/assets/images/cars/clean-mpv.png?v=5'
  }
];

export const UberVehicleSelector: React.FC<UberVehicleSelectorProps> = ({
  vehicleType,
  carType,
  onSelectVehicle,
  onSelectTransmission
}) => {
  return (
    <div className="space-y-2.5">
      {/* ── Section Header: Car Type & Transmission Switcher ── */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Car Type
        </label>

        {/* Transmission Pill Toggle (Manual / Automatic / Both) */}
        <div className="inline-flex p-0.5 bg-gray-100 rounded-lg border border-gray-200">
          {(['Manual', 'Automatic', 'Both'] as const).map((trans) => {
            const isSelected = carType?.toLowerCase() === trans.toLowerCase();
            return (
              <button
                key={trans}
                type="button"
                onClick={() => onSelectTransmission(trans)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#0B192C] hover:bg-gray-200/50'
                }`}
              >
                {trans}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Single Row Layout: 4 Vehicle Cards in One Row (Not List View) ── */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {VEHICLES.map((v) => {
          const isSelected =
            vehicleType?.toLowerCase() === v.id.toLowerCase() ||
            (v.id === 'MPV' && vehicleType?.toLowerCase() === 'mpv');

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVehicle(v.id)}
              className={`relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl text-center transition-all duration-150 active:scale-[0.97] cursor-pointer min-h-[92px] sm:min-h-[104px] border ${
                isSelected
                  ? 'bg-[#F0F7FF] border-2 border-[#0B192C] shadow-xs ring-1 ring-[#0B192C]/15'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70 shadow-2xs'
              }`}
            >
              {/* Active Selection Check Indicator */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0B192C] text-white flex items-center justify-center shadow-xs">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* 3D Car Image Graphic */}
              <div className="w-full h-10 sm:h-12 flex items-center justify-center my-0.5">
                <img
                  src={v.image}
                  alt={v.name}
                  className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-200 hover:scale-105 drop-shadow-xs"
                  loading="lazy"
                />
              </div>

              {/* Vehicle Title & Model Prototype */}
              <div className="w-full mt-1">
                <h4 className="text-[11px] sm:text-xs font-black text-gray-900 tracking-tight truncate">
                  {v.name}
                </h4>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium truncate mt-0.5">
                  {v.models}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UberVehicleSelector;
