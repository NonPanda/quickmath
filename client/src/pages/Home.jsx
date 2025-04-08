import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw, BrainCircuit, Lightbulb, Award, Pencil } from "lucide-react"; 
import DarkModeToggle from "../components/DarkModeToggle";
import SlowMode from "../components/SlowMode";

export default function Home() {
  const [started, setStarted] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 transition-colors duration-500">
      <DarkModeToggle />
      

      <div className={`w-full max-w-6xl transition-all duration-700 ease-in-out transform ${started ? "scale-100 opacity-100" : "scale-95 opacity-90"}`}>
        {started ? (
       <SlowMode setStarted={setStarted} started={started} />
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="relative">
              <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4">
                QuickMath AI
              </h1>
            </div>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-lg mb-8 leading-relaxed">
              Practice math problems interactively! Draw your answers and let AI evaluate them in real-time.
            </p>
            
            <button
              onClick={() => setStarted(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-700 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              Start Learning <ArrowRight className="ml-2" size={20} />
            </button>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-200 dark:border-gray-600">
                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit size={24} className="text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">AI Powered</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Advanced AI recognizes your handwritten answers and provides immediate feedback.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-200 dark:border-gray-600">
                <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw size={24} className="text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Unlimited Practice</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Generate as many problems as you need to master your math skills.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-200 dark:border-gray-600">
                <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={24} className="text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Track Progress</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Keep track of your score and achievement streaks as you improve.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}