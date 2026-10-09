"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Flame,
  ArrowRight,
  X,
  Award,
  BookOpen,
  Volume2,
  VolumeX,
  Share2,
  ChevronRight,
  HardDriveDownload,
} from "lucide-react";
import { OFFLINE_DEMO_QUIZZES } from "@/lib/offline/offlineQuizData";
import { saveOfflineQuizAttempt } from "@/lib/offlineDb";

export default function OfflineQuizModal({
  isOpen,
  onClose,
  initialQuizId = null,
  onQuizCompleted,
}) {
  const [selectedQuizId, setSelectedQuizId] = useState(
    initialQuizId || OFFLINE_DEMO_QUIZZES[0].id
  );
  const [activeQuiz, setActiveQuiz] = useState(OFFLINE_DEMO_QUIZZES[0]);
  const [gameState, setGameState] = useState("LOBBY"); // LOBBY, PLAYING, RESULTS
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [timeSpent, setTimeSpent] = useState(0);
  const [savedLocally, setSavedLocally] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef(null);

  // Sync activeQuiz when selectedQuizId or initialQuizId changes
  useEffect(() => {
    const targetId = initialQuizId || selectedQuizId;
    const found = OFFLINE_DEMO_QUIZZES.find((q) => q.id === targetId) || OFFLINE_DEMO_QUIZZES[0];
    setSelectedQuizId(found.id);
    setActiveQuiz(found);
    if (!isOpen) {
      setGameState("LOBBY");
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setUserAnswers([]);
      setScore(0);
      setStreak(0);
      setSavedLocally(false);
    }
  }, [initialQuizId, selectedQuizId, isOpen]);

  // Timer countdown while PLAYING
  useEffect(() => {
    if (gameState !== "PLAYING") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  if (!isOpen) return null;

  const questions = activeQuiz?.questions || [];
  const currentQuestion = questions[currentIndex] || null;

  const handleStartQuiz = (quiz = activeQuiz) => {
    setActiveQuiz(quiz);
    setSelectedQuizId(quiz.id);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeRemaining(quiz.timeLimit || 180);
    setTimeSpent(0);
    setSavedLocally(false);
    setGameState("PLAYING");
  };

  const handleOptionSelect = (option) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > bestStreak) setBestStreak(newStreak);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        selectedOption: option,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
        explanation: currentQuestion.explanation,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("RESULTS");

    const finalCorrect = score + (selectedOption === currentQuestion?.correctAnswer && !isAnswered ? 1 : 0);
    const finalTotal = questions.length || 1;
    const finalScorePct = Math.round((finalCorrect / finalTotal) * 100);
    const earnedXp = Math.round((finalScorePct / 100) * (activeQuiz.xpReward || 150));

    try {
      await saveOfflineQuizAttempt({
        quizId: activeQuiz.id,
        studentId: "current",
        answers: userAnswers,
        score: finalScorePct,
        correctAnswers: finalCorrect,
        totalQuestions: finalTotal,
        timeSpent,
        subject: activeQuiz.subject || "General",
      });
      setSavedLocally(true);
    } catch (e) {
      console.warn("Failed saving offline attempt:", e);
    }

    if (typeof onQuizCompleted === "function") {
      onQuizCompleted({
        quizId: activeQuiz.id,
        title: activeQuiz.title,
        score: finalScorePct,
        correctAnswers: finalCorrect,
        totalQuestions: finalTotal,
        xpEarned: earnedXp,
      });
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const calculateGrade = (pct) => {
    if (pct >= 90) return { grade: "A+", label: "Outstanding!", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" };
    if (pct >= 80) return { grade: "A", label: "Excellent Work!", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" };
    if (pct >= 70) return { grade: "B", label: "Good Effort!", color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/30" };
    if (pct >= 60) return { grade: "C", label: "Keep Practicing!", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" };
    return { grade: "D", label: "Need Review", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30" };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{activeQuiz.emoji || "⚡"}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {gameState === "LOBBY" ? "Offline Quiz Arena" : activeQuiz.title}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeQuiz.subject} • {activeQuiz.className}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gameState === "PLAYING" && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
                timeRemaining <= 30
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeRemaining)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Quiz"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ============================================================ */}
          {/* VIEW A: LOBBY / SELECTION                                    */}
          {/* ============================================================ */}
          {gameState === "LOBBY" && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> Ready for Offline Play
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Select a Challenge or Curriculum Demo Quiz
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg">
                    All questions, timers, explanations, and score tracking function completely offline using local IndexedDB storage.
                  </p>
                </div>

                <button
                  onClick={() => handleStartQuiz(activeQuiz)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Start Featured Quiz
                </button>
              </div>

              {/* Quiz Selection Cards */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Available Offline Quizzes ({OFFLINE_DEMO_QUIZZES.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OFFLINE_DEMO_QUIZZES.map((quiz) => {
                    const isSelected = quiz.id === activeQuiz.id;
                    return (
                      <div
                        key={quiz.id}
                        onClick={() => {
                          setActiveQuiz(quiz);
                          setSelectedQuizId(quiz.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                          isSelected
                            ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-[#635BFF] ring-2 ring-[#635BFF]/30 shadow-md"
                            : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{quiz.emoji}</span>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                                {quiz.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {quiz.subject} • {quiz.className}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            quiz.difficulty === "Easy"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : quiz.difficulty === "Hard"
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}>
                            {quiz.difficulty}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {quiz.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {Math.round(quiz.timeLimit / 60)} Mins • {quiz.questions.length} Qs
                          </span>
                          <span className="font-bold text-[#635BFF] dark:text-indigo-400 flex items-center gap-1">
                            <Award className="w-3 h-3" /> +{quiz.xpReward} XP
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ready to start action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStartQuiz(activeQuiz)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
                >
                  <span>Launch "{activeQuiz.title}"</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW B: ACTIVE QUIZ PLAYING                                  */}
          {/* ============================================================ */}
          {gameState === "PLAYING" && currentQuestion && (
            <div className="space-y-5">
              {/* Progress & Streak Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span>
                      {Math.round(((currentIndex + 1) / questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{
                        width: `${((currentIndex + 1) / questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {streak > 1 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold animate-bounce">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{streak}x Combo!</span>
                  </div>
                )}
              </div>

              {/* Question Card */}
              <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#635BFF] dark:text-indigo-400 uppercase tracking-wider">
                    {activeQuiz.subject} • Q{currentIndex + 1}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Score: {score}/{currentIndex + (isAnswered ? 1 : 0)}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Multiple Choice Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  let btnStyle = "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-[#635BFF]/50 hover:bg-indigo-50/30 dark:hover:bg-slate-800/60";

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500/20";
                    } else {
                      btnStyle = "opacity-50 border-slate-200 dark:border-slate-800";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full p-3.5 sm:p-4 rounded-xl border text-left font-medium text-xs sm:text-sm flex items-center justify-between gap-3 transition-all cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                          isAnswered && isCorrect
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : isAnswered && isSelected
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </div>

                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation Feedback */}
              {isAnswered && (
                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-slate-900/80 border border-indigo-200/60 dark:border-indigo-900/40 text-xs space-y-1 animate-in fade-in duration-200 text-left">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Explanation & Core Concept</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentQuestion.explanation || "Review the principles covered in this unit to solidify your mastery."}
                  </p>
                </div>
              )}

              {/* Navigation Action */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setGameState("LOBBY")}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                >
                  Exit Quiz
                </button>

                {isAnswered && (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2 ml-auto animate-in fade-in duration-150"
                  >
                    <span>{currentIndex + 1 === questions.length ? "Finish Assessment" : "Next Question"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW C: RESULTS & SCORE SUMMARY                              */}
          {/* ============================================================ */}
          {gameState === "RESULTS" && (
            <div className="space-y-6 text-center">
              {(() => {
                const total = questions.length || 1;
                const pct = Math.round((score / total) * 100);
                const gradeInfo = calculateGrade(pct);
                const earnedXp = Math.round((pct / 100) * (activeQuiz.xpReward || 150));

                return (
                  <>
                    <div className="py-2 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#635BFF] to-pink-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25">
                        <Trophy className="w-8 h-8" />
                      </div>

                      <div className="space-y-1">
                        <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${gradeInfo.bg} ${gradeInfo.color}`}>
                          Grade {gradeInfo.grade} • {gradeInfo.label}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                          {pct}% Accuracy
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          You answered {score} out of {total} questions correctly in {Math.floor(timeSpent / 60)}m {timeSpent % 60}s.
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">Total Score</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{score}/{total}</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">XP Earned</span>
                        <span className="text-lg font-bold text-[#635BFF] dark:text-indigo-400">+{earnedXp} XP</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">Best Streak</span>
                        <span className="text-lg font-bold text-amber-500">{bestStreak} 🔥</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 block">Storage</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-1">
                          <HardDriveDownload className="w-3.5 h-3.5" /> IndexedDB
                        </span>
                      </div>
                    </div>

                    {/* Offline Saved Badge Confirmation */}
                    {savedLocally && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Saved to local IndexedDB. Will automatically sync to school leaderboard when online!</span>
                      </div>
                    )}

                    {/* Question by Question Review */}
                    <div className="text-left space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Question Review & Solutions
                      </h4>

                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {userAnswers.map((ans, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs space-y-1 ${
                              ans.isCorrect
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                                : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {idx + 1}. {ans.question}
                              </span>
                              {ans.isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className={ans.isCorrect ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-rose-700 dark:text-rose-400 font-semibold"}>
                                Your Answer: {ans.selectedOption}
                              </span>
                              {!ans.isCorrect && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Correct: {ans.correctAnswer}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                              💡 {ans.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleStartQuiz(activeQuiz)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                      </button>

                      <button
                        onClick={() => setGameState("LOBBY")}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Pick Another Quiz
                      </button>

                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-lg shadow-indigo-500/20 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
