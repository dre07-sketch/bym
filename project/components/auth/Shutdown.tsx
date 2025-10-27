import { AlertTriangle, Power, Wrench, Car, Settings, Feather } from 'lucide-react';

function Shutdown() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,120,0,0.08),transparent_50%)] animate-pulse"></div>

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-[shimmer_3s_ease-in-out_infinite]"></div>

      <div className="relative z-10 max-w-xl w-full"> {/* Reduced width from max-w-2xl to max-w-xl */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-orange-500/30 rounded-full px-4 py-2 mb-3"> {/* Reduced gap and padding */}
            <Wrench className="w-5 h-5 text-orange-400" /> {/* Reduced icon size */}
            <span className="text-xl font-bold text-white tracking-wider">BYM GARAGE</span> {/* Reduced font size */}
            <Settings className="w-5 h-5 text-orange-400 animate-spin" style={{ animationDuration: '8s' }} /> {/* Reduced icon size */}
          </div>
          <p className="text-slate-400 text-xs font-medium tracking-wide">MANAGEMENT SYSTEM</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 shadow-2xl"> {/* Reduced padding */}
          <div className="flex items-center justify-center mb-3"> {/* Reduced margin */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Power className="relative w-12 h-12 text-red-500 animate-pulse" strokeWidth={1.5} /> {/* Reduced icon size */}
            </div>
          </div>

          <div className="text-center space-y-3"> {/* Reduced space between elements */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" /> {/* Reduced icon size */}
              <h1 className="text-2xl font-bold text-red-500 tracking-tight"> {/* Reduced font size */}
                Shut Down {/* Changed from "SYSTEM SHUTDOWN" to "Shut Down" */}
              </h1>
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} /> {/* Reduced icon size */}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

            <div className="grid grid-cols-3 gap-2 my-3"> {/* Reduced gap and margin */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-2"> {/* Reduced padding */}
                <Car className="w-4 h-4 text-slate-600 mx-auto mb-1" /> {/* Reduced icon size */}
                <p className="text-slate-500 text-xs font-medium">Service Queue</p>
                <p className="text-slate-600 text-xs mt-0.5">Offline</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-2">
                <Wrench className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                <p className="text-slate-500 text-xs font-medium">Work Orders</p>
                <p className="text-slate-600 text-xs mt-0.5">Suspended</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-2">
                <Settings className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                <p className="text-slate-500 text-xs font-medium">Inventory</p>
                <p className="text-slate-600 text-xs mt-0.5">Locked</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 font-light"> {/* Reduced font size */}
              All garage operations have been suspended
            </p>

            <div className="bg-slate-900/70 border-2 border-orange-500/30 rounded-xl p-3 mt-3"> {/* Reduced padding and margin */}
              <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                Authorization Required
              </p>
              <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border border-cyan-500/40 rounded-lg p-3"> {/* Reduced gap and padding */}
                <Feather className="w-5 h-5 text-cyan-400 animate-[spin_4s_linear_infinite]" /> {/* Reduced icon size */}
                <span className="text-lg font-bold text-cyan-300 tracking-wide"> {/* Reduced font size */}
                  Feather
                </span>
                <Feather className="w-5 h-5 text-cyan-400 animate-[spin_4s_linear_infinite]" style={{ animationDirection: 'reverse' }} />
              </div>
              <p className="text-slate-400 text-xs mt-2">System Administrator Access Required</p>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3 text-slate-500 text-xs"> {/* Reduced margin */}
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Status: Dormant Mode</span>
            </div>
          </div>
        </div>

        <div className="mt-2 text-center"> {/* Reduced margin */}
          <p className="text-slate-600 text-xs font-mono">
            ERR_CODE: BYM-SYS-401 | {new Date().toISOString().split('T')[0]} {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
    </div>
  );
}

export default Shutdown;