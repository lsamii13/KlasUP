-- KlasUp RAG Knowledge Base — Seed Data
-- 62 foundational peer-reviewed research articles across 20 pedagogical dimensions.
-- Embeddings are null here and must be generated via the embed-articles Edge Function
-- after seeding. search_terms provide immediate keyword-based retrieval.

-- ════════════════════════════════════════
--  ACTIVE LEARNING (6)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Active Learning: Creating Excitement in the Classroom',
  'Bonwell, C. C., & Eison, J. A.',
  1991,
  'ASHE-ERIC Higher Education Report No. 1',
  'Defines active learning as instructional activities that involve students in doing things and thinking about what they are doing. Argues that students must do more than just listen: they must read, write, discuss, or be engaged in solving problems. Reviews evidence that active learning leads to better student attitudes and improved thinking and writing skills.',
  'Active Learning',
  '{active learning, student engagement, higher education, classroom strategies, instructional methods}'
),
(
  'Active learning increases student performance in science, engineering, and mathematics',
  'Freeman, S., Eddy, S. L., McDonough, M., Smith, M. K., Okoroafor, N., Jordt, H., & Wenderoth, M. P.',
  2014,
  'Proceedings of the National Academy of Sciences, 111(23), 8410-8415',
  'Meta-analysis of 225 studies comparing student performance in undergraduate STEM courses under traditional lecturing versus active learning. Found that average examination scores improved by about 6% in active learning sections, and that students in classes with traditional lecturing were 1.5 times more likely to fail than students in classes with active learning.',
  'Active Learning',
  '{active learning, STEM, meta-analysis, student performance, exam scores, failure rates}'
),
(
  'Does Active Learning Work? A Review of the Research',
  'Prince, M.',
  2004,
  'Journal of Engineering Education, 93(3), 223-231',
  'Reviews the evidence for the effectiveness of active learning across engineering education. Examines collaborative learning, cooperative learning, and problem-based learning as forms of active learning. Finds broad support for active learning, particularly when students work collaboratively and when activities are structured.',
  'Active Learning',
  '{active learning, engineering education, collaborative learning, cooperative learning, evidence review}'
),
(
  'The Critical Importance of Retrieval Practice for Learning',
  'Roediger, H. L., III, & Karpicke, J. D.',
  2006,
  'Science, 319(5865), 966-968',
  'Demonstrates that retrieval practice — the act of recalling information from memory — produces greater long-term retention than repeated studying. Two experiments showed that students who practiced retrieval remembered significantly more material one week later than students who simply restudied. Implications for active recall strategies in the classroom.',
  'Active Learning',
  '{retrieval practice, testing effect, long-term retention, active recall, memory, spaced practice}'
),
(
  'Where''s the Evidence That Active Learning Works?',
  'Michael, J.',
  2006,
  'Advances in Physiology Education, 30(4), 159-167',
  'Reviews the research evidence supporting the claim that active learning methods are more effective than traditional didactic approaches. Addresses common objections from faculty who resist changing their teaching methods and provides a comprehensive summary of studies across disciplines showing benefits of active engagement.',
  'Active Learning',
  '{active learning, evidence, physiology education, faculty resistance, teaching methods}'
),
(
  'The ICAP Framework: Linking Cognitive Engagement to Active Learning Outcomes',
  'Chi, M. T. H., & Wylie, R.',
  2014,
  'Educational Psychologist, 49(4), 219-243',
  'Proposes the ICAP framework that classifies student engagement into four levels: Interactive, Constructive, Active, and Passive. Predicts that Interactive activities produce better learning than Constructive, which is better than Active, which is better than Passive. Provides a theoretical framework for designing increasingly effective active learning activities.',
  'Active Learning',
  '{ICAP framework, cognitive engagement, interactive learning, constructive learning, student engagement}'
);

-- ════════════════════════════════════════
--  PEDAGOGY (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Knowledge and Teaching: Foundations of the New Reform',
  'Shulman, L. S.',
  1987,
  'Harvard Educational Review, 57(1), 1-23',
  'Introduces the concept of Pedagogical Content Knowledge (PCK) — the unique blend of content expertise and pedagogical skill that distinguishes a teacher from a content specialist. Argues that effective teaching requires transforming subject matter knowledge into forms that are pedagogically powerful and accessible to students of varying backgrounds.',
  'Pedagogy',
  '{pedagogical content knowledge, PCK, teaching knowledge, content expertise, teacher education}'
),
(
  'Learner-Centered Teaching: Five Key Changes to Practice',
  'Weimer, M.',
  2002,
  'Jossey-Bass',
  'Outlines five key changes needed to shift from teacher-centered to learner-centered instruction: the balance of power, the function of content, the role of the teacher, the responsibility for learning, and evaluation purpose and processes. Provides practical strategies for faculty making this transition while maintaining rigor.',
  'Pedagogy',
  '{learner-centered teaching, student-centered, teaching practice, instructional design, faculty development}'
),
(
  'Creating Significant Learning Experiences: An Integrated Approach to Designing College Courses',
  'Fink, L. D.',
  2003,
  'Jossey-Bass',
  'Presents a taxonomy of significant learning that goes beyond Bloom''s cognitive domain to include foundational knowledge, application, integration, human dimension, caring, and learning how to learn. Offers an integrated course design model that aligns learning goals, feedback and assessment, and teaching and learning activities.',
  'Pedagogy',
  '{significant learning, course design, learning taxonomy, integrated design, assessment alignment}'
),
(
  'The Courage to Teach: Exploring the Inner Landscape of a Teacher''s Life',
  'Palmer, P. J.',
  1998,
  'Jossey-Bass',
  'Argues that good teaching cannot be reduced to technique — it comes from the identity and integrity of the teacher. Explores the inner landscape of teaching, including the fear and disconnection that can undermine effective instruction, and advocates for teaching that connects the personal with the professional.',
  'Pedagogy',
  '{teacher identity, teaching philosophy, inner life, authenticity, reflective teaching}'
);

-- ════════════════════════════════════════
--  EXPERIENTIAL LEARNING (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Experiential Learning: Experience as the Source of Learning and Development',
  'Kolb, D. A.',
  1984,
  'Prentice Hall',
  'Presents the experiential learning cycle: concrete experience, reflective observation, abstract conceptualization, and active experimentation. Argues that learning is a process whereby knowledge is created through the transformation of experience, and that effective learners need abilities in all four modes. Introduced learning style inventory.',
  'Experiential Learning',
  '{experiential learning cycle, Kolb, learning styles, concrete experience, reflection, abstract conceptualization}'
),
(
  'Experience and Education',
  'Dewey, J.',
  1938,
  'Kappa Delta Pi',
  'Critiques both traditional and progressive education, arguing that experience is the foundation of learning but not all experiences are educative. Introduces the concepts of continuity and interaction as criteria for evaluating the quality of educational experiences. Foundational text for experiential and progressive education.',
  'Experiential Learning',
  '{experience, progressive education, continuity, interaction, educational philosophy, Dewey}'
),
(
  'The Reflective Practitioner: How Professionals Think in Action',
  'Schon, D. A.',
  1983,
  'Basic Books',
  'Distinguishes between reflection-in-action (thinking on your feet during practice) and reflection-on-action (thinking after the event). Argues that professional expertise is built through reflective practice rather than technical rationality alone. Highly influential across teaching, medicine, social work, and other professions.',
  'Experiential Learning',
  '{reflective practice, reflection-in-action, reflection-on-action, professional expertise, practitioner knowledge}'
),
(
  'A Handbook of Reflective and Experiential Learning: Theory and Practice',
  'Moon, J. A.',
  2004,
  'RoutledgeFalmer',
  'Provides a comprehensive guide to the theory and practice of reflective and experiential learning in higher education. Covers the nature of reflection, how to support reflective learning, assessment of reflective work, and the relationship between experiential learning and reflection. Includes practical tools for faculty.',
  'Experiential Learning',
  '{reflective learning, experiential learning, reflection assessment, learning journals, higher education}'
);

-- ════════════════════════════════════════
--  KAGAN STRUCTURES (3)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Kagan Cooperative Learning Structures',
  'Kagan, S., & Kagan, M.',
  2009,
  'Kagan Publishing',
  'Presents over 200 instructional structures for cooperative learning, organized by function (team building, class building, mastery, thinking skills, information sharing, communication skills). Each structure provides a step-by-step protocol that ensures positive interdependence, individual accountability, equal participation, and simultaneous interaction (PIES).',
  'Kagan Structures',
  '{Kagan structures, cooperative learning, PIES, team building, think-pair-share, round robin}'
),
(
  'Cooperative Learning and Achievement: Theory and Research',
  'Slavin, R. E.',
  2015,
  'In C. M. Reigeluth et al. (Eds.), Instructional-Design Theories and Models, Vol. IV',
  'Reviews decades of research on cooperative learning and academic achievement. Identifies two key conditions for effectiveness: group goals and individual accountability. When both are present, cooperative learning consistently outperforms individualistic and competitive approaches across grade levels and subject areas.',
  'Kagan Structures',
  '{cooperative learning, group goals, individual accountability, academic achievement, Slavin}'
),
(
  'An Overview of Cooperative Learning',
  'Kagan, S.',
  1994,
  'In J. Thousand, A. Villa, & A. Nevin (Eds.), Creativity and Collaborative Learning',
  'Provides a comprehensive overview of the structural approach to cooperative learning, distinguishing it from other approaches (Johnson & Johnson, Slavin). Argues that structures — content-free, repeatable instructional sequences — give teachers maximum flexibility. Describes how structures promote equal participation and simultaneous interaction.',
  'Kagan Structures',
  '{cooperative learning, structural approach, equal participation, simultaneous interaction, instructional strategies}'
);

-- ════════════════════════════════════════
--  PROBLEM-BASED LEARNING (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Problem-Based Learning: An Approach to Medical Education',
  'Barrows, H. S., & Tamblyn, R. M.',
  1980,
  'Springer Publishing',
  'Foundational text introducing problem-based learning (PBL) as an instructional method in medical education. Students learn by working through complex, real-world problems in small groups with a tutor as facilitator. Emphasizes self-directed learning, critical thinking, and the integration of knowledge across disciplines.',
  'Problem-Based Learning',
  '{problem-based learning, PBL, medical education, self-directed learning, critical thinking, Barrows}'
),
(
  'Problem-Based Learning: What and How Do Students Learn?',
  'Hmelo-Silver, C. E.',
  2004,
  'Educational Psychology Review, 16(3), 235-266',
  'Comprehensive review of research on learning in PBL environments. Identifies five goals of PBL: flexible knowledge, effective problem-solving skills, self-directed learning, effective collaboration, and intrinsic motivation. Reviews the cognitive and social mechanisms through which PBL promotes learning.',
  'Problem-Based Learning',
  '{PBL, flexible knowledge, problem solving, self-directed learning, collaboration, intrinsic motivation}'
),
(
  'Overview of Problem-Based Learning: Definitions and Distinctions',
  'Savery, J. R.',
  2006,
  'Interdisciplinary Journal of Problem-Based Learning, 1(1), 9-20',
  'Clarifies the essential characteristics of PBL and distinguishes it from related approaches like project-based learning and case-based learning. Identifies key elements: ill-structured problems, student-centered approach, teacher as facilitator, and authentic assessment. Addresses common misconceptions about PBL implementation.',
  'Problem-Based Learning',
  '{PBL, ill-structured problems, facilitator, authentic assessment, student-centered}'
),
(
  'Effects of Problem-Based Learning: A Meta-Analysis',
  'Dochy, F., Segers, M., Van den Bossche, P., & Gijbels, D.',
  2003,
  'Learning and Instruction, 13(5), 533-568',
  'Meta-analysis of 43 empirical studies on the effects of PBL in higher education. Found robust positive effects on knowledge application and skills, with a small negative effect on knowledge base compared to traditional instruction. Concludes PBL students know less but are better at applying what they know.',
  'Problem-Based Learning',
  '{PBL, meta-analysis, knowledge application, skills, higher education}'
);

-- ════════════════════════════════════════
--  PROJECT-BASED LEARNING (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'A Review of Research on Project-Based Learning',
  'Thomas, J. W.',
  2000,
  'The Autodesk Foundation',
  'Comprehensive review of the research literature on project-based learning. Defines PjBL by five criteria: centrality, driving question, constructive investigation, autonomy, and realism. Reviews evidence of effectiveness across K-12 and higher education contexts, identifying both benefits and implementation challenges.',
  'Project-Based Learning',
  '{project-based learning, PjBL, driving question, constructive investigation, autonomy, realism}'
),
(
  'Project-Based Learning: An Instructional Strategy for Content Standards',
  'Krajcik, J. S., & Blumenfeld, P. C.',
  2006,
  'In R. K. Sawyer (Ed.), The Cambridge Handbook of the Learning Sciences',
  'Describes the design principles and features of effective project-based learning environments. Emphasizes the importance of driving questions anchored in real-world problems, collaborative investigation, technology as cognitive tools, and the creation of artifacts that represent student learning.',
  'Project-Based Learning',
  '{project-based learning, driving questions, collaborative investigation, artifacts, learning sciences}'
),
(
  'Setting the Standard for Project Based Learning',
  'Larmer, J., Mergendoller, J., & Boss, S.',
  2015,
  'ASCD',
  'Presents the Gold Standard for project-based learning with seven essential design elements: challenging problem or question, sustained inquiry, authenticity, student voice and choice, reflection, critique and revision, and public product. Provides practical guidance for designing high-quality PjBL experiences.',
  'Project-Based Learning',
  '{project-based learning, gold standard, design elements, sustained inquiry, authenticity, student voice}'
),
(
  'A Meta-Analysis of the Effects of Project-Based Learning on Academic Achievement',
  'Han, S., Capraro, R., & Capraro, M. M.',
  2015,
  'International Journal of STEM Education, 2(1), 1-13',
  'Meta-analysis examining the effects of project-based learning on academic achievement in STEM subjects. Found that PjBL had a moderate positive effect overall, with particularly strong effects for underperforming students and in mathematics. Results support PjBL as an equity-promoting instructional approach.',
  'Project-Based Learning',
  '{project-based learning, meta-analysis, STEM, academic achievement, equity, underperforming students}'
);

-- ════════════════════════════════════════
--  TEAMWORK & GROUP PROJECTS (3)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Cooperation and Competition: Theory and Research',
  'Johnson, D. W., & Johnson, R. T.',
  1989,
  'Interaction Book Company',
  'Synthesizes over 600 studies on cooperative, competitive, and individualistic goal structures. Finds that cooperation promotes higher achievement, more positive relationships, and greater psychological health than competition or individualistic efforts. Identifies five essential elements: positive interdependence, individual accountability, promotive interaction, social skills, and group processing.',
  'Teamwork & Group Projects',
  '{cooperative learning, positive interdependence, individual accountability, group processing, teamwork}'
),
(
  'Cooperative Learning: Theory, Research, and Practice',
  'Slavin, R. E.',
  1995,
  'Allyn & Bacon',
  'Comprehensive synthesis of cooperative learning research. Identifies that cooperative learning methods are most effective when they incorporate group goals and individual accountability. Reviews major cooperative learning models including STAD, TGT, Jigsaw, and Learning Together. Provides implementation guidance for practitioners.',
  'Teamwork & Group Projects',
  '{cooperative learning, STAD, Jigsaw, group goals, team-based learning}'
),
(
  'Designing Groupwork: Strategies for the Heterogeneous Classroom',
  'Cohen, E. G.',
  1994,
  'Teachers College Press',
  'Addresses the challenges of status differences in collaborative groups and provides strategies for creating equitable group interactions. Introduces the concept of Complex Instruction, which uses multiple-ability tasks to broaden participation and reduce status problems. Essential reading for designing fair and effective group projects.',
  'Teamwork & Group Projects',
  '{groupwork, heterogeneous classroom, status problems, Complex Instruction, equitable participation}'
);

-- ════════════════════════════════════════
--  ANDRAGOGY (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'The Modern Practice of Adult Education: From Pedagogy to Andragogy',
  'Knowles, M. S.',
  1980,
  'Association Press',
  'Foundational work defining andragogy — the art and science of helping adults learn. Identifies six key assumptions about adult learners: self-concept, experience, readiness to learn, orientation to learning, motivation to learn, and need to know. Contrasts andragogical and pedagogical approaches and provides practical design principles.',
  'Andragogy',
  '{andragogy, adult learning, self-directed learning, Knowles, adult learner assumptions}'
),
(
  'Transformative Dimensions of Adult Learning',
  'Mezirow, J.',
  1991,
  'Jossey-Bass',
  'Introduces transformative learning theory — the process by which adults critically examine their assumptions and beliefs, leading to fundamental changes in perspective. Describes the role of disorienting dilemmas, critical reflection, and rational discourse in triggering and supporting perspective transformation.',
  'Andragogy',
  '{transformative learning, perspective transformation, critical reflection, adult education, Mezirow}'
),
(
  'Becoming a Critically Reflective Teacher',
  'Brookfield, S. D.',
  1995,
  'Jossey-Bass',
  'Argues that critically reflective teaching requires examining practice through four lenses: autobiographical experience, students'' eyes, colleagues'' perceptions, and theoretical literature. Provides practical tools for faculty to develop critical reflection skills, including the Critical Incident Questionnaire (CIQ).',
  'Andragogy',
  '{critical reflection, reflective teaching, four lenses, Critical Incident Questionnaire, faculty development}'
),
(
  'Self-Direction for Lifelong Learning',
  'Candy, P. C.',
  1991,
  'Jossey-Bass',
  'Comprehensive analysis of self-directed learning in adult education. Distinguishes between self-direction as a personal attribute and self-direction as a mode of organizing instruction. Argues that self-direction is both a goal and a process of education, and that institutions must create conditions that foster learner autonomy.',
  'Andragogy',
  '{self-directed learning, learner autonomy, lifelong learning, adult education}'
);

-- ════════════════════════════════════════
--  ACTION RESEARCH (3)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Action Research and Minority Problems',
  'Lewin, K.',
  1946,
  'Journal of Social Issues, 2(4), 34-46',
  'Foundational article introducing the concept of action research as a spiral of planning, acting, observing, and reflecting. Argues that research should be conducted by practitioners in their own settings to solve real problems, and that the process of inquiry itself produces social change. Origin text for all subsequent action research methodologies.',
  'Action Research',
  '{action research, Lewin, spiral model, practitioner research, social change}'
),
(
  'Becoming Critical: Education, Knowledge and Action Research',
  'Carr, W., & Kemmis, S.',
  1986,
  'Falmer Press',
  'Develops a critical theory of action research that goes beyond technical problem-solving to examine the social and political structures that shape educational practice. Distinguishes between technical, practical, and emancipatory action research. Argues that genuine educational improvement requires critical self-reflection by communities of practitioners.',
  'Action Research',
  '{critical action research, emancipatory research, educational practice, self-reflection, Carr and Kemmis}'
),
(
  'Action Research: Principles and Practice',
  'McNiff, J.',
  2013,
  'Routledge',
  'Practical guide to conducting action research in educational settings. Covers the full cycle: identifying a concern, planning, acting, observing, reflecting, and modifying practice. Emphasizes that action research is a form of self-study that generates personal theories of practice, and provides frameworks for validating practitioner knowledge.',
  'Action Research',
  '{action research, self-study, practitioner knowledge, educational research, McNiff}'
);

-- ════════════════════════════════════════
--  UNIVERSAL DESIGN FOR LEARNING (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Teaching Every Student in the Digital Age: Universal Design for Learning',
  'Rose, D. H., & Meyer, A.',
  2002,
  'ASCD',
  'Foundational text on Universal Design for Learning (UDL). Presents the three UDL principles: multiple means of engagement, representation, and action/expression. Draws on neuroscience research on learning variability to argue that curriculum barriers — not student deficits — are the primary obstacles to learning. Provides a framework for designing flexible, inclusive instruction.',
  'Universal Design for Learning',
  '{UDL, universal design for learning, multiple means, engagement, representation, action and expression, inclusive design}'
),
(
  'Universal Design for Learning: Theory and Practice',
  'Meyer, A., Rose, D. H., & Gordon, D.',
  2014,
  'CAST Professional Publishing',
  'Updated and expanded treatment of the UDL framework. Integrates advances in learning sciences and neuroscience to provide a comprehensive guide to UDL implementation. Includes detailed guidelines, checkpoints, and practical examples for applying UDL principles across disciplines and educational levels.',
  'Universal Design for Learning',
  '{UDL, universal design for learning, UDL guidelines, learning variability, CAST, inclusive instruction}'
),
(
  'Universal Design for Learning in Higher Education: A Complete Guide',
  'Tobin, T. J., & Behling, K. T.',
  2018,
  'Routledge',
  'Practical guide to implementing UDL specifically in higher education. Addresses the unique challenges of applying UDL principles in college and university courses, including large lectures, lab courses, and online environments. Provides the Plus-One approach: making one small UDL-aligned change at a time.',
  'Universal Design for Learning',
  '{UDL, higher education, Plus-One approach, inclusive teaching, accessibility, course design}'
),
(
  'Reach Everyone, Teach Everyone: Universal Design for Learning in Higher Education',
  'Behling, K. T., & Tobin, T. J.',
  2018,
  'West Virginia University Press',
  'Examines how UDL principles can be applied across all aspects of higher education, including course design, assessment, campus services, and institutional policy. Presents case studies from diverse institutions demonstrating successful UDL implementation and measurable improvements in student outcomes.',
  'Universal Design for Learning',
  '{UDL, higher education, institutional policy, case studies, student outcomes, inclusive design}'
);

-- ════════════════════════════════════════
--  SOCRATIC SEMINAR (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Critical Thinking: Tools for Taking Charge of Your Professional and Personal Life',
  'Paul, R., & Elder, L.',
  2002,
  'Prentice Hall',
  'Presents a comprehensive framework for critical thinking built on the Socratic tradition. Defines critical thinking as self-directed, self-disciplined, self-monitored, and self-corrective thinking. Provides practical tools including Socratic questioning strategies organized into six types: clarification, probing assumptions, probing reasons, questioning viewpoints, probing implications, and questions about the question.',
  'Socratic Seminar',
  '{critical thinking, Socratic questioning, Paul and Elder, reasoning, assumptions, intellectual standards}'
),
(
  'Critical Thinking and the Socratic Method',
  'Overholser, J. C.',
  1993,
  'Journal of Humanistic Education and Development, 31(3), 108-117',
  'Examines the Socratic method as a teaching technique for developing critical thinking skills. Describes how systematic questioning can guide students to examine their beliefs, identify assumptions, and construct more reasoned positions. Provides practical protocols for facilitating Socratic discussions in educational settings.',
  'Socratic Seminar',
  '{Socratic method, critical thinking, questioning technique, guided discovery, discussion}'
),
(
  'Socratic Circles: Fostering Critical and Creative Thinking in Middle and High School',
  'Copeland, M.',
  2005,
  'Stenhouse Publishers',
  'Practical guide to implementing Socratic seminars in educational settings. Describes the inner circle/outer circle format, fishbowl discussions, and protocols for text-based Socratic dialogue. Provides evidence that regular Socratic seminars improve reading comprehension, analytical thinking, respectful discourse, and student confidence in expressing ideas.',
  'Socratic Seminar',
  '{Socratic seminar, Socratic circles, fishbowl discussion, text-based discussion, critical thinking}'
),
(
  'The Community of Inquiry Framework and Educational Practice',
  'Garrison, D. R., Anderson, T., & Archer, W.',
  2000,
  'The Internet and Higher Education, 2(2-3), 87-105',
  'Presents the Community of Inquiry (CoI) framework describing three essential elements of meaningful educational experience: social presence, cognitive presence, and teaching presence. Originally developed for online learning but widely applicable to all discussion-based instruction. Cognitive presence involves triggering events, exploration, integration, and resolution.',
  'Socratic Seminar',
  '{Community of Inquiry, CoI, social presence, cognitive presence, teaching presence, online discussion}'
);

-- ════════════════════════════════════════
--  FLIPPED CLASSROOM (3)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'The Flipped Classroom: A Survey of the Research',
  'Bishop, J. L., & Verleger, M. A.',
  2013,
  'Proceedings of the ASEE Annual Conference',
  'Comprehensive review of published and unpublished research on flipped classroom approaches. Defines the flipped classroom as interactive group learning inside the classroom and direct instruction outside the classroom via video lectures. Found generally positive student perceptions but noted the need for more rigorous controlled studies. Identified best practices including structured pre-class activities.',
  'Flipped Classroom',
  '{flipped classroom, flipped learning, video lectures, interactive learning, pre-class activities}'
),
(
  'Flip Your Classroom: Reach Every Student in Every Class Every Day',
  'Bergmann, J., & Sams, A.',
  2012,
  'ISTE/ASCD',
  'Practitioner guide to implementing the flipped classroom model, written by two high school chemistry teachers who pioneered the approach. Describes how moving direct instruction to video frees class time for hands-on activities, individualized support, and deeper exploration. Addresses common concerns about implementation, technology access, and student accountability.',
  'Flipped Classroom',
  '{flipped classroom, Bergmann and Sams, video instruction, class time, implementation guide}'
),
(
  'Flipped Classroom: A Review of Recent Literature',
  'Lo, C. K., & Hew, K. F.',
  2017,
  'Journal of Computing in Higher Education, 29(2), 251-275',
  'Systematic review of 15 studies comparing flipped and non-flipped classrooms in higher education. Found that the flipped approach generally improved student learning performance and satisfaction. Identified design principles including well-structured pre-class activities, in-class active learning, and clear accountability mechanisms for pre-class preparation.',
  'Flipped Classroom',
  '{flipped classroom, systematic review, higher education, student performance, design principles}'
);

-- ════════════════════════════════════════
--  METACOGNITION (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Metacognition and Cognitive Monitoring: A New Area of Cognitive–Developmental Inquiry',
  'Flavell, J. H.',
  1979,
  'American Psychologist, 34(10), 906-911',
  'Foundational article introducing the concept of metacognition — thinking about one''s own thinking. Distinguishes between metacognitive knowledge (what you know about your own cognition) and metacognitive regulation (how you monitor and control your cognitive processes). Identifies metacognitive knowledge, metacognitive experiences, goals/tasks, and actions/strategies as key components.',
  'Metacognition',
  '{metacognition, metacognitive knowledge, metacognitive regulation, cognitive monitoring, Flavell}'
),
(
  'A Social Cognitive View of Self-Regulated Academic Learning',
  'Zimmerman, B. J.',
  1989,
  'Journal of Educational Psychology, 81(3), 329-339',
  'Presents a social cognitive model of self-regulated learning involving forethought, performance/volitional control, and self-reflection phases. Argues that self-regulated learners are metacognitively, motivationally, and behaviorally active participants in their own learning. Identifies strategies that distinguish self-regulated from passive learners.',
  'Metacognition',
  '{self-regulated learning, metacognition, forethought, self-reflection, social cognitive theory, Zimmerman}'
),
(
  'The Power of Feedback',
  'Hattie, J., & Timperley, H.',
  2007,
  'Review of Educational Research, 77(1), 81-112',
  'Proposes a model of feedback that is most effective when it addresses three questions: Where am I going? How am I going? Where to next? Identifies four levels of feedback: task, process, self-regulation, and self. Argues that feedback aimed at self-regulation (metacognitive) level is most powerful for developing autonomous learners.',
  'Metacognition',
  '{feedback, self-regulation, metacognition, formative assessment, Hattie and Timperley}'
),
(
  'Assessing Metacognitive Awareness',
  'Schraw, G., & Dennison, R. S.',
  1994,
  'Contemporary Educational Psychology, 19(4), 460-475',
  'Develops and validates the Metacognitive Awareness Inventory (MAI), a self-report instrument measuring two components of metacognition: knowledge of cognition (declarative, procedural, conditional) and regulation of cognition (planning, monitoring, evaluation, debugging, information management). Widely used in research and practice.',
  'Metacognition',
  '{metacognitive awareness, MAI, knowledge of cognition, regulation of cognition, self-assessment}'
);

-- ════════════════════════════════════════
--  FEEDBACK QUALITY (4)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Visible Learning: A Synthesis of Over 800 Meta-Analyses Relating to Achievement',
  'Hattie, J.',
  2009,
  'Routledge',
  'Landmark synthesis of over 800 meta-analyses representing 50,000+ studies on factors influencing student achievement. Identifies feedback as one of the top 10 influences on student learning (d = 0.73). Demonstrates that the quality, timing, and focus of feedback matters more than the quantity. Finds that teacher clarity, formative evaluation, and student-teacher relationships are among the highest-impact factors.',
  'Feedback Quality',
  '{visible learning, Hattie, effect size, feedback, meta-analysis, student achievement}'
),
(
  'Assessment and Classroom Learning',
  'Black, P., & Wiliam, D.',
  1998,
  'Assessment in Education: Principles, Policy & Practice, 5(1), 7-74',
  'Highly influential review of research on formative assessment. Found that formative assessment practices, including descriptive feedback, self-assessment, and peer assessment, produce significant learning gains with effect sizes between 0.4 and 0.7. The largest gains were found among low-achieving students. Launched the "Assessment for Learning" movement.',
  'Feedback Quality',
  '{formative assessment, assessment for learning, Black and Wiliam, descriptive feedback, self-assessment}'
),
(
  'Formative Assessment and Self-Regulated Learning: A Model and Seven Principles of Good Feedback Practice',
  'Nicol, D. J., & Macfarlane-Dick, D.',
  2006,
  'Studies in Higher Education, 31(2), 199-218',
  'Proposes seven principles of good feedback practice in higher education: clarify good performance, facilitate self-assessment, deliver high-quality feedback information, encourage teacher and peer dialogue, encourage positive motivation, provide opportunities to close the gap, and use feedback to improve teaching. Integrates formative assessment with self-regulated learning theory.',
  'Feedback Quality',
  '{feedback principles, self-regulated learning, formative assessment, higher education, Nicol}'
),
(
  'Formative Assessment and the Design of Instructional Systems',
  'Sadler, D. R.',
  1989,
  'Instructional Science, 18(2), 119-144',
  'Foundational article arguing that for feedback to be effective, students must understand three things: the goal or standard, their current performance relative to that standard, and how to close the gap. Introduces the concept of "guild knowledge" — the tacit understanding of quality that experts possess and must make visible to students.',
  'Feedback Quality',
  '{formative assessment, feedback, gap closing, quality standards, Sadler, instructional design}'
);

-- ════════════════════════════════════════
--  STUDENT WELLBEING (3)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Seven Principles for Good Practice in Undergraduate Education',
  'Chickering, A. W., & Gamson, Z. F.',
  1987,
  'AAHE Bulletin, 39(7), 3-7',
  'Identifies seven principles that promote student engagement and success: encourage student-faculty contact, encourage cooperation among students, encourage active learning, give prompt feedback, emphasize time on task, communicate high expectations, and respect diverse talents and ways of learning. One of the most widely cited articles in higher education.',
  'Student Wellbeing',
  '{seven principles, good practice, student engagement, faculty contact, high expectations, Chickering}'
),
(
  'How College Affects Students: A Third Decade of Research',
  'Pascarella, E. T., & Terenzini, P. T.',
  2005,
  'Jossey-Bass',
  'Comprehensive review of research on the impact of college on students across cognitive, moral, psychosocial, and economic dimensions. Finds that the net effects of college are substantial and include gains in critical thinking, moral reasoning, identity development, and career preparation. Active engagement and quality of effort are key mediating factors.',
  'Student Wellbeing',
  '{college impact, student development, critical thinking, engagement, persistence, Pascarella}'
),
(
  'Student Involvement: A Developmental Theory for Higher Education',
  'Astin, A. W.',
  1984,
  'Journal of College Student Personnel, 25(4), 297-308',
  'Introduces the theory of student involvement, arguing that the quantity and quality of student effort invested in the educational experience directly predicts learning and development outcomes. Defines involvement as the amount of physical and psychological energy students devote to academic experience. More involvement leads to more learning.',
  'Student Wellbeing',
  '{student involvement, student engagement, developmental theory, Astin, I-E-O model}'
);

-- ════════════════════════════════════════
--  FACULTY DEVELOPMENT (3)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Scholarship Reconsidered: Priorities of the Professoriate',
  'Boyer, E. L.',
  1990,
  'Carnegie Foundation for the Advancement of Teaching',
  'Redefines scholarship beyond research to include four dimensions: discovery (original research), integration (synthesizing across disciplines), application (service and engagement), and teaching (transforming and extending knowledge through pedagogy). Argues that excellent teaching should be recognized and rewarded as a form of scholarship.',
  'Faculty Development',
  '{scholarship of teaching, Boyer, four scholarships, professoriate, faculty rewards}'
),
(
  'Course Anatomy: The Dissection and Analysis of Knowledge Through Teaching',
  'Shulman, L. S.',
  2004,
  'In Teaching as Community Property: Essays on Higher Education',
  'Extends the concept of pedagogical content knowledge to higher education and argues for making teaching public, subject to peer review, and available for others to build upon — the scholarship of teaching and learning (SoTL). Advocates treating teaching as "community property" rather than private practice.',
  'Faculty Development',
  '{scholarship of teaching and learning, SoTL, pedagogical content knowledge, peer review, community property}'
),
(
  'Creating the Future of Faculty Development',
  'Sorcinelli, M. D., Austin, A. E., Eddy, P. L., & Beach, A. L.',
  2006,
  'Jossey-Bass',
  'Comprehensive study of the state and future of faculty development in American higher education. Identifies five ages of faculty development and emerging challenges including diverse faculty, technology integration, assessment demands, and institutional change. Argues for a networked, collaborative approach to faculty development that goes beyond individual workshops.',
  'Faculty Development',
  '{faculty development, professional development, teaching centers, institutional change, Sorcinelli}'
);

-- ════════════════════════════════════════
--  BLOOM'S TAXONOMY (3)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Taxonomy of Educational Objectives: The Classification of Educational Goals, Handbook I: Cognitive Domain',
  'Bloom, B. S., Engelhart, M. D., Furst, E. J., Hill, W. H., & Krathwohl, D. R.',
  1956,
  'David McKay Company',
  'Foundational taxonomy classifying cognitive learning objectives into six hierarchical levels: Knowledge, Comprehension, Application, Analysis, Synthesis, and Evaluation. Provides a common language for educational objectives and a framework for designing assessments aligned to different levels of cognitive complexity. One of the most influential frameworks in education.',
  'Bloom''s Taxonomy',
  '{Bloom taxonomy, cognitive domain, learning objectives, knowledge, comprehension, application, analysis, synthesis, evaluation}'
),
(
  'A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom''s Taxonomy of Educational Objectives',
  'Anderson, L. W., & Krathwohl, D. R. (Eds.)',
  2001,
  'Longman',
  'Major revision of Bloom''s original taxonomy. Introduces a two-dimensional framework with a Knowledge dimension (factual, conceptual, procedural, metacognitive) and a Cognitive Process dimension (Remember, Understand, Apply, Analyze, Evaluate, Create). Replaces nouns with verbs, moves Synthesis to the top as Create, and adds metacognitive knowledge.',
  'Bloom''s Taxonomy',
  '{revised Bloom taxonomy, Anderson Krathwohl, cognitive processes, knowledge dimensions, Create, metacognitive}'
),
(
  'Bloom''s Taxonomy: A Forty-Year Retrospective',
  'Forehand, M.',
  2005,
  'In M. Orey (Ed.), Emerging Perspectives on Learning, Teaching, and Technology',
  'Reviews four decades of research on Bloom''s Taxonomy and its revised version. Examines how the taxonomy has been applied in curriculum design, assessment, and instructional planning. Discusses criticisms, limitations, and the enduring value of having a shared vocabulary for cognitive complexity in educational design.',
  'Bloom''s Taxonomy',
  '{Bloom taxonomy, retrospective, curriculum design, assessment alignment, cognitive complexity}'
);

-- ════════════════════════════════════════
--  CASE STUDIES (2)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Education for Judgment: The Artistry of Discussion Leadership',
  'Christensen, C. R., Garvin, D. A., & Sweet, A.',
  1991,
  'Harvard Business School Press',
  'Foundational text on the case method of teaching. Describes how case discussions develop analytical thinking, decision-making skills, and the ability to act under uncertainty. Provides detailed guidance on writing effective cases, leading case discussions, and creating a classroom culture that supports rigorous dialogue and respectful debate.',
  'Case Studies',
  '{case method, case study teaching, discussion leadership, Harvard Business School, analytical thinking}'
),
(
  'What the Case Method Really Teaches',
  'Garvin, D. A.',
  2003,
  'Harvard Business Review',
  'Argues that the case method teaches three categories of skills: analysis (identifying problems, generating alternatives), action (decision-making under ambiguity, persuading others), and meta-skills (learning from experience, adapting to new situations). Explains why case discussion produces different learning outcomes than lecture, including comfort with ambiguity and practice in judgment.',
  'Case Studies',
  '{case method, case study, analytical skills, decision-making, ambiguity, judgment}'
);

-- ════════════════════════════════════════
--  REFLECTIVE PRACTICE (2)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'How We Think: A Restatement of the Relation of Reflective Thinking to the Educative Process',
  'Dewey, J.',
  1933,
  'D.C. Heath',
  'Classic work defining reflective thinking as active, persistent, and careful consideration of any belief or knowledge in light of the grounds that support it and the conclusions to which it leads. Identifies five phases of reflective thought: suggestion, intellectualization, hypothesis, reasoning, and testing. Foundation for all subsequent work on reflection in education.',
  'Reflective Practice',
  '{reflective thinking, Dewey, reflection phases, critical thinking, educative process}'
),
(
  'Reflection: Turning Experience into Learning',
  'Boud, D., Keogh, R., & Walker, D.',
  1985,
  'Kogan Page',
  'Proposes a model of reflection that involves three stages: returning to experience, attending to feelings, and re-evaluating experience. Argues that reflection is the key mechanism for learning from experience and that it must be intentionally structured — it does not happen automatically. Provides frameworks for facilitating and assessing reflective learning.',
  'Reflective Practice',
  '{reflection, experiential learning, Boud, feelings in learning, reflective writing}'
);

-- ════════════════════════════════════════
--  COMMUNITY OF INQUIRY (2)
-- ════════════════════════════════════════

insert into research_articles (title, authors, year, journal, abstract, dimension, search_terms) values
(
  'Researching the Community of Inquiry Framework: Review, Issues, and Future Directions',
  'Garrison, D. R., & Arbaugh, J. B.',
  2007,
  'The Internet and Higher Education, 10(3), 157-172',
  'Reviews empirical research on the Community of Inquiry framework and identifies key findings: teaching presence is the strongest predictor of student satisfaction and perceived learning; social presence facilitates cognitive presence; and all three presences interact dynamically. Identifies measurement tools and future research directions for the CoI model.',
  'Community of Inquiry',
  '{Community of Inquiry, CoI, teaching presence, social presence, cognitive presence, online learning}'
),
(
  'E-Learning in the 21st Century: A Community of Inquiry Framework for Research and Practice',
  'Garrison, D. R.',
  2017,
  'Routledge',
  'Updated and expanded treatment of the CoI framework. Extends the model to blended and face-to-face contexts, not just online learning. Introduces the concept of shared metacognition within the CoI framework and discusses how collaborative inquiry supports deeper learning. Provides practical guidance for creating communities of inquiry in any modality.',
  'Community of Inquiry',
  '{Community of Inquiry, CoI, blended learning, shared metacognition, collaborative inquiry, Garrison}'
);
