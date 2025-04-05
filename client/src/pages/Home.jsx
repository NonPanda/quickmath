import DarkModeToggle from "../components/DarkModeToggle";
import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw, BrainCircuit } from "lucide-react"; 
import { ReactSketchCanvas } from "react-sketch-canvas";

const BACKEND_URL = "http://localhost:8000"; 

export default function Home() {
  const [started, setStarted] = useState(false);
  const [problem, setProblem] = useState({ question: "", answer: 0 });
  

  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);

  const generateProblem = () => {
    let num1, num2, operation, question, answer;
    
    operation = ["×", "+", "-"][Math.floor(Math.random() * 3)];
    if (operation === "×") {
      num1 = Math.floor(Math.random() * 10)+5;
      num2 = Math.floor(Math.random() * 10)+5;
    } else{
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
        link.download = "canvas_export.png";
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
      }

      const result = await response.json();
      const predictedAnswer = parseInt(result.prediction, 10); 

      if (isNaN(predictedAnswer)) {
        throw new Error(`Received invalid prediction: ${result.prediction}`);
      }

      if (predictedAnswer === problem.answer) {
        setFeedback({ status: "success", message: `Correct! You wrote ${predictedAnswer}.` });
        setScore((prevScore) => prevScore + 1);
        setTimeout(() => {
          generateProblem(); 
        }, 1500);
      } else {
        setFeedback({
          status: "error",
          message: `Hmm, AI read ${predictedAnswer}. The answer is ${problem.answer}. Try again!`,
        });
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-l from-gray-50 via-sky-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>

      <div className={`w-full max-w-6xl transition-all duration-700 ease-in-out transform ${started ? "scale-100" : "scale-95"}`}>
        {started ? (
          <div className="flex flex-col md:flex-row gap-6 p-6 h-full">
            <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 flex flex-col">
              <div className="p-8 flex flex-col items-center justify-center flex-grow">
                 <div className="absolute top-4 left-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                    Score: {score}
                 </div>

                <div className="text-4xl md:text-6xl font-bold mb-8 text-gray-800 dark:text-white text-center">
                  {problem.question}
                </div>

                <div className="flex flex-col w-full max-w-sm gap-4 mt-auto">

                  <div className="h-12"> 
                    {feedback && (
                      <div className={`p-3 rounded-lg text-center ${feedback.status === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}>
                        {feedback.message}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={predictAndCheck}
                      disabled={isProcessing} 
                      className={`p-4 w-full ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition flex items-center justify-center gap-2`}
                    >
                      {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                      ) : (
                         <>
                            <BrainCircuit size={20} /> 
                            <span>Check Canvas</span>
                         </>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                     <button
                       onClick={generateProblem}
                       disabled={isProcessing} 
                       className="flex items-center justify-center gap-2 p-3 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                     >
                       <RefreshCw size={18} />
                       New Problem
                     </button>
                   </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 bg-gray-200 dark:bg-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-300" style={{ minHeight: '400px' }}> 
              <div className="p-4 bg-gray-300 dark:bg-gray-600 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-gray-800 dark:text-white">Work it out here</h3>
                <div>
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1 mr-2 bg-red-500 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-800 text-white rounded-md transition text-sm"
                      title="Clear Canvas"
                    >
                      Clear
                    </button>
                    <button
                      onClick={exportCanvas}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition text-sm"
                       title="Download Canvas Image"
                    >
                      Export
                    </button>
                 </div>
              </div>
              <div className="flex-grow p-4 relative">
                 <div style={{ position: 'absolute', top: '1rem', right: '1rem', bottom: '1rem', left: '1rem' }}>
                    <ReactSketchCanvas
                        ref={canvasRef}
                        style={{ border: "1px solid #999", borderRadius: '8px', width: "100%", height: "100%" }}
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
            <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4 animate-pulse">
              QuickMath AI
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-lg mb-8">
              Draw your answers! Practice math problems interactively with AI evaluation.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
}