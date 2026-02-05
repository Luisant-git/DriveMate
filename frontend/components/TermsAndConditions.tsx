import React from 'react';

interface TermsAndConditionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Terms and Conditions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4 text-sm">
          <section>
            <h3 className="font-bold mb-2">1. Acceptance of Terms</h3>
            <p>By using DriveMate services, you agree to these terms and conditions.</p>
          </section>

          <section>
            <h3 className="font-bold mb-2">2. Service Description</h3>
            <p>DriveMate provides ride booking and transportation services through our platform.</p>
          </section>

          <section>
            <h3 className="font-bold mb-2">3. Booking and Payment</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>All bookings are subject to driver availability</li>
              <li>Fare estimates are approximate and may vary</li>
              <li>Payment is due as per the agreed terms</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold mb-2">4. Cancellation Policy</h3>
            <p>Cancellations may be subject to charges depending on timing and circumstances.</p>
          </section>

          <section>
            <h3 className="font-bold mb-2">5. User Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate pickup and drop-off locations</li>
              <li>Be present at the pickup location on time</li>
              <li>Treat drivers and vehicles with respect</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold mb-2">6. Limitation of Liability</h3>
            <p>DriveMate's liability is limited to the extent permitted by law.</p>
          </section>

          <section>
            <h3 className="font-bold mb-2">7. Privacy</h3>
            <p>Your personal information is handled according to our privacy policy.</p>
          </section>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;