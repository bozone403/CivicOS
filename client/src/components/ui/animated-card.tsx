import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: "lift" | "glow" | "scale" | "none";
  delay?: number;
  onClick?: () => void;
}

export function AnimatedCard({ 
  children, 
  className, 
  hoverEffect = "lift", 
  delay = 0,
  onClick 
}: AnimatedCardProps) {
  const hoverClasses = {
    lift: "hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
    glow: "hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300",
    scale: "hover:scale-105 transition-transform duration-300",
    none: ""
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-300 ease-in-out",
        hoverClasses[hoverEffect],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

interface AnimatedCardWithIconProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string | number;
  trend?: "up" | "down" | "neutral";
  className?: string;
  onClick?: () => void;
}

export function AnimatedCardWithIcon({
  icon,
  title,
  description,
  value,
  trend,
  className,
  onClick
}: AnimatedCardWithIconProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600", 
    neutral: "text-gray-600"
  };

  return (
    <AnimatedCard 
      className={cn("cursor-pointer", className)}
      hoverEffect="lift"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={cn("flex items-center text-xs mt-1", trendColors[trend])}>
            {trend === "up" && "↗"}
            {trend === "down" && "↘"}
            {trend === "neutral" && "→"}
            <span className="ml-1">
              {trend === "up" && "Increasing"}
              {trend === "down" && "Decreasing"}
              {trend === "neutral" && "Stable"}
            </span>
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
} 