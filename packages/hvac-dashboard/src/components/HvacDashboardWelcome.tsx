/**
 * HVAC Dashboard Welcome Component
 * "Pasja rodzi profesjonalizm" - Welcome message with company branding
 * 
 * Following Twenty CRM cursor rules:
 * - Functional components only
 * - Named exports only
 * - Event handlers over useEffect
 * - Max 150 lines per component
 * - PrimeReact/PrimeFlex UI consistency
 */

import React from 'react';

interface HvacDashboardWelcomeProps {
  className?: string;
}

export const HvacDashboardWelcome: React.FC<HvacDashboardWelcomeProps> = ({
  className = 'mb-4',
}) => {
  return (
    <div className={`${className} bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-2 m-0">
        Witaj w Fulmark HVAC CRM! 🏗️
      </h2>
      <p className="text-sm text-gray-600 leading-relaxed m-0">
        "Pasja rodzi profesjonalizm" - Zarządzaj swoimi usługami HVAC z wykorzystaniem
        najnowszych technologii AI i semantycznego wyszukiwania. System integruje
        Twenty CRM z Weaviate, Bielik LLM i CrewAI dla maksymalnej efektywności.
      </p>
    </div>
  );
};
