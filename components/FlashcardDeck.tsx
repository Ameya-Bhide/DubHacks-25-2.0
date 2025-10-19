import React, { useState, useEffect } from 'react'

interface Flashcard {
  question: string
  answer: string
}

interface FlashcardDeckProps {
  content: string
  onClose: () => void
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ content, onClose }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set())

  // Parse the flashcard content into individual cards
  useEffect(() => {
    console.log('🎴 FlashcardDeck received content:', content.substring(0, 200) + '...')
    
    const parseFlashcards = (content: string): Flashcard[] => {
      const cards: Flashcard[] = []
      
      // First try: Split by double newlines and look for Q&A pairs
      const cardSections = content.split('\n\n').filter(section => section.trim())
      
      for (const section of cardSections) {
        const lines = section.split('\n').filter(line => line.trim())
        
        if (lines.length >= 2) {
          // First line is usually the question, second line is the answer
          const question = lines[0].trim()
          const answer = lines[1].trim()
          
          // Skip if it looks like a header or doesn't have proper Q&A format
          if (question && answer && !question.includes('**') && !answer.includes('**')) {
            cards.push({ question, answer })
          }
        }
      }
      
      // If we didn't get good results, try alternative parsing
      if (cards.length === 0) {
        // Split by double newlines and pair consecutive sections
        const sections = content.split('\n\n').filter(section => section.trim())
        
        for (let i = 0; i < sections.length - 1; i += 2) {
          const question = sections[i].trim()
          const answer = sections[i + 1].trim()
          
          // Check if this looks like a Q&A pair
          if (question && answer && 
              (question.includes('?') || question.toLowerCase().includes('what') || 
               question.toLowerCase().includes('which') || question.toLowerCase().includes('true or false'))) {
            cards.push({ question, answer })
          }
        }
      }
      
      // Final fallback: try pairing all non-empty lines
      if (cards.length === 0) {
        const lines = content.split('\n').filter(line => line.trim())
        for (let i = 0; i < lines.length - 1; i += 2) {
          const question = lines[i].trim()
          const answer = lines[i + 1].trim()
          
          if (question && answer) {
            cards.push({ question, answer })
          }
        }
      }
      
      return cards
    }

    const parsedCards = parseFlashcards(content)
    console.log('🎴 Parsed flashcards:', parsedCards.length, 'cards')
    setFlashcards(parsedCards)
  }, [content])

  const currentCard = flashcards[currentCardIndex]
  const progress = flashcards.length > 0 ? ((currentCardIndex + 1) / flashcards.length) * 100 : 0

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
      setStudiedCards(prev => new Set([...prev, currentCardIndex]))
    }
  }

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    setStudiedCards(prev => new Set([...prev, currentCardIndex]))
  }

  const handleRestart = () => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setStudiedCards(new Set())
  }

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Flashcard Deck</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Flashcards Found</h4>
            <p className="text-gray-600">The content couldn't be parsed into flashcards. Please try generating flashcards again.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Flashcard Deck</h3>
            <p className="text-sm text-gray-600 mt-1">
              Card {currentCardIndex + 1} of {flashcards.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="p-6 flex-1 flex items-center justify-center min-h-[400px]">
          {currentCard && (
            <div 
              className="w-full max-w-2xl h-80 perspective-1000 cursor-pointer"
              onClick={handleFlip}
            >
              <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}>
                {/* Front of card (Question) */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center p-8">
                  <div className="text-center text-white">
                    <div className="mb-4">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold mb-4">Question</h4>
                    <p className="text-lg leading-relaxed">{currentCard.question}</p>
                    <p className="text-sm opacity-80 mt-4">Click to reveal answer</p>
                  </div>
                </div>

                {/* Back of card (Answer) */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center p-8 rotate-y-180">
                  <div className="text-center text-white">
                    <div className="mb-4">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold mb-4">Answer</h4>
                    <p className="text-lg leading-relaxed">{currentCard.answer}</p>
                    <p className="text-sm opacity-80 mt-4">Click to see question</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrevious}
                disabled={currentCardIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>

              <button
                onClick={handleFlip}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isFlipped ? 'Show Question' : 'Show Answer'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentCardIndex === flashcards.length - 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Restart</span>
              </button>

              <div className="text-sm text-gray-600">
                Studied: {studiedCards.size}/{flashcards.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlashcardDeck
