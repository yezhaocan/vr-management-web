"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  className,
  placeholder = "Pick a date",
  selected,
  onChange,
  showTime = true,
}) {
  // Handle date change from Calendar
  const handleDateSelect = (date) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    const newDate = selected ? new Date(selected) : new Date();
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    
    // If no previous selection, default to current time or 00:00:00?
    // User requirement: defaultValue="10:30:00" for input, but here we are dealing with Date object.
    // Let's keep current time if selected was null, or 00:00:00. 
    // Usually, preserving current time or setting to 00:00:00 is better.
    // Let's set to 00:00:00 if it was undefined before to match typical date picker behavior, 
    // unless showTime is true, then maybe we want to keep current time?
    // Let's stick to: if selected exists, keep its time. If not, use 00:00:00.
    if (!selected) {
        newDate.setHours(0, 0, 0, 0);
    }
    
    onChange(newDate);
  };

  // Handle time change from Input
  const handleTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;

    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    
    const newDate = selected ? new Date(selected) : new Date();
    newDate.setHours(hours || 0);
    newDate.setMinutes(minutes || 0);
    newDate.setSeconds(seconds || 0);
    
    onChange(newDate);
  };

  // Format time for input value (HH:mm:ss)
  const timeValue = selected ? format(selected, "HH:mm:ss") : "";

  // Format display text
  const displayText = selected 
    ? showTime 
        ? format(selected, "yyyy-MM-dd HH:mm:ss") 
        : format(selected, "yyyy-MM-dd")
    : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText ? displayText : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar 
            mode="single" 
            selected={selected} 
            onSelect={handleDateSelect} 
            initialFocus 
        />
        {showTime && (
            <div className="p-3 border-t border-border bg-background">
                <div className="flex items-center gap-2">
                    <Label htmlFor="time-picker" className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Time
                    </Label>
                    <Input
                        type="time"
                        id="time-picker"
                        step="1"
                        defaultValue="10:30:00"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none flex-1"
                    />
                </div>
            </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
