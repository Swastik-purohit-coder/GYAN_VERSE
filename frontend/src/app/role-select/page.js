"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { saveUserRole } from "@/lib/users";
import {
  GraduationCap,
  Users,
  ShieldCheck,
  Building2,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  ChevronRight,
  Tag,
  Award,
} from "lucide-react";

const schoolClasses = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const studentInterestTags = [
  "🤖 AI & Prompt Engineering",
  "💻 Python & Web Coding",
  "📐 Math Olympiad Prep",
  "🔬 Science & Robotics",
  "🎨 UI/UX & Design",
  "🏆 Monthly Hackathons",
  "📈 Financial Literacy",
  "🗣️ Public Speaking & Debate",
];

const teacherDepartments = [
  "Computer Science & Robotics",
  "Mathematics",
  "Physics & Physical Sciences",
  "Life Sciences & Biology",
  "Chemistry",
  "Social Sciences & Humanities",
  "Languages & Communication",
  "Commerce & Economics",
];

export default function RoleSelectPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Role, 2: Essential Info, 3: Optional Enrichment
  const [role, setRole] = useState("student"); // 'student' | 'teacher' | 'principal'
  const [saving, setSaving] = useState(false);

  // Core fields
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [mediumLanguage, setMediumLanguage] = useState("English");
  const [department, setDepartment] = useState("Computer Science & Robotics");
  const [assignedGrades, setAssignedGrades] = useState("Class 9, Class 10");
  const [designation, setDesignation] = useState("");

  // Optional fields
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [selectedInterests, setSelectedInterests] = useState(["🤖 AI & Prompt Engineering", "📐 Math Olympiad Prep"]);
  const [primaryGoal, setPrimaryGoal] = useState("Olympiad & Skill Development");
  const [parentContact, setParentContact] = useState("");
  const [experienceYears, setExperienceYears] = useState("5");
  const [specialization, setSpecialization] = useState("");
  const [boardAffiliation, setBoardAffiliation] = useState("CBSE");
  const [studentStrength, setStudentStrength] = useState("500–1500");

  useEffect(() => {
    if (isLoaded && !user) router.replace("/");
    if (user && !name) {
      setName(user.fullName || user.firstName || "");
    }
  }, [isLoaded, user, router, name]);

  const toggleInterest = (tag) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canProceedToStep3 = useMemo(() => {
    if (!name.trim()) return false;
    if (role === "student") return !!selectedClass;
    if (role === "teacher") return !!department.trim();
    if (role === "principal") return !!schoolName.trim();
    return true;
  }, [name, role, selectedClass, department, schoolName]);

  async function completeOnboarding(skipOptionals = false) {
    if (!user) return;
    setSaving(true);

    try {
      const normalizedRole = role === "principal" ? "principal" : role;
      const profileMetadata = {
        mediumLanguage,
        department: role !== "student" ? department : undefined,
        assignedGrades: role === "teacher" ? assignedGrades : undefined,
        designation: designation || (role === "principal" ? "Principal / Academic Director" : "Subject Faculty"),
        section: !skipOptionals ? section : undefined,
        rollNumber: !skipOptionals ? rollNumber : undefined,
        selectedInterests: !skipOptionals && role === "student" ? selectedInterests : undefined,
        primaryGoal: !skipOptionals && role === "student" ? primaryGoal : undefined,
        parentContact: !skipOptionals ? parentContact : undefined,
        experienceYears: !skipOptionals && role !== "student" ? experienceYears : undefined,
        specialization: !skipOptionals && role !== "student" ? specialization : undefined,
        boardAffiliation: !skipOptionals && role === "principal" ? boardAffiliation : undefined,
        studentStrength: !skipOptionals && role === "principal" ? studentStrength : undefined,
        onboardingCompleted: true,
      };

      try {
        await user.update({
          unsafeMetadata: {
            ...(user.unsafeMetadata || {}),
            role: normalizedRole,
            schoolId: schoolName.trim() || "default_school",
            class: role === "student" ? selectedClass : undefined,
            ...profileMetadata,
          },
        });
        if (user.reload) {
          await user.reload().catch(() => {});
        }
      } catch (e) {
        console.warn("Clerk unsafeMetadata update:", e);
      }

      await saveUserRole({
        userId: user.id,
        role: normalizedRole,
        name: name.trim(),
        schoolId: schoolName.trim() || "default_school",
        class: role === "student" ? selectedClass : undefined,
        ...profileMetadata,
      });

      router.replace(role === "student" ? "/student" : "/teacher");
    } catch (err) {
      console.error("Onboarding error:", err);
      alert(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-amber-100">
      <div className="w-full max-w-3xl bg-[#FFFFFF] border border-[#E8E3DA] rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
        
        {/* Clean Header */}
        <div className="px-6 py-5 md:px-8 bg-[#FAF8F5] border-b border-[#EAE5DC]">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs tracking-tight text-stone-900 uppercase">GYANARATNA</div>
                <div className="text-[11px] text-stone-500">Learning & Institutional Platform</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-stone-500">Step {step} of 3</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === step
                        ? "w-6 bg-stone-800"
                        : s < step
                        ? "w-3 bg-stone-400"
                        : "w-3 bg-[#E4DFD5]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <h1 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight">
            {step === 1 && "Select Your Institutional Role"}
            {step === 2 && "Essential Profile Information"}
            {step === 3 && "Personalize Your Academic Preferences"}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {step === 1 && "Choose how you will be using Gyanaratna to configure your workspace."}
            {step === 2 && "Fill in the required academic fields to personalize your learning portal."}
            {step === 3 && "Optional details for better recommendations. You can also update these anytime in Settings."}
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Student */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setRole("student")}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 ${
                  role === "student"
                    ? "bg-[#F7F4EE] border-stone-800 ring-1 ring-stone-800 shadow-sm"
                    : "bg-[#FCFBF9] border-[#E8E3DA] hover:border-stone-400 hover:bg-[#F9F7F2]"
                }`}
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EFECE6] text-stone-800 flex items-center justify-center text-xl font-bold">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                      Student
                      {role === "student" && <Check className="w-4 h-4 text-stone-900" />}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Interactive modules, practice quizzes, skill courses, peer study squads, and monthly competitions.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-stone-600 bg-[#EFECE6] px-2.5 py-1 rounded-md text-center">
                  Grades 1 to 12 & Olympiads
                </div>
              </div>

              {/* Teacher */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setRole("teacher")}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 ${
                  role === "teacher"
                    ? "bg-[#F7F4EE] border-stone-800 ring-1 ring-stone-800 shadow-sm"
                    : "bg-[#FCFBF9] border-[#E8E3DA] hover:border-stone-400 hover:bg-[#F9F7F2]"
                }`}
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EFECE6] text-stone-800 flex items-center justify-center text-xl font-bold">
                    👨‍🏫
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                      Teacher / Faculty
                      {role === "teacher" && <Check className="w-4 h-4 text-stone-900" />}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Manage classrooms, assign curriculum lessons, review student progress, and mentor sub-groups.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-stone-600 bg-[#EFECE6] px-2.5 py-1 rounded-md text-center">
                  Faculty & Department Leads
                </div>
              </div>

              {/* Principal */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setRole("principal")}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 ${
                  role === "principal"
                    ? "bg-[#F7F4EE] border-stone-800 ring-1 ring-stone-800 shadow-sm"
                    : "bg-[#FCFBF9] border-[#E8E3DA] hover:border-stone-400 hover:bg-[#F9F7F2]"
                }`}
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EFECE6] text-stone-800 flex items-center justify-center text-xl font-bold">
                    🏛️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                      Principal / Higher Authority
                      {role === "principal" && <Check className="w-4 h-4 text-stone-900" />}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Institution analytics, faculty oversight, noticeboard circulars, and comprehensive reports.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-stone-600 bg-[#EFECE6] px-2.5 py-1 rounded-md text-center">
                  Executive Leadership
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#EAE5DC]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
              >
                Continue to Essential Info <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Essential Info */}
        {step === 2 && (
          <div className="p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                  <span>Full Name <span className="text-rose-600">*</span></span>
                  <span className="text-[11px] text-stone-400 font-normal">Official academic record</span>
                </label>
                <input
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full official name"
                  required
                />
              </div>

              {/* Student */}
              {role === "student" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Grade / Class <span className="text-rose-600">*</span>
                    </label>
                    <select
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      {schoolClasses.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Medium of Instruction</label>
                    <select
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={mediumLanguage}
                      onChange={(e) => setMediumLanguage(e.target.value)}
                    >
                      <option value="English">English Medium</option>
                      <option value="Hindi">Hindi Medium</option>
                      <option value="Bilingual">Bilingual</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-stone-700">School / Institution Name</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Gyanaratna Model High School"
                    />
                  </div>
                </>
              )}

              {/* Teacher */}
              {role === "teacher" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Subject Department <span className="text-rose-600">*</span>
                    </label>
                    <select
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      {teacherDepartments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Designation / Title</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Faculty & Mentor"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-stone-700">Assigned Classes to Teach</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={assignedGrades}
                      onChange={(e) => setAssignedGrades(e.target.value)}
                      placeholder="e.g., Class 9, Class 10"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-stone-700">School / Institution Name</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Gyanaratna Model Senior School"
                    />
                  </div>
                </>
              )}

              {/* Principal */}
              {role === "principal" && (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-stone-700">
                      School / Institution Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Gyanaratna Central Academy"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Executive Title</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g., Principal & Academic Dean"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Affiliation Board</label>
                    <select
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={boardAffiliation}
                      onChange={(e) => setBoardAffiliation(e.target.value)}
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE / ISC</option>
                      <option value="State Board">State Board</option>
                      <option value="IB / Cambridge">IB / Cambridge</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#EAE5DC]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => completeOnboarding(true)}
                  disabled={!canProceedToStep3 || saving}
                  className="text-xs font-medium text-stone-500 hover:text-stone-800 px-3 py-2 rounded-lg transition-colors"
                >
                  {saving ? "Saving..." : "Skip Optionals & Finish"}
                </button>

                <button
                  type="button"
                  disabled={!canProceedToStep3}
                  onClick={() => setStep(3)}
                  className="bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  Next: Optional Details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Optional Enrichment */}
        {step === 3 && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F2EC] border border-[#E5DFD5] text-xs text-stone-600">
              <span>All fields below are <strong>optional</strong> and can be filled or changed later in your profile settings.</span>
              <span className="text-[10px] bg-[#EAE5DC] text-stone-700 px-2 py-0.5 rounded font-semibold uppercase">Optional</span>
            </div>

            {/* Student */}
            {role === "student" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700">
                    Favorite Learning Tracks & Skill Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {studentInterestTags.map((tag) => {
                      const active = selectedInterests.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            active
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-[#FAF8F5] text-stone-600 border-[#E2DDD5] hover:border-stone-400 hover:bg-white"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Class Section / Division</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="e.g. Section A"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Roll Number / Student ID</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 2026-CS-042"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Primary Goal / Ambition</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      placeholder="e.g. STEM Hackathon & Olympiad Prep"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Parent / Guardian Contact</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                      value={parentContact}
                      onChange={(e) => setParentContact(e.target.value)}
                      placeholder="parent@example.com (Optional)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Teacher */}
            {role === "teacher" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Years of Teaching Experience</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="e.g., 6 Years"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Area of Specialization</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g., Robotics & Artificial Intelligence"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Principal */}
            {role === "principal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Student Strength</label>
                    <select
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none"
                      value={studentStrength}
                      onChange={(e) => setStudentStrength(e.target.value)}
                    >
                      <option value="< 500">Under 500 Students</option>
                      <option value="500–1500">500 to 1,500 Students</option>
                      <option value="1500–3000">1,500 to 3,000 Students</option>
                      <option value="3000+">3,000+ Students</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Institutional Contact Desk</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                      value={parentContact}
                      onChange={(e) => setParentContact(e.target.value)}
                      placeholder="admin@school.edu / Phone"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#EAE5DC]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => completeOnboarding(true)}
                  disabled={saving}
                  className="text-xs font-medium text-stone-500 hover:text-stone-800 px-3 py-2 rounded-lg transition-colors"
                >
                  {saving ? "Saving..." : "Skip Remaining & Finish"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => completeOnboarding(false)}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs px-5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  {saving ? "Completing Setup..." : "Finish Setup & Launch"}
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
