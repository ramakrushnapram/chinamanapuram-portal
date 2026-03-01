import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */

/* ── Village Stats ── */
const VSTAT_CARDS = [
  { icon: '👩‍🎓', num: 218,    label: 'Total Students',        color: '#065f46', bg: '#d1fae5' },
  { icon: '📈',  num: '94.2%', label: 'SSC Pass % (2025)',      color: '#1e3a8a', bg: '#dbeafe', hi: true },
  { icon: '🏫',  num: 42,      label: 'Class 10 Appeared',      color: '#4c1d95', bg: '#ede9fe' },
  { icon: '🎓',  num: 40,      label: 'Class 10 Passed',        color: '#164e63', bg: '#cffafe' },
  { icon: '📚',  num: 31,      label: 'Intermediate Students',  color: '#92400e', bg: '#fef3c7' },
  { icon: '🏛️', num: 15,      label: 'College Students',       color: '#991b1b', bg: '#fee2e2' },
];

const SSC_TOPPERS = [
  { rank: 1, name: 'Kavya Nageswara Rao', marks: '595 / 600', medal: '🥇' },
  { rank: 2, name: 'Ravi Teja Babu',      marks: '582 / 600', medal: '🥈' },
  { rank: 3, name: 'Sravani Devi',        marks: '578 / 600', medal: '🥉' },
];
const IPE_TOPPERS = [
  { rank: 1, name: 'Dhanalakshmi Rao', marks: '970 / 1000', stream: 'BiPC', medal: '🥇' },
  { rank: 2, name: 'Kranthi Kumar',    marks: '948 / 1000', stream: 'MPC',  medal: '🥈' },
];

/* ── Education Flow ── */
const EDU_FLOW = [
  { step: 1, icon: '🏫', label: 'Primary',     classes: 'Class 1–5',    age: 'Age 5–10',  desc: 'Foundation of literacy & numeracy',              color: '#d1fae5', fg: '#065f46' },
  { step: 2, icon: '📚', label: 'Upper Primary',classes: 'Class 6–8',   age: 'Age 11–13', desc: 'Languages, Science, Maths, Social',              color: '#dbeafe', fg: '#1e3a8a' },
  { step: 3, icon: '📝', label: 'High School',  classes: 'Class 9–10',  age: 'Age 14–15', desc: 'SSC Board Exam — gateway to all streams',        color: '#fef3c7', fg: '#92400e' },
  { step: 4, icon: '🎓', label: 'Intermediate', classes: 'Class 11–12', age: 'Age 16–17', desc: 'MPC / BiPC / CEC / HEC streams',                 color: '#ede9fe', fg: '#4c1d95' },
  { step: 5, icon: '🏛️',label: 'Degree / ITI', classes: 'UG · Diploma',age: 'Age 18–21', desc: 'B.Tech, B.Sc, BA, BCom, ITI, Polytechnic',      color: '#ffedd5', fg: '#7c2d12' },
  { step: 6, icon: '🔬', label: 'Post Grad',    classes: 'PG · Prof.',  age: 'Age 22–23', desc: 'M.Tech, MBA, MCA, MD, LLM',                     color: '#cffafe', fg: '#164e63' },
  { step: 7, icon: '💼', label: 'Career',       classes: 'Job / Biz',   age: 'Age 22+',   desc: 'Govt jobs, Private sector, Entrepreneurship',   color: '#fce7f3', fg: '#831843' },
];

/* ── AP Government Schemes ── */
const GOV_SCHEMES = [
  {
    id: 1, icon: '📜', tag: 'Fee Reimbursement',
    name: 'Jagananna Vidya Deevena',
    color: '#1a6b3c', colorBg: '#d1fae5',
    amount: 'Up to ₹1,50,000 / year',
    desc: 'Full fee reimbursement for SC, ST, BC, EWS & Minority students pursuing professional courses (Engineering, Medical, Law, MBA, etc.) in AP colleges.',
    eligibility: 'Family income below ₹2.5 lakh · AP domicile · Enrolled in recognised AP college',
    applyAt: 'navasakam.ap.gov.in · Ward Volunteer can assist',
    status: 'open',
  },
  {
    id: 2, icon: '🏠', tag: 'Hostel + Transport',
    name: 'Jagananna Vasathi Deevena',
    color: '#1d4ed8', colorBg: '#dbeafe',
    amount: '₹10,000 – ₹20,000 / year',
    desc: 'Financial support for hostel, boarding, and transport expenses for students studying away from home in degree and professional colleges.',
    eligibility: 'Enrolled in recognised college · Hostel resident or daily commuter · AP domicile',
    applyAt: 'Village Volunteer · navasakam.ap.gov.in',
    status: 'open',
  },
  {
    id: 3, icon: '👩', tag: "Mother's Grant",
    name: 'Amma Vodi',
    color: '#dc2626', colorBg: '#fee2e2',
    amount: '₹15,000 / year',
    desc: "Annual financial support of ₹15,000 paid directly to mothers who ensure their children attend school (Class 1–12). One of AP government's flagship schemes.",
    eligibility: "Mother/guardian · Child enrolled in Govt/Aided/CBSE/ICSE school · Income below ₹5 lakh",
    applyAt: 'Ward Volunteer, Village Panchayat Office · amma-vodi.ap.gov.in',
    status: 'open',
  },
  {
    id: 4, icon: '🎒', tag: 'Free School Kit',
    name: 'Jagananna Vidya Kanuka',
    color: '#7c3aed', colorBg: '#ede9fe',
    amount: 'Free kit worth ₹2,400',
    desc: 'Every student in government schools receives a free kit containing textbooks, notebooks, uniform (2 sets), school bag, shoes, belt, and stationery each year.',
    eligibility: 'All students in Govt schools · Classes 1–10 · No income limit',
    applyAt: 'Automatically distributed through school headmaster at start of academic year',
    status: 'open',
  },
];

/* ── Scholarships ── */
const SCHOLARSHIPS = [
  {
    id: 1, icon: '🏛️', color: '#1a6b3c', colorBg: '#d1fae5', status: 'open',
    name: 'Zilla Parishad Merit Scholarship',
    provider: 'Zilla Parishad, Vizianagaram',
    amount: '₹5,000 / year',
    eligibility: 'Classes 6–10 · Minimum 75% marks · Annual family income below ₹1.5 lakh',
    deadline: 'March 15, 2026',
    documents: ['Aadhaar Card', 'Previous marksheet', 'Income certificate', 'Caste certificate'],
    applyAt: 'Mandal Educational Office, Gantyada',
  },
  {
    id: 2, icon: '📜', color: '#1d4ed8', colorBg: '#dbeafe', status: 'open',
    name: 'SC/ST Post-Matric Scholarship',
    provider: 'Government of Andhra Pradesh',
    amount: '₹8,000 – ₹15,000 / year',
    eligibility: 'Classes 11–Degree · SC/ST category · Family income below ₹2.5 lakh',
    deadline: 'April 30, 2026',
    documents: ['Caste & income certificates', 'Aadhaar', 'Bank passbook', 'Bonafide certificate'],
    applyAt: 'scholarship.ap.gov.in · Welfare Office, Gantyada',
  },
  {
    id: 3, icon: '🎓', color: '#7c3aed', colorBg: '#ede9fe', status: 'open',
    name: 'BC Welfare Board Scholarship',
    provider: 'AP BC Welfare Department',
    amount: '₹3,500 – ₹10,000 / year',
    eligibility: 'Classes 1–12 & Degree · BC category · Income below ₹1.5 lakh',
    deadline: 'March 31, 2026',
    documents: ['BC caste certificate', 'Income certificate', 'Aadhaar', 'Bank account details'],
    applyAt: 'AP BC Welfare portal · Ward Volunteer can assist',
  },
  {
    id: 4, icon: '🇮🇳', color: '#b45309', colorBg: '#fef3c7', status: 'upcoming',
    name: 'National Means-cum-Merit Scholarship (NMMS)',
    provider: 'Ministry of Education, Govt. of India',
    amount: '₹12,000 / year',
    eligibility: 'Class 8 pass · State selection exam · Family income below ₹3.5 lakh',
    deadline: 'Exam: February 2027',
    documents: ['Class 8 marksheet', 'Income certificate', 'Aadhaar', 'School recommendation'],
    applyAt: 'Through school headmaster',
  },
  {
    id: 5, icon: '🕌', color: '#0891b2', colorBg: '#cffafe', status: 'closed',
    name: 'Minority Welfare Scholarship (Pre-Matric)',
    provider: 'Ministry of Minority Affairs, GoI',
    amount: '₹1,000 – ₹10,000 / year',
    eligibility: 'Classes 1–10 · Minority communities · Income below ₹1 lakh',
    deadline: 'Closed – Opens Sep 2026',
    documents: ['Minority community certificate', 'Income certificate', 'Marksheet'],
    applyAt: 'NSP Portal – scholarships.gov.in',
  },
  {
    id: 6, icon: '⚗️', color: '#dc2626', colorBg: '#fee2e2', status: 'upcoming',
    name: 'EAMCET Free Coaching – Jagananna Vidya Kanuka',
    provider: 'Government of Andhra Pradesh',
    amount: 'Free coaching + ₹1,000 stipend/month',
    eligibility: 'Class 12 (MPC/BiPC) · AP State board · Family income below ₹2 lakh',
    deadline: 'Applications open July 2026',
    documents: ['Class 10 & 11 marksheets', 'Income certificate', 'Aadhaar', 'Domicile certificate'],
    applyAt: 'AP School Education portal',
  },
];

/* ── Live Job Updates ── */
const JOBS = [
  { id: 1, icon: '🚔', type: 'govt', title: 'AP Police Constable Recruitment 2026',  dept: 'APSLPRB',                     vacancies: 6100,  lastDate: 'Mar 31, 2026', qualification: '10+2 Pass',            location: 'Andhra Pradesh',          tag: 'Hot' },
  { id: 2, icon: '📋', type: 'govt', title: 'APPSC Group II Services 2026',           dept: 'AP Public Service Commission', vacancies: 780,   lastDate: 'Apr 15, 2026', qualification: 'Degree',               location: 'Andhra Pradesh',          tag: 'New' },
  { id: 3, icon: '👨‍🏫', type: 'govt', title: 'AP DSC Teacher Recruitment 2026',      dept: 'AP School Education Dept',    vacancies: 10000, lastDate: 'May 10, 2026', qualification: 'Degree + B.Ed',        location: 'Andhra Pradesh',          tag: 'Hot' },
  { id: 4, icon: '🚂', type: 'govt', title: 'Railway Apprentice – SCR Zone',          dept: 'South Central Railway',        vacancies: 3012,  lastDate: 'Apr 5, 2026',  qualification: '10th + ITI',           location: 'Visakhapatnam Division',  tag: '' },
  { id: 5, icon: '🏥', type: 'govt', title: 'AP Aarogyasri Staff Nurse & ANM',        dept: 'NHM Andhra Pradesh',           vacancies: 850,   lastDate: 'Apr 20, 2026', qualification: 'GNM / B.Sc Nursing',  location: 'Andhra Pradesh',          tag: '' },
  { id: 6, icon: '🏦', type: 'govt', title: 'IBPS PO Recruitment 2026',               dept: 'Institute of Banking Personnel',vacancies: 4500, lastDate: 'Mar 25, 2026', qualification: 'Any Degree',           location: 'AP exam centers',         tag: 'Closing Soon' },
  { id: 7, icon: '💻', type: 'private', title: 'Infosys BPO Off-Campus Drive',        dept: 'Infosys Ltd',                 vacancies: 200,   lastDate: 'Rolling Basis', qualification: 'Any Degree (2024/25)', location: 'Visakhapatnam',           tag: '' },
  { id: 8, icon: '📦', type: 'private', title: 'Amazon Fulfilment Center Associates', dept: 'Amazon India',                vacancies: 500,   lastDate: 'Rolling Basis', qualification: '10th Pass',            location: 'Visakhapatnam',           tag: '' },
];

/* ── Career Guidance ── */
const CAREER_PATHS = {
  '10th': [
    { icon: '📐', path: 'Intermediate (MPC)',      desc: 'Opens door to Engineering (EAMCET), BSc, Statistics' },
    { icon: '🧬', path: 'Intermediate (BiPC)',      desc: 'Opens door to MBBS/BAMS/Nursing, Agriculture, Pharmacy' },
    { icon: '📊', path: 'Intermediate (CEC)',       desc: 'Commerce path → CA, Banking, BA Economics' },
    { icon: '🔧', path: 'ITI (1–2 years)',          desc: 'Trade skills: Electrician, Fitter, Welder, COPA, Plumber' },
    { icon: '🏗️', path: 'Polytechnic Diploma',    desc: '3-year diploma — lateral entry into B.Tech 2nd year' },
    { icon: '🚔', path: 'AP Police / Railway',      desc: '10th pass eligible for Constable, Railway Apprentice' },
    { icon: '⚔️', path: 'Defence (Agniveer)',       desc: 'Army/Navy/Air Force 4-year service scheme' },
    { icon: '🏥', path: 'ANM / GNM Nursing',        desc: '2-year ANM or 3-year GNM diploma — government nursing colleges' },
  ],
  '12th': [
    { icon: '🏛️', path: 'EAMCET (Engineering)',   desc: 'B.Tech in CSE, ECE, Civil, Mechanical — 4-year degree' },
    { icon: '🩺', path: 'NEET (MBBS / BAMS)',       desc: 'Medical entrance for MBBS, BDS, Ayurveda, Homeopathy' },
    { icon: '🎓', path: 'Degree (BA/BSc/BCom)',     desc: 'Regular 3-year degree — opens govt competitive exams' },
    { icon: '🏦', path: 'Banking (IBPS/SBI)',        desc: 'Clerk and PO exams — stable government bank jobs' },
    { icon: '👮', path: 'APPSC Group 4 / Constable',desc: 'AP State govt exams — many posts open every year' },
    { icon: '✈️', path: 'Defence (NDA / AFCAT)',    desc: 'NDA after 12th for Army/Navy/Air Force officer entry' },
    { icon: '💊', path: 'Pharmacy (B.Pharm)',        desc: '4-year course — can open own medical shop after graduation' },
    { icon: '⚖️', path: 'Law (5-year LLB)',         desc: 'Integrated law degree — Lawyer, Judge, Legal Advisor' },
  ],
  'degree': [
    { icon: '📋', path: 'APPSC Group 1 / Group 2',  desc: 'Deputy Collector, DSP, Commercial Tax Officer' },
    { icon: '🌏', path: 'UPSC Civil Services',       desc: 'IAS/IPS — District Collector, IPS Officer. AP has many toppers' },
    { icon: '💻', path: 'IT / Software Companies',   desc: 'TCS, Infosys, Wipro, Amazon, HCL — Vizianagaram growing IT sector' },
    { icon: '👨‍🏫', path: 'DSC Teacher Recruitment', desc: 'AP School Education recruits thousands of teachers every year' },
    { icon: '🏦', path: 'Banking PO (IBPS/SBI/RBI)', desc: 'Probationary Officer — managerial role, good salary and growth' },
    { icon: '🔬', path: 'Post Graduation (PG)',       desc: 'M.Tech, MBA → better jobs + NET/GATE for research/academia' },
    { icon: '🏥', path: 'Govt Hospital / NHM',       desc: 'NHM AP recruits Staff Nurse, Lab Technician, Medical Officer' },
    { icon: '🌾', path: 'Agriculture Officer (AEO)', desc: 'Connect farmers with government schemes — popular in AP' },
  ],
};

/* ── Technology Courses ── */
const COURSES = [
  { id: 1, icon: '💻', level: 'Beginner', levelColor: '#d1fae5', levelFg: '#065f46', cost: 'FREE', name: 'Basic Computer Skills', provider: 'PMGDISHA (Govt of India)', duration: '20 hours', mode: 'Offline at ITI', desc: 'Mouse, keyboard, Windows basics, internet browsing, email, and government portal usage. Govt certificate provided.' },
  { id: 2, icon: '📱', level: 'Beginner', levelColor: '#d1fae5', levelFg: '#065f46', cost: 'FREE', name: 'Smartphone & Internet Safety', provider: 'RBI Digi Dhan Yatra', duration: '5 hours', mode: 'Mobile App / Online', desc: 'Safe internet use, avoiding scams, WhatsApp tips, downloading forms, and online shopping basics.' },
  { id: 3, icon: '💳', level: 'Beginner', levelColor: '#d1fae5', levelFg: '#065f46', cost: 'FREE', name: 'UPI & Digital Payments', provider: 'NPCI (PhonePe / GPay)', duration: '3 hours', mode: 'Mobile App', desc: 'Set up UPI ID, send/receive money, pay bills, check balance, and use government DBT transfer apps.' },
  { id: 4, icon: '📊', level: 'Intermediate', levelColor: '#fef3c7', levelFg: '#92400e', cost: 'FREE (PMKVY)', name: 'Tally ERP 9 & GST Accounting', provider: 'PMKVY / ITI Gantyada', duration: '90 hours (3 months)', mode: 'Offline at ITI', desc: 'Accounting, billing, inventory, and GST filing — useful for shop owners and students seeking accounts jobs.' },
  { id: 5, icon: '🎓', level: 'Advanced', levelColor: '#dbeafe', levelFg: '#1e3a8a', cost: 'FREE*', name: 'NPTEL Certificate Courses', provider: 'IITs & IISc (SWAYAM Portal)', duration: '4–12 weeks', mode: 'Online (swayam.gov.in)', desc: 'Programming, Electronics, Management from IIT professors. Valid certificate for jobs and higher studies. (*₹1,000 exam fee for certificate)' },
  { id: 6, icon: '📹', level: 'Intermediate', levelColor: '#fef3c7', levelFg: '#92400e', cost: 'FREE', name: 'YouTube & Social Media Income', provider: 'Google Digital Garage', duration: '12 hours', mode: 'Online', desc: 'Start a YouTube channel, create content in Telugu, grow followers, and earn from digital media.' },
];

/* ── Skill Development Centers ── */
const SKILL_CENTERS = [
  { id: 1, icon: '🏭', type: 'ITI', name: 'Government ITI, Gantyada', distance: '3 km from village', color: '#d1fae5', fg: '#065f46', courses: ['Electrician', 'Fitter', 'Welder', 'COPA', 'Plumber'], duration: '1–2 years', fee: 'Free for SC/ST · ₹500/yr others', phone: '08922-234567', admission: 'July–August each year' },
  { id: 2, icon: '🎯', type: 'APSSDC', name: 'AP Skill Dev. Center, Vizianagaram', distance: '18 km', color: '#dbeafe', fg: '#1e3a8a', courses: ['CNC Machine Operator', 'Solar Panel Technician', 'Hospitality & Tourism', 'Retail Management'], duration: '3–6 months', fee: 'Free (Govt funded)', phone: '0891-2550123', admission: 'Rolling admissions' },
  { id: 3, icon: '🧵', type: 'Village Center', name: 'Samagra Shiksha Skills Center', distance: 'In Chinamanapuram', color: '#fce7f3', fg: '#831843', courses: ['Tailoring & Embroidery', 'Mobile Phone Repair', 'Beauty & Wellness', 'Food Processing'], duration: '3 months', fee: 'Free for women', phone: 'Contact Panchayat Office', admission: 'March & October batches' },
  { id: 4, icon: '🏗️', type: 'Polytechnic', name: 'Govt. Polytechnic, Cheepurupalli', distance: '15 km', color: '#ede9fe', fg: '#4c1d95', courses: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Computer Engineering'], duration: '3 years (Diploma)', fee: '₹5,000/year (Subsidized)', phone: '08942-222345', admission: 'POLYCET exam — April each year' },
];

/* ── Achievers ── */
const ACHIEVEMENTS = [
  { id: 1, name: 'Kiran Rao',            year: 2016, icon: '💻', tag: 'Engineering', tagColor: '#1a6b3c', tagBg: '#d1fae5', title: 'B.Tech – Computer Science · JNTU Kakinada',            detail: 'Scored 94.2% in SSC from ZP High School. First from the village to join a central university. Currently Software Engineer at Hyderabad MNC.',        score: '94.2% SSC' },
  { id: 2, name: 'Priya Rao',            year: 2019, icon: '🩺', tag: 'Medicine',    tagColor: '#0891b2', tagBg: '#cffafe', title: 'MBBS – Andhra Medical College, Visakhapatnam',         detail: 'Cleared NEET with 621/720. First girl from Chinamanapuram in a government medical college. Aspires to return and serve the village as a doctor.',  score: 'NEET 621/720' },
  { id: 3, name: 'Arun Rao',             year: 2021, icon: '🏗️', tag: 'Engineering', tagColor: '#1a6b3c', tagBg: '#d1fae5', title: 'B.Tech – Civil Engineering · GVPCOE, Vizianagaram',     detail: 'Secured District 3rd rank in AP Intermediate (MPC). Recipient of the ZP Merit Scholarship for 3 consecutive years.',                               score: 'District Rank 3' },
  { id: 4, name: 'Divya Nageswara Rao', year: 2022, icon: '⚖️', tag: 'Law',         tagColor: '#7c3aed', tagBg: '#ede9fe', title: 'LLB – Andhra University, Visakhapatnam',               detail: 'Cleared AP LAWCET at 96th percentile. Active NSS volunteer — received Best NSS Award at state level.',                                             score: 'LAWCET 96th %ile' },
  { id: 5, name: 'Sai Durga Prasad',    year: 2023, icon: '🏏', tag: 'Sports',      tagColor: '#b45309', tagBg: '#fef3c7', title: 'District U-19 Cricket Team Captain',                   detail: "Selected for Vizianagaram District U-19 cricket team. Led team to State tournament. Received Chief Minister's Sports Scholarship.",               score: 'State Level' },
  { id: 6, name: 'Lakshmi Venkata Rao', year: 2024, icon: '🎨', tag: 'Arts',        tagColor: '#dc2626', tagBg: '#fee2e2', title: 'State-Level Painting Award · AP Cultural Fest',        detail: 'Won First Prize in State-level painting competition on "Rural Heritage of Andhra Pradesh". Painting displayed at Collectorate, Vizianagaram.',      score: '1st Prize State' },
];

/* ── Live News ── */
const NEWS = [
  { id: 1, icon: '👨‍🏫', category: 'Recruitment',   color: '#d1fae5', fg: '#065f46', headline: 'AP DSC 2026: Government announces 10,000 teacher posts across AP schools',                              date: 'Feb 28, 2026', source: 'AP School Education Department' },
  { id: 2, icon: '📝', category: 'Exam',             color: '#fef3c7', fg: '#92400e', headline: 'EAMCET 2026 schedule released — Engineering: May 15–18, Medical: May 22–23',                          date: 'Mar 1, 2026',  source: 'JNTUA – AP EAMCET' },
  { id: 3, icon: '📊', category: 'Results',          color: '#dbeafe', fg: '#1e3a8a', headline: 'AP Intermediate Results 2026 expected on April 15 — check manabadi.co.in',                            date: 'Mar 5, 2026',  source: 'BIEAP (Board of Intermediate Education, AP)' },
  { id: 4, icon: '💻', category: 'Scheme',           color: '#ede9fe', fg: '#4c1d95', headline: 'Free laptops for Class 12 top scorers under Jagananna Vidya Kanuka scheme',                          date: 'Feb 20, 2026', source: 'AP Government Press Release' },
  { id: 5, icon: '🏫', category: 'Infrastructure',  color: '#ffedd5', fg: '#7c2d12', headline: 'Samagra Shiksha: 500 new digital classrooms with Smart TVs in AP government schools',                  date: 'Feb 15, 2026', source: 'Samagra Shiksha Authority, AP' },
  { id: 6, icon: '🎓', category: 'Scholarship',     color: '#fee2e2', fg: '#991b1b', headline: 'Vidya Deevena application deadline extended to March 30, 2026',                                        date: 'Feb 25, 2026', source: 'AP Welfare Department' },
  { id: 7, icon: '🏆', category: 'Achievement',     color: '#cffafe', fg: '#164e63', headline: 'Vizianagaram student Sai Rithvik secures All India Rank 1200 in JEE Advanced 2025',                    date: 'Feb 10, 2026', source: 'JEE Advanced Result Gazette' },
];

const STATUS_CFG = {
  open:     { label: 'Apply Now', bg: '#d1fae5', color: '#065f46' },
  upcoming: { label: 'Upcoming',  bg: '#fef3c7', color: '#92400e' },
  closed:   { label: 'Closed',   bg: '#f3f4f6', color: '#4b5563' },
};

const TABS = [
  { id: 'Overview',     icon: '📊', label: 'Overview'       },
  { id: 'Schemes',      icon: '🏛️', label: 'Schemes'        },
  { id: 'Scholarships', icon: '🎓', label: 'Scholarships'   },
  { id: 'Jobs',         icon: '💼', label: 'Jobs & Careers' },
  { id: 'Courses',      icon: '💻', label: 'Courses'        },
  { id: 'Achievers',    icon: '🏆', label: 'Achievers'      },
  { id: 'News',         icon: '📰', label: 'News'           },
];

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════ */

function SectionHead({ title, sub }) {
  return (
    <div className="edu-section-head">
      <h2 className="edu-section-title">{title}</h2>
      {sub && <p className="edu-section-sub">{sub}</p>}
    </div>
  );
}

function ScholarshipCard({ s, expanded, onToggle }) {
  const st   = STATUS_CFG[s.status];
  const open = expanded === s.id;
  return (
    <div className={`edu-card ${open ? 'edu-card-open' : ''}`}>
      <div className="edu-card-head" onClick={() => onToggle(s.id)}>
        <div className="edu-card-icon" style={{ background: s.colorBg, color: s.color }}>{s.icon}</div>
        <div className="edu-card-meta">
          <div className="edu-card-title">{s.name}</div>
          <div className="edu-card-sub">{s.provider}</div>
        </div>
        <div className="edu-card-right">
          <span className="edu-amount">{s.amount}</span>
          <span className="edu-status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
          <span className="edu-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="edu-card-body">
          <div className="edu-detail-grid">
            <div className="edu-detail-block">
              <div className="edu-detail-label">✅ Eligibility</div>
              <div className="edu-detail-value">{s.eligibility}</div>
            </div>
            <div className="edu-detail-block">
              <div className="edu-detail-label">📅 Deadline</div>
              <div className="edu-detail-value edu-deadline">{s.deadline}</div>
            </div>
            <div className="edu-detail-block">
              <div className="edu-detail-label">📄 Documents Required</div>
              <ul className="edu-doc-list">{s.documents.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
            <div className="edu-detail-block">
              <div className="edu-detail-label">🏢 Where to Apply</div>
              <div className="edu-detail-value">{s.applyAt}</div>
            </div>
          </div>
          {s.status === 'open' && <button className="btn-save edu-apply-btn">📤 Get Application Form</button>}
        </div>
      )}
    </div>
  );
}

function SchemeCard({ s, expanded, onToggle }) {
  const st   = STATUS_CFG[s.status];
  const open = expanded === s.id;
  return (
    <div className={`edu-scheme-card ${open ? 'edu-scheme-card-open' : ''}`} style={{ borderColor: open ? s.color : undefined }}>
      <div className="edu-scheme-head" onClick={() => onToggle(s.id)}>
        <div className="edu-scheme-icon" style={{ background: s.colorBg, color: s.color }}>{s.icon}</div>
        <div className="edu-scheme-meta">
          <div className="edu-scheme-tag" style={{ background: s.colorBg, color: s.color }}>{s.tag}</div>
          <div className="edu-scheme-name">{s.name}</div>
        </div>
        <div className="edu-scheme-right">
          <div className="edu-scheme-amount">{s.amount}</div>
          <span className="edu-status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
          <span className="edu-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="edu-card-body">
          <p className="edu-scheme-desc">{s.desc}</p>
          <div className="edu-detail-grid">
            <div className="edu-detail-block">
              <div className="edu-detail-label">✅ Who Can Apply</div>
              <div className="edu-detail-value">{s.eligibility}</div>
            </div>
            <div className="edu-detail-block">
              <div className="edu-detail-label">🏢 How to Apply</div>
              <div className="edu-detail-value">{s.applyAt}</div>
            </div>
          </div>
          <button className="btn-save edu-apply-btn">📋 Learn More</button>
        </div>
      )}
    </div>
  );
}

function AchievementCard({ a }) {
  return (
    <div className="ach-card">
      <div className="ach-top">
        <div className="ach-icon-wrap" style={{ background: a.tagBg, color: a.tagColor }}>{a.icon}</div>
        <div>
          <span className="ach-tag" style={{ background: a.tagBg, color: a.tagColor }}>{a.tag}</span>
          <div className="ach-year">Class of {a.year}</div>
        </div>
        <div className="ach-score-badge">{a.score}</div>
      </div>
      <div className="ach-name">{a.name}</div>
      <div className="ach-title">{a.title}</div>
      <p className="ach-detail">{a.detail}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function Education() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [expanded,  setExpanded]  = useState(null);
  const [jobType,   setJobType]   = useState('all');
  const [careerLvl, setCareerLvl] = useState('10th');
  const [filterSt,  setFilterSt]  = useState('all');
  const [search,    setSearch]    = useState('');

  function toggleExpand(id) { setExpanded(e => e === id ? null : id); }

  const filteredScholarships = useMemo(() => SCHOLARSHIPS.filter(s => {
    const q = search.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q))
        && (filterSt === 'all' || s.status === filterSt);
  }), [search, filterSt]);

  const filteredJobs = useMemo(() =>
    jobType === 'all' ? JOBS : JOBS.filter(j => j.type === jobType), [jobType]);

  function switchTab(id) { setActiveTab(id); setSearch(''); setFilterSt('all'); setExpanded(null); }

  return (
    <div>
      <Navbar />

      {/* ── Hero ── */}
      <div className="edu-hero">
        <div className="edu-hero-inner">
          <div className="edu-hero-icon">📚</div>
          <h1 className="edu-hero-title">Education Hub</h1>
          <p className="edu-hero-sub">Chinamanapuram · Gantyada Mandal · Vizianagaram District</p>
          <div className="edu-hero-pills">
            <span className="edu-hero-pill">🎓 {SCHOLARSHIPS.length} Scholarships</span>
            <span className="edu-hero-pill">🏛️ {GOV_SCHEMES.length} Govt Schemes</span>
            <span className="edu-hero-pill">💼 {JOBS.length} Live Jobs</span>
            <span className="edu-hero-pill">🏆 {ACHIEVEMENTS.length} Achievers</span>
          </div>
        </div>
      </div>

      {/* ── Village Stats Strip ── */}
      <div className="edu-stats-bar">
        <div className="edu-stats-inner">
          {VSTAT_CARDS.map(s => (
            <div className={`edu-stat ${s.hi ? 'edu-stat-hl' : ''}`} key={s.label}>
              <span className="edu-stat-icon">{s.icon}</span>
              <span className="edu-stat-num" style={{ color: s.color }}>{s.num}</span>
              <span className="edu-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="edu-tabs-wrap">
        <div className="edu-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`cp-tab ${activeTab === t.id ? 'cp-tab-active' : ''}`}
              onClick={() => switchTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Panel ── */}
      <div className="edu-panel">

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'Overview' && (
          <div>
            <SectionHead title="📊 Village Education Statistics" sub="ZP High School, Chinamanapuram · Academic Year 2025–26" />
            <div className="edu-vstat-grid">
              {VSTAT_CARDS.map(s => (
                <div className="edu-vstat-card" key={s.label} style={{ background: s.bg }}>
                  <div className="edu-vstat-icon">{s.icon}</div>
                  <div className="edu-vstat-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="edu-vstat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <SectionHead title="🏅 Top Scorers 2025" sub="" />
            <div className="edu-topper-grid">
              <div className="edu-topper-table">
                <div className="edu-topper-table-head">SSC (Class 10) Toppers</div>
                {SSC_TOPPERS.map(t => (
                  <div className="edu-topper-row" key={t.rank}>
                    <span className="edu-topper-medal">{t.medal}</span>
                    <span className="edu-topper-name">{t.name}</span>
                    <span className="edu-topper-marks">{t.marks}</span>
                  </div>
                ))}
              </div>
              <div className="edu-topper-table">
                <div className="edu-topper-table-head">Intermediate (Class 12) Toppers</div>
                {IPE_TOPPERS.map(t => (
                  <div className="edu-topper-row" key={t.rank}>
                    <span className="edu-topper-medal">{t.medal}</span>
                    <span className="edu-topper-name">{t.name}</span>
                    <span className="edu-topper-marks">{t.marks} <small>({t.stream})</small></span>
                  </div>
                ))}
              </div>
            </div>

            <SectionHead title="🎓 Path of Education" sub="From primary school all the way to your career — step by step" />
            <div className="edu-flow-wrap">
              <div className="edu-flow">
                {EDU_FLOW.flatMap((step, idx) => {
                  const items = [
                    <div className="edu-flow-step" key={`step-${step.step}`}>
                      <div className="edu-flow-step-num">{step.step}</div>
                      <div className="edu-flow-icon" style={{ background: step.color, color: step.fg }}>{step.icon}</div>
                      <div className="edu-flow-step-label">{step.label}</div>
                      <div className="edu-flow-step-class">{step.classes}</div>
                      <div className="edu-flow-step-age">{step.age}</div>
                      <div className="edu-flow-step-desc">{step.desc}</div>
                    </div>,
                  ];
                  if (idx < EDU_FLOW.length - 1) {
                    items.push(<div className="edu-flow-arrow" key={`arr-${idx}`}>→</div>);
                  }
                  return items;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ SCHEMES ══ */}
        {activeTab === 'Schemes' && (
          <div>
            <SectionHead
              title="🏛️ AP Government Education Schemes"
              sub="Flagship welfare schemes from Andhra Pradesh Government for students and parents"
            />
            <div className="edu-scheme-list">
              {GOV_SCHEMES.map(s => (
                <SchemeCard key={s.id} s={s} expanded={expanded} onToggle={toggleExpand} />
              ))}
            </div>
            <div className="edu-help-box">
              <div className="edu-help-icon">💡</div>
              <div>
                <div className="edu-help-title">Need help with scheme applications?</div>
                <div className="edu-help-text">
                  Your Ward Volunteer or Village Volunteer can help you apply for all AP Government schemes.
                  Visit the Panchayat Office with your Aadhaar card, bank passbook, and income certificate.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SCHOLARSHIPS ══ */}
        {activeTab === 'Scholarships' && (
          <>
            <div className="edu-controls">
              <div className="fd-search-wrap" style={{ flex: 1, minWidth: 220 }}>
                <span className="fd-search-icon">🔍</span>
                <input
                  className="fd-search-input" type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search scholarships…"
                />
                {search && <button className="fd-search-clear" onClick={() => setSearch('')}>✕</button>}
              </div>
              <div className="edu-filter-group">
                {['all', 'open', 'upcoming', 'closed'].map(st => (
                  <button key={st} className={`cp-filter-btn ${filterSt === st ? 'cp-filter-active' : ''}`} onClick={() => setFilterSt(st)}>
                    {st === 'all' ? 'All' : st === 'open' ? '✅ Open' : st === 'upcoming' ? '🔜 Upcoming' : 'Closed'}
                  </button>
                ))}
              </div>
            </div>
            {filteredScholarships.length === 0 ? (
              <div className="fd-empty">
                <div className="fd-empty-icon">🔍</div>
                <h3>No scholarships found</h3>
                <button className="fd-clear-btn" onClick={() => { setSearch(''); setFilterSt('all'); }}>Clear Filters</button>
              </div>
            ) : (
              <div className="edu-list">
                {filteredScholarships.map(s => (
                  <ScholarshipCard key={s.id} s={s} expanded={expanded} onToggle={toggleExpand} />
                ))}
              </div>
            )}
            <div className="edu-help-box">
              <div className="edu-help-icon">💡</div>
              <div>
                <div className="edu-help-title">Need help applying?</div>
                <div className="edu-help-text">
                  Visit the Panchayat office or contact our Ward Volunteer for assistance.
                  The Village Sarpanch can also provide supporting letters.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ JOBS & CAREERS ══ */}
        {activeTab === 'Jobs' && (
          <div>
            <SectionHead
              title={<><span className="edu-live-dot" />Live Job Updates</>}
              sub="Latest government and private job openings relevant to Vizianagaram & Andhra Pradesh"
            />
            <div className="edu-job-filters">
              {['all', 'govt', 'private'].map(t => (
                <button key={t} className={`gl-filter-btn ${jobType === t ? 'gl-filter-active' : ''}`} onClick={() => setJobType(t)}>
                  {t === 'all' ? 'All Jobs' : t === 'govt' ? '🏛️ Government' : '🏢 Private'}
                </button>
              ))}
            </div>
            <div className="edu-job-grid">
              {filteredJobs.map(job => (
                <div key={job.id} className="edu-job-card">
                  <div className="edu-job-top">
                    <div className="edu-job-icon">{job.icon}</div>
                    <div className="edu-job-type-badge" style={{ background: job.type === 'govt' ? '#d1fae5' : '#dbeafe', color: job.type === 'govt' ? '#065f46' : '#1e3a8a' }}>
                      {job.type === 'govt' ? '🏛️ Government' : '🏢 Private'}
                    </div>
                    {job.tag && (
                      <span className="edu-job-tag" style={{ background: job.tag === 'Closing Soon' ? '#fee2e2' : '#fef3c7', color: job.tag === 'Closing Soon' ? '#991b1b' : '#92400e' }}>
                        {job.tag}
                      </span>
                    )}
                  </div>
                  <div className="edu-job-title">{job.title}</div>
                  <div className="edu-job-dept">{job.dept}</div>
                  <div className="edu-job-info-row">
                    <span>📍 {job.location}</span>
                    <span>🎓 {job.qualification}</span>
                  </div>
                  <div className="edu-job-footer">
                    <div className="edu-job-vacancies">👥 {job.vacancies.toLocaleString()} vacancies</div>
                    <div className="edu-job-deadline" style={{ color: job.lastDate.includes('Rolling') ? '#0891b2' : '#dc2626' }}>
                      📅 {job.lastDate}
                    </div>
                  </div>
                  <button className="edu-job-apply-btn">Apply / Details →</button>
                </div>
              ))}
            </div>

            <SectionHead title="🧭 Career Guidance" sub="What are your options after each level of education?" />
            <div className="edu-career-tabs">
              {['10th', '12th', 'degree'].map(lvl => (
                <button
                  key={lvl}
                  className={`edu-career-tab ${careerLvl === lvl ? 'edu-career-tab-active' : ''}`}
                  onClick={() => setCareerLvl(lvl)}
                >
                  {lvl === '10th' ? 'After 10th (SSC)' : lvl === '12th' ? 'After 12th (Intermediate)' : 'After Degree'}
                </button>
              ))}
            </div>
            <div className="edu-career-grid">
              {(CAREER_PATHS[careerLvl] || []).map((c, i) => (
                <div className="edu-career-card" key={i}>
                  <div className="edu-career-icon">{c.icon}</div>
                  <div className="edu-career-path">{c.path}</div>
                  <div className="edu-career-desc">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ COURSES & SKILLS ══ */}
        {activeTab === 'Courses' && (
          <div>
            <SectionHead
              title="💻 Free Technology Courses"
              sub="Learn digital skills — computers, smartphones, payments — mostly free for all villagers"
            />
            <div className="edu-course-grid">
              {COURSES.map(c => (
                <div className="edu-course-card" key={c.id}>
                  <div className="edu-course-top">
                    <div className="edu-course-icon">{c.icon}</div>
                    <span className="edu-course-level" style={{ background: c.levelColor, color: c.levelFg }}>{c.level}</span>
                  </div>
                  <div className="edu-course-name">{c.name}</div>
                  <div className="edu-course-provider">{c.provider}</div>
                  <div className="edu-course-info">
                    <span>⏱ {c.duration}</span>
                    <span>📍 {c.mode}</span>
                  </div>
                  <p className="edu-course-desc">{c.desc}</p>
                  <div className="edu-course-footer">
                    <span className="edu-course-cost">{c.cost}</span>
                    <button className="edu-job-apply-btn" style={{ width: 'auto', padding: '6px 16px', fontSize: '0.78rem' }}>Enroll →</button>
                  </div>
                </div>
              ))}
            </div>

            <SectionHead
              title="🔧 Skill Development Centers"
              sub="ITI and Polytechnic colleges near Gantyada Mandal — learn a trade and earn a good living"
            />
            <div className="edu-skill-grid">
              {SKILL_CENTERS.map(sc => (
                <div className="edu-skill-card" key={sc.id}>
                  <div className="edu-skill-head" style={{ background: sc.color }}>
                    <span className="edu-skill-icon">{sc.icon}</span>
                    <div>
                      <div className="edu-skill-name" style={{ color: sc.fg }}>{sc.name}</div>
                      <div className="edu-skill-type" style={{ color: sc.fg }}>{sc.type} · 📍 {sc.distance}</div>
                    </div>
                  </div>
                  <div className="edu-skill-body">
                    <div className="edu-skill-courses-label">Courses offered:</div>
                    <div className="edu-skill-course-tags">
                      {sc.courses.map((course, i) => <span className="edu-skill-tag" key={i}>{course}</span>)}
                    </div>
                    <div className="edu-skill-meta">
                      <div>⏱ <strong>Duration:</strong> {sc.duration}</div>
                      <div>💰 <strong>Fee:</strong> {sc.fee}</div>
                      <div>📅 <strong>Admission:</strong> {sc.admission}</div>
                      <div>📞 <strong>Phone:</strong> {sc.phone}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ACHIEVERS ══ */}
        {activeTab === 'Achievers' && (
          <>
            <div className="ach-intro">
              🌟 Celebrating the bright minds of Chinamanapuram — our village's greatest pride.
            </div>
            <div className="ach-grid">
              {ACHIEVEMENTS.map(a => <AchievementCard key={a.id} a={a} />)}
            </div>
            <div className="edu-help-box" style={{ marginTop: 32 }}>
              <div className="edu-help-icon">🏅</div>
              <div>
                <div className="edu-help-title">Know a village achiever?</div>
                <div className="edu-help-text">
                  If a student from Chinamanapuram has achieved something remarkable in academics, sports, or arts,
                  contact the Panchayat office to nominate them for the Annual Village Education Award.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ NEWS ══ */}
        {activeTab === 'News' && (
          <div>
            <SectionHead
              title={<><span className="edu-live-dot" />Latest Education News — Andhra Pradesh</>}
              sub="Updated March 2026 · Exam alerts, scheme updates, and recruitment news"
            />
            <div className="edu-news-list">
              {NEWS.map(n => (
                <div className="edu-news-item" key={n.id}>
                  <div className="edu-news-icon" style={{ background: n.color, color: n.fg }}>{n.icon}</div>
                  <div className="edu-news-body">
                    <div className="edu-news-badge" style={{ background: n.color, color: n.fg }}>{n.category}</div>
                    <div className="edu-news-headline">{n.headline}</div>
                    <div className="edu-news-meta">
                      <span>📅 {n.date}</span>
                      <span>📰 {n.source}</span>
                    </div>
                  </div>
                  <div className="edu-news-arrow">→</div>
                </div>
              ))}
            </div>
            <div className="edu-help-box" style={{ marginTop: 24 }}>
              <div className="edu-help-icon">📡</div>
              <div>
                <div className="edu-help-title">Stay updated</div>
                <div className="edu-help-text">
                  Follow official AP government portals: <strong>apsche.ap.gov.in</strong> (APPSC),
                  &nbsp;<strong>manabadi.co.in</strong> (results), <strong>navasakam.ap.gov.in</strong> (schemes).
                  The village chat section also posts important updates regularly.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* end panel */}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">🏘️</div>
          <div className="footer-village">Chinamanapuram Village Portal</div>
          <div className="footer-tagline">Gantyada Mandal · Vizianagaram District · Andhra Pradesh · India</div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/families">Families</Link>
            <Link to="/family-tree">Family Tree</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/complaints">Complaints</Link>
            <Link to="/chat">Chat</Link>
          </div>
          <div className="footer-copy">© 2026 Chinamanapuram Village Portal · Built with care for our community</div>
        </div>
      </footer>
    </div>
  );
}
