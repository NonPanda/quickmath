import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw, BrainCircuit, Lightbulb, Award, Pencil,ArrowLeft, Hourglass, FastForward, Infinity, BarChart } from "lucide-react"; 
import DarkModeToggle from "../components/DarkModeToggle";
import SlowMode from "../components/SlowMode";
import QuickMode from "../components/QuickMode";

export default function Home() {
  const [started, setStarted] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-gray-950/90 dark:to-black transition-colors duration-500">
      

      <div className={`w-full max-w-6xl transition-transform duration-300 ease-in-out transform ${started ? "scale-100 opacity-100" : "scale-95 opacity-90"}`}>
        {started ? (
        <div>
      <ArrowLeft className="absolute top-12 left-4 text-stext hover:text-ptext hover:scale-115 transition-all duration-300 dark:text-gray-300 cursor-pointer" onClick={() => setStarted(false)} size={24} />
        {started === "slow" ? (
       <SlowMode setStarted={setStarted} started={started} />
        ):(
          <QuickMode setStarted={setStarted} started={started} />
        )}
       </div>
        ) : (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <DarkModeToggle />
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="relative">
              <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4">
                QuickMath AI
              </h1>
            </div>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-lg mb-8 leading-relaxed">
              Practice math problems interactively! Draw your answers and let AI evaluate them in real-time.
            </p>
            <div className="flex items-center justify-center mb-8 gap-12">
            <button
              onClick={() => setStarted("slow")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-700 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              Slow Mode <Hourglass className="ml-3" size={20} />
            </button>

            <button
              onClick={() => setStarted("quick")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-700 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              Quick Mode <FastForward className="ml-3" size={20} />
            </button>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="bg-white dark:bg-blue-950/20  backdrop-blur-3xl p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-200 dark:border-[#2A3759]">
                <div className=" flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit size={72} className="text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">AI Powered</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Advanced AI recognizes your handwritten answers and provides immediate feedback.</p>
              </div>
              
              <div className="bg-white dark:bg-blue-950/20 backdrop-blur-3xl p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-200 dark:border-[#2A3759]">
                <div className="flex items-center justify-center mx-auto mb-4">
                  <Infinity size={72} className="text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Unlimited Practice</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Generate as many problems as you need to master your math skills.</p>
              </div>
              
              <div className="bg-white dark:bg-blue-950/20  backdrop-blur-3xl p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-200 dark:border-[#2A3759]">
                <div className="flex items-center justify-center mx-auto mb-4">
                  <BarChart size={72} className="text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Track Progress</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Keep track of your score and achievement streaks as you improve.</p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}