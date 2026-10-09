/**
 * GyanVerse Recommendation Service (TypeScript)
 * Shared across mobile app and shared modules.
 */

import {
  ExamDetail,
  ExamRecommendation,
  StudentProfileForRecommendation,
  TargetClassBracket,
  ExamCategory,
} from '../types/exams';

export function getPersonalizedExamRecommendations(
  studentProfile: StudentProfileForRecommendation,
  examsList: ExamDetail[]
): ExamRecommendation[] {
  if (!Array.isArray(examsList) || examsList.length === 0) {
    return [];
  }

  const {
    studentClass = 10,
    stream = 'general',
    aspiration = 'scholarship_financial_aid',
    familyIncome = 'below_1_5L',
    state = 'Odisha',
  } = studentProfile || {};

  const recommendations: ExamRecommendation[] = [];

  for (const exam of examsList) {
    const eligibleClasses = exam.eligibleClasses || [];
    const streamRequired = exam.eligibility?.streamRequired || ['any'];
    const targetAspirations = exam.targetAspirations || [];
    const incomeCap = exam.eligibility?.incomeCap;
    const domicile = exam.eligibility?.domicile;

    let classScore = 0;
    let eligibilityStatus: 'eligible' | 'target_next_year' | 'ineligible' = 'eligible';
    const reasons: string[] = [];

    // 1. Class Alignment Evaluation
    const isDirectClass = eligibleClasses.includes(studentClass);
    const isFeederClass = eligibleClasses.some((c) => c === studentClass + 1);

    if (isDirectClass) {
      classScore = 40;
      eligibilityStatus = 'eligible';
      reasons.push(`Direct eligibility for Class ${studentClass}`);
    } else if (isFeederClass) {
      classScore = 30;
      eligibilityStatus = 'target_next_year';
      reasons.push(`Target preparation for Class ${studentClass + 1} admission/scholarship`);
    } else {
      const maxEligibleClass = Math.max(...eligibleClasses);
      if (studentClass > maxEligibleClass) {
        continue; // Filter out passed brackets
      } else {
        classScore = 15;
        eligibilityStatus = 'target_next_year';
        reasons.push(`Future milestone for Class ${eligibleClasses.join('/')}`);
      }
    }

    // 2. Stream Alignment Evaluation
    let streamScore = 0;
    const isJunior = studentClass <= 10;

    if (isJunior) {
      streamScore = 30;
      reasons.push('Universal foundation curriculum match');
    } else {
      const acceptsAny = streamRequired.includes('any');
      const acceptsPCM = streamRequired.includes('pcm') || streamRequired.includes('pcmb');
      const acceptsPCB = streamRequired.includes('pcb') || streamRequired.includes('pcmb');

      if (acceptsAny) {
        streamScore = 30;
        reasons.push('Open to all streams (Science, Commerce, Arts)');
      } else if ((stream === 'pcm' || stream === 'pcmb') && acceptsPCM) {
        streamScore = 30;
        reasons.push('Direct match for Science (PCM) stream');
      } else if ((stream === 'pcb' || stream === 'pcmb') && acceptsPCB) {
        streamScore = 30;
        reasons.push('Direct match for Science (PCB) stream');
      } else if (stream === 'commerce' && streamRequired.includes('commerce')) {
        streamScore = 30;
        reasons.push('Direct match for Commerce stream');
      } else if (stream === 'arts_humanities' && streamRequired.includes('arts_humanities')) {
        streamScore = 30;
        reasons.push('Direct match for Humanities stream');
      } else {
        streamScore = 10;
      }
    }

    // 3. Career Aspiration Alignment
    let aspirationScore = 0;
    const isAspirationMatch = targetAspirations.includes(aspiration);

    if (isAspirationMatch) {
      aspirationScore = 20;
      reasons.push(`Aligns directly with your career goal (${aspiration.replace(/_/g, ' ')})`);
    } else {
      aspirationScore = 8;
    }

    // 4. Financial Criteria & Quota Bonus
    let financialScore = 0;
    const isLowIncome = familyIncome === 'below_1_5L' || familyIncome === '1_5L_to_3_5L';

    if (incomeCap && isLowIncome) {
      financialScore = 10;
      reasons.push(`Qualifies for income criteria (< ₹${(incomeCap / 100000).toFixed(1)}L)`);
    } else if (exam.benefits?.type === 'free_education' && isLowIncome) {
      financialScore = 10;
      reasons.push('100% Free residential education with boarding');
    } else if (exam.benefits?.monetaryAmountPerYear && exam.benefits.monetaryAmountPerYear >= 10000) {
      financialScore = 8;
      reasons.push(`Provides ₹${exam.benefits.monetaryAmountPerYear.toLocaleString('en-IN')}/yr financial grant`);
    } else {
      financialScore = 5;
    }

    // 5. State / Domicile Boost
    let stateScore = 0;
    if (domicile && state) {
      if (domicile.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(domicile.toLowerCase())) {
        stateScore = 5;
        reasons.push(`State honor for students in ${state}`);
      }
    } else if (!domicile || domicile === 'All India') {
      stateScore = 3;
    }

    const rawScore = classScore + streamScore + aspirationScore + financialScore + stateScore;
    const matchScore = Math.min(100, Math.max(10, Math.round(rawScore)));

    let urgencyLevel: 'open_now' | 'closing_soon' | 'upcoming' | 'planning_ahead' = 'planning_ahead';
    if (exam.importantDates?.isApplicationLive) {
      urgencyLevel = 'open_now';
    } else if (exam.importantDates?.isDeadlineApproaching) {
      urgencyLevel = 'closing_soon';
    } else {
      urgencyLevel = isDirectClass ? 'upcoming' : 'planning_ahead';
    }

    let keyHighlight = '';
    if (exam.benefits?.monetaryAmountPerYear) {
      keyHighlight = `₹${exam.benefits.monetaryAmountPerYear.toLocaleString('en-IN')}/yr Stipend`;
    } else if (exam.benefits?.type === 'free_education') {
      keyHighlight = '100% Free Boarding';
    } else if (exam.benefits?.type === 'officer_commission') {
      keyHighlight = 'Officer Commission';
    } else {
      keyHighlight = exam.badge || 'National Entrance';
    }

    recommendations.push({
      exam,
      matchScore,
      matchReasons: reasons,
      eligibilityStatus,
      urgencyLevel,
      keyHighlight,
    });
  }

  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  return recommendations;
}

export function filterExams(
  examsList: ExamDetail[],
  filters: {
    classBracket?: TargetClassBracket;
    specificClass?: number | string;
    category?: ExamCategory | string;
    searchQuery?: string;
  }
): ExamDetail[] {
  if (!Array.isArray(examsList)) return [];

  const { classBracket, specificClass, category, searchQuery } = filters;

  return examsList.filter((exam) => {
    if (classBracket && classBracket !== 'all' && exam.classBracket !== classBracket) {
      return false;
    }

    if (specificClass && specificClass !== 'all') {
      const cls = Number(specificClass);
      if (!exam.eligibleClasses?.includes(cls)) {
        return false;
      }
    }

    if (category && category !== 'all' && exam.category !== category) {
      return false;
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = exam.title.toLowerCase().includes(q);
      const matchShortName = exam.shortName.toLowerCase().includes(q);
      const matchBody = exam.conductingBody.toLowerCase().includes(q);
      const matchTags = exam.recommendationTags?.some((t) => t.toLowerCase().includes(q));

      if (!matchTitle && !matchShortName && !matchBody && !matchTags) {
        return false;
      }
    }

    return true;
  });
}
