
import React, { useState } from 'react';

type Destination = 'nearby' | 'specific';
type ResponseMethod = 'Phone Call' | 'WhatsApp' | 'SMS';

type RequestForm = {
  medicineName: string;
  brand: string;
  strength: string;
  dosageForm: string;
  details: string;
  area: string;
  destination: Destination;
  pharmacy: string;
  phone: string;
  responseMethod: ResponseMethod;
  consent: boolean;
  acknowledgement: boolean;
};

const initialForm: RequestForm = {
  medicineName: '',
  brand: '',
  strength: '',
  dosageForm: '',
  details: '',
  area: '',
  destination: 'nearby',
  pharmacy: '',
  phone: '',
  responseMethod: 'Phone Call',
  consent: false,
  acknowledgement: false,
};

const inputClass =
  'w-full border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

const RequestMedicine: React.FC = () => {
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [showNotice, setShowNotice] = useState(false);

  const update = <K extends keyof RequestForm>(
    key: K,
    value: RequestForm[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setShowNotice(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.destination === 'specific' && !form.pharmacy) {
      window.alert('Please select a specific pharmacy.');
      return;
    }

    if (!form.acknowledgement) {
      window.alert('Please acknowledge the medicine availability notice.');
      return;
    }

    if (!form.consent) {
      window.alert('Please agree to be contacted regarding your request.');
      return;
    }

    // Day 4: Frontend prototype only.
    // Do not send or store personal information yet.
    setShowNotice(true);
  };

  const sectionTitle = (
    number: string,
    title: string,
    description: string
  ) => (
    <div className="flex items-start gap-5 mb-6">
      <div className="w-11 h-11 rounded-full bg-[#dcece2] text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h2 className="text-xl font-light text-[#103f35]">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white text-[#103f35]">

      {/* Page Heading */}
      <section className="bg-[#f1f8f3] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="uppercase tracking-widest text-xs font-bold text-emerald-700 mb-3">
            Guest Request Service
          </p>
          <h1 className="text-4xl font-light">Request a Medicine</h1>
          <p className="text-gray-500 mt-4 max-w-lg">
            Can't find the medicine you need? Send a request to
            participating pharmacies and check their responses.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-[1.4fr_1fr] gap-12"
      >
        {/* Left Column */}
        <div className="space-y-12">

          {/* 01 Medicine Information */}
          <section>
            {sectionTitle(
              '01',
              'Medicine Information',
              'Tell participating pharmacies what you are looking for.'
            )}

            <div className="ml-0 sm:ml-16 grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="medicineName" className="block text-sm font-semibold mb-2">
                  Medicine Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="medicineName"
                  required
                  value={form.medicineName}
                  onChange={(e) => update('medicineName', e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-semibold mb-2">
                  Preferred Brand <span className="text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => update('brand', e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="strength" className="block text-sm font-semibold mb-2">
                  Strength <span className="text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  id="strength"
                  value={form.strength}
                  onChange={(e) => update('strength', e.target.value)}
                  placeholder="e.g. 500mg"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="dosage" className="block text-sm font-semibold mb-2">
                  Dosage Form
                </label>
                <select
                  id="dosage"
                  value={form.dosageForm}
                  onChange={(e) => update('dosageForm', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select if known</option>
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Inhaler</option>
                  <option>Cream</option>
                  <option>Injection</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="details" className="block text-sm font-semibold mb-2">
                  Additional Details <span className="text-gray-400 font-normal">Optional</span>
                </label>
                <textarea
                  id="details"
                  rows={4}
                  value={form.details}
                  onChange={(e) => update('details', e.target.value)}
                  placeholder="Any helpful details for the pharmacy"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* 02 Preferred Location */}
          <section>
            {sectionTitle(
              '02',
              'Preferred Location',
              'Choose an area manually. GPS sharing is not required.'
            )}

            <div className="ml-0 sm:ml-16">
              <label htmlFor="area" className="block text-sm font-semibold mb-2">
                Preferred Town / Area <span className="text-red-600">*</span>
              </label>
              <select
                id="area"
                required
                value={form.area}
                onChange={(e) => {
                  setForm((previous) => ({
                    ...previous,
                    area: e.target.value,
                    pharmacy: '',
                  }));
                  setShowNotice(false);
                }}
                className={inputClass}
              >
                <option value="">Select an area</option>
                <option value="Kandana">Kandana</option>
                <option value="Ja-Ela">Ja-Ela</option>
                <option value="Ragama">Ragama</option>
              </select>
            </div>
          </section>

          {/* 03 Request Destination */}
          <section>
            {sectionTitle(
              '03',
              'Request Destination',
              'Requests are sent only to active participating pharmacies.'
            )}

            <div className="ml-0 sm:ml-16 grid sm:grid-cols-2 gap-4">
              <label className={`border rounded-md p-4 cursor-pointer ${
                form.destination === 'nearby'
                  ? 'border-emerald-600 bg-[#f1f8f3]'
                  : 'border-gray-200'
              }`}>
                <div className="flex gap-3 items-start">
                  <input
                    type="radio"
                    name="destination"
                    checked={form.destination === 'nearby'}
                    onChange={() => update('destination', 'nearby')}
                    className="mt-1 accent-emerald-700"
                  />
                  <div>
                    <p className="text-sm font-semibold">Nearby Participating Pharmacies</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Send to eligible pharmacies in the selected area. Recommended.
                    </p>
                  </div>
                </div>
              </label>

              <label className={`border rounded-md p-4 cursor-pointer ${
                form.destination === 'specific'
                  ? 'border-emerald-600 bg-[#f1f8f3]'
                  : 'border-gray-200'
              }`}>
                <div className="flex gap-3 items-start">
                  <input
                    type="radio"
                    name="destination"
                    checked={form.destination === 'specific'}
                    onChange={() => update('destination', 'specific')}
                    className="mt-1 accent-emerald-700"
                  />
                  <div>
                    <p className="text-sm font-semibold">Specific Pharmacy</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Send the request only to one selected pharmacy.
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {form.destination === 'specific' && (
              <div className="ml-0 sm:ml-16 mt-5">
                <label htmlFor="pharmacy" className="block text-sm font-semibold mb-2">
                  Select Pharmacy <span className="text-red-600">*</span>
                </label>
                <select
                  id="pharmacy"
                  required
                  value={form.pharmacy}
                  onChange={(e) => update('pharmacy', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a pharmacy</option>
                  {form.area === 'Kandana' && <option>Gimshani Pharmacy</option>}
                  {form.area === 'Ja-Ela' && <option>Ja-Ela Community Pharmacy</option>}
                  {form.area === 'Ragama' && <option>Ragama Family Pharmacy</option>}
                </select>
              </div>
            )}
          </section>

          {/* 04 Contact Details */}
          <section>
            {sectionTitle(
              '04',
              'How Would You Like to Receive Updates?',
              'Your contact details are used only for this request and are never displayed publicly.'
            )}

            <div className="ml-0 sm:ml-16 space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  pattern="(?:0[0-9]{9}|\+94[0-9]{9})"
                  title="Enter a Sri Lankan number such as 0771234567 or +94771234567"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="e.g. +94 XX XXX XXXX"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(['Phone Call', 'WhatsApp', 'SMS'] as ResponseMethod[]).map((method) => (
                  <label key={method} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="responseMethod"
                      checked={form.responseMethod === method}
                      onChange={() => update('responseMethod', method)}
                      className="accent-emerald-700"
                    />
                    {method}
                  </label>
                ))}
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => update('consent', e.target.checked)}
                  className="mt-1 accent-emerald-700"
                />
                I agree to be contacted by participating pharmacies regarding this request.
              </label>
            </div>
          </section>
        </div>

        {/* Right Column - Request Summary */}
        <div>
          <div className="bg-[#f6f8f7] rounded-xl p-8 lg:sticky lg:top-28">
            <p className="uppercase tracking-widest text-xs font-bold text-emerald-700 text-center">
              Review Request
            </p>

            <h2 className="text-2xl font-light mt-6 mb-7">
              Request Summary
            </h2>

            {[
              ['Medicine', form.medicineName || 'Not entered'],
              ['Preferred Location', form.area || 'Not selected'],
              [
                'Destination',
                form.destination === 'nearby'
                  ? 'Eligible pharmacies near your selected area'
                  : form.pharmacy || 'No pharmacy selected',
              ],
              ['Response Preference', form.responseMethod],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-emerald-200 py-3">
                <p className="uppercase text-xs text-gray-400 font-semibold">
                  {label}
                </p>
                <p className="text-sm text-gray-700 mt-1">{value}</p>
              </div>
            ))}

            <label className="flex gap-3 items-start text-xs text-gray-500 mt-10">
              <input
                type="checkbox"
                checked={form.acknowledgement}
                onChange={(e) => update('acknowledgement', e.target.checked)}
                className="mt-1 accent-emerald-700"
              />
              I understand this request does not guarantee medicine
              availability and pharmacies may not respond immediately.
            </label>

            <button
              type="submit"
              className="w-full bg-[#006747] hover:bg-[#005338] text-white rounded-md px-5 py-3 mt-7 text-sm font-semibold"
            >
              Submit Request
            </button>

            {showNotice && (
              <div role="status" className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800">
                Form validation successful! This is a frontend prototype.
                No request has been submitted or saved.
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default RequestMedicine;
