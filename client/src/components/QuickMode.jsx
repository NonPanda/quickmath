import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw, BrainCircuit, Lightbulb, Award, Pencil } from "lucide-react"; 
import { ReactSketchCanvas } from "react-sketch-canvas";
import DarkModeToggle from "../components/DarkModeToggle";


const BACKEND_URL = "http://localhost:8000"; 

export default function Home() {
  const [started, setStarted] = useState(false);
  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streak, setStreak] = useState(0);

  const canvasRef = useRef(null);

  const generateProblem = () => {
    let num1, num2, operation, question, answer;
    
    operation = ["×", "+", "-"][Math.floor(Math.random() * 3)];
    if (operation === "×") {
      num1 = Math.floor(Math.random() * 10) + 5;
      num2 = Math.floor(Math.random() * 10) + 5;
    } else {
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * 30) + 10;
    }
    
    if (operation === "+") {
      question = `${num1} + ${num2} = ?`;
      answer = num1 + num2;
    } else if (operation === "-") {
      if (num1 < num2) [num1, num2] = [num2, num1];
      question = `${num1} - ${num2} = ?`;
      answer = num1 - num2;
    } else {
      question = `${num1} × ${num2} = ?`;
      answer = num1 * num2;
    }
    
    setProblem({ question, answer });
    setIsProcessing(false);
    setFeedback(null);
    clearCanvas();
  };

  useEffect(() => {
    if (started) {
      generateProblem();
    }
  }, [started]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      setFeedback(null);
    }
  };

  const exportCanvas = () => { 
    if (canvasRef.current) {
      canvasRef.current.exportImage("png").then((dataUrl) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `quickmath_problem_${Date.now()}.png`;
        link.click();
      });
    }
  };

  const predictAndCheck = async () => {
    if (!canvasRef.current) return;
    setFeedback(null); 
    setIsProcessing(true); 

    try {
      const imageDataUrl = await canvasRef.current.exportImage("png");

      if (!imageDataUrl) {
        throw new Error("Could not export canvas image.");
      }

      const response = await fetch(`${BACKEND_URL}/predict/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl: imageDataUrl }), 
      });

      if (!response.ok) {
        let errorMsg = `Prediction failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg; 
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      const predictedAnswer = parseInt(result.prediction, 10); 

      if (isNaN(predictedAnswer)) {
        throw new Error(`Received invalid prediction: ${result.prediction}`);
      }

      if (predictedAnswer === problem.answer) {
        setFeedback({ 
          status: "success", 
          message: `Correct! You wrote ${predictedAnswer}.` 
        });
        setScore((prevScore) => prevScore + 1);
        setStreak((prevStreak) => prevStreak + 1);
      
        
        setTimeout(() => {
          generateProblem(); 
        }, 1500);
      } else {
        setFeedback({
          status: "error",
          message: `Hmm, AI read ${predictedAnswer}. The answer is ${problem.answer}. Try again!`,
        });
        setStreak(0);
      }
    } catch (error) {
      console.error("Prediction Error:", error);
      setFeedback({
        status: "error",
        message: `Error: ${error.message || "Could not get prediction."}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 transition-colors duration-500">
      <DarkModeToggle />
      

      <div className={`w-full max-w-6xl transition-all duration-700 ease-in-out transform ${started ? "scale-100 opacity-100" : "scale-95 opacity-90"}`}>
        {started ? (
          <div className="flex flex-col md:flex-row gap-6 p-6 h-full">
            <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 flex flex-col backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 border border-gray-100 dark:border-gray-700">
              <div className="p-8 flex flex-col items-center justify-center flex-grow relative">
                <div className="flex gap-4 absolute top-2 left-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                    <Award size={16} />
                    Score: {score}
                  </div>
                  
                  {streak > 0 && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg animate-pulse">
                      <Lightbulb size={16} />
                      Streak: {streak}
                    </div>
                  )}
                </div>

                <div className="text-4xl md:text-6xl font-bold my-12 text-gray-800 dark:text-white text-center">
                  {problem.question}
                </div>

                <div className="flex flex-row w-full max-w-sm gap-4 mt-auto">
                  <div className="h-12 transition-all"> 
                    {feedback && (
                      <div className={`p-3 rounded-lg text-center shadow-md transform transition-all duration-300 ${
                        feedback.status === "success" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 scale-105" 
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}>
                        {feedback.message}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={predictAndCheck}
                      disabled={isProcessing} 
                      className={`p-4 w-full rounded-xl transition-all duration-300 transform hover:scale-102 hover:shadow-lg flex items-center justify-center gap-2 font-medium ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <BrainCircuit size={20} /> 
                          <span>Check Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                    <button
                      onClick={generateProblem}
                      disabled={isProcessing} 
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 transform hover:scale-102 hover:shadow-lg font-medium ${
                        isProcessing 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                      }`}
                    >
                      <RefreshCw size={18} />
                    </button>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-700 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-colors duration-300 border border-gray-200 dark:border-gray-600" style={{ minHeight: '500px' }}> 
              <div className="p-4 bg-gray-200 dark:bg-gray-600 flex justify-between items-center flex-shrink-0">
                <h3 className="font-semibold text-gray-800/60 dark:text-white flex items-center">
                  Work it out here
                </h3>
                <div>
                  <button
                    onClick={clearCanvas}
                    className="px-3 py-1.5 mr-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded-md transition text-sm shadow-md"
                    title="Clear Canvas"
                  >
                    Clear
                  </button>
                  <button
                    onClick={exportCanvas}
                    className="px-3 py-1.5 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition text-sm shadow-md"
                    title="Download Canvas Image"
                  >
                    Export
                  </button>
                </div>
              </div>
              <div className="flex-grow p-4 relative">
                <div className="absolute top-1 right-1 bottom-1 left-1">
                  <ReactSketchCanvas
                    ref={canvasRef}
                    style={{ 
                      border: "2px solid #ccc", 
                      borderRadius: '0.75rem', 
                      width: "100%", 
                      height: "100%",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                    }}
                    canvasColor="white"
                    strokeWidth={6} 
                    strokeColor="black"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="relative">
              <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4">
                QuickMath AI
              </h1>
              <Pencil className="absolute -top-8 -right-8 text-4xl text-blue-500 dark:text-blue-300" size={30} />
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