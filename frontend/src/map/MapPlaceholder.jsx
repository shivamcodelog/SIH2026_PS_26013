import React from 'react';

export default function MapPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
      <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 text-xl">
        🗺️
      </div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">
        WebGIS Interactive Map Layer
      </h3>
      <p className="text-xs text-slate-500 max-w-sm">
        Leaflet map visualization scheduled for Mission 7. Spatial boundary layers and IoU conflict overlays will render here.
      </p>
    </div>
  );
}
