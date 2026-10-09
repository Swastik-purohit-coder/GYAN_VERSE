/**
 * GyanVerse Deterministic Exam & Scholarship Recommendation Engine
 * Evaluates student profiles against 23+ national and state exams.
 */

/**
 * Calculates a personalized match score (0-100) and ranking for examinations
 * based on student class, stream, career aspiration, income bracket, and state.
 *
 * @param {Object} studentProfile
 * @param {number} studentProfile.studentClass Current school class (5-12)
 * @param {string} [studentProfile.stream] 'pcm' | 'pcb' | 'pcmb' | 'commerce' | 'arts_humanities' | 'general' | 'any'
 * @param {string} [studentProfile.aspiration] Target career goal / aspiration key
 * @param {string} [studentProfile.familyIncome] 'below_1_5L' | '1_5L_to_3_5L' | '3_5L_to_8L' | 'above_8L'
 * @param {string} [studentProfile.state] E.g. 'Odisha', 'All India'
 * @param {Array} examsList Array of ExamDetail objects from examsData
 * @returns {Array} Ranked list of exam recommendations with match scores and rationale
 */
export function getPersonalizedExamRecommendations(studentProfile, examsList) {
  if (!Array.isArray(examsList) || examsList.length === 0) {
    return [];
  }

  const {
    studentClass = 10,
    stream = "general",
    aspiration = "scholarship_financial_aid",
    familyIncome = "below_1_5L",
    state = "Odisha",
  } = studentProfile || {};

  const recommendations = [];

  for (const exam of examsList) {
    const eligibleClasses = exam.eligibleClasses || [];
    const streamRequired = exam.eligibility?.streamRequired || ["any"];
    const targetAspirations = exam.targetAspirations || [];
    const incomeCap = exam.eligibility?.incomeCap;
    const domicile = exam.eligibility?.domicile;

    let classScore = 0;
    let eligibilityStatus = "eligible";
    const reasons = [];

    // 1. Class Alignment Evaluation (Max 40 pts)
    const isDirectClass = eligibleClasses.includes(studentClass);
    const isFeederClass = eligibleClasses.some((c) => c === studentClass + 1);

    if (isDirectClass) {
      classScore = 40;
      eligibilityStatus = "eligible";
      reasons.push(`Direct eligibility for Class ${studentClass}`);
    } else if (isFeederClass) {
      classScore = 30;
      eligibilityStatus = "target_next_year";
      reasons.push(`Target preparation for Class ${studentClass + 1} admission/scholarship`);
    } else {
      // If student is past the eligible class, skip unless it's a multi-class talent test
      const maxEligibleClass = Math.max(...eligibleClasses);
      if (studentClass > maxEligibleClass) {
        continue; // Student has passed the allowed age/class bracket
      } else {
        classScore = 15;
        eligibilityStatus = "planning_ahead";
        reasons.push(`Future milestone for Class ${eligibleClasses.join("/")}`);
      }
    }

    // 2. Stream Alignment Evaluation (Max 30 pts)
    let streamScore = 0;
    const isJunior = studentClass <= 10;

    if (isJunior) {
      // Classes 5 to 10 follow universal foundational curriculum
      streamScore = 30;
      reasons.push("Universal foundation curriculum match");
    } else {
      // Classes 11 & 12 stream matching
      const acceptsAny = streamRequired.includes("any");
      const acceptsPCM = streamRequired.includes("pcm") || streamRequired.includes("pcmb");
      const acceptsPCB = streamRequired.includes("pcb") || streamRequired.includes("pcmb");

      if (acceptsAny) {
        streamScore = 30;
        reasons.push("Open to all streams (Science, Commerce, Arts)");
      } else if ((stream === "pcm" || stream === "pcmb") && acceptsPCM) {
        streamScore = 30;
        reasons.push("Direct match for Science (PCM) stream");
      } else if ((stream === "pcb" || stream === "pcmb") && acceptsPCB) {
        streamScore = 30;
        reasons.push("Direct match for Science (PCB) stream");
      } else if (stream === "commerce" && streamRequired.includes("commerce")) {
        streamScore = 30;
        reasons.push("Direct match for Commerce stream");
      } else if (stream === "arts_humanities" && streamRequired.includes("arts_humanities")) {
        streamScore = 30;
        reasons.push("Direct match for Humanities stream");
      } else {
        streamScore = 10;
      }
    }

    // 3. Career Aspiration Alignment (Max 20 pts)
    let aspirationScore = 0;
    const isAspirationMatch = targetAspirations.includes(aspiration);

    if (isAspirationMatch) {
      aspirationScore = 20;
      if (aspiration === "scholarship_financial_aid") {
        reasons.push("High-value financial scholarship & stipend opportunity");
      } else if (aspiration === "engineering_technology") {
        reasons.push("Direct pathway to premier engineering institutions (IITs/NITs)");
      } else if (aspiration === "medicine_healthcare") {
        reasons.push("Premier national medical entrance for MBBS / AIIMS");
      } else if (aspiration === "defense_armed_forces") {
        reasons.push("Direct Officer Commission in Indian Armed Forces");
      } else if (aspiration === "research_pure_science") {
        reasons.push("Premier scientific research & DISHA/INSPIRE fellowship");
      } else if (aspiration === "school_excellence") {
        reasons.push("100% Free residential education in premier central school");
      } else if (aspiration === "math_aptitude_olympiads") {
        reasons.push("Top tier mathematics talent & Olympiad recognition");
      } else if (aspiration === "central_universities") {
        reasons.push("Gateway to top central universities (DU, BHU, JNU)");
      } else if (aspiration === "law_legal_studies") {
        reasons.push("Admission to premier National Law Universities (NLUs)");
      }
    } else {
      aspirationScore = 8;
    }

    // 4. Financial Criteria & Quota Bonus (Max 10 pts)
    let financialScore = 0;
    const isLowIncome = familyIncome === "below_1_5L" || familyIncome === "1_5L_to_3_5L";

    if (incomeCap && isLowIncome) {
      financialScore = 12; // Extra boost for income-capped direct scholarships
      reasons.push(`Qualifies for income cap criteria (family income < ₹${(incomeCap / 100000).toFixed(1)}L)`);
    } else if (exam.benefits?.type === "free_education" && isLowIncome) {
      financialScore = 10;
      reasons.push("100% Free residential schooling with full living coverage");
    } else if (exam.benefits?.monetaryAmountPerYear && exam.benefits.monetaryAmountPerYear >= 10000) {
      financialScore = 8;
      reasons.push(`Provides ₹${exam.benefits.monetaryAmountPerYear.toLocaleString("en-IN")}/yr cash grant`);
    } else {
      financialScore = 5;
    }

    // 5. State / Domicile Boost (Max 8 pts)
    let stateScore = 0;
    if (domicile && state) {
      if (domicile.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(domicile.toLowerCase())) {
        stateScore = 8;
        reasons.push(`State honor for students in ${state}`);
      }
    } else if (!domicile || domicile === "All India") {
      stateScore = 2;
    }

    // 6. Specific Class Focus Bonus (Prioritize exams specifically tailored to this class)
    let specificityBonus = 0;
    if (eligibleClasses.length === 1 && eligibleClasses[0] === studentClass) {
      specificityBonus = 4;
      reasons.push(`Specifically designed for Class ${studentClass}`);
    }

    // Compute final aggregate match score (capped at 100%)
    const rawScore = classScore + streamScore + aspirationScore + financialScore + stateScore + specificityBonus;
    const matchScore = Math.min(100, Math.max(10, Math.round(rawScore)));

    // Urgency Level
    let urgencyLevel = "planning_ahead";
    if (exam.importantDates?.isApplicationLive) {
      urgencyLevel = "open_now";
    } else if (exam.importantDates?.isDeadlineApproaching) {
      urgencyLevel = "closing_soon";
    } else {
      urgencyLevel = isDirectClass ? "upcoming" : "planning_ahead";
    }

    // Key highlight
    let keyHighlight = "";
    if (exam.benefits?.monetaryAmountPerYear) {
      keyHighlight = `₹${exam.benefits.monetaryAmountPerYear.toLocaleString("en-IN")}/yr Stipend`;
    } else if (exam.benefits?.type === "free_education") {
      keyHighlight = "100% Free Boarding";
    } else if (exam.benefits?.type === "officer_commission") {
      keyHighlight = "Officer Commission";
    } else {
      keyHighlight = exam.badge || "National Entrance";
    }

    recommendations.push({
      exam,
      matchScore,
      rawScore,
      matchReasons: reasons,
      eligibilityStatus,
      urgencyLevel,
      keyHighlight,
    });
  }

  // Sort descending by rawScore; break ties with eligibility status, state, specificity, and benefit amount
  recommendations.sort((a, b) => {
    if (b.rawScore !== a.rawScore) {
      return b.rawScore - a.rawScore;
    }
    // Direct class over feeder class
    if (a.eligibilityStatus === "eligible" && b.eligibilityStatus !== "eligible") return -1;
    if (b.eligibilityStatus === "eligible" && a.eligibilityStatus !== "eligible") return 1;

    // State domicile match priority
    const aState = a.exam.eligibility?.domicile && state && a.exam.eligibility.domicile.toLowerCase().includes(state.toLowerCase());
    const bState = b.exam.eligibility?.domicile && state && b.exam.eligibility.domicile.toLowerCase().includes(state.toLowerCase());
    if (aState && !bState) return -1;
    if (bState && !aState) return 1;

    // Specificity of class (single class targeted over wide multi-class range)
    const aLen = a.exam.eligibleClasses?.length || 99;
    const bLen = b.exam.eligibleClasses?.length || 99;
    if (aLen !== bLen) return aLen - bLen;

    const bAmt = b.exam.benefits?.monetaryAmountPerYear || 0;
    const aAmt = a.exam.benefits?.monetaryAmountPerYear || 0;
    return bAmt - aAmt;
  });

  return recommendations;
}

/**
 * Filter exam directory by class bracket, category, search query, and status.
 */
export function filterExams(examsList, { classBracket, specificClass, category, status, searchQuery }) {
  if (!Array.isArray(examsList)) return [];

  return examsList.filter((exam) => {
    // 1. Class Bracket Filter
    if (classBracket && classBracket !== "all") {
      if (exam.classBracket !== classBracket) {
        return false;
      }
    }

    // 2. Specific Class Filter
    if (specificClass && specificClass !== "all") {
      const clsNum = Number(specificClass);
      if (!exam.eligibleClasses?.includes(clsNum)) {
        return false;
      }
    }

    // 3. Category Filter
    if (category && category !== "all") {
      if (exam.category !== category) {
        return false;
      }
    }

    // 4. Status Filter
    if (status && status !== "all") {
      if (status === "open_now" && !exam.importantDates?.isApplicationLive) {
        return false;
      }
      if (status === "closing_soon" && !exam.importantDates?.isDeadlineApproaching) {
        return false;
      }
    }

    // 5. Search Query
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = exam.title?.toLowerCase().includes(q);
      const matchShortName = exam.shortName?.toLowerCase().includes(q);
      const matchBody = exam.conductingBody?.toLowerCase().includes(q);
      const matchTags = exam.recommendationTags?.some((t) => t.toLowerCase().includes(q));
      const matchOverview = exam.overview?.toLowerCase().includes(q);

      if (!matchTitle && !matchShortName && !matchBody && !matchTags && !matchOverview) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Retrieves a single exam by ID or slug.
 */
export function getExamByIdOrSlug(idOrSlug, examsList) {
  if (!Array.isArray(examsList) || !idOrSlug) return null;
  return examsList.find((e) => e.id === idOrSlug || e.slug === idOrSlug) || null;
}
