import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Pass24/7 design system — cascade order is deliberate:
//   1. vendor (bootstrap, above)
//   2. tokens  — custom properties only, no output
//   3. base    — reset + typography (must beat Bootstrap's heading sizes)
//   4. theme   — overrides Bootstrap's own --bs-* variables app-wide
//   5. page    — page-scoped styles
import './styles/tokens.css';
import './index.css';
import './styles/theme.css';
import './styles/auth.css';
import './Styles/Home.css';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import ScrollToTop from './components/common/ScrollToTop';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';

// User Components
import Dashboard from './components/User/Dashboard';
import Profile from './components/User/Profile';

// Exam Components
import Exams from './components/Exam/Exams';
import PracticeHome from './components/Practice/PracticeHome';
import PracticeSession from './components/Practice/PracticeSession';
import SessionSummary from './components/Practice/SessionSummary';

// Interview Components - FIXED IMPORTS
import InterviewLevels from './components/pages/InterviewLevels';
import InterviewDetail from './components/pages/InterviewDetail';
import FullInterview from './components/pages/FullInterview';
import Careers from './components/pages/Careers';
import Skills from './components/pages/skills';
import Aptitude from './components/pages/Aptitude';
import CivilService from './components/pages/CivilService';
import Promotion from './components/pages/Promotion';

// Quiz Components
import TimedQuiz from './components/Quiz/TimedQuiz';
import UntimedQuiz from './components/Quiz/UntimedQuiz';
import QuizResults from './components/Quiz/QuizResults';

// Payment Components
import PaymentPlans from './components/Payments/PaymentPlans';
import PaymentSuccess from './components/Payments/PaymentSuccess';
import PaymentCancelled from './components/Payments/PaymentCancelled';
import PaymentHistory from './components/Payments/PaymentHistory';

// Static Pages
import Home from './components/pages/Home';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import HowItWorks from './components/pages/HowItWorks';
import InterviewMentoring from './components/pages/InterviewMentoring';
import PersonalCoaching from './components/pages/PersonalCoaching';
import CVBuildUp from './components/pages/CVBuildUp';
import TypingSkills from './components/pages/TypingSkills';
import RemoteJobs from './components/pages/RemoteJobs';
import IndustryQuestions from './components/pages/IndustryQuestions';

// Blog Components
import BlogList from './components/Blog/BlogList';
import BlogDetail from './components/Blog/BlogDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Resets scroll on every route change. Without it React Router
            keeps the previous page's scroll offset, so navigating from a
            scrolled page lands mid-page — which looks like the footer
            loading first. */}
        <ScrollToTop />
        <div className="App d-flex flex-column min-vh-100">
          <Navbar />
          
          <main className="flex-grow-1" style={{ marginTop: '76px' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:resetId" element={<ResetPassword />} />
              
              {/* Exam Routes */}
              <Route path="/exams" element={<Exams />} />
              
              {/* PracticeHome routes */}
              <Route path="/practice/:examType" element={<PracticeHome />} />
              <Route path="/practice/:examType/:subjectName" element={<PracticeHome />} />
              
              {/* Practice Session - requires authentication */}
              <Route path="/practice/session/:sessionId" element={
                <PrivateRoute>
                  <PracticeSession />
                </PrivateRoute>
              } />
              
              {/* Session Review - requires authentication */}
              <Route path="/practice/:sessionId/review" element={
                <PrivateRoute>
                  <PracticeSession />
                </PrivateRoute>
              } />
              
              {/* Session Result - requires authentication */}
              <Route path="/session/:sessionId/result" element={
                <PrivateRoute>
                  <SessionSummary />
                </PrivateRoute>
              } />
              
              {/* Interview Routes */}
              <Route path="/interview-levels" element={<InterviewLevels />} />
              <Route path="/interview/:slug" element={<InterviewDetail />} />
              <Route path="/interview/:slug/full" element={
                <PrivateRoute requirePremium>
                  <FullInterview />
                </PrivateRoute>
              } />
              
              {/* Quiz Routes */}
              <Route path="/quiz/timed/:productId" element={
                <PrivateRoute>
                  <TimedQuiz />
                </PrivateRoute>
              } />
              <Route path="/quiz/untimed/:productId" element={
                <PrivateRoute>
                  <UntimedQuiz />
                </PrivateRoute>
              } />
              <Route path="/quiz/results/:sessionId" element={
                <PrivateRoute>
                  <QuizResults />
                </PrivateRoute>
              } />
              
              {/* User Dashboard Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/history" element={
                <PrivateRoute>
                  <PaymentHistory />
                </PrivateRoute>
              } />
              
              {/* Payment Routes */}
              <Route path="/payment-plans" element={<PaymentPlans />} />
              <Route path="/payment/success" element={
                <PrivateRoute>
                  <PaymentSuccess />
                </PrivateRoute>
              } />
              <Route path="/payment/cancelled" element={
                <PrivateRoute>
                  <PaymentCancelled />
                </PrivateRoute>
              } />
              
              {/* Blog Routes */}
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              
              {/* Static Pages */}
              <Route path="/interview-mentoring" element={<InterviewMentoring />} />
              <Route path="/personal-coaching" element={<PersonalCoaching />} />
              <Route path="/cv-build-up" element={<CVBuildUp />} />
              <Route path="/typing-skills" element={<TypingSkills />} />
              <Route path="/remote-jobs" element={<RemoteJobs />} />
              <Route path="/industry-questions" element={<IndustryQuestions />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/skills" element={<Skills />} />

              {/* Career Routes */}
              <Route path="/careers/aptitude" element={<Aptitude />} />
              <Route path="/careers/civil" element={<CivilService />} />
              <Route path="/careers/promotion" element={<Promotion />} />
              
              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
          
          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;