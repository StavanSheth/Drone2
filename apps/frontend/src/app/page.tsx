"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push("/dashboard");
  };

  const handleQuickDemo = () => {
    router.push("/dashboard");
  };

  return (
    <div className="!m-0 !h-screen !w-screen !overflow-hidden !bg-[#101415] font-hanken">
      {/* ============================================================
           PAGE
      ============================================================ */}
      <main className="!relative !flex !h-screen !w-screen !items-center !justify-center !overflow-hidden !p-0">
        {/* ========================================================
             BACKGROUND
        ========================================================= */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-bg.png"
          alt="Trinetra Drone Background"
          className="!absolute !inset-0 !z-0 !h-full !w-full !object-cover !object-center"
        />

        {/* Dark overlay */}
        <div className="!absolute !inset-0 !z-10 !h-full !w-full !bg-black/55" />

        {/* ========================================================
             LOGIN CARD

             HARD LOCK:
             296 x 410 PX
        ========================================================= */}
        <section className="!relative !z-20 !block !h-[410px] !min-h-[410px] !max-h-[410px] !w-[296px] !min-w-[296px] !max-w-[296px] !shrink-0 !grow-0 !overflow-hidden !rounded-[28px] !border !border-white/10 !bg-[#202522]/90 !p-0 !text-white !shadow-[0_24px_60px_rgba(0,0,0,0.45)] !backdrop-blur-[24px]">
          {/* ====================================================
               LOGO
          ===================================================== */}
          <div className="!absolute !left-[24px] !top-[24px] !h-[32px] !w-[32px]">
            <span
              className="material-symbols-outlined !block !h-[32px] !w-[32px] !text-[32px] !leading-[32px] !text-[#ff6415]"
              style={{
                fontVariationSettings: "'FILL' 0, 'wght' 400",
              }}
            >
              flight_takeoff
            </span>
          </div>

          {/* ====================================================
               LOGO UNDERLINE
          ===================================================== */}
          <div className="!absolute !left-[24px] !top-[52px] !h-[2px] !w-[32px] !bg-[#ff6415]" />

          {/* ====================================================
               TITLE
          ===================================================== */}
          <h1 className="!absolute !left-0 !top-[68px] !m-0 !w-full !text-center !whitespace-nowrap !text-[27px] !font-bold !leading-[30px] !tracking-[-0.7px] !text-white">
            System Access
          </h1>

          {/* ====================================================
               SUBTITLE

               IMPORTANT:
               Explicitly positioned so it CANNOT disappear.
          ===================================================== */}
          <p className="!absolute !left-[24px] !top-[101px] !m-0 !w-[248px] !text-center !whitespace-nowrap !text-[12px] !font-normal !leading-[18px] !text-white/60">
            Authenticate to connect to telemetry streams.
          </p>

          <form onSubmit={handleLogin}>
            {/* ====================================================
                 OPERATOR LABEL
            ===================================================== */}
            <label
              htmlFor="email"
              className="!absolute !left-[24px] !top-[145px] !m-0 !text-[11px] !font-semibold !leading-[14px] !text-white/65"
            >
              Operator ID / Email
            </label>

            {/* ====================================================
                 OPERATOR INPUT

                 SOLID WHITE
            ===================================================== */}
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@aetheric.sys"
              className="!absolute !left-[24px] !top-[163px] !m-0 !h-[30px] !min-h-[30px] !max-h-[30px] !w-[248px] !min-w-[248px] !max-w-[248px] !rounded-[16px] !border !border-black/10 !bg-white !px-3 !py-0 !text-[11px] !font-normal !leading-[30px] !text-[#222] !outline-none placeholder:!text-black/20 focus:!border-[#ff6415]/60 focus:!bg-white focus:!ring-2 focus:!ring-[#ff6415]/10"
            />

            {/* ====================================================
                 PASSCODE LABEL
            ===================================================== */}
            <label
              htmlFor="password"
              className="!absolute !left-[24px] !top-[210px] !m-0 !text-[11px] !font-semibold !leading-[14px] !text-white/65"
            >
              Passcode
            </label>

            {/* ====================================================
                 FORGOT
            ===================================================== */}
            <button
              type="button"
              onClick={handleQuickDemo}
              className="!absolute !right-[24px] !top-[210px] !m-0 !border-0 !bg-transparent !p-0 !text-[10px] !font-semibold !leading-[14px] !text-[#ff6415] hover:!underline cursor-pointer"
            >
              Forgot?
            </button>

            {/* ====================================================
                 PASSWORD INPUT

                 SOLID WHITE
            ===================================================== */}
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="!absolute !left-[24px] !top-[228px] !m-0 !h-[30px] !min-h-[30px] !max-h-[30px] !w-[248px] !min-w-[248px] !max-w-[248px] !rounded-[16px] !border !border-black/10 !bg-white !px-3 !py-0 !text-[11px] !font-normal !leading-[30px] !text-[#222] !outline-none placeholder:!text-black/20 focus:!border-[#ff6415]/60 focus:!bg-white focus:!ring-2 focus:!ring-[#ff6415]/10"
            />

            {/* ====================================================
                 INITIATE LINK
            ===================================================== */}
            <button
              type="submit"
              className="!absolute !left-[24px] !top-[274px] !m-0 !h-[37px] !min-h-[37px] !max-h-[37px] !w-[248px] !min-w-[248px] !max-w-[248px] !rounded-[19px] !border-0 !bg-[#f45b0b] !p-0 !text-[10px] !font-bold !leading-[37px] !text-white !shadow-[0_7px_18px_rgba(244,91,11,0.22)] hover:!bg-[#ff6817] cursor-pointer"
            >
              <span>INITIATE LINK</span>
              <span
                className="material-symbols-outlined !ml-[6px] !inline-block !h-[13px] !w-[13px] !text-[13px] !leading-[13px] !align-middle"
                style={{
                  fontVariationSettings: "'FILL' 1, 'wght' 500",
                }}
              >
                login
              </span>
            </button>
          </form>

          {/* ====================================================
               QUICK DEMO
          ===================================================== */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="!absolute !left-[24px] !top-[321px] !m-0 !h-[32px] !min-h-[32px] !max-h-[32px] !w-[248px] !min-w-[248px] !max-w-[248px] !rounded-[17px] !border !border-white/10 !bg-white/[0.07] !p-0 !text-[10px] !font-semibold !leading-[32px] !text-white/80 hover:!bg-white/[0.12] transition-colors cursor-pointer"
          >
            <span>Quick Demo</span>
            <span className="material-symbols-outlined !ml-[6px] !inline-block !text-[13px] !leading-[13px] !align-middle">
              play_arrow
            </span>
          </button>

          {/* ====================================================
               REQUEST ACCESS
          ===================================================== */}
          <p className="!absolute !bottom-[19px] !left-[24px] !m-0 !w-[248px] !text-center !whitespace-nowrap !text-[10px] !font-normal !leading-[14px] !text-white/50">
            New Operator?{" "}
            <button
              type="button"
              onClick={handleQuickDemo}
              className="!font-semibold !text-[#ff6415] !no-underline hover:!underline cursor-pointer bg-transparent border-0 p-0"
            >
              Request Access
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}
