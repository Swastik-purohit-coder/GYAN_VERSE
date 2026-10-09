"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { saveUserRole } from "@/lib/users";
import {
  GraduationCap,
  BookOpen,
  Building2,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Cpu,
  Code,
  Calculator,
  FlaskConical,
  Palette,
  Trophy,
  TrendingUp,
  Mic,
  Sparkles,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Clock,
  Bell,
  Moon,
  Lock,
} from "lucide-react";

const schoolClasses = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const studentInterestOptions = [
  { id: "math", label: "Mathematics & Olympiad", icon: Calculator },
  { id: "science", label: "Science & Experiments", icon: FlaskConical },
  { id: "competitions", label: "School Competitions & Quiz", icon: Trophy },
  { id: "arts", label: "Creative Arts & Drawing", icon: Palette },
  { id: "debate", label: "Public Speaking & Debate", icon: Mic },
  { id: "gk", label: "General Knowledge & Social Studies", icon: TrendingUp },
  { id: "digital", label: "Computer & Digital Basics", icon: Cpu },
  { id: "language", label: "Language & Story Writing", icon: Sparkles },
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

  const [step, setStep] = useState(1); // 1: Role, 2: Essential Info, 3: Parent & Preferences
  const [role, setRole] = useState("student"); // 'student' | 'teacher' | 'principal'
  const [saving, setSaving] = useState(false);

  // Core essential fields
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [mediumLanguage, setMediumLanguage] = useState("English");
  const [department, setDepartment] = useState("Computer Science & Robotics");
  const [assignedGrades, setAssignedGrades] = useState("Class 9, Class 10");
  const [designation, setDesignation] = useState("");

  // Student specific essential & parental details
  const [dob, setDob] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState(""); // optional
  const [address, setAddress] = useState("");

  // Parent Controlling System settings
  const [parentalControl, setParentalControl] = useState({
    weeklyReports: true,
    dailyStudyLimit: "2 Hours / Day",
    safetyMode: true,
    quizAlerts: true,
    quietHours: false,
  });

  // Optional enrichment fields
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [selectedInterests, setSelectedInterests] = useState(["AI & Prompt Engineering", "Math Olympiad Prep"]);
  const [primaryGoal, setPrimaryGoal] = useState("Olympiad & Skill Development");
  const [experienceYears, setExperienceYears] = useState("5");
  const [specialization, setSpecialization] = useState("");
  const [boardAffiliation, setBoardAffiliation] = useState("CBSE");
  const [studentStrength, setStudentStrength] = useState("500–1500");

  useEffect(() => {
    if (isLoaded && !user) router.replace("/");
    if (user && !name) {
      setName(user.fullName || user.firstName || "");
    }
    if (user?.id) {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("edit") === "true" || params.get("change") === "true") {
          return;
        }
      }
      const metaRole = user?.unsafeMetadata?.role;
      const localRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
      let cookieRole = null;
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)gyan_user_role=([^;]+)/);
        if (match) cookieRole = decodeURIComponent(match[1]);
      }
      const effectiveRole =
        (metaRole && metaRole !== "unassigned" ? metaRole : null) ||
        (localRole && localRole !== "unassigned" ? localRole : null) ||
        (cookieRole && cookieRole !== "unassigned" ? cookieRole : null);

      if (effectiveRole === "student") {
        router.replace("/student/dashboard");
      } else if (["principal", "admin", "higher_body"].includes(effectiveRole)) {
        router.replace("/principal");
      } else if (effectiveRole === "teacher") {
        router.replace("/teacher/dashboard");
      }
    }
  }, [isLoaded, user, router, name]);

  const toggleInterest = (label) => {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const updateParentalControl = (key, value) => {
    setParentalControl((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const canProceedToStep3 = useMemo(() => {
    if (!name.trim()) return false;
    if (role === "student") {
      return !!selectedClass && !!dob.trim() && !!fatherName.trim();
    }
    if (role === "teacher") return !!department.trim();
    if (role === "principal") return !!schoolName.trim();
    return true;
  }, [name, role, selectedClass, dob, fatherName, department, schoolName]);

  async function completeOnboarding(skipOptionals = false) {
    if (!user) return;
    setSaving(true);

    try {
      const normalizedRole = role === "principal" ? "principal" : role;
      
      const profileMetadata = {
        dob: role === "student" ? dob : undefined,
        fatherName: role === "student" ? fatherName : undefined,
        parentPhone: role === "student" ? parentPhone : undefined,
        parentEmail: role === "student" ? parentEmail : undefined,
        studentPhone: role === "student" ? studentPhone : undefined,
        address: role === "student" ? address : undefined,
        parentalControl: role === "student" ? parentalControl : undefined,
        mediumLanguage,
        department: role !== "student" ? department : undefined,
        assignedGrades: role === "teacher" ? assignedGrades : undefined,
        designation: designation || (role === "principal" ? "Principal / Academic Director" : "Subject Faculty"),
        section: !skipOptionals ? section : undefined,
        rollNumber: !skipOptionals ? rollNumber : undefined,
        selectedInterests: !skipOptionals && role === "student" ? selectedInterests : undefined,
        primaryGoal: !skipOptionals && role === "student" ? primaryGoal : undefined,
        experienceYears: !skipOptionals && role !== "student" ? experienceYears : undefined,
        specialization: !skipOptionals && role !== "student" ? specialization : undefined,
        boardAffiliation: !skipOptionals && role === "principal" ? boardAffiliation : undefined,
        studentStrength: !skipOptionals && role === "principal" ? studentStrength : undefined,
        onboardingCompleted: true,
      };

      // 1. If student, register profile with full parental details into student directory
      if (normalizedRole === "student") {
        try {
          await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: user.id,
              userId: user.id,
              name: name.trim() || user.fullName || user.firstName || "Student",
              class: selectedClass,
              schoolId: schoolName.trim() || "default_school",
              dob,
              fatherName,
              parentPhone,
              parentEmail,
              studentPhone,
              address,
              section,
              rollNumber,
              mediumLanguage,
              parentalControl,
            }),
          });
        } catch (stdErr) {
          console.warn("[completeOnboarding] Student directory registration:", stdErr);
        }
      }

      // 2. Persist directly to Supabase user_roles and LocalStorage
      await saveUserRole({
        userId: user.id,
        role: normalizedRole,
        name: name.trim() || user.fullName || user.firstName || "User",
        schoolId: schoolName.trim() || "default_school",
        class: role === "student" ? selectedClass : (normalizedRole === "principal" ? "role:principal" : undefined),
        ...profileMetadata,
      });

      // 3. Sync to Clerk user metadata
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
      } catch (e) {
        console.warn("Clerk unsafeMetadata update:", e);
      }

      // 4. Immediate clean navigation to role portal
      const targetPath =
        normalizedRole === "student"
          ? "/student/dashboard"
          : normalizedRole === "principal"
          ? "/principal"
          : "/teacher/dashboard";

      if (typeof window !== "undefined") {
        document.cookie = `gyan_user_role=${normalizedRole}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem("userRole", normalizedRole);
        window.location.replace(targetPath);
      } else {
        router.replace(targetPath);
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      alert(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-grid-cream text-stone-800 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-stone-200">
      <div className="w-full max-w-3xl bg-[#FFFFFF] border border-[#E8E3DA] rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
        
        {/* Minimal Clean Header */}
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
            {step === 2 && (role === "student" ? "Student Essential Details & Identification" : "Essential Profile Information")}
            {step === 3 && (role === "student" ? "Parent Information & Controlling System" : "Personalize Your Academic Preferences")}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {step === 1 && "Choose how you will be using Gyanaratna to configure your workspace."}
            {step === 2 && (role === "student" ? "Enter student DOB, father's/guardian's name, and academic grade." : "Fill in the required academic fields to personalize your learning portal.")}
            {step === 3 && (role === "student" ? "Configure parent contact points and parental safety controls for progress reports." : "Optional details for better recommendations. You can also update these anytime in Settings.")}
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Student Card */}
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
                  <div className="w-10 h-10 rounded-lg bg-[#EFECE6] border border-[#DFD9CE] text-stone-800 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-stone-800" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                      Student
                      {role === "student" && <Check className="w-4 h-4 text-stone-900" />}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      Interactive curriculum modules, practice quizzes, skill micro-courses, peer squads, and competitions.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-stone-600 bg-[#EFECE6] px-2.5 py-1 rounded-md text-center">
                  Grades 1 to 12 & Olympiads
                </div>
              </div>

              {/* Teacher Card */}
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
                  <div className="w-10 h-10 rounded-lg bg-[#EFECE6] border border-[#DFD9CE] text-stone-800 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-stone-800" />
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

              {/* Principal Card */}
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
                  <div className="w-10 h-10 rounded-lg bg-[#EFECE6] border border-[#DFD9CE] text-stone-800 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-stone-800" />
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
                  <span>Student Full Name <span className="text-rose-600">*</span></span>
                  <span className="text-[11px] text-stone-400 font-normal">Official academic record</span>
                </label>
                <input
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              {/* Student Fields */}
              {role === "student" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <span>Date of Birth (DOB) <span className="text-rose-600">*</span></span>
                    </label>
                    <input
                      type="date"
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>Father&apos;s / Guardian&apos;s Name <span className="text-rose-600">*</span></span>
                    </label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Enter Father or Guardian full name"
                      required
                    />
                  </div>

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

              {/* Teacher Fields */}
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

              {/* Principal Fields */}
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
                  {saving ? "Saving..." : "Skip Remaining & Finish"}
                </button>

                <button
                  type="button"
                  disabled={!canProceedToStep3}
                  onClick={() => setStep(3)}
                  className="bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  Next: {role === "student" ? "Parent & Safety Controls" : "Academic Preferences"} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Parent Information & Parental Controlling System */}
        {step === 3 && (
          <div className="p-6 md:p-8 space-y-6">
            {role === "student" ? (
              <div className="space-y-6">
                {/* Parent Contact Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#EAE5DC]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-stone-800" />
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Parent & Contact Verification
                      </h3>
                    </div>
                    <span className="text-[11px] text-stone-500">Required for institutional security & updates</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-500" />
                        <span>Parent Phone Number <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="tel"
                        className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210 (For SMS / WhatsApp alerts)"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-stone-500" />
                        <span>Parent Email ID <span className="text-rose-600">*</span></span>
                      </label>
                      <input
                        type="email"
                        className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="parent.guardian@example.com (Weekly reports)"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>Student&apos;s Own Phone Number</span>
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="e.g. +91 91234 56789 (Optional)"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-500" />
                        <span>Residential Address</span>
                      </label>
                      <input
                        className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Flat No., Street, City, State, PIN"
                      />
                    </div>
                  </div>
                </div>

                {/* Parent Controlling System Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#EAE5DC]">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-stone-800" />
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Parent Controlling & Safety System
                      </h3>
                    </div>
                    <span className="text-[11px] text-stone-500">Customizable anytime from Settings</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Weekly Reports Toggle */}
                    <div className="p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FCFBF9] flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                          <Mail className="w-3.5 h-3.5 text-stone-800" /> Weekly Academic Digest
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          Automated weekly summary of quiz grades, study hours, and attendance sent to Parent Email.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={parentalControl.weeklyReports}
                        onChange={(e) => updateParentalControl("weeklyReports", e.target.checked)}
                        className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                      />
                    </div>

                    {/* Instant Quiz Score Alerts */}
                    <div className="p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FCFBF9] flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                          <Bell className="w-3.5 h-3.5 text-stone-800" /> Instant Assessment Alerts
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          Send direct SMS/notification alert to parent phone upon test or quiz completion.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={parentalControl.quizAlerts}
                        onChange={(e) => updateParentalControl("quizAlerts", e.target.checked)}
                        className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                      />
                    </div>

                    {/* Junior Content & Safety Shield */}
                    <div className="p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FCFBF9] flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                          <ShieldAlert className="w-3.5 h-3.5 text-stone-800" /> Junior Safety Shield
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          Curate resources to verified faculty & restrict unvetted external forums (Automatic for Class 1–6).
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={parentalControl.safetyMode}
                        onChange={(e) => updateParentalControl("safetyMode", e.target.checked)}
                        className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                      />
                    </div>

                    {/* Nighttime Curfew */}
                    <div className="p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FCFBF9] flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                          <Moon className="w-3.5 h-3.5 text-stone-800" /> Quiet Hours & Study Curfew
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          Restrict non-essential notifications and encourage healthy sleep schedule between 10 PM - 6 AM.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={parentalControl.quietHours}
                        onChange={(e) => updateParentalControl("quietHours", e.target.checked)}
                        className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Daily Screen Time / Study Hour Target */}
                  <div className="p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-stone-800 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-stone-900">Daily Study Screen Time Target</div>
                        <div className="text-[11px] text-stone-500">Notify student and parent when daily study target is reached</div>
                      </div>
                    </div>
                    <select
                      className="bg-white border border-[#E2DDD5] rounded-lg px-3 py-1.5 text-xs text-stone-800 font-medium focus:outline-none"
                      value={parentalControl.dailyStudyLimit}
                      onChange={(e) => updateParentalControl("dailyStudyLimit", e.target.value)}
                    >
                      <option value="1 Hour / Day">1 Hour / Day</option>
                      <option value="2 Hours / Day">2 Hours / Day</option>
                      <option value="3 Hours / Day">3 Hours / Day</option>
                      <option value="Flexible / No Limit">Flexible / No Limit</option>
                    </select>
                  </div>
                </div>

                {/* Additional Academic Interests */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#EAE5DC]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-stone-800" />
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Optional Interests & Class Info
                      </h3>
                    </div>
                    <span className="text-[10px] bg-[#EAE5DC] text-stone-700 px-2 py-0.5 rounded font-semibold uppercase">Optional</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {studentInterestOptions.map(({ id, label, icon: IconComponent }) => {
                      const active = selectedInterests.includes(label);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleInterest(label)}
                          className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                            active
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-[#FAF8F5] text-stone-600 border-[#E2DDD5] hover:border-stone-400 hover:bg-white"
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 ${active ? "text-white" : "text-stone-500"}`} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
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
                </div>
              </div>
            ) : (
              /* Teacher / Principal Options */
              <div className="space-y-4">
                {role === "teacher" && (
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
                )}

                {role === "principal" && (
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
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="admin@school.edu / Phone"
                      />
                    </div>
                  </div>
                )}
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
                  {saving ? "Saving..." : "Save & Continue"}
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
