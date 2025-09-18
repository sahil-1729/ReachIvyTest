"use client"

import { useState } from "react"
import { ContactForm } from "@/components/contact-form"
import { FormEntries } from "@/components/form-entries"
import { ConversationUI } from "@/components/conversation-ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleFormSubmitSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          {/* <p className="text-muted-foreground"> Stanford Application Prep</p> */}
        </div>

        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Contact Form</TabsTrigger>
            <TabsTrigger value="conversation">Stanford Application Prep</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
              <ContactForm onSubmitSuccess={handleFormSubmitSuccess} />
              <FormEntries refreshTrigger={refreshTrigger} />
            </div>
          </TabsContent>

          <TabsContent value="conversation" className="mt-6">
            <div className="flex justify-center">
              <ConversationUI />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </main>
  )
}
