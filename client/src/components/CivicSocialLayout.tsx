import React from 'react';
import { cn } from '@/lib/utils';

interface CivicSocialLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'wide';
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function CivicSocialLayout({
  children,
  className,
  variant = 'default',
  sidebar,
  header,
  footer
}: CivicSocialLayoutProps) {
  const variants = {
    default: "social-container",
    compact: "w-full max-w-2xl mx-auto px-4",
    wide: "w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
  };

  return (
    <div className="min-h-screen bg-background">
      {header && (
        <header className="bg-card border-b border-border">
          <div className={variants[variant]}>
            {header}
          </div>
        </header>
      )}
      
      <div className="flex">
        {sidebar && (
          <aside className="hidden lg:block w-80 border-r border-border bg-card/50">
            <div className="sticky top-16 p-6">
              {sidebar}
            </div>
          </aside>
        )}
        
        <main className={cn(
          "flex-1",
          sidebar ? "lg:ml-0" : "",
          className
        )}>
          <div className={cn(
            variants[variant],
            "py-6 space-y-6"
          )}>
            {children}
          </div>
        </main>
      </div>
      
      {footer && (
        <footer className="border-t border-border bg-card/50">
          <div className={variants[variant]}>
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}

interface CivicSocialHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function CivicSocialHeader({
  title,
  subtitle,
  actions,
  className
}: CivicSocialHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between py-4", className)}>
      <div>
        <h1 className="social-heading-1 text-card-foreground">{title}</h1>
        {subtitle && (
          <p className="social-caption mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}

interface CivicSocialSidebarProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function CivicSocialSidebar({
  title,
  children,
  className
}: CivicSocialSidebarProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {title && (
        <div>
          <h2 className="social-heading-2 text-card-foreground mb-4">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

interface CivicSocialSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

export function CivicSocialSection({
  title,
  description,
  children,
  className,
  variant = 'default'
}: CivicSocialSectionProps) {
  return (
    <section className={cn(
      "space-y-4",
      variant === 'compact' ? "space-y-3" : "space-y-4",
      className
    )}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="social-heading-2 text-card-foreground">{title}</h2>
          )}
          {description && (
            <p className="social-caption">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

interface CivicSocialGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function CivicSocialGrid({
  children,
  className,
  cols = 3
}: CivicSocialGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={cn(
      "grid gap-4 sm:gap-6",
      gridCols[cols],
      className
    )}>
      {children}
    </div>
  );
}

interface CivicSocialListProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function CivicSocialList({
  children,
  className,
  spacing = 'normal'
}: CivicSocialListProps) {
  const spacingClasses = {
    tight: "space-y-2",
    normal: "space-y-4",
    loose: "space-y-6"
  };

  return (
    <div className={cn(
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

interface CivicSocialEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CivicSocialEmptyState({
  title,
  description,
  icon,
  action,
  className
}: CivicSocialEmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      {icon && (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="social-heading-2 text-card-foreground mb-2">{title}</h3>
      <p className="social-body text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}

interface CivicSocialLoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function CivicSocialLoadingState({
  title = "Loading...",
  description = "Please wait while we load your content.",
  className
}: CivicSocialLoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 animate-pulse">
        <div className="w-8 h-8 bg-muted-foreground rounded-full"></div>
      </div>
      <h3 className="social-heading-2 text-card-foreground mb-2">{title}</h3>
      <p className="social-body text-muted-foreground">{description}</p>
    </div>
  );
}

interface CivicSocialErrorStateProps {
  title: string;
  description: string;
  retry?: () => void;
  className?: string;
}

export function CivicSocialErrorState({
  title,
  description,
  retry,
  className
}: CivicSocialErrorStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-destructive rounded-full"></div>
      </div>
      <h3 className="social-heading-2 text-card-foreground mb-2">{title}</h3>
      <p className="social-body text-muted-foreground max-w-md mb-6">{description}</p>
      {retry && (
        <button
          onClick={retry}
          className="social-button-primary px-4 py-2 rounded-md"
        >
          Try Again
        </button>
      )}
    </div>
  );
} 