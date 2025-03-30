import DarkModeToggle from "../components/DarkModeToggle";
import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import {ReactSketchCanvas} from "react-sketch-canvas";
export default function Home() {
  const [started, setStarted] = useState(false);
  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
 
  const [isDrawing, setIsDrawing] = useState(false);
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
    setUserAnswer("");
    setFeedback(null);
    clearCanvas();
  };

  useEffect(() => {
    if (started) {
      generateProblem();
    }
  }, [started]);
  useEffect(() => {
   
    
    const handleResize = () => {
    
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startDrawing = (e) => {
    
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(e);

  };

  const clearCanvas = () => {
 
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  };

  const stopDrawing = () => {

    setIsDrawing(false);
  };

  const getCoordinates = (e) => {
  
  };



  const checkAnswer = () => {
    const numAnswer = parseInt(userAnswer, 10);
    
    if (isNaN(numAnswer)) {
      setFeedback({ status: "error", message: "Please enter a number" });
      return;
    }
    
    if (numAnswer === problem.answer) {
      setFeedback({ status: "success", message: "Correct! Great job!" });
      setScore(prevScore => prevScore + 1);
      setTimeout(() => {
        generateProblem();
      }, 1500);
    } else {
      setFeedback({ status: "error", message: `Try again! The answer is ${problem.answer}` });
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
            <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300">

              
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="text-4xl md:text-6xl font-bold mb-8 text-gray-800 dark:text-white">
                  {problem.question}
                </div>
                
                <div className="flex flex-col w-full max-w-sm gap-4">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                      placeholder="Your answer"
                      className="w-full p-4 text-2xl border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition"
                    />
                    <button
                      onClick={checkAnswer}
                      className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center"
                    >
                      <ArrowRight size={24} />
                    </button>
                  </div>
                  
                  {feedback && (
                    <div className={`p-3 rounded-lg text-center ${feedback.status === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}>
                      {feedback.message}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={generateProblem}
                      className="flex items-center justify-center gap-2 p-3 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                    >
                      <RefreshCw size={18} />
                      New Problem
                    </button>
                  </div>
                  
                  
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 bg-gray-200 dark:bg-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
              <div className="p-4 bg-gray-300 dark:bg-gray-600 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white">Work it out here</h3>
                <button
                  onClick={clearCanvas}
                  className="px-3 py-1 bg-gray-400 dark:bg-gray-800 hover:bg-gray-500 dark:hover:bg-gray-900 text-white rounded-md transition text-sm"
                >
                  Clear
                </button>
              </div>
              <div className="flex-grow p-4">
              <ReactSketchCanvas
                ref={canvasRef}
                style={{ border: "1px solid #000", width: "100%", height: "100%" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                canvasColor="white"
                strokeWidth={5}
                strokeColor="black"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
              QuickMath
            </h1>
            <p className="text-xl text-white/80 max-w-lg mb-8">
              A fun and interactive way for kids to practice math problems while improving their skills through drawing and solving
            </p>
            <button
              onClick={() => setStarted(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Start Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
}