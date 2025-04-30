import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw, Lightbulb, Award, Pencil, CheckCircle } from "lucide-react"; 
import { ReactSketchCanvas } from "react-sketch-canvas";


const BACKEND_URL="http://localhost:8000"; 

export default function QuickMode({ started, setStarted }){

  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [index, setIndex] = useState(0);
  const [problems, setProblems] = useState([]);

  const isDarkMode= localStorage.getItem('theme')==='dark';

  
  const canvasRef = useRef(null);

  const startSessions=()=>{

    let sessionProblems = Array.from({ length: 3 }, () => generateProblem());
    setProblems(sessionProblems); 
    setProblem(sessionProblems[0]);
    console.log(sessionProblems);
    console.log("Session started with problems:", sessionProblems);
  };

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

    return {question,answer};
  };

  useEffect(() => {
    if (started) {
      startSessions();
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
      console.log("Prediction result:", result.predictions.full_number);
      const predictedAnswer = parseInt(result.predictions.full_number, 10); 

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
          
        setIndex((prevIndex)=>{
          const newIndex=prevIndex+1;
          problems[newIndex+1]=generateProblem();
          setProblems([...problems]);
          setProblem(problems[newIndex]);
          return newIndex;
        });

        
          clearCanvas();
          setFeedback(null);
          
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

      <div className="min-h-screen pt-24">
  <div className="flex flex-col md:flex-row gap-6 p-6 h-full max-w-6xl mx-auto">
    <div className="w-full md:w-1/2 bg-[#FAFAF8] dark:bg-gradient-to-t dark:from-gray-900 dark:via-gray-950/90 dark:to-gray-950 rounded-3xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 pt-4 bg-gray-50 dark:bg-gradient-to-b dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 dark:border-gray-700">
        <div className="flex gap-4 items-center text-xl font-semibold text-stext">
          Score: {score}
        </div>

        <div> 
          {feedback && (
            <div className={`text-center px-3 py-2 rounded-xl ${
              feedback.status === "success" 
                ? "text-green-800 dark:bg-green-900 dark:text-green-100" 
                : "text-red-800 dark:bg-red-900 dark:text-red-100"
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
              : 'hover:text-ptext text-stext hover:scale-110'
          }`}
        >
          <RefreshCw size={24} />
        </button>
      </div>
      <div className="flex flex-col items-center space-y-4 md:space-y-6 py-8">
        <div className="text-xl md:text-2xl text-gray-400 dark:text-gray-500 italic h-[48px] md:h-[56px] flex items-center justify-center">
          {index > 0 && problems[index - 1] ? problems[index - 1].question : <span>&nbsp;</span>}
        </div>

        <div className="text-5xl md:text-6xl font-bold text-ptext dark:text-white text-center leading-snug">
          {problems[index] ? problems[index].question : ""}
        </div>

        <div className="text-xl md:text-2xl text-gray-400 dark:text-gray-500 italic h-[48px] md:h-[56px] flex items-center justify-center">
          {problems[index + 1] ? problems[index + 1].question : <span>&nbsp;</span>}
        </div>
      </div>


      
      <div className="p-4 flex justify-center">
        <button
          onClick={predictAndCheck}
          disabled={isProcessing} 
          className={`p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium min-w-[250px] shadow-md text-xl ${
            isProcessing 
              ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-ttext hover:scale-105 border-emerald-600 border-b-emerald-700 border-b-4 dark:bg-blue-600 dark:border-b-blue-700 dark:hover:bg-blue-700'
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

    <div className="w-full md:w-1/2 bg-[#f9f9f1] dark:bg-[#1F1F2E] rounded-t-3xl shadow-md overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800" style={{ minHeight: '500px' }}> 
      <div className="px-6 pt-4 bg-[#FAFAF8] dark:bg-gradient-to-t dark:from-gray-900 dark:via-gray-950/90 dark:to-gray-950 flex justify-between items-center">
        <h3 className="font-semibold text-stext flex items-center text-2xl">
          Your Answer
          <Pencil size={24} className="ml-4 text-stext/90" />
        </h3>
        <button
          onClick={clearCanvas}
          className="px-3 py-1.5 font-bold bg-[#E94F37] hover:bg-red-600 text-ttext rounded-lg transition text-lg dark:bg-blue-600 dark:hover:bg-blue-700 duration-300 flex items-center gap-2"
          disabled={isProcessing}
        >
          Clear
        </button>
      </div>
      <div className="flex-grow p-4 relative">
        <div className="absolute inset-2">
          <ReactSketchCanvas
            ref={canvasRef}
            style={{ 
              width: "100%", 
              height: "100%",
            }}
            strokeWidth={6} 
            canvasColor={isDarkMode ? "#0305139c" : "#FFF6D8"}
            strokeColor={isDarkMode ? "#FDFDFD" : "#4B5563"}
          />
        </div>
      </div>
    </div>
  </div>
</div>
    );

}