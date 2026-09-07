import React, { useState } from 'react';
import { Clock, FastForward, AlertTriangle, UserCheck, UserX, RefreshCw, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';

interface SimulationBarProps {
  simulatedTime: string;
  simulatedDate: string;
  onAdvanceTime: (minutes: number) => void;
  onSetTime: (time: string) => void;
  onTriggerScenario: (scenarioId: string) => void;
  onRefresh: () => void;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  simulatedTime,
  simulatedDate,
  onAdvanceTime,
  onSetTime,
  onTriggerScenario,
  onRefresh,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTime, setCustomTime] = useState(simulatedTime);

  return (
    <aside aria-label="Development Simulation Panel" className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs transition-all z-50 sticky top-0 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-medium text-[11px] border border-teal-500/30">
            <Sparkles className="w-3 h-3" />
            Dev Simulation Engine
          </span>
          <div className="flex items-center gap-1.5 font-mono text-amber-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Hospital Clock: <strong className="text-white text-sm">{simulatedTime}</strong></span>
            <span className="text-slate-400 text-[10px]">({simulatedDate})</span>
          </div>
        </div>

        {/* Quick Time Advances */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-slate-400 hidden sm:inline text-[11px]">Advance Clock:</span>
          <button
            id="sim-btn-plus-5"
            onClick={() => onAdvanceTime(5)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Advance clock by 5 minutes"
          >
            +5m
          </button>
          <button
            id="sim-btn-plus-15"
            onClick={() => onAdvanceTime(15)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition font-medium"
            title="Advance clock by 15 minutes"
          >
            +15m
          </button>
          <button
            id="sim-btn-plus-30"
            onClick={() => onAdvanceTime(30)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Advance clock by 30 minutes"
          >
            +30m
          </button>
          <button
            id="sim-btn-plus-60"
            onClick={() => onAdvanceTime(60)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Advance clock by 1 hour"
          >
            +1 hr
          </button>

          <button
            id="sim-btn-toggle-scenarios"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium transition"
          >
            <Zap className="w-3 h-3" />
            <span>Test Scenarios</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            id="sim-btn-refresh-state"
            onClick={onRefresh}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Force refresh state from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Scenario Tray */}
      {isOpen && (
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            <button
              id="sim-scenario-doctor-late"
              onClick={() => onTriggerScenario('doctor-late-15')}
              className="text-left p-2 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-200 flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">1. Doctor 15m Late</div>
                <div className="text-[10px] text-slate-400">Dr. Subba Rao starts at 10:15</div>
              </div>
            </button>

            <button
              id="sim-scenario-doctor-ahead"
              onClick={() => onTriggerScenario('doctor-ahead-10')}
              className="text-left p-2 rounded bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-200 flex items-center gap-2"
            >
              <FastForward className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">2. Doctor Runs Ahead</div>
                <div className="text-[10px] text-slate-400">10 mins ahead; early check-in allowed</div>
              </div>
            </button>

            <button
              id="sim-scenario-long-consultation"
              onClick={() => onTriggerScenario('long-consultation-30')}
              className="text-left p-2 rounded bg-slate-900 hover:bg-slate-800 border border-orange-500/30 text-orange-200 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">3. Consultation Over-run</div>
                <div className="text-[10px] text-slate-400">Case takes 30m; rolls downstream delay</div>
              </div>
            </button>

            <button
              id="sim-scenario-emergency"
              onClick={() => onTriggerScenario('emergency-patient')}
              className="text-left p-2 rounded bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-rose-200 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">4. Emergency Priority</div>
                <div className="text-[10px] text-slate-400">Inserts child &amp; consumes buffer</div>
              </div>
            </button>

            <button
              id="sim-scenario-late-reassign"
              onClick={() => onTriggerScenario('patient-late-reassign')}
              className="text-left p-2 rounded bg-slate-900 hover:bg-slate-800 border border-blue-500/30 text-blue-200 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">5. Late Arrival Reassigned</div>
                <div className="text-[10px] text-slate-400">Reassigned non-punitively</div>
              </div>
            </button>

            <button
              id="sim-scenario-no-show"
              onClick={() => onTriggerScenario('patient-no-show')}
              className="text-left p-2 rounded bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-200 flex items-center gap-2"
            >
              <UserX className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">6. No-Show Slot Release</div>
                <div className="text-[10px] text-slate-400">Reassuring message sent</div>
              </div>
            </button>

            <div className="flex items-center gap-2 p-1.5 rounded bg-slate-900 border border-slate-800">
              <input
                id="sim-input-clock"
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="bg-slate-800 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:outline-none focus:border-teal-500"
              />
              <button
                id="sim-btn-set-custom-clock"
                onClick={() => onSetTime(customTime)}
                className="px-2 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium"
              >
                Set Time
              </button>
            </div>

            <button
              id="sim-scenario-reset"
              onClick={() => onTriggerScenario('reset-database')}
              className="text-left p-2 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Reset All Test Data</div>
                <div className="text-[10px] text-red-300">Restore fresh 10 scenarios</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
