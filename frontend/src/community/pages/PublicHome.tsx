
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroImage from '../../assets/pharmacy-hero.png';

const pharmacies = [
  {
    id: 'gimshani',
    name: 'Gimshani Pharmacy',
    location: 'Kandana, Sri Lanka',
  },
  {
    id: 'ja-ela-community',
    name: 'Ja-Ela Community Pharmacy',
    location: 'Ja-Ela, Sri Lanka',
  },
];

const PublicHome: React.FC = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/find-medicines?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="bg-white text-[#103f35]">

      {/* Hero Section */}
      <section
        className="relative min-h-[490px] bg-cover bg-center flex items-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#003c2d]/95 via-[#003c2d]/75 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 py-20">
          <div className="max-w-xl">
            <p className="text-sm tracking-widest uppercase font-semibold text-emerald-200 mb-6">
              Welcome to AidFast
            </p>

            <h1 className="text-4xl md:text-6xl font-light leading-tight text-white">
              Find the<br />
              Medicines You Need,<br />
              <span className="text-[#a4dc91]">Closer to You.</span>
            </h1>

            <p className="text-gray-200 mt-6 max-w-md">
              Search medicine availability across participating
              pharmacies, find convenient locations, and request
              medicines when they are unavailable.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to="/find-medicines"
                className="bg-white text-[#064b38] px-6 py-3 rounded font-semibold text-sm"
              >
                Find a Medicine
              </Link>

              <Link
                to="/request-medicine"
                className="border border-white/70 text-white px-6 py-3 rounded text-sm"
              >
                Request a Medicine
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 -mt-5">
        <form
          onSubmit={handleSearch}
          className="bg-white shadow-xl rounded-lg p-3 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine name, generic name, or brand..."
            className="flex-1 px-4 py-3 outline-none text-sm text-gray-700 min-w-0"
            aria-label="Search medicines"
          />

          <button
            type="submit"
            className="bg-[#006747] hover:bg-[#005338] text-white px-6 py-3 rounded-md text-sm font-medium"
          >
            Search Medicines
          </button>
        </form>
      </section>

      {/* Making Medicine Access Easier */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="uppercase tracking-widest text-xs font-semibold text-emerald-700">
          Here for Your Community
        </p>

        <h2 className="text-3xl mt-3 font-light">
          Making Medicine Access Easier
        </h2>

        <p className="text-gray-500 mt-3 max-w-lg mx-auto">
          Find medicines, check participating pharmacies, and request
          unavailable medicines through one convenient platform.
        </p>

        <div className="grid md:grid-cols-3 mt-12 border-y border-gray-200 text-left">
          {[
            ['01', 'Find Medicines', 'Search medicines using generic names or brand names.'],
            ['02', 'Check Availability', 'View medicine availability across participating pharmacies.'],
            ['03', 'Request Medicines', 'Send a request when the medicine you need is unavailable.'],
          ].map(([number, title, description]) => (
            <div key={number} className="p-8 md:border-r last:border-r-0 border-gray-200">
              <div className="flex gap-5">
                <span className="text-emerald-700 font-semibold">{number}</span>
                <div>
                  <h3 className="text-lg">{title}</h3>
                  <p className="text-gray-500 text-sm mt-2">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How AidFast Works */}
      <section className="bg-[#f1f8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center gap-4 mb-12">
            <h2 className="text-3xl font-light">How AidFast Works</h2>
            <Link to="/how-it-works" className="text-emerald-800 text-sm font-semibold">
              Learn More ›
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-emerald-200 pt-8">
            {[
              ['01', 'Search', 'Enter the medicine name.'],
              ['02', 'Check', 'View availability across participating pharmacies.'],
              ['03', 'Choose', 'Select a pharmacy or submit a medicine request.'],
              ['04', 'Connect', 'Contact a pharmacy or track responses.'],
            ].map(([number, title, description]) => (
              <div key={number}>
                <span className="text-emerald-700 font-semibold text-sm">{number}</span>
                <h3 className="text-2xl mt-6 mb-2 font-light">{title}</h3>
                <p className="text-gray-500 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Participating Pharmacies */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-widest font-semibold text-emerald-700">
          Local and Trusted
        </p>

        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-5 mt-8">
          <div>
            <h2 className="text-3xl font-light">Our Participating Pharmacies</h2>
            <p className="text-gray-500 mt-2 max-w-lg">
              Starting in Kandana and designed to serve more communities
              as approved pharmacies join.
            </p>
          </div>

          <Link to="/pharmacies" className="text-emerald-800 font-semibold text-sm">
            View All Pharmacies ›
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-10">
          {pharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-2xl font-light">{pharmacy.name}</h3>
              <p className="text-gray-500 text-sm mt-2">⌖ {pharmacy.location}</p>
              <p className="text-gray-500 text-sm mt-3">
                Access approved medicine availability information and
                contact the pharmacy before your visit.
              </p>

              <Link
                to={`/pharmacies/${pharmacy.id}`}
                className="inline-block mt-5 border border-emerald-600 text-emerald-800 rounded px-4 py-2 text-sm font-medium"
              >
                View Pharmacy
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Reminder */}
      <section className="bg-[#e5f4ed] py-10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          <div>
            <p className="uppercase tracking-widest text-xs text-emerald-700 font-semibold">
              Helpful Reminder
            </p>
            <h2 className="text-2xl font-light mt-1">Know Before You Visit</h2>
          </div>

          <p className="text-gray-600 text-sm">
            Medicine availability may change during daily pharmacy
            operations. We recommend contacting the pharmacy to
            confirm availability before travelling.
          </p>
        </div>
      </section>

    </div>
  );
};

export default PublicHome;
