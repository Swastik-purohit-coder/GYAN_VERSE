"use client";

import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { saveUserRole } from "@/lib/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/student/components/ui/card";
import { Button } from "@/student/components/ui/button";
import { Badge } from "@/student/components/ui/badge";
import FooterNav from "@/components/FooterNav";
import {
  User,
  GraduationCap,
  Sparkles,
  Save,
  CheckCircle2,
  Check,
  Building2,
  BookOpen,
  Award,
  Layers,
  ShieldCheck,
  Mail,
  Phone,
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
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [selectedClass, setSelectedClass] = useState("Class 10");
  const [mediumLanguage, setMediumLanguage] = useState("English");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [parentContact, setParentContact] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      const meta = user.unsafeMetadata || {};
      setRole(meta.role || "student");
      setName(user.fullName || user.firstName || "");
      setSchoolName(meta.schoolId || "");
      setSelectedClass(meta.class || "Class 10");
      setMediumLanguage(meta.mediumLanguage || "English");
      setDepartment(meta.department || "");
      setDesignation(meta.designation || "");
      setSection(meta.section || "");
      setRollNumber(meta.rollNumber || "");
      setSelectedInterests(Array.isArray(meta.selectedInterests) ? meta.selectedInterests : ["🤖 AI & Prompt Engineering"]);
      setPrimaryGoal(meta.primaryGoal || "");
      setParentContact(meta.parentContact || "");
      setSpecialization(meta.specialization || "");
    }
  }, [user]);

  const toggleInterest = (tag) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const profileMetadata = {
        mediumLanguage,
        department: role !== "student" ? department : undefined,
        designation: designation || undefined,
        section: section || undefined,
        rollNumber: rollNumber || undefined,
        selectedInterests: role === "student" ? selectedInterests : undefined,
        primaryGoal: role === "student" ? primaryGoal : undefined,
        parentContact: parentContact || undefined,
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
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      alert("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans selection:bg-amber-100">
      <SignedIn>
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FFFFFF] border border-[#EAE5DC] text-stone-900 p-6 rounded-2xl shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#EFECE6] text-stone-700 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                  Profile & Preferences
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Account & Academic Settings</h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Update your academic grade, interests, and contact preferences anytime.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#E2DDD5] text-stone-700 capitalize font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-800" /> Role: {role}
              </span>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Profile and preferences successfully saved!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Core Essential Information */}
            <Card className="bg-[#FFFFFF] border-[#EAE5DC] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#F0EBE1]">
                <CardTitle className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-800" /> Essential Account Details
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Primary academic parameters used across your courses and assessments.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Full Name *</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your official full name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700">Institution / School Name</label>
                    <input
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="School name or code"
                    />
                  </div>

                  {role === "student" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700">Current Grade / Class *</label>
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
                    </>
                  )}

                  {role !== "student" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700">Subject Department</label>
                        <input
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Computer Science & Robotics"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700">Official Title / Designation</label>
                        <input
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Senior Faculty & Mentor"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optional Fields (Enrichment) */}
            <Card className="bg-[#FFFFFF] border-[#EAE5DC] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#F0EBE1] flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-stone-800" /> Additional & Optional Information
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-500">
                    Enrich your profile for personalized peer squads, skill courses, and notifications.
                  </CardDescription>
                </div>
                <span className="text-[10px] bg-[#EFECE6] text-stone-600 px-2 py-0.5 rounded font-medium">
                  Optional
                </span>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {role === "student" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-700">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700">Class Section / Division</label>
                        <input
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          placeholder="e.g. Section A"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700">Roll Number / Student ID</label>
                        <input
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="e.g. 2026-CS-042"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700">Primary Goal / Ambition</label>
                        <input
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                          value={primaryGoal}
                          onChange={(e) => setPrimaryGoal(e.target.value)}
                          placeholder="e.g. STEM Hackathons & Olympiad Prep"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700">Parent / Guardian Contact</label>
                        <input
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                          value={parentContact}
                          onChange={(e) => setParentContact(e.target.value)}
                          placeholder="parent@example.com (Optional)"
                        />
                      </div>
                    </div>
                  </>
                )}

                {role !== "student" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700">Area of Specialization</label>
                      <input
                        className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Artificial Intelligence, Robotics"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700">Institutional Contact Desk</label>
                      <input
                        className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-stone-800 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-stone-900 focus:outline-none transition-colors"
                        value={parentContact}
                        onChange={(e) => setParentContact(e.target.value)}
                        placeholder="admin@school.edu / Phone"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving Changes..." : "Save Profile Settings"}
              </button>
            </div>
          </form>
        </div>
        <FooterNav />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}
