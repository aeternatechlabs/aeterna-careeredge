"use client";

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  nextStep?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  nextStep,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-[#EBDDD1] bg-[#FFF8F0]/70 p-6 sm:p-8 text-center space-y-3 ${className}`}
    >
      {icon && <div className="flex justify-center text-[#7A0F1F]">{icon}</div>}
      <h4 className="font-heading text-base font-bold text-[#2B1B1B]">{title}</h4>
      <p className="text-sm text-[#59413F] max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {nextStep && (
        <p className="text-xs font-semibold text-[#7A0F1F]">{nextStep}</p>
      )}
      {action && <div className="pt-1 flex justify-center">{action}</div>}
    </div>
  );
}
