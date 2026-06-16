"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LandingPageInner() {
  const searchParams = useSearchParams();
  const sa = searchParams.get("sa");
  const checkout = searchParams.get("checkout");
  
  let src = "/landing.html";
  const params = new URLSearchParams();
  if (sa) params.set("sa", sa);
  if (checkout) params.set("checkout", checkout);
  if (params.toString()) src += "?" + params.toString();

  return (
    <iframe
      src={src}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="Carousel Studio"
    />
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0a0a0a", height: "100vh" }} />}>
      <LandingPageInner />
    </Suspense>
  );
}
