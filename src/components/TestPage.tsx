'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, UserAnswer } from '@/types';
import questionsData from '@/data/questions.json';
import { analytics, abTestManager } from '@/utils/analytics';
import { scoreAnswers } from '@/utils/scoring';
import { useRouter } from 'next/navigation';

const TestContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const TestCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 25px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 700px;
  width: 100%;
  min-height: 500px;

  @media (max-width: 768px) {
    padding: 30px 25px;
    border-radius: 20px;
    min-height: 450px;
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: 30px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 4px;
`;

const ProgressText = styled.p`
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
`;

const QuestionNumber = styled(motion.p)`
  color: #888;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
`;

const QuestionText = styled(motion.h2)`
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 40px;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 30px;
  }
`;

const AnswerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const AnswerButton = styled(motion.button)<{ selected?: boolean }>`
  background: ${props => props.selected
    ? 'linear-gradient(45deg, #667eea, #764ba2)'
    : 'rgba(255, 255, 255, 0.8)'};
  color: ${props => props.selected ? 'white' : '#333'};
  border: 2px solid ${props => props.selected ? 'transparent' : 'rgba(102, 126, 234, 0.3)'};
  border-radius: 15px;
  padding: 20px 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  line-height: 1.5;
  min-height: 80px;
  display: flex;
  align-items: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
    border-color: #667eea;
  }

  @media (max-width: 768px) {
    padding: 18px 20px;
    font-size: 1rem;
    min-height: 70px;
  }
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  gap: 20px;

  @media (max-width: 768px) {
    margin-top: 30px;
    gap: 15px;
  }
`;

const NavButton = styled(motion.button)<{ disabled?: boolean }>`
  background: ${props => props.disabled
    ? 'rgba(255, 255, 255, 0.3)'
    : 'linear-gradient(45deg, #667eea, #764ba2)'};
  color: ${props => props.disabled ? '#999' : 'white'};
  border: none;
  border-radius: 50px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  min-width: 100px;

  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.3)'};
  }

  @media (max-width: 768px) {
    padding: 10px 25px;
    font-size: 0.9rem;
    min-width: 80px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(102, 126, 234, 0.3);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  margin-bottom: 20px;
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
`;

const TestPage: React.FC = () => {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    const variant = abTestManager.getUserVariant();
    const allQuestions = questionsData as Question[];

    const questionCount = variant.config.questionCount || 30;
    const selectedQuestions = allQuestions.slice(0, questionCount);

    setQuestions(selectedQuestions);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());

    analytics.trackPageView('test');
  }, []);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answer: 'A' | 'B') => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const questionTime = Date.now() - questionStartTime;
    analytics.trackQuestionAnswered(
      questions[currentQuestionIndex].id,
      selectedAnswer,
      questionTime
    );

    const newAnswer: UserAnswer = {
      questionId: questions[currentQuestionIndex].id,
      answer: selectedAnswer
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      handleTestComplete(updatedAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const previousAnswer = answers[currentQuestionIndex - 1];
      setSelectedAnswer(previousAnswer?.answer || null);
      setAnswers(answers.slice(0, -1));
    }
  };

  const handleTestComplete = (finalAnswers: UserAnswer[]) => {
    setIsLoading(true);

    const totalTime = Date.now() - startTime;
    const result = scoreAnswers(finalAnswers);

    analytics.trackTestCompleted(
      result.archetype.id,
      totalTime,
      questions.length
    );

    localStorage.setItem('testResult', JSON.stringify(result));

    setTimeout(() => {
      router.push('/result');
    }, 2000);
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (questions.length === 0) {
    return (
      <TestContainer>
        <TestCard>
          <LoadingContainer>
            <LoadingSpinner
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <LoadingText>테스트를 준비하고 있어요...</LoadingText>
          </LoadingContainer>
        </TestCard>
      </TestContainer>
    );
  }

  if (isLoading) {
    return (
      <TestContainer>
        <TestCard>
          <LoadingContainer>
            <LoadingSpinner
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <LoadingText>
              결과를 분석하고 있어요...<br />
              잠시만 기다려주세요! ✨
            </LoadingText>
          </LoadingContainer>
        </TestCard>
      </TestContainer>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <TestContainer>
      <TestCard
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ProgressContainer>
          <ProgressBar>
            <ProgressFill
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </ProgressBar>
          <ProgressText>
            {currentQuestionIndex + 1} / {questions.length}
          </ProgressText>
        </ProgressContainer>

        <QuestionNumber
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Q{currentQuestionIndex + 1}
        </QuestionNumber>

        <QuestionText
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {currentQuestion.text}
        </QuestionText>

        <AnswerContainer>
          <AnimatePresence>
            <AnswerButton
              selected={selectedAnswer === 'A'}
              onClick={() => handleAnswerSelect('A')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              A. {currentQuestion.A_text}
            </AnswerButton>

            <AnswerButton
              selected={selectedAnswer === 'B'}
              onClick={() => handleAnswerSelect('B')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              B. {currentQuestion.B_text}
            </AnswerButton>
          </AnimatePresence>
        </AnswerContainer>

        <NavigationContainer>
          <NavButton
            disabled={currentQuestionIndex === 0}
            onClick={handlePrevious}
            whileHover={{ scale: currentQuestionIndex === 0 ? 1 : 1.05 }}
            whileTap={{ scale: currentQuestionIndex === 0 ? 1 : 0.95 }}
          >
            이전
          </NavButton>

          <NavButton
            disabled={!selectedAnswer}
            onClick={handleNext}
            whileHover={{ scale: !selectedAnswer ? 1 : 1.05 }}
            whileTap={{ scale: !selectedAnswer ? 1 : 0.95 }}
          >
            {currentQuestionIndex === questions.length - 1 ? '완료' : '다음'}
          </NavButton>
        </NavigationContainer>
      </TestCard>
    </TestContainer>
  );
};

export default TestPage;