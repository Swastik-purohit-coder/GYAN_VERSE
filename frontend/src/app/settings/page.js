"use client";

import { useUser } from "@clerk/nextjs";
import OfflineSafeAuthGuard from "@/components/OfflineSafeAuthGuard";
import { useEffect, useState } from "react";
import { saveUserRole } from "@/lib/users";
import { useTheme } from "@/components/ThemeProvider";
import {
  User,
  GraduationCap,
  Sparkles,
  Save,
  CheckCircle2,
  Building2,
  BookOpen,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Bell,
  Moon,
  ShieldAlert,
  Lock,
  Loader2,
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

export default function SettingsPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [mediumLanguage, setMediumLanguage] = useState("English");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  // Student & Parental Details
  const [dob, setDob] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [address, setAddress] = useState("");

  // Parental Control System
  const [parentalControl, setParentalControl] = useState({
    weeklyReports: true,
    dailyStudyLimit: "2 Hours / Day",
    safetyMode: true,
    quizAlerts: true,
    quietHours: false,
  });

  // Optional Academic Enrichment
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const meta = user.unsafeMetadata || {};
    setRole(meta.role || "student");
    setName(user.fullName || user.firstName || "");
    setSchoolName(meta.schoolId || "");
    setSelectedClass(meta.class || "Class 10");
    setMediumLanguage(meta.mediumLanguage || "English");
    setDepartment(meta.department || "");
    setDesignation(meta.designation || "");

    setDob(meta.dob || "");
    setFatherName(meta.fatherName || "");
    setParentPhone(meta.parentPhone || "");
    setParentEmail(meta.parentEmail || "");
    setStudentPhone(meta.studentPhone || "");
    setAddress(meta.address || "");

    if (meta.parentalControl) {
      setParentalControl({
        weeklyReports: meta.parentalControl.weeklyReports ?? true,
        dailyStudyLimit: meta.parentalControl.dailyStudyLimit || "2 Hours / Day",
        safetyMode: meta.parentalControl.safetyMode ?? true,
        quizAlerts: meta.parentalControl.quizAlerts ?? true,
        quietHours: meta.parentalControl.quietHours ?? false,
      });
    }

    setSection(meta.section || "");
    setRollNumber(meta.rollNumber || "");
    setSelectedInterests(
      Array.isArray(meta.selectedInterests)
        ? meta.selectedInterests
        : ["🤖 AI & Prompt Engineering"]
    );
    setPrimaryGoal(meta.primaryGoal || "");
    setSpecialization(meta.specialization || "");

    // Also populate fresh details from Supabase user_roles database
    fetchUserRole(user.id)
      .then((dbDoc) => {
        if (!active || !dbDoc) return;
        if (dbDoc.role) setRole(dbDoc.role);
        if (dbDoc.name) setName(dbDoc.name);
        if (dbDoc.schoolId || dbDoc.school_id) setSchoolName(dbDoc.schoolId || dbDoc.school_id);
        if (dbDoc.class) setSelectedClass(dbDoc.class);
        if (dbDoc.mediumLanguage) setMediumLanguage(dbDoc.mediumLanguage);
        if (dbDoc.department) setDepartment(dbDoc.department);
        if (dbDoc.designation) setDesignation(dbDoc.designation);

        if (dbDoc.dob) setDob(dbDoc.dob);
        if (dbDoc.fatherName) setFatherName(dbDoc.fatherName);
        if (dbDoc.parentPhone || dbDoc.parent_phone) setParentPhone(dbDoc.parentPhone || dbDoc.parent_phone);
        if (dbDoc.parentEmail || dbDoc.parent_email) setParentEmail(dbDoc.parentEmail || dbDoc.parent_email);
        if (dbDoc.studentPhone || dbDoc.phone) setStudentPhone(dbDoc.studentPhone || dbDoc.phone);
        if (dbDoc.address) setAddress(dbDoc.address);

        if (dbDoc.parentalControl) {
          setParentalControl((prev) => ({
            ...prev,
            ...dbDoc.parentalControl,
          }));
        }

        if (dbDoc.section) setSection(dbDoc.section);
        if (dbDoc.rollNumber) setRollNumber(dbDoc.rollNumber);
        if (dbDoc.selectedInterests && Array.isArray(dbDoc.selectedInterests)) {
          setSelectedInterests(dbDoc.selectedInterests);
        }
        if (dbDoc.primaryGoal) setPrimaryGoal(dbDoc.primaryGoal);
        if (dbDoc.specialization) setSpecialization(dbDoc.specialization);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user]);

  const toggleInterest = (tag) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const updateParentalControl = (key, value) => {
    setParentalControl((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || undefined;

      const profileMetadata = {
        email,
        dob: role === "student" ? dob : undefined,
        fatherName: role === "student" ? fatherName : undefined,
        parentPhone: role === "student" ? parentPhone : undefined,
        parentEmail: role === "student" ? parentEmail : undefined,
        studentPhone: role === "student" ? studentPhone : undefined,
        address: role === "student" ? address : undefined,
        parentalControl: role === "student" ? parentalControl : undefined,
        mediumLanguage,
        department: role !== "student" ? department : undefined,
        designation: designation || undefined,
        section: section || undefined,
        rollNumber: rollNumber || undefined,
        selectedInterests: role === "student" ? selectedInterests : undefined,
        primaryGoal: role === "student" ? primaryGoal : undefined,
        specialization: role !== "student" ? specialization : undefined,
      };

      try {
        await user.update({
          unsafeMetadata: {
            ...(user.unsafeMetadata || {}),
            role,
            schoolId: schoolName.trim() || undefined,
            class: role === "student" ? selectedClass : undefined,
            ...profileMetadata,
          },
        });
        if (user.reload) await user.reload().catch(() => {});
      } catch (err) {
        console.warn("Clerk metadata save:", err);
      }

      await saveUserRole({
        userId: user.id,
        role,
        name: name.trim(),
        schoolId: schoolName.trim() || undefined,
        class: role === "student" ? selectedClass : undefined,
        ...profileMetadata,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4500);
    } catch (error) {
      alert("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Explicit theme token classes guaranteeing 100% readable contrast in both Light and Dark modes
  const t = {
    pageBg: isDark ? "bg-[#0B0F19] text-[#F8FAFC]" : "bg-[#F8FAFC] text-[#0F172A]",
    card: isDark ? "bg-[#111827] border-[#1F2937]" : "bg-white border-[#E2E8F0]",
    cardSubtle: isDark ? "bg-[#1E293B]/70 border-[#334155]" : "bg-[#F8FAFC] border-[#E2E8F0]",
    cardSubtleActive: isDark ? "bg-[#312E81]/30 border-[#4F46E5]/60" : "bg-[#EEF2FF] border-[#C7D2FE]",
    title: isDark ? "text-[#F8FAFC]" : "text-[#0F172A]",
    subtitle: isDark ? "text-[#94A3B8]" : "text-[#64748B]",
    label: isDark ? "text-[#E2E8F0]" : "text-[#1E293B]",
    input: isDark
      ? "bg-[#1E293B] border-[#334155] text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/20 [color-scheme:dark]"
      : "bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/15 [color-scheme:light]",
    select: isDark
      ? "bg-[#1E293B] border-[#334155] text-[#F8FAFC] focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/20"
      : "bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/15",
    tagActive: "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs",
    tagInactive: isDark
      ? "bg-[#1E293B] text-[#E2E8F0] border-[#334155] hover:border-[#6366F1] hover:bg-[#283548]"
      : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]",
    badge: isDark
      ? "bg-[#1E293B] text-[#E2E8F0] border-[#334155]"
      : "bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]",
    primaryBtn: "bg-[#4F46E5] hover:bg-[#4338CA] active:scale-98 text-white shadow-xs transition-all",
  };

  return (
    <OfflineSafeAuthGuard>
      <div className={`min-h-screen ${t.pageBg} font-sans selection:bg-indigo-100 selection:text-indigo-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Dynamic Profile Summary Header Card */}
          <div className={`${t.card} border rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden transition-colors`}>
            {/* Top decorative accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Dynamic Avatar */}
                <div className="relative shrink-0">
                  {user?.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.imageUrl}
                      alt={name || "Student Avatar"}
                      className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ${isDark ? "ring-[#1F2937]" : "ring-[#F1F5F9]"} shadow-xs`}
                    />
                  ) : (
                    <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold ring-4 ${isDark ? "ring-[#1F2937]" : "ring-[#F1F5F9]"} shadow-xs`}>
                      {(name || user?.firstName || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 ${isDark ? "border-[#111827]" : "border-white"} rounded-full`}
                    title="Online & Verified"
                  />
                </div>

                {/* Profile Meta Details */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${t.title}`}>
                      {name || user?.fullName || "Student Profile"}
                    </h1>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isDark ? "bg-[#312E81]/30 text-[#A5B4FC] border-[#4F46E5]/40" : "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"} border capitalize`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {role}
                    </span>
                  </div>

                  <p className={`text-xs sm:text-sm ${t.subtitle}`}>
                    {user?.primaryEmailAddress?.emailAddress || parentEmail || "Account & Academic Credentials"}
                  </p>

                  {/* Real Dynamic Data Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {role === "student" && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${t.badge} border`}>
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{selectedClass || "Class Not Set"}</span>
                      </span>
                    )}

                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${t.badge} border`}>
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{schoolName.trim() || "Institution Not Specified"}</span>
                    </span>

                    {role === "student" && mediumLanguage && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${t.badge} border`}>
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{mediumLanguage}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Action & Status */}
              <div className={`flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 ${isDark ? "border-[#1F2937]" : "border-[#F1F5F9]"}`}>
                <div className="text-left sm:text-right">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider block ${t.subtitle}`}>
                    Cloud Status
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl ${t.primaryBtn} disabled:opacity-60 cursor-pointer`}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success Feedback Alert */}
          {savedSuccess && (
            <div className={`p-4 rounded-xl ${isDark ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-800"} border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs transition-all`}>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Student profile and parental control parameters successfully updated!</span>
              </div>
              <span className={`text-[11px] font-semibold ${isDark ? "bg-emerald-900/60 text-emerald-300" : "bg-emerald-100 text-emerald-800"} px-2 py-0.5 rounded`}>
                Saved
              </span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Section 1: Student Identification & Academic Details */}
            <div className={`${t.card} border rounded-2xl shadow-xs overflow-hidden transition-colors`}>
              <div className={`p-5 sm:p-6 pb-4 border-b ${isDark ? "border-[#1F2937]" : "border-[#F1F5F9]"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${isDark ? "bg-[#312E81]/30 text-[#A5B4FC] border-[#4F46E5]/40" : "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"} flex items-center justify-center shrink-0 border`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className={`text-sm sm:text-base font-bold ${t.title}`}>
                      Student Identification & Academic Details
                    </h2>
                    <p className={`text-xs ${t.subtitle} mt-0.5`}>
                      Primary academic parameters used across course curricula and grading systems.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className={`block text-xs font-semibold ${t.label}`}>
                      Student Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your official full name"
                      required
                    />
                  </div>

                  {role === "student" && (
                    <>
                      <div className="space-y-1.5">
                        <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                          <Calendar className={`w-3.5 h-3.5 ${t.subtitle}`} />
                          <span>Date of Birth (DOB) <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                          type="date"
                          className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                          <User className={`w-3.5 h-3.5 ${t.subtitle}`} />
                          <span>Father&apos;s / Guardian&apos;s Name <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                          className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="Father or Guardian full name"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                      <Building2 className={`w-3.5 h-3.5 ${t.subtitle}`} />
                      <span>Institution / School Name</span>
                    </label>
                    <input
                      className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="School name or code"
                    />
                  </div>

                  {role === "student" && (
                    <>
                      <div className="space-y-1.5">
                        <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                          <GraduationCap className={`w-3.5 h-3.5 ${t.subtitle}`} />
                          <span>Current Grade / Class <span className="text-rose-500">*</span></span>
                        </label>
                        <select
                          className={`w-full ${t.select} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs cursor-pointer`}
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                        >
                          {schoolClasses.map((cls) => (
                            <option key={cls} value={cls} className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>
                              {cls}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                          <BookOpen className={`w-3.5 h-3.5 ${t.subtitle}`} />
                          <span>Medium of Instruction</span>
                        </label>
                        <select
                          className={`w-full ${t.select} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs cursor-pointer`}
                          value={mediumLanguage}
                          onChange={(e) => setMediumLanguage(e.target.value)}
                        >
                          <option value="English" className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>English Medium</option>
                          <option value="Hindi" className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>Hindi Medium</option>
                          <option value="Bilingual" className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>Bilingual</option>
                        </select>
                      </div>
                    </>
                  )}

                  {role !== "student" && (
                    <>
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${t.label}`}>
                          Subject Department
                        </label>
                        <input
                          className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Computer Science & Robotics"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${t.label}`}>
                          Official Title / Designation
                        </label>
                        <input
                          className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Senior Faculty & Mentor"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Parent & Student Contact Details */}
            {role === "student" && (
              <div className={`${t.card} border rounded-2xl shadow-xs overflow-hidden transition-colors`}>
                <div className={`p-5 sm:p-6 pb-4 border-b ${isDark ? "border-[#1F2937]" : "border-[#F1F5F9]"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${isDark ? "bg-purple-950/40 text-purple-300 border-purple-800/40" : "bg-purple-50 text-purple-600 border-purple-100"} flex items-center justify-center shrink-0 border`}>
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className={`text-sm sm:text-base font-bold ${t.title}`}>
                        Parent & Student Contact Details
                      </h2>
                      <p className={`text-xs ${t.subtitle} mt-0.5`}>
                        Official parent phone & email for grade alerts, school notices, and verification.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                        <Phone className={`w-3.5 h-3.5 ${t.subtitle}`} />
                        <span>Parent Phone Number <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="tel"
                        className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="+91 98765 43210 (Parent Mobile)"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                        <Mail className={`w-3.5 h-3.5 ${t.subtitle}`} />
                        <span>Parent Email ID <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="email"
                        className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="parent.guardian@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`flex items-center justify-between text-xs font-semibold ${t.label}`}>
                        <span className="flex items-center gap-1.5">
                          <Phone className={`w-3.5 h-3.5 ${t.subtitle}`} />
                          <span>Student&apos;s Own Phone Number</span>
                        </span>
                        <span className={`text-[10px] ${t.subtitle} font-normal`}>(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="+91 91234 56789 (Optional)"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-1.5 text-xs font-semibold ${t.label}`}>
                        <MapPin className={`w-3.5 h-3.5 ${t.subtitle}`} />
                        <span>Residential Address</span>
                      </label>
                      <input
                        className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Flat No., Street, City, State, PIN"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Parent Controlling & Supervision System */}
            {role === "student" && (
              <div className={`${t.card} border rounded-2xl shadow-xs overflow-hidden transition-colors`}>
                <div className={`p-5 sm:p-6 pb-4 border-b ${isDark ? "border-[#1F2937]" : "border-[#F1F5F9]"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${isDark ? "bg-amber-950/40 text-amber-300 border-amber-800/40" : "bg-amber-50 text-amber-600 border-amber-100"} flex items-center justify-center shrink-0 border`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className={`text-sm sm:text-base font-bold ${t.title}`}>
                        Parent Controlling & Supervision System
                      </h2>
                      <p className={`text-xs ${t.subtitle} mt-0.5`}>
                        Parental oversight, screen limits, and safety mode rules for this student profile.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Weekly Academic Digest */}
                    <div
                      className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                        parentalControl.weeklyReports ? t.cardSubtleActive : t.cardSubtle
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 font-semibold text-xs ${t.title}`}>
                          <Mail className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Weekly Academic Digest</span>
                        </div>
                        <p className={`text-[11px] ${t.subtitle} leading-relaxed`}>
                          Automated weekly summary of quiz grades and attendance sent to Parent Email.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={parentalControl.weeklyReports}
                          onChange={(e) => updateParentalControl("weeklyReports", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-9 h-5 ${isDark ? "bg-[#334155]" : "bg-[#CBD5E1]"} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5]`}></div>
                      </label>
                    </div>

                    {/* Instant Assessment Alerts */}
                    <div
                      className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                        parentalControl.quizAlerts ? t.cardSubtleActive : t.cardSubtle
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 font-semibold text-xs ${t.title}`}>
                          <Bell className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Instant Assessment Alerts</span>
                        </div>
                        <p className={`text-[11px] ${t.subtitle} leading-relaxed`}>
                          SMS / WhatsApp alert to parent phone upon test or quiz completion.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={parentalControl.quizAlerts}
                          onChange={(e) => updateParentalControl("quizAlerts", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-9 h-5 ${isDark ? "bg-[#334155]" : "bg-[#CBD5E1]"} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5]`}></div>
                      </label>
                    </div>

                    {/* Junior Safety Shield */}
                    <div
                      className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                        parentalControl.safetyMode ? t.cardSubtleActive : t.cardSubtle
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 font-semibold text-xs ${t.title}`}>
                          <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Junior Safety Shield</span>
                        </div>
                        <p className={`text-[11px] ${t.subtitle} leading-relaxed`}>
                          Restrict non-faculty community resources and forums (active by default for &le; Class 6).
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={parentalControl.safetyMode}
                          onChange={(e) => updateParentalControl("safetyMode", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-9 h-5 ${isDark ? "bg-[#334155]" : "bg-[#CBD5E1]"} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5]`}></div>
                      </label>
                    </div>

                    {/* Quiet Hours & Study Curfew */}
                    <div
                      className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                        parentalControl.quietHours ? t.cardSubtleActive : t.cardSubtle
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 font-semibold text-xs ${t.title}`}>
                          <Moon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Quiet Hours & Study Curfew</span>
                        </div>
                        <p className={`text-[11px] ${t.subtitle} leading-relaxed`}>
                          Enforce bedtime mode & silence non-critical notifications between 10 PM - 6 AM.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={parentalControl.quietHours}
                          onChange={(e) => updateParentalControl("quietHours", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-9 h-5 ${isDark ? "bg-[#334155]" : "bg-[#CBD5E1]"} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5]`}></div>
                      </label>
                    </div>
                  </div>

                  {/* Daily Study Screen Time Target */}
                  <div className={`p-4 rounded-xl border ${t.cardSubtle} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${isDark ? "bg-[#312E81]/30 text-[#A5B4FC] border-[#4F46E5]/40" : "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"} flex items-center justify-center shrink-0 border`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${t.title}`}>
                          Daily Study Screen Time Target
                        </div>
                        <div className={`text-[11px] ${t.subtitle}`}>
                          Alert parents when daily study goal or max screen time is reached
                        </div>
                      </div>
                    </div>
                    <select
                      className={`${t.select} rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none cursor-pointer shadow-xs`}
                      value={parentalControl.dailyStudyLimit}
                      onChange={(e) => updateParentalControl("dailyStudyLimit", e.target.value)}
                    >
                      <option value="1 Hour / Day" className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>1 Hour / Day</option>
                      <option value="2 Hours / Day" className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>2 Hours / Day</option>
                      <option value="3 Hours / Day" className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>3 Hours / Day</option>
                      <option value="Flexible / No Limit" className={isDark ? "bg-[#1E293B] text-[#F8FAFC]" : "bg-white text-[#0F172A]"}>Flexible / No Limit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Academic Focus & Learning Preferences (Optional) */}
            <div className={`${t.card} border rounded-2xl shadow-xs overflow-hidden transition-colors`}>
              <div className={`p-5 sm:p-6 pb-4 border-b ${isDark ? "border-[#1F2937]" : "border-[#F1F5F9]"} flex flex-row items-center justify-between`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${isDark ? "bg-purple-950/40 text-purple-300 border-purple-800/40" : "bg-purple-50 text-purple-600 border-purple-100"} flex items-center justify-center shrink-0 border`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className={`text-sm sm:text-base font-bold ${t.title}`}>
                      Additional Learning Preferences
                    </h2>
                    <p className={`text-xs ${t.subtitle} mt-0.5`}>
                      Enrich your profile for personalized peer squads, skill courses, and recommendations.
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${t.badge} border shrink-0`}>
                  Optional
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {role === "student" && (
                  <>
                    <div className="space-y-2">
                      <label className={`block text-xs font-semibold ${t.label}`}>
                        Learning Tracks & Skill Interests
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {studentInterestTags.map((tag) => {
                          const active = selectedInterests.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleInterest(tag)}
                              className={`text-xs px-3.5 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
                                active ? t.tagActive : t.tagInactive
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2">
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${t.label}`}>
                          Class Section / Division
                        </label>
                        <input
                          className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          placeholder="e.g. Section A"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className={`block text-xs font-semibold ${t.label}`}>
                          Roll Number / Student ID
                        </label>
                        <input
                          className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="e.g. 2026-CS-042"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className={`block text-xs font-semibold ${t.label}`}>
                          Primary Goal / Ambition
                        </label>
                        <input
                          className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                          value={primaryGoal}
                          onChange={(e) => setPrimaryGoal(e.target.value)}
                          placeholder="e.g. STEM Hackathons & Olympiad Prep"
                        />
                      </div>
                    </div>
                  </>
                )}

                {role !== "student" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold ${t.label}`}>
                        Area of Specialization
                      </label>
                      <input
                        className={`w-full ${t.input} rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-xs`}
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Artificial Intelligence, Robotics"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Form Action Bar */}
            <div className={`${t.card} border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors`}>
              <p className={`text-xs ${t.subtitle}`}>
                All modifications are saved securely to your cloud profile and verified via authentication.
              </p>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl ${t.primaryBtn} font-semibold text-xs sm:text-sm disabled:opacity-60 cursor-pointer shrink-0`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Saving Changes..." : "Save Profile & Controls"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </OfflineSafeAuthGuard>
  );
}
