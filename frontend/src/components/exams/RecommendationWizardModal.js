"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  GraduationCap,
  Compass,
  DollarSign,
  Building,
  Target,
  ArrowRight,
} from "lucide-react";

export default function RecommendationWizardModal({
  isOpen,
  onClose,
  initialProfile = {},
  onComplete,
}) {
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState(initialProfile.studentClass || 10);
  const [selectedStream, setSelectedStream] = useState(initialProfile.stream || "general");
  const [selectedAspiration, setSelectedAspiration] = useState(
    initialProfile.aspiration || "scholarship_financial_aid"
  );
  const [familyIncome, setFamilyIncome] = useState(initialProfile.familyIncome || "below_1_5L");
  const [stateDomicile, setStateDomicile] = useState(initialProfile.state || "Odisha");

  if (!isOpen) return null;

  const isJunior = selectedClass <= 10;

  // Stream choices tailored dynamically
  const juniorStreams = [
    { id: "general", label: "General School Curriculum", desc: "Balanced preparation across all subjects" },
    { id: "math_aptitude", label: "Math & Science Focus", desc: "Special interest in problem solving and Olympiads" },
    { id: "scholarship_focus", label: "Need & Merit Scholarships", desc: "Focus on state and central scholarships" },
  ];

  const seniorStreams = [
    { id: "pcm", label: "Science (PCM)", desc: "Physics, Chemistry, Mathematics (Engineering, Research, Defense)" },
    { id: "pcb", label: "Science (PCB)", desc: "Physics, Chemistry, Biology (Medical, Healthcare, Biotechnology)" },
    { id: "pcmb", label: "Science (PCMB)", desc: "Physics, Chemistry, Math & Biology (Both Tech & Medical)" },
    { id: "commerce", label: "Commerce", desc: "Accounts, Economics, Business Studies (CUET, CA, Finance)" },
    { id: "arts_humanities", label: "Arts & Humanities", desc: "History, Pol Science, Law, Civil Services, CUET" },
  ];

  // Career aspiration choices
  const juniorAspirations = [
    { id: "scholarship_financial_aid", label: "Scholarships & Financial Aid", icon: "💰", desc: "PMST, NMMS, NRTS, Merit Awards" },
    { id: "school_admissions", label: "Premier School Admissions", icon: "🏫", desc: "Navodaya (JNVST), Sainik School (AISSEE)" },
    { id: "talent_olympiads", label: "Olympiads & Talent Search", icon: "🏆", desc: "Science & Math Olympiads, NTSE foundation" },
  ];

  const seniorAspirations = [
    { id: "engineering_iit_nit", label: "Premier Engineering", icon: "⚙️", desc: "IITs, NITs, BITS, Top Technical Universities (JEE)" },
    { id: "medical_healthcare", label: "Medical & Dental", icon: "🩺", desc: "AIIMS, JIPMER, Govt Medical Colleges (NEET)" },
    { id: "defense_armed_forces", label: "Defense & Armed Forces", icon: "🎖️", desc: "Officer Cadre in Army, Navy, Air Force (NDA)" },
    { id: "pure_science_research", label: "Pure Science & Research", icon: "🔬", desc: "NISER, IISER, IISc, DAE (NEST, IAT)" },
    { id: "central_universities", label: "Central Universities", icon: "🏛️", desc: "DU, BHU, JNU, State Universities (CUET)" },
    { id: "law_judiciary", label: "Law & Legal Studies", icon: "⚖️", desc: "National Law Universities (CLAT)" },
    { id: "scholarship_financial_aid", label: "Higher Studies Scholarships", icon: "🎓", desc: "INSPIRE SHE (₹80k/yr), Central Sector Aid" },
  ];

  const streamOptions = isJunior ? juniorStreams : seniorStreams;
  const aspirationOptions = isJunior ? juniorAspirations : seniorAspirations;

  const handleNext = () => {
    if (step < 3) {
      // Auto adjust stream if class changed from junior to senior
      if (step === 1 && selectedClass >= 11 && selectedStream === "general") {
        setSelectedStream("pcm");
      }
      setStep((prev) => prev + 1);
    } else {
      // Final step submit
      const profileData = {
        studentClass: Number(selectedClass),
        stream: selectedStream,
        aspiration: selectedAspiration,
        familyIncome,
        state: stateDomicile,
      };

      try {
        localStorage.setItem("student_exam_profile", JSON.stringify(profileData));
      } catch {}

      if (onComplete) {
        onComplete(profileData);
      }
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-[#635BFF]/10 via-purple-500/5 to-transparent">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1 text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Exam Match Wizard • Step {step} of 3</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {step === 1 && "What class are you currently in?"}
            {step === 2 && "Select your subjects or study stream"}
            {step === 3 && "What is your primary dream goal?"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {step === 1 && "We personalize timelines, eligibility, and scholarship programs for your exact grade."}
            {step === 2 && "Helps match engineering, medical, defense, research, or merit tracks."}
            {step === 3 && "Matches your career ambition to high-value entrance examinations."}
          </p>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-[#635BFF] h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* STEP 1: CLASS SELECTION */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Choose Grade (Classes 5 to 12)
              </span>

              <div className="grid grid-cols-4 gap-2.5">
                {[5, 6, 7, 8, 9, 10, 11, 12].map((cls) => {
                  const isSelected = selectedClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`py-3.5 px-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "border-[#635BFF] bg-[#635BFF]/10 text-[#635BFF] font-extrabold shadow-xs scale-102"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                      }`}
                    >
                      <span className="block text-base sm:text-lg">Class {cls}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {cls <= 8 ? "Foundation" : cls <= 10 ? "Secondary" : "Sr Secondary"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* State & Income Quick Selectors */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    State Domicile:
                  </label>
                  <select
                    value={stateDomicile}
                    onChange={(e) => setStateDomicile(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="Odisha">Odisha (State + National Exams)</option>
                    <option value="All India">All India / Other States</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Family Annual Income:
                  </label>
                  <select
                    value={familyIncome}
                    onChange={(e) => setFamilyIncome(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="below_1_5L">Below ₹1.5 Lakhs (Full Aid Priority)</option>
                    <option value="1_5L_to_3_5L">₹1.5 Lakhs – ₹3.5 Lakhs (NMMS Eligible)</option>
                    <option value="3_5L_to_8L">₹3.5 Lakhs – ₹8.0 Lakhs</option>
                    <option value="above_8L">Above ₹8.0 Lakhs</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STREAM SELECTION */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Choose Stream or Academic Focus
              </span>

              <div className="space-y-2">
                {streamOptions.map((st) => {
                  const isSelected = selectedStream === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStream(st.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "border-[#635BFF] bg-[#635BFF]/10 text-slate-900 dark:text-white font-bold shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2">
                          {st.label}
                          {isSelected && <Check className="w-4 h-4 text-[#635BFF]" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {st.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: ASPIRATION SELECTION */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Target Career Direction
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {aspirationOptions.map((asp) => {
                  const isSelected = selectedAspiration === asp.id;
                  return (
                    <button
                      key={asp.id}
                      type="button"
                      onClick={() => setSelectedAspiration(asp.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#635BFF] bg-[#635BFF]/10 shadow-xs ring-1 ring-[#635BFF]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-base mb-1">
                        <span>{asp.icon}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {asp.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {asp.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249e0] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors ml-auto"
          >
            <span>{step === 3 ? "Find My Perfect Exams" : "Next Step"}</span>
            {step === 3 ? <Sparkles className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
