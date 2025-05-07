import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, RefreshCw, Lightbulb, Award, Pencil, CheckCircle } from "lucide-react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const BACKEND_URL = "http://localhost:8000";

export default function QuickMode({ started, setStarted }) {
  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [index, setIndex] = useState(0);
  const [problems, setProblems] = useState([]);
  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(90);

  const timeformat = (time) => {
    if (typeof time !== "number" || time < 0) return "N/A";
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const handleTimeUp = () => {
    setFeedback({ status: "time", message: "Time's up! Your score is " + score });
    setIsProcessing(false);
    setIndex(0);
    setProblems([]);
    setProblem({ question: "", answer: 0 });
    clearCanvas();
  };

  useEffect(() => {
    if (started) {
      setTimeLeft(90);
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [started]);

  const isDarkMode = localStorage.getItem('theme') === 'dark';

  const canvasRef = useRef(null);

  const startSessions = () => {
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

    return { question, answer };
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
  
  const inactive = useRef(null);
  const handleUserDraw = () => {
    if (inactive.current) {
      clearTimeout(inactive.current);
    }
    inactive.current = setTimeout(() => {
      predictAndCheck();
    }, 1000);
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
          setIndex((prevIndex) => {
            const newIndex = prevIndex + 1;
            problems[newIndex + 1] = generateProblem();
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
        {timeLeft === 0 ? (
          <div className="mx-auto w-3/4 bg-[#FAFAF8] dark:bg-gradient-to-t dark:from-gray-900 dark:via-gray-950/90 dark:to-gray-950 rounded-3xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50 dark:bg-gradient-to-b dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 dark:border-gray-700">
              <div className="flex items-center gap-4 text-xl font-semibold text-stext mb-4 md:mb-0">
                <div className="text-center text-2xl font-bold text-green-800 dark:text-green-100">
                  Time's up! Your score is {score}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium text-stext">Would you like to play again?</span>
                <button
                  onClick={() => {
                    setStarted("quick");
                    startSessions();
                    setIndex(0);

                    setScore(0);
                    setTimeLeft(90);

                    clearCanvas();

                    timerRef.current = setInterval(() => {
                      setTimeLeft((prevTime) => {
                        if (prevTime <= 1) {
                          clearInterval(timerRef.current);
                          handleTimeUp();
                          return 0;
                        }
                        return prevTime - 1;
                      });
                    }, 1000);
                    setFeedback(null);
                  }}

                  className="px-4 py-2 font-bold bg-[#E94F37] hover:bg-red-600 text-white rounded-lg transition text-lg dark:bg-blue-600 dark:hover:bg-blue-700 duration-300 flex items-center gap-2"
                >
                  <RefreshCw size={20} className="text-white" />
                  Restart
                </button>
              </div>
            </div>
          
          </div>
        ) : (
          <>
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

                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-stext flex items-center gap-2">
                    Time Left: {timeformat(timeLeft)}
                    <Lightbulb size={24} className="text-stext/90" />
                  </div>
                </div>
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
                    onStroke={handleUserDraw}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}