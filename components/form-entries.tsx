"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FormEntry } from "@/lib/database"

interface FormEntriesProps {
  refreshTrigger: number
}

export function FormEntries({ refreshTrigger }: FormEntriesProps) {
  const [entries, setEntries] = useState<FormEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/form-entries")
      const result = await response.json()

      if (response.ok) {
        setEntries(result.entries)
      }
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
    // console.log(entries)
  }, [refreshTrigger])

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Form Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading entries...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Form Entries ({entries?.length ? entries.length : 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {entries?.length > 0 ?
          (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{entry.name}</h3>
                    <Badge variant="secondary">{new Date(entry.created_at).toLocaleString()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.email}</p>
                  <p className="text-sm">{entry.message}</p>
                </div>
              ))}
            </div>
          ) :
          (
            <p className="text-muted-foreground">No entries yet. Submit the form to see entries here.</p>
          )
        }
      </CardContent>
    </Card>
  )
}
