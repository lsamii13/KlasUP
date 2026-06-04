// Mock data for syllabus import wizard (Stage 2 — UI only, no real extraction)

export const mockProposals = {
  outcomes: [
    { code: "LO1", label: "Social media strategy fundamentals", full_text: "Demonstrate understanding of core social media marketing strategies and their application to brand building.", confidence: "high" },
    { code: "LO2", label: "Platform-specific content creation", full_text: "Create platform-appropriate content for Instagram, TikTok, LinkedIn, and X that aligns with brand voice and audience expectations.", confidence: "high" },
    { code: "LO3", label: "Analytics and performance measurement", full_text: "Analyze social media performance metrics to evaluate campaign effectiveness and inform data-driven marketing decisions.", confidence: "high" },
    { code: "LO4", label: "Community management techniques", full_text: "Apply community management best practices to build and sustain engaged online audiences.", confidence: "high" },
    { code: "LO5", label: "Ethical social media practices", full_text: "Evaluate ethical considerations in social media marketing including transparency, data privacy, and responsible influence.", confidence: "high" },
    { code: "LO6", label: "Integrated campaign planning", full_text: "Design an integrated social media campaign that coordinates messaging across platforms and aligns with broader marketing objectives.", confidence: "high" },
  ],
  weeks: [
    { week_number: 1, topic: "Foundations of Social Media Marketing", detail: "Overview of the social media landscape and its role in modern marketing.", is_milestone: false, weekly_outcomes: ["LO1"], readings: ["Tuten & Solomon, Ch. 1-2"], lecture_topic: "The evolution of social media marketing", activities: ["Platform audit: students map their own social media usage"], discussion_board: "What brand do you follow on social media and why?", wellness_note: null, confidence: "high" },
    { week_number: 2, topic: "Audience Research & Personas", detail: "Identifying and segmenting target audiences for social media.", is_milestone: false, weekly_outcomes: ["LO1", "LO4"], readings: ["Tuten & Solomon, Ch. 3"], lecture_topic: "Building audience personas from data", activities: ["Workshop: create a persona for a local business"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 3, topic: "Content Strategy & Brand Voice", detail: "Developing a consistent brand voice and content calendar.", is_milestone: false, weekly_outcomes: ["LO2"], readings: ["Handley & Chapman, Everybody Writes, Ch. 1-5"], lecture_topic: "Brand voice frameworks", activities: ["Brand voice exercise: rewrite a press release in three different tones"], discussion_board: "Share an example of a brand whose voice you admire.", wellness_note: null, confidence: "high" },
    { week_number: 4, topic: "Visual Storytelling & Design", detail: "Principles of visual content creation for social platforms.", is_milestone: false, weekly_outcomes: ["LO2"], readings: ["Walter & Gioglio, The Power of Visual Storytelling, Ch. 2-3"], lecture_topic: null, activities: ["Canva lab: design a carousel post"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 5, topic: "Instagram & TikTok Deep Dive", detail: null, is_milestone: false, weekly_outcomes: ["LO2"], readings: [], lecture_topic: "Algorithm mechanics and content formats", activities: ["Create a 60-second TikTok concept storyboard", "Peer review: swap storyboards and give feedback"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 6, topic: "LinkedIn & Professional Branding", detail: "Using LinkedIn for B2B marketing and personal brand development.", is_milestone: false, weekly_outcomes: ["LO2", "LO4"], readings: ["Schaffer, The Age of Influence, Ch. 7"], lecture_topic: "B2B vs. B2C social strategies", activities: [], discussion_board: "Post your updated LinkedIn headline — get peer feedback.", wellness_note: null, confidence: "high" },
    { week_number: 7, topic: "Community Building & Engagement", detail: "Strategies for growing and managing online communities.", is_milestone: false, weekly_outcomes: ["LO4"], readings: ["Tuten & Solomon, Ch. 6"], lecture_topic: "Moderation, tone, and crisis response", activities: ["Role play: respond to a viral negative comment"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 8, topic: "Spring Break", detail: null, is_milestone: false, weekly_outcomes: [], readings: [], lecture_topic: null, activities: [], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 9, topic: "Social Media Analytics", detail: "Reading dashboards, interpreting KPIs, and reporting results.", is_milestone: false, weekly_outcomes: ["LO3"], readings: ["Tuten & Solomon, Ch. 9"], lecture_topic: "KPIs that matter vs. vanity metrics", activities: ["Lab: pull a real analytics report from a class account"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 10, topic: "Paid Social & Advertising", detail: "Budgeting, targeting, and A/B testing paid campaigns.", is_milestone: false, weekly_outcomes: ["LO3", "LO6"], readings: [], lecture_topic: "Facebook/Instagram Ads Manager walkthrough", activities: ["Budget simulation: allocate $500 across platforms"], discussion_board: "Is organic reach dead? Defend your position.", wellness_note: null, confidence: "high" },
    { week_number: 11, topic: "Influencer Marketing & Ethics", detail: "Evaluating influencer partnerships and navigating FTC guidelines.", is_milestone: false, weekly_outcomes: ["LO5"], readings: ["Schaffer, The Age of Influence, Ch. 10-11"], lecture_topic: "FTC disclosure requirements", activities: ["Case study: Fyre Festival — what went wrong"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 12, topic: "Crisis Communication on Social", detail: null, is_milestone: false, weekly_outcomes: ["LO4", "LO5"], readings: [], lecture_topic: "Real-time crisis response frameworks", activities: ["Simulation: draft a response to a data breach announcement"], discussion_board: null, wellness_note: "Check in with yourself — crisis topics can surface stress. Office hours are open.", confidence: "high" },
    { week_number: 13, topic: "Campaign Planning Workshop", detail: "In-class working session for final campaign projects.", is_milestone: false, weekly_outcomes: ["LO6"], readings: [], lecture_topic: null, activities: ["Peer feedback on draft campaign briefs"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 14, topic: "Building Brand Advocacy", detail: "Turning customers into advocates through loyalty programs and UGC.", is_milestone: false, weekly_outcomes: ["LO4", "LO6"], readings: ["Tuten & Solomon, Ch. 11"], lecture_topic: "User-generated content strategies", activities: [], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 15, topic: "Campaign Presentations", detail: "Student teams present their integrated campaign proposals.", is_milestone: false, weekly_outcomes: ["LO6"], readings: [], lecture_topic: null, activities: ["Team presentations (15 min each) + Q&A"], discussion_board: null, wellness_note: null, confidence: "high" },
    { week_number: 16, topic: "Course Wrap-Up & Reflection", detail: "Review of key themes, portfolio submission, and course evaluations.", is_milestone: true, weekly_outcomes: [], readings: [], lecture_topic: "Where social media marketing is heading", activities: ["Written reflection: what changed in how you think about social media"], discussion_board: null, wellness_note: null, confidence: "low" },
  ],
  assignments: [
    { title: "Integrated Social Media Campaign", assignment_type: "Project", description: "Teams of 3-4 design and present a multi-platform social media campaign for a real local business, including strategy brief, content calendar, sample posts, and projected KPIs.", due_week: null, due_date_text: "Presentations during Week 15 class sessions", suggested_lo_codes: ["LO2", "LO3", "LO6"], confidence: "high" },
    { title: "Personal Brand Portfolio", assignment_type: "Project", description: "Build and document your professional social media presence across LinkedIn and one other platform, with a reflective essay on strategy decisions.", due_week: null, due_date_text: "Due by last day of classes", suggested_lo_codes: ["LO2", "LO4"], confidence: "high" },
    { title: "Analytics Case Brief", assignment_type: "Other", description: null, due_week: 13, due_date_text: "April 10rd, 2018", suggested_lo_codes: ["LO6"], confidence: "low" },
    { title: "Ethical Dilemma Presentation", assignment_type: "Presentation", description: "Prepare a 10-minute presentation analyzing an ethical controversy in social media marketing, with recommendations.", due_week: null, due_date_text: null, suggested_lo_codes: [], confidence: "low" },
  ],
  missing_sections: [],
  notes: null,
};

export const mockCurrentCourse = {
  outcomes: [],
  weeks: [
    { week_number: 1, topic: null }, { week_number: 2, topic: null }, { week_number: 3, topic: null },
    { week_number: 4, topic: "Customer Loyalty Deep-Dive" },
    { week_number: 5, topic: null }, { week_number: 6, topic: null },
    { week_number: 7, topic: "Guest Speaker Week" },
    { week_number: 8, topic: null }, { week_number: 9, topic: null }, { week_number: 10, topic: null },
    { week_number: 11, topic: null }, { week_number: 12, topic: null }, { week_number: 13, topic: null },
    { week_number: 14, topic: null }, { week_number: 15, topic: null }, { week_number: 16, topic: null },
  ],
  assignments: [],
};
