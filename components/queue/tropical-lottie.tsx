// components/queue/tropical-lottie.tsx
"use client";

import Lottie from "lottie-react";
import animationData from "@/animations/lottie/leaves.json";
import animationDataDrink from "@/animations/lottie/drink2.json";
import animationDataCapivara from "@/animations/lottie/capivara.json";
import animationDataWaiting from "@/animations/lottie/waiting.json";
import animationDataMonkey from "@/animations/lottie/monkey.json";
import animationDataDog from "@/animations/lottie/dog2.json";

// 1. Criamos uma interface para receber o estado da tela
interface TropicalLottieOverlayProps {
  isCalled?: boolean; // Prop opcional, por padrão será false
  isEmpty?: boolean;
}

export function TropicalLottieOverlay({ isCalled = false, isEmpty = false }: TropicalLottieOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      
      {/* 🌿 Animação no Topo Esquerdo (Mantém Sempre) */}
      <div className="absolute -top-10 -left-10 w-[400px] opacity-80 mix-blend-screen">
        <Lottie 
          animationData={animationData} 
          loop={true}      
          autoplay={true}  
        />
      </div>

      {/* 🍹 E 🦫 ANIMAÇÕES NORMAIS (Somem se isCalled for true) */}
      {!isCalled && !isEmpty  && (
        <>
          <div className="absolute scale-x-[-1] bottom-0 left-0 w-[200px] opacity-80 mix-blend-screen">
            <Lottie 
              animationData={animationDataCapivara} 
              loop={true} 
              autoplay={true} 
            />
          </div>

          <div className="absolute top-20 right-20 w-[300px] opacity-80 mix-blend-screen">
            <Lottie 
              animationData={animationDataDrink} 
              loop={true} 
              autoplay={true} 
            />
          </div>
        </>
      )}

      {/* ⏳ ANIMAÇÃO DE WAITING (Aparece APENAS se isCalled for true) */}
      {isCalled && !isEmpty &&  (
        // Substitui a capivara/drink. Ajuste o top/bottom/left/right como preferir!
        <>
          <div className="absolute bottom-10 left-20 w-[250px] opacity-80 mix-blend-screen">
            <Lottie 
              animationData={animationDataWaiting} 
              loop={true} 
              autoplay={true} 
            />
          </div>
        
        <div className="absolute top-20 right-20 w-[300px] opacity-80 mix-blend-screen">
            <Lottie 
              animationData={animationDataWaiting} 
              loop={true} 
              autoplay={true} 
            />
          </div>
        </>
      )}

      {isEmpty && (
        <>
        <div className="absolute -bottom-10 left-20 w-[250px] opacity-80 mix-blend-screen">
            <Lottie 
              animationData={animationDataMonkey} 
              loop={true} 
              autoplay={true} 
            />
          </div>
          <div className="absolute top-20 right-20 w-[250px] opacity-80 mix-blend-screen">
            <Lottie 
              animationData={animationDataDog} 
              loop={true} 
              autoplay={true} 
            />
          </div>
        </>
      )}

      {/* 🌿 Animação espelhada no Canto Inferior Direito (Mantém Sempre) */}
      <div className="absolute -bottom-10 -right-10 w-[400px] opacity-80 mix-blend-screen rotate-180">
        <Lottie 
          animationData={animationData} 
          loop={true} 
          autoplay={true} 
        />
      </div>

    </div>
  );
}