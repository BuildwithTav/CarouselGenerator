"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/?upgraded=true");
    }, 3000);
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:64,marginBottom:24}}>⚡</div>
        <h1 style={{color:"#fff",fontSize:32,fontWeight:800,margin:"0 0 12px"}}>You're in.</h1>
        <p style={{color:"#BB9900",fontSize:18,fontWeight:600,margin:"0 0 8px"}}>Payment confirmed.</p>
        <p style={{color:"#888",fontSize:14,margin:0}}>Taking you back to Carousel Studio...</p>
      </div>
    </div>
  );
}
