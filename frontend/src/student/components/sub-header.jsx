import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Flame, Gift, Calendar, Target, Trophy, Star } from "lucide-react";
import { useI18n } from "@/i18n/useI18n";

export function SubHeader({ showStreak = false, showChallenge = false, showRewards = false, showProgress = false, user, todaysChallenge, nextLevelRewards, customContent, className = "" }) { if (!showStreak && !showChallenge && !showRewards && !showProgress && !customContent) {
    return null; }
  const { t } = useI18n();

  return (
    <div className={`px-4 py-3 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs text-slate-800 dark:text-slate-100 transition-colors ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 overflow-x-auto py-0.5">
          {/* Streak Counter */}
          {showStreak && user && (
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 whitespace-nowrap bg-gradient-to-r from-amber-50 to-orange-50/80 dark:from-orange-950/40 dark:to-amber-950/30 border border-orange-200/80 dark:border-orange-800/40 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {t.subHeader.dayStreak({ count: user.streak })}
                </span>
                <span className="text-[11px] font-medium text-orange-700 dark:text-orange-300 leading-tight">
                  {t.subHeader.keepItGoing()}
                </span>
              </div>
            </div>
          )}

          {/* Today's Challenge */}
          {showChallenge && todaysChallenge && (
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2 whitespace-nowrap bg-gradient-to-r from-sky-50 to-blue-50/80 dark:from-sky-950/40 dark:to-blue-950/30 border border-sky-200/80 dark:border-sky-800/40 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{todaysChallenge.icon}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {todaysChallenge.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden bg-sky-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${(todaysChallenge.progress / todaysChallenge.target) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">
                      {todaysChallenge.progress}/{todaysChallenge.target}
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs bg-white/80 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-slate-700 shadow-xs">
                +{todaysChallenge.reward} {t.common.xp()}
              </Badge>
            </div>
          )}

          {/* XP Progress to Next Level */}
          {showProgress && user && (
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2 whitespace-nowrap bg-gradient-to-r from-indigo-50 to-blue-50/80 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/40 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Star className="w-4 h-4 fill-indigo-500 text-indigo-500 dark:fill-indigo-400 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {t.subHeader.xpToLevel({ xp: user.xpToNextLevel - user.xp, level: user.level + 1 })}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden bg-indigo-200/80 dark:bg-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${(user.xp / user.xpToNextLevel) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                    {Math.round((user.xp / user.xpToNextLevel) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Level Rewards */}
          {showRewards && nextLevelRewards && nextLevelRewards.length > 0 && (
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-50 to-pink-50/80 dark:from-purple-950/40 dark:to-pink-950/30 border border-purple-200/80 dark:border-purple-800/40 rounded-xl px-3.5 py-2 whitespace-nowrap shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {t.subHeader.nextRewards()}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {nextLevelRewards.slice(0, 3).map((reward, index) => (
                    <span key={index} className="text-xs">
                      {reward.icon}
                    </span>
                  ))}
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                    {nextLevelRewards[0].name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Content */}
          {customContent && <div className="flex-1">{customContent}</div>}
        </div>
      </div>
    </div>
  );
}