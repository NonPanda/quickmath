import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw, Lightbulb, Award, Pencil, CheckCircle } from "lucide-react"; 
import { ReactSketchCanvas } from "react-sketch-canvas";
import DarkModeToggle from "../components/DarkModeToggle";


const BACKEND_URL = "http://localhost:8000"; 

export default function SlowMode({ started, setStarted }) {

  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const isDarkMode= localStorage.getItem('theme') === 'dark';

  
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


  const predictAndCheck = async () => {
    if (!canvasRef.current) return;
    setFeedback(null); 
    setIsProcessing(true); 

    try {
      const imageDataUrl = await canvasRef.current.exportImage("png");
      if (imageDataUrl && imageDataUrl.startsWith("data:image/png;base64,")) {
        console.log("Image data URL is valid:", imageDataUrl);
      } else {
        console.error("Invalid image data URL:", imageDataUrl);
      }

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

      <div className="min-h-screen pt-8">
        <div className="max-w-2xl mx-auto bg-[#FAFAF8] dark:bg-[#121212] rounded-3xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 pt-4 bg-gray-50 dark:bg-[#121212]  dark:border-gray-700">
            <div className="flex gap-4 items-center text-xl font-semibold text-stext ">
             
                Score: {score}
              
            
            </div>

            <div> 
                {feedback && (
                  <div className={`text-center ${
                    feedback.status === "success" 
                      ? " text-green-800 dark:bg-green-900 dark:text-green-100" 
                      : " text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}>
                    {feedback.message}
                  </div>
                )}
              </div>
    
            <button
              onClick={generateProblem}
              disabled={isProcessing} 
              className={`flex items-center justify-center gap-2 p-2 rounded-xl w-12 h-12 transition-all duration-300 ${
                isProcessing 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : ' hover:text-ptext text-stext hover:scale-105'
              }`}
            >
              <RefreshCw size={24} />
            </button>
          </div>
    
          <div className="pb-4 px-16 flex flex-col gap-4">
            <div className="text-4xl md:text-6xl font-bold text-ptext text-center py-4">
              {problem.question}
            </div>
            
            <div className="bg-gray-200 dark:bg-[#1F1F2E] rounded-t-xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800" style={{ minHeight: '400px' }}> 
              <div className="px-6 pt-2 bg-gray-200 dark:bg-[#1F1F2E] flex justify-between items-center">
                <h3 className="font-semibold text-stext  flex items-center text-2xl">
                  Your Answer
                  <Pencil size={24} className="ml-4 text-stext/90" />
                </h3>
                <button
                  onClick={clearCanvas}
                  className="px-3 py-1.5 font-semibold bg-[#E94F37] hover:bg-red-600 text-ttext rounded-lg transition text-lg dark:bg-blue-900 dark:hover:bg-blue-700 duration-300 flex items-center gap-2"
                  disabled={isProcessing}
                >
                  Clear
                </button>
              </div>
              <div className="flex-grow px-4 relative">
                <div className="absolute inset-2">
                  <ReactSketchCanvas
                    ref={canvasRef}
                    style={{ 
                      width: "100%", 
                      height: "100%",
                    }}
                    strokeWidth={6} 
                    canvasColor={isDarkMode ? "#0315139c" : "#FFF6D8"}
                    strokeColor={isDarkMode ? "#FDFDFD" : "#4B5563"}
                  
                  />
                </div>
              </div>
            </div>
    
              
              
              <button
                onClick={predictAndCheck}
                disabled={isProcessing} 
                className={`p-4 mx-auto rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium min-w-[300px]   shadow-md text-xl  ${
                  isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-ttext hover:scale-105 border-emerald-600 border-b-emerald-800 border-b-4 dark:bg-emerald-700 dark:border-b-emerald-800 dark:hover:bg-emerald-600'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} /> 
                    <span>Check Answer</span>
                  </>
                )}
              </button>
            </div>
        </div>
      </div>
    );

}