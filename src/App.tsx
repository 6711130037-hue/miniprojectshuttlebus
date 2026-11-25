/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BusProvider, useBus } from './context/BusContext';
import { Header } from './components/common/Header';
import { LoginScreen } from './components/auth/LoginScreen';
import { PassengerPortal } from './components/live/PassengerPortal';
import { DriverPortal } from './components/live/DriverPortal';
import { AdminPortal } from './components/live/AdminPortal';
import { FigmaWorkspace } from './components/figma/FigmaWorkspace';
import { ErDiagramView } from './components/er/ErDiagramView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainLayout: React.FC = () => {
  const { appMode, liveRole, isAuthenticated } = useBus();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-amber-400 selection:text-slate-900 font-sans">
      <Header />

      {/* Main Container Area */}
      <main className="flex-1">
        {!isAuthenticated ? (
          <>
            {appMode === 'figma' && <FigmaWorkspace />}
            {appMode === 'er' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <ErDiagramView />
              </div>
            )}
            {appMode === 'live' && <LoginScreen />}
          </>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* Passenger only sees PassengerPortal */}
            {liveRole === 'passenger' && <PassengerPortal />}

            {/* Driver only sees DriverPortal */}
            {liveRole === 'driver' && <DriverPortal />}

            {/* Admin only sees AdminPortal (or ER Schema view if selected by Admin) */}
            {liveRole === 'admin' && (
              <>
                {appMode === 'er' ? <ErDiagramView /> : <AdminPortal />}
              </>
            )}
          </div>
        )}
      </main>

      {/* Global Bottom Credit Bar */}
      {appMode !== 'figma' && (
        <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-4 px-4 sm:px-6 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <span className="font-semibold text-slate-700">ระบบจองรถบัส (Miniproject)</span> • มหาวิทยาลัยเทคโนโลยีมหานคร (MUT)
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              Entity & Attributes Database Specs • Figma Canvas & Live Prototype
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BusProvider>
        <MainLayout />
      </BusProvider>
    </ErrorBoundary>
  );
}
