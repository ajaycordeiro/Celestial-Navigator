import './fonts.css';
import asset0 from "./assets/pos-28-hero.png";

import React from 'react';
import { MapPin, Calendar, Clock, Star } from 'lucide-react';

export function HolidayMarket() {
  return (
    <div
      style={{ width: "100%", height: "100%" }}
      className="relative bg-[#0F172A] overflow-hidden text-slate-100 font-sans flex flex-col items-center justify-between"
    >
      {/* Inner Border Frame */}
      <div className="absolute inset-4 border border-amber-900/40 rounded-xl pointer-events-none z-10" />
      <div className="absolute inset-5 border border-amber-900/20 rounded-lg pointer-events-none z-10" />

      {/* Top Image Section */}
      <div className="relative w-full h-[45%] flex-shrink-0">
        <img
          src={asset0}
          alt="Holiday Market Scene"
          className="w-full h-full object-cover"
        />
        {/* Gradients for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/50 via-transparent to-transparent" />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col items-center w-full px-12 pt-4 pb-14 z-20 text-center">

        <div className="flex items-center gap-3 text-amber-500 font-medium tracking-[0.25em] uppercase text-xs mb-6">
          <Star className="w-3.5 h-3.5 fill-amber-500/30" />
          <span>Annual Winter Event</span>
          <Star className="w-3.5 h-3.5 fill-amber-500/30" />
        </div>

        <h1 className="font-['Playfair_Display'] text-[4rem] leading-[1.05] text-amber-50 mb-6 drop-shadow-lg">
          Starlight<br />
          <span className="font-light text-amber-200">Holiday Market</span>
        </h1>

        <p className="text-slate-300 text-[1.1rem] max-w-md mx-auto mb-10 leading-relaxed font-light">
          Join us for an enchanting evening of artisanal crafts, warm mulled wine, and festive cheer under the winter stars.
        </p>

        <div className="w-full flex flex-col gap-6 items-center mt-auto">
          <div className="flex items-center gap-12 border-y border-amber-900/60 py-5 px-8 w-[110%] justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-amber-400 opacity-80" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-medium text-amber-50 tracking-wide">DEC 12-14</p>
                <p className="text-sm text-slate-400 font-light">Friday to Sunday</p>
              </div>
            </div>
            <div className="w-px h-12 bg-amber-900/60" />
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-amber-400 opacity-80" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-medium text-amber-50 tracking-wide">4 PM - 10 PM</p>
                <p className="text-sm text-slate-400 font-light">Evening Hours</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300 mt-2">
            <MapPin className="w-5 h-5 text-amber-400 opacity-80" strokeWidth={1.5} />
            <span className="text-[1.05rem] tracking-wide font-light">The Historic Wharf, Pier 39, San Francisco</span>
          </div>
        </div>
      </div>

      {/* Subtle decorations (Snow/Stars) */}
      <div className="absolute top-[48%] left-[10%] w-1.5 h-1.5 rounded-full bg-amber-100/40 blur-[1px]" />
      <div className="absolute top-[42%] right-[15%] w-2 h-2 rounded-full bg-amber-200/30 blur-[1px]" />
      <div className="absolute bottom-[20%] left-[8%] w-1 h-1 rounded-full bg-amber-100/50" />
      <div className="absolute bottom-[25%] right-[10%] w-1.5 h-1.5 rounded-full bg-amber-200/40" />
    </div>
  );
}
