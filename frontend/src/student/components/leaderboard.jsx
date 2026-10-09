import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Trophy } from "lucide-react";
import { useI18n } from "@/i18n/useI18n";
import { cacheApiResponse, getCachedApiResponse } from "@/lib/offlineDb";

const DEFAULT_OFFLINE_LEADERS = [
  { studentId: "lead_1", name: "Aarav Sharma", class: "Class 8", xp: 1450 },
  { studentId: "lead_2", name: "Priya Patel", class: "Class 8", xp: 1320 },
  { studentId: "lead_3", name: "Rohan Verma", class: "Class 8", xp: 1180 },
  { studentId: "lead_4", name: "Ananya Mishra", class: "Class 8", xp: 950 },
  { studentId: "lead_5", name: "Student (You)", class: "Class 8", xp: 820 },
];

export default function Leaderboard() {
	const { t } = useI18n();
	const [leaders, setLeaders] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadLeaderboard() {
			const cacheKey = "student_leaderboard";
			try {
				if (typeof navigator !== "undefined" && navigator.onLine) {
					const res = await fetch("/api/leaderboard", { cache: "no-store" });
					if (res.ok) {
						const data = await res.json();
						if (Array.isArray(data) && data.length > 0) {
							setLeaders(data);
							await cacheApiResponse(cacheKey, data);
							return;
						}
					}
				}
			} catch (e) {
				console.warn("Leaderboard network fetch failed, using cache:", e);
			}

			// Read cache
			const cached = await getCachedApiResponse(cacheKey);
			if (Array.isArray(cached) && cached.length > 0) {
				setLeaders(cached);
			} else {
				setLeaders(DEFAULT_OFFLINE_LEADERS);
			}
			setLoading(false);
		}

		loadLeaderboard().finally(() => setLoading(false));
	}, []);

	return (
		<Card className="bg-slate-900/90 border-slate-800 text-slate-100">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-amber-400">
					<Trophy className="w-5 h-5 text-amber-400" /> {t.leaderboard.title()}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{loading ? (
					<p className="text-sm text-slate-400 py-4 text-center">Loading leaderboard...</p>
				) : leaders.length === 0 ? (
					<p className="text-sm text-slate-400 py-4 text-center">No student rankings available yet.</p>
				) : (
					leaders.map((l, i) => (
						<div key={l.studentId || i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
							<div className="flex items-center gap-3">
								<Avatar className="w-8 h-8 bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
									<AvatarFallback>{(l.name || "S").charAt(0).toUpperCase()}</AvatarFallback>
								</Avatar>
								<div>
									<span className="font-medium text-slate-200">{i + 1}. {l.name}</span>
									{l.class && <span className="text-xs text-slate-400 block">{l.class}</span>}
								</div>
							</div>
							<span className="text-sm font-semibold text-amber-400">{l.xp || 0} {t.leaderboard.xpSuffix()}</span>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}

