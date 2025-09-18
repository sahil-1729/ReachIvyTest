"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mic, Square } from "lucide-react"
import Image from "next/image"
import gif from "../public/Ivy_animation.gif"
import { io, Socket } from "socket.io-client"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
  isTyping?: boolean
}
// get started, could you share a bit about what you're currently studying or your main area of interest? This helps me understand your starting point.
const QUESTIONS = [
  "To ",
  "Thinking about your short-term goals, are there any specific projects, experiences, or internships you've already been involved in that have shaped these ambitions?",
  "When you think about Stanford, is there a particular program, a professor's work, or a research center that really stands out to you and directly aligns with your long-term goals?",
  "What kind of community do you hope to find at Stanford? Are there specific student organizations, collaborative environments, or extracurriculars that you're excited to join that would support your journey?",
  "Let's talk impact. What's the biggest problem you want to solve in your chosen field, and how do you believe a Stanford education will uniquely equip you to tackle it?",
]
interface UserAnswers {
  currentStudy: string
  experiences: string
  stanfordProgram: string
  community: string
  impact: string
}
export function ConversationUI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [conversationStarted, setConversationStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Partial<UserAnswers>>({})
  const [questionPhaseComplete, setQuestionPhaseComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  let speechRecognition = new webkitSpeechRecognition();

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // setting up websocket connection
  useEffect(() => {

    const socketInstance = io('http://localhost:3000')

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    socketInstance.on('audio-received', (data) => {
      console.log('Audio received confirmation:', data)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const addMessage = (text: string, sender: "user" | "ai") => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const addAiMessageWithTypewriter = (fullText: string) => {
    const messageId = Math.random().toString(36).substr(2, 9)
    const newMessage: Message = {
      id: messageId,
      text: "",
      sender: "ai",
      timestamp: new Date(),
      isTyping: true,
    }

    setMessages((prev) => [...prev, newMessage])

    let currentIndex = 0
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, text: fullText.slice(0, currentIndex + 1) } : msg)),
        )
        currentIndex++
      } else {
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isTyping: false } : msg)))
        clearInterval(typeInterval)
        setIsAiTyping(false)
      }
    }, 30)
  }

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return

    addMessage(userMessage, "user")
    setIsAiTyping(true)

    // Store user answer if we're in question phase
    if (!questionPhaseComplete && currentQuestionIndex < QUESTIONS.length) {
      const answerKeys: (keyof UserAnswers)[] = [
        "currentStudy",
        "experiences",
        "stanfordProgram",
        "community",
        "impact",
      ]
      setUserAnswers((prev) => ({
        ...prev,
        [answerKeys[currentQuestionIndex]]: userMessage,
      }))

      // Move to next question 
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setTimeout(() => {
          addAiMessageWithTypewriter(QUESTIONS[currentQuestionIndex + 1])
          setCurrentQuestionIndex((prev) => prev + 1)
        }, 1000)
      } else {
        setQuestionPhaseComplete(true)
        setTimeout(() => {
          addAiMessageWithTypewriter(
            "Thank you for sharing those insights! Now I have a much better understanding of your background and goals. Let's dive deeper into crafting your Stanford application narrative. What specific aspect would you like to explore further - perhaps how to connect your experiences to Stanford's resources, or how to articulate your unique value proposition?",
          )
        }, 1000)
      }
    } else {
      // start conversation 
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            context: userAnswers,
            isPersonalized: true,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get AI response")
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let aiResponse = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            aiResponse += chunk
          }
        }


        setTimeout(() => {
          addAiMessageWithTypewriter(aiResponse)
        }, 1000)

      } catch (error) {
        addAiMessageWithTypewriter("Sorry, I'm having trouble responding right now. Please try again.")
      }
    }
  }

  const startConversation = () => {
    setConversationStarted(true)
    setMessages([])
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setQuestionPhaseComplete(false)

    // ADD THIS!!!
    // I'm excited to help you craft a compelling Stanford application. I'll start by asking you a few questions to understand your background and goals better.
    setTimeout(() => {
      addAiMessageWithTypewriter(
        "Hi!  " +
        QUESTIONS[0],
      )
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isAiTyping) {
      sendMessage(inputValue)
      setInputValue("")
    }
  }

  const startRecording = async () => {
    try {

      if ("webkitSpeechRecognition" in window) {
        speechRecognition.start();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      // Store recorder in ref for access in interval
      mediaRecorderRef.current = recorder

      // Reset chunks ref
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          // console.log('Audio chunk received:', event.data.size, 'bytes')
        }
      }

      recorder.onstop = () => {
        console.log('Recording stopped, total chunks:', audioChunksRef.current.length)
        // Don't stop the stream here as we want to continue recording
      }

      speechRecognition.onresult = (event) => {
        // Create the interim transcript string locally because we don't want it to persist like final transcript
        let interim_transcript = "";
        let final_transcript = ""
        // Loop through the results from the speech recognition object.
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          // If the result item is Final, add it to Final Transcript, Else add it to Interim transcript
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
          } else {
            interim_transcript += event.results[i][0].transcript;
          }
        }

        // Set the Final transcript and Interim transcript.
        console.log('transcript ', final_transcript);
        console.log(interim_transcript);
      };

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setAudioChunks([])
      // console.log("recording started")

      // Clear any existing interval first
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        // console.log("Cleared existing interval")
      }

      // Start sending audio chunks every 4 seconds
      recordingIntervalRef.current = setInterval(() => {
        // console.log("Interval triggered - checking recorder state")
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log("recording to be sent, chunks count here:", audioChunksRef.current.length)

          // Stop current recording to get the data
          mediaRecorderRef.current.stop()

          // Wait a moment for the ondataavailable event to fire
          setTimeout(() => {
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
              console.log('Sending audio blob via WebSocket:', audioBlob.size, 'bytes')
              sendAudioToWebSocket(audioBlob)
              audioChunksRef.current = [] // Clear chunks after sending
            }

            // Start recording again
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
              // console.log("Restarting recording...")
              mediaRecorderRef.current.start()
            }
          }, 100)
        } else {
          console.log("Recorder not in recording state:", mediaRecorderRef.current?.state)
        }
      }, 4000)

      // console.log('recording interval set:', recordingIntervalRef.current)

    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if ("webkitSpeechRecognition" in window) {

      speechRecognition.stop();
      console.log('speech stop')

    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      // Stop all tracks when user manually stops recording
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    setIsRecording(false)
    mediaRecorderRef.current = null
  }

  const sendAudioToWebSocket = (audioBlob: Blob) => {
    try {
      console.log('Preparing to send audio blob via WebSocket:', audioBlob.size, 'bytes')

      if (!socket || !isConnected) {
        console.error('WebSocket not connected')
        return
      }

      // Convert blob to ArrayBuffer for WebSocket transmission
      const reader = new FileReader()
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer
        const audioData = {
          audio: Array.from(new Uint8Array(arrayBuffer)),
          timestamp: new Date().toISOString(),
          size: audioBlob.size,
          type: 'audio/wav'
        }

        console.log('Sending audio data via WebSocket...')
        socket.emit('audio-data', audioData)
      }

      reader.readAsArrayBuffer(audioBlob)
    } catch (error) {
      console.error('Error sending audio via WebSocket:', error)
    }
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div>
      {/* Instructions  */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-sm font-medium text-muted-foreground mt-0.5">1.</span>
            <p className="text-sm text-muted-foreground">This is a new, focused, short session with my AI mind.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm font-medium text-muted-foreground mt-0.5">2.</span>
            <p className="text-sm text-muted-foreground">
              This session will help you develop your ideas from a starting point structure.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* gradient border  */}
      <div className="border bg-gradient-to-r from-[#c599f9] via-[#f3a28e] to-[#94fae7] rounded-2xl p-0.75">
        <div className="border rounded-xl flex flex-col gap-0.5 bg-white">

          {/* Topic of conversation */}
          <div className="flex items-center gap-2 p-4 shadow-sm  rounded-t-xl border-muted 
      ">
            <div className="flex flex-row text-xl">
              <p className="font-medium">
                hello
              </p>
              <strong>
                ivy
              </strong>
            </div>
            &nbsp;
            &nbsp;
            Stanford Application Conversation
            {conversationStarted && !questionPhaseComplete && (
              <span className="text-sm text-muted-foreground ml-auto">
                Question {currentQuestionIndex + 1} of {QUESTIONS.length}
              </span>
            )}
          </div>

          {/* User and AI assistant conversation  */}
          <Card className="w-full max-w-2xl h-[700px] overflow-y-auto flex flex-col shadow-none border-0">
            <CardHeader>
              {/* <CardTitle className="flex items-center gap-2">

              </CardTitle> */}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!conversationStarted ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Have a personalized conversation with helloivy about your Stanford goals and aspirations
                    </p>
                    <Button onClick={startConversation}>Start Conversation</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 w-full overflow-y-auto space-y-4 mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.sender === "ai" &&
                          (message.isTyping ?
                            (<div>
                              <Image src="./Ivy_animation.gif" alt="google" width={52} height={52} />
                            </div>)
                            :
                            (
                              <div>
                                <Image src="/Ai.png" alt="google" width={52} height={52} />
                              </div>
                            )
                          )
                        }
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user" ? "bg-[#eff4fe] text-primary ml-auto" : "bg-muted"
                            }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {message.text}
                            {message.isTyping && <span className="animate-pulse">|</span>}
                          </p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {message.sender === "user" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-[#0652f6] text-white">U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {isAiTyping && messages.length > 0 && !messages[messages.length - 1]?.isTyping && (
                      <div className="flex gap-3 justify-start">
                        {/* <div>
                          <Image src="./Ivy_animation.gif" alt="google" width={52} height={52} />
                        </div> */}

                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSubmit} className="flex gap-2 ">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={questionPhaseComplete ? "Continue the conversation..." : "Share your thoughts..."}
                      disabled={isAiTyping}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isAiTyping || !isConnected}
                      variant={isRecording ? "destructive" : "outline"}
                      className="px-3"
                      title={!isConnected ? "WebSocket not connected" : isRecording ? "Stop recording" : "Start recording"}
                    >
                      {isRecording ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button type="submit" disabled={isAiTyping || !inputValue.trim()}>
                      Send
                    </Button>
                  </form>

                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>



  )
}



