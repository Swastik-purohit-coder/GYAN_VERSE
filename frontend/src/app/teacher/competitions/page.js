"use client";

import { useState, useMemo } from "react";
import { useCompetitions } from "@/hooks/useDashboardFeatures";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Input } from "@teacher/components/ui/input";
import { Textarea } from "@teacher/components/ui/textarea";
import { Progress } from "@teacher/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@teacher/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@teacher/components/ui/select";
import {
  Trophy,
  Plus,
  Search,
  Calendar,
  Sparkles,
  Users,
  Award,
  Medal,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Star,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function MonthlyCompetitionsPage() {
  const { user } = useUser();
  const { competitions, loading, addCompetition } = useCompetitions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "hackathon",
    status: "active",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 86400000 * 20).toISOString().split("T")[0],
    prize_pool: "₹25,000 + Merit Gold Trophies",
    team_size: "2–4 Members",
    target_class: "Class 8–12",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCompetition = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await addCompetition({
        ...formData,
        created_by: user?.fullName || "Principal / Academic Dean",
      });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "hackathon",
        status: "active",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 86400000 * 20).toISOString().split("T")[0],
        prize_pool: "₹25,000 + Merit Gold Trophies",
        team_size: "2–4 Members",
        target_class: "Class 8–12",
      });
    } catch (err) {
      console.error("Failed to launch competition:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((comp) => {
      const matchesSearch =
        comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.prize_pool?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "all" || comp.category === selectedCategory;
      const matchesStat = selectedStatus === "all" || comp.status === selectedStatus;
      return matchesSearch && matchesCat && matchesStat;
    });
  }, [competitions, searchQuery, selectedCategory, selectedStatus]);

  const stats = useMemo(() => {
    const total = competitions.length;
    const active = competitions.filter((c) => c.status === "active").length;
    const participants = competitions.reduce((acc, c) => acc + (c.participants_count || 32), 0);
    const submissions = competitions.reduce((acc, c) => acc + (c.submissions_count || 18), 0);

    return { total, active, participants, submissions };
  }, [competitions]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500 text-white font-semibold text-[10px] animate-pulse">Live Competition</Badge>;
      case "judging":
        return <Badge className="bg-amber-500 text-white font-semibold text-[10px]">Under Evaluation</Badge>;
      case "completed":
        return <Badge className="bg-slate-700 text-white font-semibold text-[10px]">Completed</Badge>;
      default:
        return <Badge className="bg-blue-500 text-white font-semibold text-[10px]">Upcoming</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-amber-950 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-amber-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-300" /> Institutional Excellence & Olympiads
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monthly Competitions & Hackathons</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Host school-wide monthly coding hackathons, math speed olympiads, science exhibitions, and track student champion leaderboards.
          </p>
        </div>

        {/* Launch Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 px-5 py-2.5 rounded-xl flex items-center gap-2 self-start md:self-auto">
              <Plus className="w-4 h-4 text-slate-950" /> Launch Monthly Challenge
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" /> Create Monthly Competition Challenge
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Configure competition problem statement, timelines, team criteria, and awards.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCompetition} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Competition Title *</label>
                <Input
                  placeholder="e.g., 🏆 October STEM Innovation Challenge: Autonomous AI & Clean Energy"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Track Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleInputChange("category", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hackathon">Coding & AI Hackathon</SelectItem>
                      <SelectItem value="olympiad">Math Olympiad</SelectItem>
                      <SelectItem value="science">Science Project Expo</SelectItem>
                      <SelectItem value="debate">Debate & Leadership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Team Format</label>
                  <Select
                    value={formData.team_size}
                    onValueChange={(val) => handleInputChange("team_size", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Team Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual (Solo)">Individual (Solo)</SelectItem>
                      <SelectItem value="2–4 Members">Team (2–4 Members)</SelectItem>
                      <SelectItem value="3–5 Members">Team (3–5 Members)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Eligibility Grade</label>
                  <Input
                    placeholder="Class 8–12"
                    value={formData.target_class}
                    onChange={(e) => handleInputChange("target_class", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Submission Deadline</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Prize Pool / Trophy Badges</label>
                  <Input
                    placeholder="₹25,000 + Merit Gold Badges"
                    value={formData.prize_pool}
                    onChange={(e) => handleInputChange("prize_pool", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Problem Statement & Guidelines</label>
                <Textarea
                  placeholder="State the core challenge prompt, submission formats (GitHub, PDF, Video Demo), and evaluation rubrics..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  {isSubmitting ? "Launching..." : "Publish Monthly Challenge"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Challenges</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Competitions</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Participating Teams</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.participants}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submissions Evaluated</div>
              <div className="text-2xl font-bold text-violet-600 mt-1">{stats.submissions}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search competitions, prize pools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter By:
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-44 text-xs h-8">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="hackathon">Hackathons</SelectItem>
              <SelectItem value="olympiad">Math Olympiads</SelectItem>
              <SelectItem value="science">Science Expo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32 text-xs h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Live Active</SelectItem>
              <SelectItem value="judging">Under Judging</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Competitions Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCompetitions.map((comp) => (
          <Card key={comp.id} className="bg-white border-slate-200/80 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(comp.status)}
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-600" /> {comp.prize_pool}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mt-2">{comp.title}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {comp.description}
              </p>

              {/* Detail Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Format</div>
                  <div className="font-bold text-slate-800 mt-0.5">{comp.team_size || "2-4 Members"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Registered</div>
                  <div className="font-bold text-indigo-600 mt-0.5">{comp.participants_count || 24} Teams</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Deadline</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {comp.end_date ? new Date(comp.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Nov 15"}
                  </div>
                </div>
              </div>

              {/* Top Podium preview if available */}
              {comp.leaderboard && comp.leaderboard.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-amber-500" /> Current Podium Standings
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {comp.leaderboard.slice(0, 3).map((lead, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1"
                      >
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[9px] font-bold inline-flex items-center justify-center">
                          #{lead.rank}
                        </span>
                        {lead.team_name} ({lead.score} pts)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
