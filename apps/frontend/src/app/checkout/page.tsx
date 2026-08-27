"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, CreditCard, Lock } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex flex-col items-center justify-center p-4 text-[#1a1a1a] font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-[#e2dfd9] transform animation-fade-in">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Payment Successful</h1>
          <p className="text-[#666] mb-8 font-medium leading-relaxed">Your dummy payment was processed successfully. The selected assets are now available in your dashboard.</p>
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#111] text-white font-bold text-[14px] hover:bg-black transition-colors shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col items-center py-16 px-4 text-[#1a1a1a] font-sans">
      <div className="w-full max-w-lg mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#666] hover:text-[#111] font-bold text-[13px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl max-w-lg w-full border border-[#e2dfd9]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Secure Checkout</h1>
            <p className="text-[#888] text-[13px] font-medium">This is a dummy payment process.</p>
          </div>
          <div className="w-10 h-10 bg-[#f4f4f5] rounded-full flex items-center justify-center text-[#888]">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold tracking-widest uppercase text-[#888] mb-2">Cardholder Name</label>
            <input 
              required
              type="text" 
              defaultValue="John Doe"
              className="w-full h-12 px-4 rounded-xl bg-[#f4f4f5] border border-[#d8d4ce] outline-none focus:border-[#111] focus:bg-white transition-all text-[14px] font-medium"
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-bold tracking-widest uppercase text-[#888] mb-2">Card Number</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
              <input 
                required
                type="text" 
                defaultValue="4242 4242 4242 4242"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-[#f4f4f5] border border-[#d8d4ce] outline-none focus:border-[#111] focus:bg-white transition-all text-[14px] font-medium font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold tracking-widest uppercase text-[#888] mb-2">Expiry Date</label>
              <input 
                required
                type="text" 
                defaultValue="12/26"
                placeholder="MM/YY"
                className="w-full h-12 px-4 rounded-xl bg-[#f4f4f5] border border-[#d8d4ce] outline-none focus:border-[#111] focus:bg-white transition-all text-[14px] font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-widest uppercase text-[#888] mb-2">CVC</label>
              <input 
                required
                type="text" 
                defaultValue="123"
                placeholder="123"
                maxLength={4}
                className="w-full h-12 px-4 rounded-xl bg-[#f4f4f5] border border-[#d8d4ce] outline-none focus:border-[#111] focus:bg-white transition-all text-[14px] font-medium"
              />
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-[#eee]">
            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full h-14 rounded-xl bg-[#1a1a1a] text-white font-bold text-[15px] hover:bg-black transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_20px_rgba(26,26,26,0.2)] disabled:opacity-70 flex justify-center items-center"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Pay Now"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
