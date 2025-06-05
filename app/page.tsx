"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, Clock, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Time {
  hour: number
  minute: number
  isNextDay: boolean
}

interface Break {
  id: string
  startTime: Time
  endTime: Time
}

interface Duty {
  startTime: Time
  endTime: Time
}

interface ValidationResult {
  isValid: boolean
  issues: string[]
  legalIssues: string[]
  dutyDurationMinutes: number
  breakDurations: { breakNumber: number; duration: number }[]
}

// Helper function to convert time to minutes
const timeToMinutes = (time: Time): number => {
  return (time.isNextDay ? 24 * 60 : 0) + time.hour * 60 + time.minute
}

// Helper function to calculate duration between two times in minutes
const calculateDuration = (startTime: Time, endTime: Time): number => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  return endMinutes - startMinutes
}

// Function to validate legal duty requirements - returns boolean
const validateLegalDuty = (duty: Duty, breaks: Break[]): boolean => {
  // TODO: Complete this method to check the legality of the duty
  // This method should validate legal requirements such as:
  // - Maximum duty duration limits
  // - Required break durations based on duty length
  // - Minimum rest periods between duties
  // - Any other regulatory compliance checks

  return true
}

// Format time for display
const formatTime = (time: Time): string => {
  return `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`
}

// Format duration for display
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default function DutyTimeValidator() {
  const [duty, setDuty] = useState<Duty>({
    startTime: { hour: 8, minute: 0, isNextDay: false },
    endTime: { hour: 16, minute: 0, isNextDay: false },
  })

  const [breaks, setBreaks] = useState<Break[]>([])

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const addBreak = () => {
    setBreaks([
      ...breaks,
      {
        id: Date.now().toString(),
        startTime: { hour: 12, minute: 0, isNextDay: false },
        endTime: { hour: 13, minute: 0, isNextDay: false },
      },
    ])
  }

  const removeBreak = (id: string) => {
    setBreaks(breaks.filter((breakItem) => breakItem.id !== id))
  }

  const updateBreakTime = (id: string, field: "startTime" | "endTime", timeField: "hour" | "minute", value: number) => {
    setBreaks(
      breaks.map((breakItem) =>
        breakItem.id === id
          ? {
              ...breakItem,
              [field]: {
                ...breakItem[field],
                [timeField]: value,
              },
            }
          : breakItem,
      ),
    )
  }

  const updateBreakNextDay = (id: string, field: "startTime" | "endTime", value: boolean) => {
    setBreaks(
      breaks.map((breakItem) =>
        breakItem.id === id
          ? {
              ...breakItem,
              [field]: {
                ...breakItem[field],
                isNextDay: value,
              },
            }
          : breakItem,
      ),
    )
  }

  const updateDutyTime = (field: "startTime" | "endTime", timeField: "hour" | "minute", value: number) => {
    setDuty({
      ...duty,
      [field]: {
        ...duty[field],
        [timeField]: value,
      },
    })
  }

  const updateDutyNextDay = (field: "startTime" | "endTime", value: boolean) => {
    setDuty({
      ...duty,
      [field]: {
        ...duty[field],
        isNextDay: value,
      },
    })
  }

  const validateDuty = (duty: Duty, breaks: Break[]): ValidationResult => {
    // Log the inputs as originally requested
    console.log("Duty:", duty)
    console.log("Breaks:", breaks)

    // Initialize validation result
    const result: ValidationResult = {
      isValid: true,
      issues: [],
      legalIssues: [],
      dutyDurationMinutes: 0,
      breakDurations: [],
    }

    // Check if duty end time is after duty start time
    const dutyDuration = calculateDuration(duty.startTime, duty.endTime)
    if (dutyDuration <= 0) {
      result.isValid = false
      result.issues.push("Duty end time must be after duty start time")
    } else {
      // Store duty duration
      result.dutyDurationMinutes = dutyDuration
    }

    // If there are no breaks, just continue with validation
    if (breaks.length === 0) {
      console.log("No breaks provided")
    }

    // Calculate break durations and check each break
    breaks.forEach((breakItem, index) => {
      const breakNumber = index + 1
      const breakDuration = calculateDuration(breakItem.startTime, breakItem.endTime)

      // Store break duration
      result.breakDurations.push({ breakNumber, duration: breakDuration })

      // Check if break end time is after break start time
      if (breakDuration <= 0) {
        result.isValid = false
        result.issues.push(`Break ${breakNumber}: End time must be after start time`)
      }

      // Check if break is within duty time
      const breakStartAfterDutyStart = timeToMinutes(breakItem.startTime) >= timeToMinutes(duty.startTime)
      const breakEndBeforeDutyEnd = timeToMinutes(breakItem.endTime) <= timeToMinutes(duty.endTime)

      if (!breakStartAfterDutyStart) {
        result.isValid = false
        result.issues.push(`Break ${breakNumber}: Start time must be after duty start time`)
      }

      if (!breakEndBeforeDutyEnd) {
        result.isValid = false
        result.issues.push(`Break ${breakNumber}: End time must be before duty end time`)
      }

      // Check for overlaps with other breaks
      breaks.forEach((otherBreak, otherIndex) => {
        if (index !== otherIndex) {
          const thisBreakStart = timeToMinutes(breakItem.startTime)
          const thisBreakEnd = timeToMinutes(breakItem.endTime)
          const otherBreakStart = timeToMinutes(otherBreak.startTime)
          const otherBreakEnd = timeToMinutes(otherBreak.endTime)

          // Check if this break overlaps with another break
          const overlaps =
            (thisBreakStart >= otherBreakStart && thisBreakStart < otherBreakEnd) || // Start during other break
            (thisBreakEnd > otherBreakStart && thisBreakEnd <= otherBreakEnd) || // End during other break
            (thisBreakStart <= otherBreakStart && thisBreakEnd >= otherBreakEnd) // Contains other break

          if (overlaps) {
            result.isValid = false
            result.issues.push(`Break ${breakNumber} overlaps with Break ${otherIndex + 1}`)
          }
        }
      })
    })

    // Remove duplicate issues
    result.issues = [...new Set(result.issues)]

    // Check legal requirements
    const isLegalDuty = validateLegalDuty(duty, breaks)

    // If not legal, add the legal issue and set isValid to false
    if (!isLegalDuty) {
      result.legalIssues.push(
        "Legal requirement: Duty duration exceeds 6 hours and requires at least one 30-minute break",
      )
      result.isValid = false
    }

    return result
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = validateDuty(duty, breaks)
    setValidationResult(result)
  }

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Generate minutes (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Duty Time Validator</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Duty Times
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duty Start Time */}
                <div className="space-y-2">
                  <Label>Duty Start Time (24h)</Label>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label htmlFor="dutyStartHour" className="text-xs">
                        Hour
                      </Label>
                      <Select
                        value={duty.startTime.hour.toString()}
                        onValueChange={(value) => updateDutyTime("startTime", "hour", Number.parseInt(value))}
                      >
                        <SelectTrigger id="dutyStartHour">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((hour) => (
                            <SelectItem key={`start-hour-${hour}`} value={hour.toString()}>
                              {hour.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-1/2">
                      <Label htmlFor="dutyStartMinute" className="text-xs">
                        Minute
                      </Label>
                      <Select
                        value={duty.startTime.minute.toString()}
                        onValueChange={(value) => updateDutyTime("startTime", "minute", Number.parseInt(value))}
                      >
                        <SelectTrigger id="dutyStartMinute">
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                          {minutes.map((minute) => (
                            <SelectItem key={`start-minute-${minute}`} value={minute.toString()}>
                              {minute.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="dutyStartNextDay"
                      checked={duty.startTime.isNextDay}
                      onCheckedChange={(checked) => updateDutyNextDay("startTime", checked === true)}
                    />
                    <label
                      htmlFor="dutyStartNextDay"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Next day
                    </label>
                  </div>
                </div>

                {/* Duty End Time */}
                <div className="space-y-2">
                  <Label>Duty End Time (24h)</Label>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label htmlFor="dutyEndHour" className="text-xs">
                        Hour
                      </Label>
                      <Select
                        value={duty.endTime.hour.toString()}
                        onValueChange={(value) => updateDutyTime("endTime", "hour", Number.parseInt(value))}
                      >
                        <SelectTrigger id="dutyEndHour">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((hour) => (
                            <SelectItem key={`end-hour-${hour}`} value={hour.toString()}>
                              {hour.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-1/2">
                      <Label htmlFor="dutyEndMinute" className="text-xs">
                        Minute
                      </Label>
                      <Select
                        value={duty.endTime.minute.toString()}
                        onValueChange={(value) => updateDutyTime("endTime", "minute", Number.parseInt(value))}
                      >
                        <SelectTrigger id="dutyEndMinute">
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                          {minutes.map((minute) => (
                            <SelectItem key={`end-minute-${minute}`} value={minute.toString()}>
                              {minute.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="dutyEndNextDay"
                      checked={duty.endTime.isNextDay}
                      onCheckedChange={(checked) => updateDutyNextDay("endTime", checked === true)}
                    />
                    <label
                      htmlFor="dutyEndNextDay"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Next day
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Breaks</h3>
                <Button
                  type="button"
                  onClick={addBreak}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Break
                </Button>
              </div>

              <div className="space-y-3">
                {breaks.map((breakItem) => (
                  <div key={breakItem.id} className="flex items-start gap-3 p-3 border rounded-md bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                      {/* Break Start Time */}
                      <div className="space-y-2">
                        <Label>Break Start Time (24h)</Label>
                        <div className="flex gap-2">
                          <div className="w-1/2">
                            <Label htmlFor={`breakStartHour-${breakItem.id}`} className="text-xs">
                              Hour
                            </Label>
                            <Select
                              value={breakItem.startTime.hour.toString()}
                              onValueChange={(value) =>
                                updateBreakTime(breakItem.id, "startTime", "hour", Number.parseInt(value))
                              }
                            >
                              <SelectTrigger id={`breakStartHour-${breakItem.id}`}>
                                <SelectValue placeholder="Hour" />
                              </SelectTrigger>
                              <SelectContent>
                                {hours.map((hour) => (
                                  <SelectItem key={`break-start-hour-${breakItem.id}-${hour}`} value={hour.toString()}>
                                    {hour.toString().padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-1/2">
                            <Label htmlFor={`breakStartMinute-${breakItem.id}`} className="text-xs">
                              Minute
                            </Label>
                            <Select
                              value={breakItem.startTime.minute.toString()}
                              onValueChange={(value) =>
                                updateBreakTime(breakItem.id, "startTime", "minute", Number.parseInt(value))
                              }
                            >
                              <SelectTrigger id={`breakStartMinute-${breakItem.id}`}>
                                <SelectValue placeholder="Minute" />
                              </SelectTrigger>
                              <SelectContent>
                                {minutes.map((minute) => (
                                  <SelectItem
                                    key={`break-start-minute-${breakItem.id}-${minute}`}
                                    value={minute.toString()}
                                  >
                                    {minute.toString().padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Checkbox
                            id={`breakStartNextDay-${breakItem.id}`}
                            checked={breakItem.startTime.isNextDay}
                            onCheckedChange={(checked) =>
                              updateBreakNextDay(breakItem.id, "startTime", checked === true)
                            }
                          />
                          <label
                            htmlFor={`breakStartNextDay-${breakItem.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Next day
                          </label>
                        </div>
                      </div>

                      {/* Break End Time */}
                      <div className="space-y-2">
                        <Label>Break End Time (24h)</Label>
                        <div className="flex gap-2">
                          <div className="w-1/2">
                            <Label htmlFor={`breakEndHour-${breakItem.id}`} className="text-xs">
                              Hour
                            </Label>
                            <Select
                              value={breakItem.endTime.hour.toString()}
                              onValueChange={(value) =>
                                updateBreakTime(breakItem.id, "endTime", "hour", Number.parseInt(value))
                              }
                            >
                              <SelectTrigger id={`breakEndHour-${breakItem.id}`}>
                                <SelectValue placeholder="Hour" />
                              </SelectTrigger>
                              <SelectContent>
                                {hours.map((hour) => (
                                  <SelectItem key={`break-end-hour-${breakItem.id}-${hour}`} value={hour.toString()}>
                                    {hour.toString().padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-1/2">
                            <Label htmlFor={`breakEndMinute-${breakItem.id}`} className="text-xs">
                              Minute
                            </Label>
                            <Select
                              value={breakItem.endTime.minute.toString()}
                              onValueChange={(value) =>
                                updateBreakTime(breakItem.id, "endTime", "minute", Number.parseInt(value))
                              }
                            >
                              <SelectTrigger id={`breakEndMinute-${breakItem.id}`}>
                                <SelectValue placeholder="Minute" />
                              </SelectTrigger>
                              <SelectContent>
                                {minutes.map((minute) => (
                                  <SelectItem
                                    key={`break-end-minute-${breakItem.id}-${minute}`}
                                    value={minute.toString()}
                                  >
                                    {minute.toString().padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Checkbox
                            id={`breakEndNextDay-${breakItem.id}`}
                            checked={breakItem.endTime.isNextDay}
                            onCheckedChange={(checked) => updateBreakNextDay(breakItem.id, "endTime", checked === true)}
                          />
                          <label
                            htmlFor={`breakEndNextDay-${breakItem.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Next day
                          </label>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeBreak(breakItem.id)}
                      variant="destructive"
                      size="icon"
                      className="mt-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full">
              Validate Duty
            </Button>
          </CardFooter>
        </form>
      </Card>

      {validationResult && (
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.isValid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">Valid</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-500">Invalid</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Duty Duration */}
              {validationResult.dutyDurationMinutes > 0 && (
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                  <p className="font-medium">
                    Total Duty Duration: {formatDuration(validationResult.dutyDurationMinutes)}
                  </p>

                  {/* Break Durations */}
                  {validationResult.breakDurations.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Break Durations:</p>
                      <ul className="mt-1 space-y-1">
                        {validationResult.breakDurations.map(({ breakNumber, duration }) => (
                          <li key={breakNumber}>
                            Break {breakNumber}: {formatDuration(duration)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Issues */}
              {validationResult.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Validation Issues
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      {validationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Legal Issues */}
              {validationResult.legalIssues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Legal Requirement Violations
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      {validationResult.legalIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Valid Message */}
              {validationResult.isValid && (
                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    All Validations Passed
                  </AlertTitle>
                  <AlertDescription>
                    The duty and break times are valid and comply with all requirements.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
