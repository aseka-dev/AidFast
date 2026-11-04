
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  town: string;
  phone: string;
  hours: string[];
  status: 'Open' | 'Closed';
};

const pharmacies: Pharmacy[] = [
  {
    id: 'gimshani',
    name: 'Gimshani Pharmacy',
    address: 'No.1, Main Street, Kandana.',
    town: 'Kandana',
    phone: '+94 11 223 4567',
    hours: ['Mon-Sat, 8:00 AM-9:00 PM', 'Sun, 8:00 AM-2:00 PM'],
    status: 'Open',
  },
  {
    id: 'ja-ela-community',
    name: 'Ja-Ela Community Pharmacy',
    address: 'No. 45/A, St. Clare Rd, Ja-Ela.',
    town: 'Ja-Ela',
    phone: '+94 11 223 0000',
    hours: ['Mon-Sat, 8:00 AM-9:00 PM'],
    status: 'Open',
  },
  {
    id: 'ragama-family',
    name: 'Ragama Family Pharmacy',
    address: 'No. 8, Main Street, Ragama.',
    town: 'Ragama',
    phone: '+94 11 223 1234',
    hours: ['Mon-Sat, 8:00 AM-9:00 PM', 'Sun, 8:00 AM-5:00 PM'],
    status: 'Closed',
  },
];

const Pharmacies: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = pharmacies.filter((pharmacy) =>
    `${pharmacy.name} ${pharmacy.town} ${pharmacy.address}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  return (
    <div className="bg-white text-[#103f35]">

      {/* Page Heading */}
      <section className="bg-[#f1f8f3] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="uppercase tracking-widest text-xs font-bold text-emerald-700 mb-3">
            Community Directory
          </p>

          <h1 className="text-4xl font-light">
            Find a Pharmacy
          </h1>

          <p className="text-gray-500 mt-4">
            Explore approved pharmacies participating in AidFast.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">

        {/* Pharmacy Search */}
        <div className="max-w-5xl mx-auto flex items-center gap-4 border border-gray-200 rounded-md px-5 py-4">
          <span className="text-emerald-700" aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pharmacy name, town, or area"
            aria-label="Search pharmacies"
            className="w-full outline-none text-gray-700 text-sm"
          />
        </div>

        {/* Nearby Pharmacies */}
        <div className="mt-14">
          <h2 className="text-3xl font-light">
            Nearby Pharmacies
          </h2>

          <p className="text-gray-500 mt-2">
            {filtered.length} locations found
          </p>
        </div>

        {/* Static Map Prototype */}
        <div className="relative mt-10 h-[350px] md:h-[400px] rounded-xl border border-gray-300 overflow-hidden bg-[#e6eeea]">

          {/* Decorative roads */}
          <svg
            viewBox="0 0 1000 450"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            <path d="M-50 20 L1050 400" stroke="white" strokeWidth="22" />
            <path d="M100 500 L580 -50" stroke="white" strokeWidth="22" />
            <path d="M510 500 L560 -50" stroke="white" strokeWidth="18" />
            <path d="M820 500 L600 -50" stroke="white" strokeWidth="22" />
            <path d="M-50 280 L1050 60" stroke="white" strokeWidth="9" />
          </svg>

          {/* Map markers */}
          {filtered.some((p) => p.id === 'gimshani') && (
            <Link
              to="/pharmacies/gimshani"
              title="Gimshani Pharmacy"
              className="absolute top-[58%] left-[38%] -translate-x-1/2 -translate-y-1/2 bg-emerald-700 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              ⌖
            </Link>
          )}

          {filtered.some((p) => p.id === 'ja-ela-community') && (
            <Link
              to="/pharmacies/ja-ela-community"
              title="Ja-Ela Community Pharmacy"
              className="absolute top-[68%] left-[51%] -translate-x-1/2 -translate-y-1/2 bg-emerald-700 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              ⌖
            </Link>
          )}

          {filtered.some((p) => p.id === 'ragama-family') && (
            <Link
              to="/pharmacies/ragama-family"
              title="Ragama Family Pharmacy"
              className="absolute top-[43%] left-[65%] -translate-x-1/2 -translate-y-1/2 bg-emerald-700 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              ⌖
            </Link>
          )}

          <span className="absolute bottom-5 left-5 text-gray-400 text-xl">
            Gampaha
          </span>

          <span className="absolute top-4 right-4 text-xs text-gray-500 bg-white/80 px-3 py-1 rounded">
            Illustrative map — not to scale
          </span>
        </div>

        {/* Pharmacy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {filtered.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="border border-emerald-200 rounded-xl p-5 flex flex-col min-h-[260px]"
            >
              <div className="flex justify-end">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    pharmacy.status === 'Open'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  ● {pharmacy.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold mt-2">
                {pharmacy.name}
              </h3>

              <p className="text-gray-500 text-xs mt-2">
                ⌖ {pharmacy.address}
              </p>

              <p className="uppercase text-xs text-gray-400 font-semibold mt-5">
                Contact
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {pharmacy.phone}
              </p>

              <p className="uppercase text-xs text-gray-400 font-semibold mt-4">
                Opening Hours
              </p>

              {pharmacy.hours.map((hour) => (
                <p key={hour} className="text-sm text-gray-700">
                  {hour}
                </p>
              ))}

              <div className="mt-auto pt-6">
                <Link
                  to={`/pharmacies/${pharmacy.id}`}
                  className="inline-block border border-emerald-600 text-emerald-800 rounded px-4 py-2 text-xs font-semibold hover:bg-emerald-50"
                >
                  View Pharmacy
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No pharmacies found matching your search.
          </p>
        )}

      </section>
    </div>
  );
};

export default Pharmacies;

