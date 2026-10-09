import React, { useState, useMemo } from 'react';
import { Search, Filter, User, TrendingUp, TrendingDown, Minus, BookOpen, Award, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';

// STEM-focused student data
const studentsData = [
  { id: 1, name: "Sarah Mitchell", class: "Grade 6A - Mathematics", grade: 6, overallProgress: 85, subjects: {
      Mathematics: { progress: 85, trend: "up", recentActivity: "Algebra Problem Sets", lastActive: "2 hours ago" },
      Science: { progress: 78, trend: "up", recentActivity: "Lab: Chemical Reactions", lastActive: "1 day ago" },
      Technology: { progress: 82, trend: "stable", recentActivity: "Programming Basics", lastActive: "3 hours ago" },
      Engineering: { progress: 79, trend: "up", recentActivity: "Bridge Design Project", lastActive: "5 hours ago" }
    },
    achievements: ["STEM Excellence", "Math Champion", "Science Fair Winner"],
    totalLessons: 45,
    completedLessons: 38,
    averageScore: 81
  },
  { id: 2, name: "James Kumar", class: "Grade 6A - Mathematics", grade: 6, overallProgress: 72, subjects: {
      Mathematics: { progress: 72, trend: "up", recentActivity: "Geometry Fundamentals", lastActive: "4 hours ago" },
      Science: { progress: 68, trend: "stable", recentActivity: "Physics Concepts", lastActive: "2 days ago" },
      Technology: { progress: 75, trend: "up", recentActivity: "Digital Design", lastActive: "1 day ago" },
      Engineering: { progress: 73, trend: "stable", recentActivity: "Simple Machines", lastActive: "6 hours ago" }
    },
    achievements: ["Team Player", "Tech Innovator"],
    totalLessons: 45,
    completedLessons: 32,
    averageScore: 72
  },
  { id: 3, name: "Emily Chen", class: "Grade 7A - Science", grade: 7, overallProgress: 91, subjects: {
      Mathematics: { progress: 88, trend: "stable", recentActivity: "Advanced Algebra", lastActive: "1 hour ago" },
      Science: { progress: 95, trend: "up", recentActivity: "Advanced Chemistry Lab", lastActive: "3 hours ago" },
      Technology: { progress: 89, trend: "up", recentActivity: "Web Development", lastActive: "2 hours ago" },
      Engineering: { progress: 92, trend: "up", recentActivity: "Robotics Project", lastActive: "4 hours ago" }
    },
    achievements: ["Outstanding STEM Student", "Science Excellence", "Innovation Award", "Tech Leader"],
    totalLessons: 42,
    completedLessons: 40,
    averageScore: 91
  },
  { id: 4, name: "David Rodriguez", class: "Grade 8A - Technology", grade: 8, overallProgress: 58, subjects: {
      Mathematics: { progress: 52, trend: "down", recentActivity: "Pre-Algebra Review", lastActive: "1 week ago" },
      Science: { progress: 58, trend: "stable", recentActivity: "Basic Biology", lastActive: "3 days ago" },
      Technology: { progress: 65, trend: "up", recentActivity: "Computer Basics", lastActive: "2 days ago" },
      Engineering: { progress: 55, trend: "stable", recentActivity: "Design Thinking", lastActive: "4 days ago" }
    },
    achievements: ["Effort in Technology"],
    totalLessons: 38,
    completedLessons: 22,
    averageScore: 58
  },
  { id: 5, name: "Alex Thompson", class: "Grade 9A - Engineering", grade: 9, overallProgress: 87, subjects: {
      Mathematics: { progress: 84, trend: "stable", recentActivity: "Trigonometry", lastActive: "6 hours ago" },
      Science: { progress: 89, trend: "up", recentActivity: "Physics Lab", lastActive: "4 hours ago" },
      Technology: { progress: 88, trend: "up", recentActivity: "CAD Design", lastActive: "1 day ago" },
      Engineering: { progress: 87, trend: "stable", recentActivity: "Mechanical Systems", lastActive: "2 hours ago" }
    },
    achievements: ["Engineering Excellence", "Innovation Leader", "Design Thinking Award"],
    totalLessons: 40,
    completedLessons: 37,
    averageScore: 87
  },
  { id: 6, name: "Maya Patel", class: "Grade 10A - Advanced Mathematics", grade: 10, overallProgress: 93, subjects: {
      Mathematics: { progress: 96, trend: "up", recentActivity: "Calculus Introduction", lastActive: "1 hour ago" },
      Science: { progress: 91, trend: "stable", recentActivity: "Advanced Physics", lastActive: "3 hours ago" },
      Technology: { progress: 90, trend: "up", recentActivity: "AI Fundamentals", lastActive: "2 hours ago" },
      Engineering: { progress: 95, trend: "up", recentActivity: "Advanced Robotics", lastActive: "4 hours ago" }
    },
    achievements: ["STEM Valedictorian", "Math Olympiad", "Science Fair Champion", "Tech Innovation"],
    totalLessons: 48,
    completedLessons: 46,
    averageScore: 93
  }
];

const classOptions = [
  "All Classes",
  "Grade 6A - Mathematics",
  "Grade 6A - Science",
  "Grade 7A - Mathematics", 
  "Grade 7A - Science",
  "Grade 8A - Technology",
  "Grade 9A - Engineering",
  "Grade 10A - Advanced Mathematics",
  "Grade 11A - Advanced Science",
  "Grade 12A - Advanced Engineering"
];

export function StudentProgress({ compact = false }) {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(search.toLowerCase());
      const matchClass = selectedClass === 'All Classes' || student.class === selectedClass;
      return matchSearch && matchClass;
    });
  }, [search, selectedClass]);

  const renderTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500 inline" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-rose-500 inline" />;
    return <Minus className="w-4 h-4 text-slate-400 inline" />;
  };

  if (compact) {
    return (
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-800">
            <span>Student Progress Overview</span>
            <span className="text-xs font-normal text-slate-500">{studentsData.length} Students Tracked</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {studentsData.slice(0, 4).map(student => (
            <div key={student.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center rounded-full">
                  <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900 leading-none">{student.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{student.class}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-slate-900">{student.overallProgress}%</span>
                <Progress value={student.overallProgress} className="w-16 h-1.5 mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search student by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-[220px] bg-slate-50">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => (
          <Card key={student.id} className="border border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center rounded-full">
                    <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base text-slate-900">{student.name}</CardTitle>
                    <p className="text-xs text-slate-500">{student.class}</p>
                  </div>
                </div>
                <Badge variant={student.overallProgress >= 80 ? "default" : student.overallProgress >= 60 ? "secondary" : "destructive"}>
                  {student.overallProgress}% Overall
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Completed Lessons</span>
                  <span>{student.completedLessons} / {student.totalLessons}</span>
                </div>
                <Progress value={(student.completedLessons / student.totalLessons) * 100} className="h-2" />
              </div>

              {/* Subject Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Subject Mastery</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(student.subjects).map(([subject, data]) => (
                    <div key={subject} className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-600 truncate">{subject}</span>
                        <span className="font-semibold text-slate-800">{data.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Trend</span>
                        <span>{renderTrendIcon(data.trend)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Badges & Achievements</p>
                <div className="flex flex-wrap gap-1">
                  {student.achievements.map((ach, idx) => (
                    <span key={idx} className="inline-flex items-center text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                      <Award className="w-2.5 h-2.5 mr-1 text-amber-600" />
                      {ach}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
export default StudentProgress;
